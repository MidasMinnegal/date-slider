# Utility Module Contract: DateCalculations

**Type**: TypeScript Module  
**Layer**: Core Logic  
**Responsibility**: Date arithmetic, formatting, and conversion between dates and path distances

---

## Exports

### Constants

```typescript
export const BASE_DATE = new Date(1900, 0, 1);
export const PIXELS_PER_DAY = 1;
```

---

## Functions

### distanceToDate

```typescript
export function distanceToDate(distance: number): Date
```

**Purpose**: Converts distance along path (in pixels) to a Date object.

**Algorithm**:
```
days_since_base = round(distance / PIXELS_PER_DAY)
result_date = BASE_DATE + days_since_base
```

**Parameters**:
- `distance`: Distance in pixels along path

**Returns**: Date object representing the selected date

**Example**:
```typescript
const date = distanceToDate(365);
```

---

### dateToDistance

```typescript
export function dateToDistance(date: Date): number
```

**Purpose**: Converts a Date object to distance along path (in pixels).

**Algorithm**:
```
milliseconds_diff = date - BASE_DATE
days_diff = milliseconds_diff / MS_PER_DAY
distance = days_diff * PIXELS_PER_DAY
```

**Parameters**:
- `date`: Date object to convert

**Returns**: Distance in pixels from path start

**Example**:
```typescript
const distance = dateToDistance(new Date(1920, 5, 15));
```

---

### formatDate

```typescript
export function formatDate(date: Date): string
```

**Purpose**: Formats Date object as human-readable string.

**Format**: `"Month Day, Year"` (e.g., `"January 1, 1900"`)

**Parameters**:
- `date`: Date object to format

**Returns**: Formatted date string

**Error Handling**: Returns `"Invalid Date"` for invalid Date objects

**Example**:
```typescript
const formatted = formatDate(new Date(1900, 0, 1));
```

---

### addDays

```typescript
export function addDays(date: Date, days: number): Date
```

**Purpose**: Adds or subtracts days from a date (for keyboard navigation).

**Parameters**:
- `date`: Starting date
- `days`: Number of days to add (negative to subtract)

**Returns**: New Date object (does not mutate input)

**Example**:
```typescript
const nextWeek = addDays(currentDate, 7);
const yesterday = addDays(currentDate, -1);
```

---

### daysBetween

```typescript
export function daysBetween(date1: Date, date2: Date): number
```

**Purpose**: Calculates number of days between two dates.

**Parameters**:
- `date1`: First date
- `date2`: Second date

**Returns**: Integer number of days (can be negative)

**Example**:
```typescript
const days = daysBetween(
  new Date(1900, 0, 1),
  new Date(1900, 0, 10)
);
```

---

### isValidDate

```typescript
export function isValidDate(date: Date): boolean
```

**Purpose**: Checks if Date object represents a valid date.

**Parameters**:
- `date`: Date object to validate

**Returns**: `true` if valid, `false` if invalid or NaN

**Example**:
```typescript
isValidDate(new Date(1900, 0, 1));
isValidDate(new Date('invalid'));
```

---

### clampDate

```typescript
export function clampDate(
  date: Date,
  minDate: Date | null = null,
  maxDate: Date | null = null
): Date
```

**Purpose**: Clamps date to specified range (if limits provided).

**Parameters**:
- `date`: Date to clamp
- `minDate`: Minimum allowed date (or `null` for no minimum)
- `maxDate`: Maximum allowed date (or `null` for no maximum)

**Returns**: Clamped Date object

**Example**:
```typescript
const clamped = clampDate(
  new Date(1850, 0, 1),
  new Date(1900, 0, 1),
  new Date(2000, 0, 1)
);
```

---

### parseFormattedDate

```typescript
export function parseFormattedDate(formatted: string): Date | null
```

**Purpose**: Parses formatted date string back to Date object (for testing/serialization).

**Format**: Expects `"Month Day, Year"` format

**Parameters**:
- `formatted`: Date string to parse

**Returns**: 
- Date object if parsing succeeds
- `null` if format invalid

**Example**:
```typescript
const date = parseFormattedDate("January 1, 1900");
```

---

## Internal Helpers

### getMonthName

```typescript
function getMonthName(monthIndex: number): string
```

**Purpose**: Converts month index (0-11) to month name.

**Implementation**:
```typescript
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getMonthName(monthIndex: number): string {
  return MONTH_NAMES[monthIndex];
}
```

---

### monthNameToIndex

```typescript
function monthNameToIndex(monthName: string): number
```

**Purpose**: Converts month name to index (0-11) for parsing.

**Returns**: Month index or -1 if invalid

---

## Constants (Internal)

```typescript
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
```

---

## Edge Cases

### Leap Years

```typescript
addDays(new Date(2000, 1, 28), 1);
addDays(new Date(1900, 1, 28), 1);
```

**Behavior**: JavaScript Date handles leap years automatically (1900 not leap, 2000 is leap).

### BCE Dates (Negative Years)

```typescript
formatDate(new Date(-1000, 0, 1));
```

**Behavior**: Format as `"January 1, -1000"` (negative year indicates BCE).

### Far Future Dates

```typescript
const farFuture = new Date(10000, 0, 1);
```

**Behavior**: JavaScript Date supports years up to ±8,640,000 trillion days from epoch.

### DST (Daylight Saving Time)

**Behavior**: Date arithmetic uses UTC internally to avoid DST edge cases.

---

## Dependencies

None (uses only JavaScript built-in Date API)

---

## Performance Notes

- Date arithmetic is fast (native implementation)
- Formatting uses array lookup (O(1))
- No external libraries required
- All functions pure (no side effects)

---

## Testing Contract

### Unit Tests

- ✅ `distanceToDate(0)` returns `BASE_DATE`
- ✅ `distanceToDate(365)` returns January 1, 1901
- ✅ `dateToDistance(BASE_DATE)` returns 0
- ✅ `formatDate` handles all months correctly
- ✅ `formatDate` handles negative years (BCE)
- ✅ `addDays` handles leap years
- ✅ `daysBetween` returns correct difference
- ✅ `isValidDate` rejects invalid dates
- ✅ `clampDate` respects min/max bounds
- ✅ `parseFormattedDate` round-trips with `formatDate`

### Edge Case Tests

- ✅ Leap year boundaries (Feb 28/29)
- ✅ Century years (1900 not leap, 2000 is leap)
- ✅ Far past dates (year 1 CE)
- ✅ Far future dates (year 10000)
- ✅ Negative years (BCE dates)

---

## Example Usage

```typescript
import {
  distanceToDate,
  dateToDistance,
  formatDate,
  addDays
} from './core/state/DateCalculations';

const distance = 150;

const date = distanceToDate(distance);

const formatted = formatDate(date);

const nextDay = addDays(date, 1);

const newDistance = dateToDistance(nextDay);
```

---

## Type Safety

```typescript
export function distanceToDate(distance: number): Date {
  if (!Number.isFinite(distance)) {
    throw new Error('Distance must be finite number');
  }
  
  const daysSinceBase = Math.round(distance / PIXELS_PER_DAY);
  const result = new Date(BASE_DATE);
  result.setDate(result.getDate() + daysSinceBase);
  
  return result;
}

export function formatDate(date: Date): string {
  if (!isValidDate(date)) {
    return 'Invalid Date';
  }
  
  const month = getMonthName(date.getMonth());
  const day = date.getDate();
  const year = date.getFullYear();
  
  return `${month} ${day}, ${year}`;
}
```
