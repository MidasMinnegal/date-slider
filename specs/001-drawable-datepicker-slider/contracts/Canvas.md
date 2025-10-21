# Component Contract: Canvas

**Type**: React Component (Presentation)  
**Layer**: Rendering  
**Responsibility**: Manages layered canvas rendering and RAF-based animation loop

---

## Props

### Input Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `width` | `number` | Yes | - | Canvas width in CSS pixels |
| `height` | `number` | Yes | - | Canvas height in CSS pixels |
| `pathData` | `PathData` | Yes | - | Current path geometry and metadata |
| `markerState` | `MarkerState` | Yes | - | Current marker position and drag state |
| `endButtons` | `EndButton[]` | Yes | - | Array of 2 end buttons (start/end) |
| `interactionMode` | `InteractionMode` | Yes | - | Current interaction state |
| `testId` | `string` | No | `'canvas'` | Test identifier |

### Ref

```typescript
interface CanvasRef {
  getContexts(): CanvasContexts;
  invalidateLayers(layers: LayerName[]): void;
  forceRedraw(): void;
}

type LayerName = 'background' | 'path' | 'marker';

interface CanvasContexts {
  background: CanvasRenderingContext2D | null;
  path: CanvasRenderingContext2D | null;
  marker: CanvasRenderingContext2D | null;
}
```

---

## State

### Local State

```typescript
interface CanvasState {
  dpr: number;
  isReady: boolean;
}
```

### Ref-Stored State

```typescript
interface CanvasRefs {
  backgroundCanvas: HTMLCanvasElement | null;
  pathCanvas: HTMLCanvasElement | null;
  markerCanvas: HTMLCanvasElement | null;
  rafId: number | null;
  dirtyLayers: Set<LayerName>;
}
```

---

## Rendering Strategy

### Layered Canvas Architecture

1. **Background Layer** (bottom)
   - Grid lines or background styling
   - Static; only redrawn on resize
   - Z-index: 1

2. **Path Layer** (middle)
   - Slider path segments
   - End buttons
   - Redrawn when path changes or button state changes
   - Z-index: 2

3. **Marker Layer** (top)
   - Date marker
   - Focus indicator
   - Redrawn every frame during interactions
   - Z-index: 3

### Dirty Region Tracking

```typescript
const dirtyLayers = new Set<LayerName>();

function markDirty(layer: LayerName): void {
  dirtyLayers.add(layer);
}

function render(): void {
  if (dirtyLayers.has('background')) {
    renderBackground();
    dirtyLayers.delete('background');
  }
  if (dirtyLayers.has('path')) {
    renderPath();
    dirtyLayers.delete('path');
  }
  if (dirtyLayers.has('marker')) {
    renderMarker();
    dirtyLayers.delete('marker');
  }
}
```

---

## Methods

### Public (via ref)

```typescript
getContexts(): CanvasContexts
```
Returns 2D contexts for all three layers.

```typescript
invalidateLayers(layers: LayerName[]): void
```
Marks specified layers as dirty, triggering redraw in next RAF cycle.

```typescript
forceRedraw(): void
```
Immediately redraws all layers (bypasses dirty tracking).

### Private Rendering

```typescript
renderBackground(ctx: CanvasRenderingContext2D): void
```
Draws static background (grid, etc.).

```typescript
renderPath(ctx: CanvasRenderingContext2D, pathData: PathData, endButtons: EndButton[]): void
```
Draws slider path segments and end buttons with current state.

```typescript
renderMarker(ctx: CanvasRenderingContext2D, markerState: MarkerState): void
```
Draws date marker at current position with focus indicator if applicable.

```typescript
clearLayer(ctx: CanvasRenderingContext2D): void
```
Clears entire layer canvas.

### Private Lifecycle

```typescript
setupCanvases(): void
```
Creates 3 canvas elements, sets dimensions with DPR scaling, stacks via CSS.

```typescript
startRenderLoop(): void
```
Initiates RAF loop for continuous rendering.

```typescript
stopRenderLoop(): void
```
Cancels RAF loop.

```typescript
handleRAF(timestamp: DOMHighResTimeStamp): void
```
RAF callback; renders dirty layers and schedules next frame.

---

## Lifecycle Hooks

### useEffect: Canvas Setup

```typescript
useEffect(() => {
  const dpr = window.devicePixelRatio || 1;
  setDpr(dpr);
  setupCanvases();
  markDirty('background');
  markDirty('path');
  markDirty('marker');
  setIsReady(true);
  
  return () => {
    stopRenderLoop();
  };
}, []);
```

### useEffect: Dimension Changes

```typescript
useEffect(() => {
  if (!isReady) return;
  
  [backgroundCanvas, pathCanvas, markerCanvas].forEach(canvas => {
    if (canvas) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext('2d');
      ctx?.scale(dpr, dpr);
    }
  });
  
  invalidateLayers(['background', 'path', 'marker']);
}, [width, height, dpr]);
```

### useEffect: Path Data Changes

```typescript
useEffect(() => {
  invalidateLayers(['path']);
}, [pathData]);
```

### useEffect: Marker State Changes

```typescript
useEffect(() => {
  invalidateLayers(['marker']);
}, [markerState]);
```

### useEffect: RAF Loop Control

```typescript
useEffect(() => {
  if (interactionMode !== 'idle') {
    startRenderLoop();
  } else {
    stopRenderLoop();
    invalidateLayers(['marker', 'path']);
  }
}, [interactionMode]);
```

---

## Dependencies

### External

- React 18+ (`useRef`, `useEffect`, `useState`, `useImperativeHandle`, `forwardRef`)

### Internal

- `PathRenderer` (utility module)
- `MarkerRenderer` (utility module)
- `BackgroundRenderer` (utility module)

---

## Type Definitions

```typescript
interface PathData {
  segments: Float32Array;
  lut: PathLUTEntry[];
  totalLength: number;
  bounds: PathBounds;
}

interface MarkerState {
  position: Point;
  pathDistance: number;
  isDragging: boolean;
}

interface EndButton {
  type: 'start' | 'end';
  center: Point;
  radius: number;
  isActive: boolean;
}

type InteractionMode = 'idle' | 'dragging' | 'drawing';

type Point = { x: number; y: number };
```

---

## Styling

Canvas layers are absolutely positioned and stacked:

```css
.canvas-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.canvas-layer {
  position: absolute;
  top: 0;
  left: 0;
  image-rendering: pixelated;
}

.canvas-layer-background { z-index: 1; }
.canvas-layer-path { z-index: 2; }
.canvas-layer-marker { z-index: 3; }
```

---

## Performance Budget

| Operation | Target | Strategy |
|-----------|--------|----------|
| Background render | <2ms | Cached; only on resize |
| Path render | <5ms | Viewport culling; simplified geometry |
| Marker render | <1ms | Single circle + text |
| Total frame | <16.67ms | Dirty layer tracking |

---

## Accessibility

- Canvas elements have `role="img"` with descriptive `aria-label`
- Focus indicator rendered on marker layer when parent container focused
- No direct keyboard handling (delegated to parent)

---

## Error Handling

```typescript
try {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');
  // ... rendering code
} catch (error) {
  console.error('Canvas rendering error:', error);
  // Fallback: set error state, display message
}
```

---

## Testing Contract

### Unit Tests

- ✅ Creates 3 canvas elements on mount
- ✅ Sets correct dimensions with DPR scaling
- ✅ Marks layers dirty when props change
- ✅ Exposes contexts via ref
- ✅ Cleans up RAF on unmount

### Integration Tests

- ✅ Renders path segments correctly
- ✅ Renders marker at correct position
- ✅ Updates rendering when interaction mode changes
- ✅ Handles resize without errors

### Visual Regression Tests (Playwright)

- ✅ Initial state matches baseline screenshot
- ✅ Dragging marker updates visual correctly
- ✅ Drawing mode extends path visually
- ✅ End buttons render in correct positions

---

## Example Usage

```typescript
import { Canvas } from './components/Canvas';

function Parent() {
  const canvasRef = useRef<CanvasRef>(null);
  const [pathData, setPathData] = useState<PathData>(initialPath);
  const [markerState, setMarkerState] = useState<MarkerState>(initialMarker);
  
  return (
    <Canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      pathData={pathData}
      markerState={markerState}
      endButtons={endButtonsFromPath(pathData)}
      interactionMode="idle"
    />
  );
}
```
