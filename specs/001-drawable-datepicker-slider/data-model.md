# Data Model: Drawable Canvas Datepicker Slider

**Feature**: 001-drawable-datepicker-slider  
**Date**: 2025-10-21  
**Status**: Phase 1 - Design & Contracts

## Overview

This document defines the core data entities, their fields, validation rules, and state transitions for the drawable canvas datepicker feature.

---

## Entity 1: Path

Represents the selectable slider path composed of the initial 200px line plus any user-drawn extensions.

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `segments` | `Float32Array` | Flat array of coordinates [x0,y0,x1,y1,...] | Length must be even; minimum 4 values (2 points) |
| `lut` | `PathLUTEntry[]` | Pre-computed lookup table for arc-length queries | Sorted by distance ascending; generated after drawing |
| `totalLength` | `number` | Total path length in pixels (equals days) | Must equal `lut[lut.length-1].distance` |
| `bounds` | `PathBounds` | Bounding box for viewport culling | `minX <= maxX`, `minY <= maxY` |
| `spatialGrid` | `Map<string, number[]>` | Cell-to-segment-index mapping for intersection detection | Cell keys format: `"${gridX},${gridY}"` |
| `intersections` | `PathIntersection[]` | Pre-computed self-intersection points | Empty if no intersections; each entry includes `segmentA`, `segmentB`, `point`, `timestamp` |

### Type Definitions

```typescript
type PathLUTEntry = {
  distance: number;
  segmentIndex: number;
  x: number;
  y: number;
};

type PathBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type PathIntersection = {
  segmentIndexA: number;
  segmentIndexB: number;
  point: { x: number; y: number };
  timestamp: number;
};
```

### Validation Rules

- `segments.length >= 4` (at least one line segment)
- All coordinate values must be finite numbers
- `totalLength > 0`
- LUT entries must have strictly increasing distances
- Spatial grid cell size: 50-100px (configurable constant)
- Intersection segments must satisfy `segmentIndexA < segmentIndexB` (chronological order)

### State Transitions

1. **Initial**: 200px horizontal line, centered horizontally and vertically on screen, 2 segments
2. **Drawing**: Segments appended in real-time as user drags; LUT not yet computed
3. **Complete**: Drawing released → LUT generated → spatial grid populated → intersections detected
4. **Simplified** (idle): RDP algorithm reduces segment count while preserving shape

### Lifecycle

- **Creation**: On component mount, initial path created centered on screen (viewport center horizontally and vertically)
- **Mutation**: During drawing mode, segments appended via `addSegment(x, y)`
- **Finalization**: On drawing end, `computeLUT()`, `buildSpatialGrid()`, `detectIntersections()` called
- **Optimization**: During idle time, `simplifyPath(epsilon)` reduces complexity

---

## Entity 2: Marker

Represents the draggable date indicator that moves along the path.

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `position` | `Point` | Current x,y canvas coordinates | Must lie on the path (within tolerance) |
| `pathDistance` | `number` | Distance along path from start (in pixels) | `0 <= pathDistance <= path.totalLength` |
| `date` | `Date` | Currently selected date | Calculated as `BASE_DATE + pathDistance` days |
| `isDragging` | `boolean` | Whether user is currently dragging marker | Mutually exclusive with drawing mode |
| `dragOffset` | `Point` | Offset from marker center to cursor during drag | Only valid when `isDragging === true` |

### Type Definitions

```typescript
type Point = {
  x: number;
  y: number;
};

const BASE_DATE = new Date(1900, 0, 1);
```

### Validation Rules

- `position` must be validated against path bounds on every update
- `pathDistance` must be clamped to `[0, path.totalLength]`
- `date` must be valid Date object (not NaN)
- At intersections, marker follows earliest segment (lowest `segmentIndex`)

### State Transitions

1. **Idle**: Marker stationary at current position; `isDragging = false`
2. **Dragging**: User pressed on marker → `isDragging = true` → position updates on pointer move → follows path constraints
3. **Release**: Pointer up → `isDragging = false` → marker snaps to final position on path
4. **Keyboard Navigation**: Arrow key pressed → `pathDistance` incremented/decremented → position recalculated

### Calculation Methods

**Distance to Date**:
```typescript
function distanceToDate(distance: number): Date {
  const daysSinceBase = Math.round(distance);
  const result = new Date(BASE_DATE);
  result.setDate(result.getDate() + daysSinceBase);
  return result;
}
```

**Position from Distance**:
```typescript
function positionFromDistance(distance: number, lut: PathLUTEntry[]): Point {
  const idx = binarySearch(lut, distance);
  const [a, b] = [lut[idx], lut[idx + 1]];
  const t = (distance - a.distance) / (b.distance - a.distance);
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t)
  };
}
```

---

## Entity 3: EndButton

Represents clickable regions at path termini that activate drawing mode.

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `type` | `'start' \| 'end'` | Which terminus this button represents | Immutable after creation |
| `center` | `Point` | Center position on canvas | Updates when path is extended |
| `radius` | `number` | Hit detection radius in pixels | Default: 20px |
| `isActive` | `boolean` | Whether button is currently pressed/drawing | Only one button can be active at a time |

### Validation Rules

- `radius > 0`
- `center` must equal path's first segment point (type='start') or last segment point (type='end')
- `isActive` can only be true when user is in drawing mode

### State Transitions

1. **Idle**: Button visible at path terminus; `isActive = false`
2. **Pressed**: Pointer down within radius → `isActive = true` → drawing mode begins
3. **Drawing**: Pointer moves → path extends from this button's position
4. **Released**: Pointer up → `isActive = false` → drawing mode ends → button position updates to new path terminus

### Hit Detection

```typescript
function isPointerOverButton(pointer: Point, button: EndButton): boolean {
  const dx = pointer.x - button.center.x;
  const dy = pointer.y - button.center.y;
  return Math.sqrt(dx * dx + dy * dy) <= button.radius;
}
```

---

## Entity 4: Canvas

Represents the rendering surface and interaction layer.

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `width` | `number` | Canvas width in CSS pixels | Equals `window.innerWidth` (fullscreen) |
| `height` | `number` | Canvas height in CSS pixels | Equals `window.innerHeight` (fullscreen) |
| `dpr` | `number` | Device pixel ratio for high-DPI displays | Typically 1, 2, or 3 |
| `layers` | `CanvasLayers` | Separate canvases for static/dynamic content | All layers same dimensions |
| `viewport` | `Rect` | Visible area for clipping | `{x: 0, y: 0, width, height}` |

### Type Definitions

```typescript
type CanvasLayers = {
  background: HTMLCanvasElement;
  path: HTMLCanvasElement;
  marker: HTMLCanvasElement;
};

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};
```

### Validation Rules

- `width > 0` and `height > 0`
- `dpr > 0`
- All layer canvases must have same dimensions: `width * dpr` x `height * dpr`
- Viewport must be within canvas bounds

### Lifecycle

- **Initialization**: On mount, create 3 stacked canvases with proper DPR scaling
- **Resize**: Window resize → update dimensions → redraw all layers
- **Cleanup**: On unmount, dispose canvas contexts and remove event listeners

### Rendering Strategy

- **Background layer**: Static grid/styling; rarely redrawn
- **Path layer**: Redrawn when path changes (drawing complete, simplification)
- **Marker layer**: Redrawn every frame during dragging/keyboard navigation

---

## Entity 5: InteractionState

Represents the current user interaction mode and input state.

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `mode` | `InteractionMode` | Current interaction type | Enum: `'idle' \| 'dragging' \| 'drawing'` |
| `activeButton` | `'start' \| 'end' \| null` | Which end button activated drawing | Only non-null when `mode === 'drawing'` |
| `pointer` | `PointerState` | Current pointer position and state | Updated on pointer events |
| `keyboard` | `KeyboardState` | Current keyboard modifiers | Updated on key events |

### Type Definitions

```typescript
type InteractionMode = 'idle' | 'dragging' | 'drawing';

type PointerState = {
  x: number;
  y: number;
  isDown: boolean;
  startX: number;
  startY: number;
};

type KeyboardState = {
  shift: boolean;
  alt: boolean;
  ctrl: boolean;
};
```

### Validation Rules

- Mode transitions must follow allowed paths: `idle ↔ dragging`, `idle ↔ drawing`
- Cannot enter `dragging` mode while `mode === 'drawing'` (mutually exclusive)
- `activeButton` must be null when `mode !== 'drawing'`

### State Machine

```
        pointer down on marker
IDLE ────────────────────────────→ DRAGGING
  ↑                                    │
  │                                    │ pointer up
  │                                    ↓
  │                                  IDLE
  │
  │    pointer down on end button
  └──────────────────────────────→ DRAWING
                                       │
                                       │ pointer up
                                       ↓
                                     IDLE
```

### Transition Conditions

| From | To | Trigger | Validation |
|------|----|---------|--------------|
| `idle` | `dragging` | Pointer down on marker | Marker hit test passes |
| `dragging` | `idle` | Pointer up | Always allowed |
| `idle` | `drawing` | Pointer down on end button | End button hit test passes |
| `drawing` | `idle` | Pointer up | Always allowed; finalizes path |

---

## Entity 6: DateState

Represents date-specific display and formatting state.

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `current` | `Date` | Currently selected date | Must be valid Date (not NaN) |
| `formatted` | `string` | Human-readable date string | Format: "Month Day, Year" (e.g., "January 1, 1900") |
| `displayPosition` | `Point` | Where to render date text relative to marker | Offset from marker position |

### Validation Rules

- `current` must not be `Invalid Date`
- `formatted` must match pattern `/^[A-Z][a-z]+ \d{1,2}, -?\d+$/`
- `displayPosition` must be visible within viewport (or clamped to edges)

### Formatting

```typescript
function formatDate(date: Date): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}
```

### Display Position Logic

- Default: 30px above and 10px right of marker center
- If too close to top edge: render below marker instead
- If too close to right edge: render left of marker instead
- Always prioritize keeping text fully visible within viewport

---

## Relationships

```
Canvas (1) ──contains──→ Path (1)
Canvas (1) ──contains──→ Marker (1)
Canvas (1) ──contains──→ EndButton (2)

Path (1) ──constrains──→ Marker (1)
Path (1) ──determines──→ EndButton.center (2)

Marker (1) ──calculates──→ DateState (1)
DateState (1) ──positions_near──→ Marker (1)

InteractionState (1) ──controls──→ Marker.isDragging (1)
InteractionState (1) ──controls──→ EndButton.isActive (0..1)

EndButton (1) ──extends──→ Path (1) [when active]
```

---

## Constants

```typescript
const INITIAL_SLIDER_WIDTH = 200;
const BASE_DATE = new Date(1900, 0, 1);
const MARKER_RADIUS = 8;
const END_BUTTON_RADIUS = 20;
const SPATIAL_GRID_CELL_SIZE = 75;
const PATH_SIMPLIFICATION_EPSILON = 1.5;
const DATE_DISPLAY_OFFSET = { x: 10, y: -30 };
const FRAME_BUDGET_MS = 16.67;
const MAX_PATH_LENGTH = 100000;
```

---

## Next Steps

With data model defined:
1. Generate component contracts (Phase 1 continuation)
2. Define props, events, and interfaces for React components
3. Create quickstart.md for development setup
4. Update agent context with technical stack details
