# Component Contract: DatepickerCanvas

**Type**: React Component (Container)  
**Layer**: Application  
**Responsibility**: Top-level container managing state and coordinating child components

---

## Props

### Input Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `className` | `string` | No | `''` | Additional CSS classes for styling |
| `onDateChange` | `(date: Date) => void` | No | `undefined` | Callback fired when selected date changes |
| `initialDate` | `Date` | No | `new Date(1900, 0, 1)` | Starting date for marker position |
| `testId` | `string` | No | `'datepicker-canvas'` | Test identifier for automation |

### Ref

```typescript
interface DatepickerCanvasRef {
  getCurrentDate(): Date;
  setDate(date: Date): void;
  resetToDefault(): void;
}
```

---

## State

### Local State

```typescript
interface DatepickerCanvasState {
  interactionMode: 'idle' | 'dragging' | 'drawing';
  selectedDate: Date;
  isInitialized: boolean;
}
```

### Ref-Stored State (non-reactive)

```typescript
interface DatepickerCanvasRefs {
  pathData: PathData;
  markerState: MarkerState;
  canvasContexts: CanvasContexts;
  rafId: number | null;
  pointerState: PointerState;
}
```

---

## Events

### Emitted Events

| Event | Payload | When Fired | Frequency |
|-------|---------|------------|-----------|
| `onDateChange` | `Date` | Date changes via drag/keyboard/drawing | Throttled to 60fps max |

### Consumed Events

| Event | Source | Handler | Purpose |
|-------|--------|---------|---------|
| `pointerdown` | `window` | `handlePointerDown` | Detect marker drag or button press |
| `pointermove` | `window` | `handlePointerMove` | Update drag position or extend path |
| `pointerup` | `window` | `handlePointerUp` | End drag or finalize drawing |
| `keydown` | `window` | `handleKeyDown` | Keyboard navigation (arrow keys) |
| `resize` | `window` | `handleResize` | Adjust canvas dimensions |

---

## Children Components

```typescript
<DatepickerCanvas>
  <Canvas ref={canvasRef} />
  <DateDisplay position={displayPosition} date={selectedDate} />
  <ScreenReaderAnnouncer date={selectedDate} />
</DatepickerCanvas>
```

---

## Methods

### Public (via ref)

```typescript
getCurrentDate(): Date
```
Returns currently selected date.

```typescript
setDate(date: Date): void
```
Programmatically set marker to specific date position.

```typescript
resetToDefault(): void
```
Reset slider to initial 200px state at January 1, 1900.

### Private

```typescript
handlePointerDown(event: PointerEvent): void
```
Determines if pointer is over marker or end button; transitions interaction mode.

```typescript
handlePointerMove(event: PointerEvent): void
```
Updates marker position (dragging mode) or extends path (drawing mode).

```typescript
handlePointerUp(event: PointerEvent): void
```
Ends current interaction; finalizes path if in drawing mode.

```typescript
handleKeyDown(event: KeyboardEvent): void
```
Arrow keys: move marker ±1 day (±10 with Shift); Escape: reset to idle.

```typescript
handleResize(): void
```
Recalculates canvas dimensions and redraws all layers.

```typescript
updateDateFromMarker(): void
```
Calculates date from marker's path distance and triggers `onDateChange`.

```typescript
startRenderLoop(): void
```
Initiates RAF loop for continuous rendering during interactions.

```typescript
stopRenderLoop(): void
```
Cancels RAF loop when returning to idle state.

---

## Lifecycle Hooks

### useEffect: Initialization

```typescript
useEffect(() => {
  initializeCanvas();
  createInitialPath();
  attachEventListeners();
  
  return () => {
    detachEventListeners();
    cancelAnimationFrame(rafId.current);
  };
}, []);
```

### useEffect: Date Change Notification

```typescript
useEffect(() => {
  if (onDateChange && isInitialized) {
    onDateChange(selectedDate);
  }
}, [selectedDate]);
```

### useEffect: Interaction Mode Transitions

```typescript
useEffect(() => {
  if (interactionMode !== 'idle') {
    startRenderLoop();
  } else {
    stopRenderLoop();
  }
}, [interactionMode]);
```

---

## Dependencies

### External

- React 18+ (`useState`, `useRef`, `useEffect`, `useImperativeHandle`, `forwardRef`)

### Internal

- `Canvas` (child component)
- `DateDisplay` (child component)
- `ScreenReaderAnnouncer` (child component)
- `PathGeometry` (utility module)
- `DateCalculations` (utility module)
- `HitDetection` (utility module)

---

## Type Definitions

```typescript
import { PathData, MarkerState, PointerState } from './types';

interface CanvasContexts {
  background: CanvasRenderingContext2D;
  path: CanvasRenderingContext2D;
  marker: CanvasRenderingContext2D;
}
```

---

## Accessibility

- Manages focus state for canvas element (`tabIndex={0}`)
- Forwards keyboard events to internal handlers
- Coordinates with `ScreenReaderAnnouncer` for date announcements
- Provides ARIA label: `aria-label="Drawable datepicker canvas"`

---

## Performance Notes

- State updates batched via React 18 automatic batching
- Animation state stored in refs to avoid re-renders during interactions
- RAF loop only active during `dragging` or `drawing` modes
- Pointer events use passive listeners where appropriate
- Window event listeners attached/detached in useEffect cleanup

---

## Error Handling

```typescript
try {
  const contexts = initializeCanvas();
  if (!contexts) throw new Error('Canvas initialization failed');
} catch (error) {
  console.error('DatepickerCanvas error:', error);
  // Fallback: render error state UI
}
```

---

## Testing Contract

### Unit Tests

- ✅ Renders without crashing
- ✅ Initializes with default date (January 1, 1900)
- ✅ Accepts custom `initialDate` prop
- ✅ Calls `onDateChange` when date changes
- ✅ Exposes ref methods (`getCurrentDate`, `setDate`, `resetToDefault`)

### Integration Tests

- ✅ Pointer down on marker transitions to `dragging` mode
- ✅ Pointer move while dragging updates marker position
- ✅ Pointer up while dragging returns to `idle` mode
- ✅ Pointer down on end button transitions to `drawing` mode
- ✅ Drawing extends path from button position
- ✅ Keyboard navigation changes date by correct amount

### Snapshot Tests

- ✅ Component structure matches expected JSX tree

---

## Example Usage

```typescript
import { DatepickerCanvas } from './components/DatepickerCanvas';

function App() {
  const canvasRef = useRef<DatepickerCanvasRef>(null);
  
  const handleDateChange = (date: Date) => {
    console.log('Selected date:', date);
  };
  
  const handleReset = () => {
    canvasRef.current?.resetToDefault();
  };
  
  return (
    <div>
      <DatepickerCanvas
        ref={canvasRef}
        onDateChange={handleDateChange}
        initialDate={new Date(1920, 5, 15)}
      />
      <button onClick={handleReset}>Reset</button>
    </div>
  );
}
```
