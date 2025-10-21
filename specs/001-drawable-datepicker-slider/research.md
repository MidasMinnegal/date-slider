# Research: Drawable Canvas Datepicker Slider

**Date**: 2025-10-21  
**Feature**: 001-drawable-datepicker-slider

## Overview

This document consolidates research findings for technical decisions required to implement the drawable canvas datepicker. All "NEEDS CLARIFICATION" items from the Technical Context have been resolved.

---

## Decision 1: Testing Framework

**Decision**: Vitest + React Testing Library + jest-canvas-mock

**Rationale**:
- Vitest offers 5-10x faster execution than Jest due to native ESM support
- Native Vite integration (React projects commonly use Vite)
- Jest-compatible API for easy migration/familiarity
- Modern architecture optimized for React 18+
- `jest-canvas-mock` provides canvas API mocking for unit/integration tests without rendering overhead
- Playwright for E2E visual regression testing as secondary layer

**Alternatives Considered**:
- **Jest + React Testing Library**: Slower execution, requires Babel transforms, older CommonJS architecture
- **Testing Library alone**: Insufficient for canvas-specific validation
- **Cypress**: More heavyweight E2E solution, slower feedback than Vitest for unit tests

**Implementation Notes**:
- Use `jest-canvas-mock` for unit/integration tests to validate canvas operations via `ctx.__getEvents()`
- Use Playwright for E2E tests with visual regression (screenshot comparison)
- Layer tests: Unit (geometry/state) → Integration (React components) → E2E (full workflows)

---

## Decision 2: Path Geometry Algorithms

### 2.1 Arc-Length Calculation

**Decision**: Pre-computed Lookup Table (LUT) with Legendre-Gauss Quadrature

**Rationale**:
- User-drawn paths are polylines (sequence of line segments)
- Pre-compute cumulative distance array during drawing (O(n) one-time cost)
- Binary search for distance-to-coordinate mapping: O(log n) per query
- Achieves <0.5ms per marker positioning query (60fps budget)
- Simple enough to implement custom without external dependencies

**Data Structure**:
```javascript
pathLUT = [
  { distance: 0, x: x0, y: y0, segmentIndex: 0 },
  { distance: 150, x: x1, y: y1, segmentIndex: 1 },
  ...
]
```

**Alternatives Considered**:
- **Real-time calculation**: Too slow for 60fps with 100k pixel paths
- **Paper.js library**: 500KB overhead for simple polyline operations

### 2.2 Self-Intersection Detection

**Decision**: Spatial Hashing Grid with Line-Line Intersection Tests

**Rationale**:
- Divide canvas into grid cells (~50-100px per cell)
- Only test segments in same/adjacent cells for intersection
- Reduces O(n²) naive algorithm to ~O(n) with spatial partitioning
- Lightweight: <2ms for typical paths
- Track segment timestamps to determine "earliest" at intersection (per spec FR-015)

**Alternatives Considered**:
- **Bentley-Ottmann Sweep Line**: Overkill for user-drawn paths; complexity not justified
- **No optimization**: O(n²) too slow for long paths

### 2.3 Point-on-Path Positioning

**Decision**: Binary Search on Pre-Computed LUT

**Rationale**:
- Given target distance, binary search LUT to find bracketing entries
- Linear interpolation between bracket points for smooth positioning
- O(log n) complexity achieves <0.5ms query time
- Pairs naturally with arc-length LUT from Decision 2.1

### 2.4 Path Clipping at Viewport Boundaries

**Decision**: Cohen-Sutherland Line Clipping Algorithm

**Rationale**:
- Standard algorithm for line segment clipping against rectangle
- Fast rejection of segments entirely outside viewport via bit operations
- Minimal overhead: nearly free for typical paths
- Well-documented, simple to implement

**Alternatives Considered**:
- **No clipping**: Wastes computation on off-screen segments
- **Subdivision for curves**: Unnecessary (paths are polylines)

### 2.5 Path Simplification

**Decision**: Ramer-Douglas-Peucker (RDP) with epsilon = 1-2 pixels

**Rationale**:
- Industry standard for polyline simplification
- Can reduce 100k points to 10-20k while preserving visual fidelity
- Run during idle time (requestIdleCallback) to avoid blocking interactions
- Use `simplify-js` library (lightweight) or custom implementation

**Alternatives Considered**:
- **Visvalingam-Whyatt**: Better area preservation but more computation
- **No simplification**: Memory/performance degradation with very long paths

---

## Decision 3: React Canvas Architecture

**Decision**: RAF-based render loop with ref-stored state, layered canvas approach

**Rationale**:
- **Decoupled from React render cycle**: Animation state in refs (not state) prevents re-render overhead
- **RequestAnimationFrame loop**: Standard for 60fps animations, allows frame budgeting
- **Layered canvases**: Separate static background, dynamic path, animated marker for partial redraws
- **Pointer Events API**: Unified mouse/touch handling (avoids separate event handlers)
- **Dirty region tracking**: Only redraw changed areas to stay within 16.67ms frame budget

**Architectural Pattern**:
```
Component Structure:
- DatepickerCanvas (wrapper, state management)
  - Canvas (rendering layer, RAF loop)
  - DateDisplay (HTML overlay for date text)

State Management:
- React state: UI mode (drawing/dragging), visibility flags
- Refs: Canvas context, RAF ID, path data, mouse position, animation state
```

**Alternatives Considered**:
- **State-driven rendering**: Too many re-renders, cannot achieve 60fps
- **Redux/MobX**: Overkill for single-component state
- **Single canvas**: More complex dirty tracking; layers simplify optimization

---

## Decision 4: State Management Strategy

**Decision**: Minimal React state + refs for animation data + Zustand for future scalability

**Rationale**:
- **React state**: Only for values affecting UI rendering (interaction mode, error states)
- **Refs**: Animation frame IDs, canvas context, path geometry, mouse position, drawing state
- **Zustand** (if needed): Lightweight global state (77B gzipped) for multi-component coordination
- Avoids re-render overhead during interactions (critical for 60fps)

**Alternatives Considered**:
- **Redux**: Too heavyweight for this feature's scope
- **Context API**: Re-renders all consumers on change (performance issue)
- **State-only approach**: Would trigger re-renders on every mouse move

---

## Decision 5: Accessibility Strategy

**Decision**: Keyboard navigation + ARIA live regions + screen reader fallbacks

**Rationale**:
- Canvas is bitmap with no semantic structure for screen readers
- Must provide alternative interaction methods and state announcements

**Implementation**:
- Make canvas focusable (tabIndex={0})
- Keyboard controls: Arrow keys move marker (1 day per press), Shift+Arrow = 10 days
- ARIA live region announces selected date on change
- Fallback content inside `<canvas>` tags describing purpose
- Focus indicator rendered on canvas when focused

**Alternatives Considered**:
- **Hit Regions API**: Limited browser support, not reliable
- **Parallel DOM structure**: Duplicates logic, hard to maintain
- **No accessibility**: Violates WCAG, excludes users

---

## Decision 6: Performance Optimizations

**Decisions**:
1. **Integer coordinates**: Use Math.floor() to avoid sub-pixel anti-aliasing overhead
2. **Float32Array** for path data: 50% memory reduction vs Float64Array, cache-friendly
3. **Web Worker** for LUT generation: Offload computation from main thread (Phase 2)
4. **requestIdleCallback** for path simplification: Non-blocking optimization
5. **DevicePixelRatio scaling**: Support high-DPI displays without blur

**Rationale**: Each optimization targets specific bottlenecks:
- Integer coords: Reduces rendering overhead (~2-3ms savings)
- Typed arrays: Memory locality improves iteration speed
- Web Workers: Keeps main thread responsive during path processing
- Idle callbacks: Non-critical work doesn't block interactions
- DPR scaling: Maintains visual quality on Retina displays

---

## Decision 7: Data Structures

**Decision**: Flat Float32Array for segments + LUT array + spatial hash grid

**Path Representation**:
```javascript
{
  segments: Float32Array,  // [x0,y0,x1,y1,x2,y2,...]
  lut: Array<{dist, idx, x, y}>,
  bounds: {minX, minY, maxX, maxY},
  spatialGrid: Map<cellKey, segmentIndices[]>
}
```

**Rationale**:
- **Flat array**: Avoids pointer chasing, cache-friendly iteration
- **LUT**: O(log n) distance queries for marker positioning
- **Spatial grid**: O(1) proximity queries for intersection detection
- **Bounds**: Quick viewport culling checks

---

## Technology Stack Summary

| Category | Technology | Rationale |
|----------|------------|-----------|
| **Framework** | React 18+ | Specified in requirements, modern concurrent features |
| **Build Tool** | Vite | Fast HMR, native ESM, pairs with Vitest |
| **Language** | TypeScript | Type safety for complex geometry calculations |
| **Testing** | Vitest + RTL + jest-canvas-mock | Fast execution, canvas mocking, Jest-compatible |
| **E2E Testing** | Playwright | Visual regression, real browser validation |
| **State** | React hooks + refs + Zustand (optional) | Minimal overhead, decoupled from render cycle |
| **Canvas API** | Native HTML5 Canvas | No library overhead, sufficient for 2D operations |
| **Simplification** | simplify-js or custom RDP | Lightweight polyline simplification |

---

## Performance Budget (60fps = 16.67ms/frame)

| Operation | Budget | Strategy |
|-----------|--------|----------|
| Arc-length LUT generation | 2-3ms | On path change only, Web Worker in Phase 2 |
| Marker positioning | <0.5ms | Binary search LUT |
| Intersection checks | 1-2ms | Spatial hashing grid |
| Canvas rendering | 8-10ms | Layered canvas, dirty regions |
| Event handling | <1ms | RAF throttling |
| **Buffer** | 3-4ms | Safety margin |

---

## Open Questions (Deferred to Implementation)

1. **Very long paths (>100k pixels)**: Monitor performance; apply aggressive simplification if needed
2. **Distant dates (year 10000+)**: Use standard Date library; handle overflow edge cases in tests
3. **Fast erratic drawing**: Input smoothing may be needed; evaluate during user testing
4. **Transition smoothness**: Implement Bézier easing for marker movement at segment junctions

These are low-impact edge cases best addressed iteratively during implementation.

---

## Next Steps

Phase 1 (Design & Contracts):
1. Generate data-model.md defining entities (Path, Marker, DateState)
2. Create component contracts (props, events, state)
3. Write quickstart.md for development setup
4. Update agent context with technology choices
