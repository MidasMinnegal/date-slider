# Component Contract: DateDisplay

**Type**: React Component (Presentation)  
**Layer**: UI Overlay  
**Responsibility**: Displays formatted date text positioned near marker

---

## Props

### Input Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `date` | `Date` | Yes | - | Date object to display |
| `position` | `Point` | Yes | - | X/Y coordinates for positioning |
| `visible` | `boolean` | No | `true` | Whether to show date display |
| `className` | `string` | No | `''` | Additional CSS classes |
| `testId` | `string` | No | `'date-display'` | Test identifier |

---

## State

This component is stateless (pure presentation).

---

## Rendering

### HTML Structure

```tsx
<div
  className={`date-display ${className}`}
  style={{
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: 'translate(-50%, -100%)',
    visibility: visible ? 'visible' : 'hidden'
  }}
  data-testid={testId}
  aria-live="polite"
  aria-atomic="true"
>
  {formatDate(date)}
</div>
```

### Positioning Logic

```typescript
function calculateDisplayPosition(
  markerPos: Point,
  canvasBounds: Rect
): Point {
  const offset = { x: 0, y: -40 };
  let x = markerPos.x + offset.x;
  let y = markerPos.y + offset.y;
  
  const TEXT_WIDTH = 200;
  const TEXT_HEIGHT = 30;
  
  if (y - TEXT_HEIGHT < 0) {
    y = markerPos.y + 40;
  }
  
  if (x + TEXT_WIDTH / 2 > canvasBounds.width) {
    x = canvasBounds.width - TEXT_WIDTH / 2 - 10;
  }
  
  if (x - TEXT_WIDTH / 2 < 0) {
    x = TEXT_WIDTH / 2 + 10;
  }
  
  return { x, y };
}
```

---

## Methods

### Private

```typescript
formatDate(date: Date): string
```
Formats date as "Month Day, Year" (e.g., "January 1, 1900").

```typescript
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatDate(date: Date): string {
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}
```

---

## Lifecycle Hooks

### useMemo: Formatted Date

```typescript
const formattedDate = useMemo(() => {
  return formatDate(date);
}, [date]);
```

---

## Dependencies

### External

- React 18+ (`useMemo`)

### Internal

None (pure presentation component)

---

## Type Definitions

```typescript
interface DateDisplayProps {
  date: Date;
  position: Point;
  visible?: boolean;
  className?: string;
  testId?: string;
}

type Point = {
  x: number;
  y: number;
};
```

---

## Styling

```css
.date-display {
  position: absolute;
  pointer-events: none;
  user-select: none;
  
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
  
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  
  transition: opacity 0.15s ease;
}

.date-display[aria-hidden="true"] {
  opacity: 0;
}
```

---

## Accessibility

- Uses `aria-live="polite"` to announce date changes to screen readers
- `aria-atomic="true"` ensures entire date string is read on change
- `pointer-events: none` prevents interference with canvas interactions
- Semantic HTML with clear text content (not canvas-rendered)

---

## Performance Notes

- Component uses `React.memo` to prevent unnecessary re-renders
- Formatting memoized based on date prop
- Pure functional component (no side effects)
- Minimal DOM structure (single div)

---

## Error Handling

```typescript
function formatDate(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.warn('Invalid date provided to DateDisplay:', date);
    return 'Invalid Date';
  }
  // ... formatting logic
}
```

---

## Testing Contract

### Unit Tests

- ✅ Renders formatted date string correctly
- ✅ Positions element at provided coordinates
- ✅ Handles invisible state (`visible={false}`)
- ✅ Formats dates correctly for various inputs (past, future, leap years)
- ✅ Shows "Invalid Date" for invalid Date objects
- ✅ Re-renders only when date or position changes (memo optimization)

### Snapshot Tests

- ✅ HTML structure matches expected output
- ✅ CSS classes applied correctly

---

## Example Usage

```typescript
import { DateDisplay } from './components/DateDisplay';

function App() {
  const [markerPos, setMarkerPos] = useState({ x: 400, y: 300 });
  const [currentDate, setCurrentDate] = useState(new Date(1900, 0, 1));
  
  return (
    <>
      <Canvas onMarkerMove={setMarkerPos} />
      <DateDisplay
        date={currentDate}
        position={markerPos}
        visible={true}
      />
    </>
  );
}
```

---

## Edge Cases

### Viewport Boundaries

- If marker near top edge: display below marker instead of above
- If marker near right edge: clamp position to stay within viewport
- If marker near left edge: clamp position to stay within viewport

### Date Range

- Handles dates far in past (e.g., 1 CE, 1000 BCE)
- Handles dates far in future (e.g., year 10000)
- Correctly formats negative years as "Year -5000" for BCE dates

### Performance

- Position updates throttled by parent's RAF loop (max 60fps)
- No animation overhead (uses CSS transform for positioning)
