# Utility Module Contract: PathGeometry

**Type**: TypeScript Module  
**Layer**: Core Logic  
**Responsibility**: Path manipulation, intersection detection, distance calculations

---

## Exports

### Types

```typescript
export interface PathData {
  segments: Float32Array;
  lut: PathLUTEntry[];
  totalLength: number;
  bounds: PathBounds;
  spatialGrid: Map<string, number[]>;
  intersections: PathIntersection[];
}

export interface PathLUTEntry {
  distance: number;
  segmentIndex: number;
  x: number;
  y: number;
}

export interface PathBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface PathIntersection {
  segmentIndexA: number;
  segmentIndexB: number;
  point: Point;
  timestamp: number;
}

export type Point = { x: number; y: number };
```

---

## Functions

### createInitialPath

```typescript
export function createInitialPath(
  centerX: number,
  centerY: number,
  width: number = 200
): PathData
```

**Purpose**: Creates the default 200px horizontal slider centered at given coordinates.

**Parameters**:
- `centerX`: X coordinate of center point
- `centerY`: Y coordinate of center point  
- `width`: Total slider width (default 200px)

**Returns**: `PathData` with initial state (2 endpoints, no intersections, simple LUT)

**Example**:
```typescript
const path = createInitialPath(960, 540, 200);
```

---

### addPathSegment

```typescript
export function addPathSegment(
  pathData: PathData,
  point: Point
): PathData
```

**Purpose**: Appends a new segment endpoint during drawing mode.

**Parameters**:
- `pathData`: Current path state
- `point`: New endpoint coordinates

**Returns**: Updated `PathData` with new segment (LUT not yet updated)

**Side Effects**: Does not recompute LUT or spatial grid (deferred until drawing completes)

**Example**:
```typescript
let path = initialPath;
path = addPathSegment(path, { x: 150, y: 200 });
```

---

### finalizePath

```typescript
export function finalizePath(pathData: PathData): PathData
```

**Purpose**: Computes LUT, spatial grid, and intersections after drawing completes.

**Parameters**:
- `pathData`: Path with newly added segments

**Returns**: `PathData` with all metadata computed

**Performance**: O(n) for LUT, O(n) for spatial grid, ~O(n) for intersection detection with spatial hashing

**Example**:
```typescript
const finalPath = finalizePath(drawnPath);
```

---

### computeLUT

```typescript
export function computeLUT(segments: Float32Array): PathLUTEntry[]
```

**Purpose**: Generates lookup table mapping distance-along-path to coordinates.

**Algorithm**: 
1. Iterate segments
2. Calculate cumulative Euclidean distance
3. Store distance, segment index, and coordinates

**Complexity**: O(n) where n = number of segments

**Example**:
```typescript
const lut = computeLUT(pathData.segments);
```

---

### positionFromDistance

```typescript
export function positionFromDistance(
  distance: number,
  lut: PathLUTEntry[],
  segments: Float32Array
): Point
```

**Purpose**: Calculates X/Y coordinates for a given distance along path.

**Algorithm**:
1. Binary search LUT for bracketing entries
2. Linear interpolation between entries
3. Return interpolated point

**Complexity**: O(log n)

**Constraints**: `0 <= distance <= totalLength`

**Example**:
```typescript
const position = positionFromDistance(150, path.lut, path.segments);
```

---

### distanceFromPosition

```typescript
export function distanceFromPosition(
  point: Point,
  pathData: PathData
): number
```

**Purpose**: Finds closest distance-along-path for a given X/Y coordinate (reverse lookup).

**Algorithm**:
1. Use spatial grid to get nearby segments
2. Calculate perpendicular distance to each segment
3. Return distance of closest point on path

**Complexity**: O(k) where k = average segments per grid cell

**Example**:
```typescript
const distance = distanceFromPosition({ x: 200, y: 300 }, pathData);
```

---

### detectIntersections

```typescript
export function detectIntersections(
  segments: Float32Array,
  spatialGrid: Map<string, number[]>
): PathIntersection[]
```

**Purpose**: Finds all self-intersection points in path.

**Algorithm**:
1. For each segment, query spatial grid for nearby segments
2. Perform line-line intersection test
3. Only test segments not adjacent (indices differ by > 1)
4. Store intersection with timestamp = lower segment index

**Complexity**: ~O(n) with spatial hashing, O(n²) naive

**Example**:
```typescript
const intersections = detectIntersections(path.segments, path.spatialGrid);
```

---

### buildSpatialGrid

```typescript
export function buildSpatialGrid(
  segments: Float32Array,
  cellSize: number = 75
): Map<string, number[]>
```

**Purpose**: Creates spatial hash grid for efficient proximity queries.

**Algorithm**:
1. Divide canvas into grid cells of `cellSize` pixels
2. For each segment, determine which cells it overlaps
3. Add segment index to those cells in map

**Returns**: Map with keys `"${gridX},${gridY}"` and values as segment index arrays

**Example**:
```typescript
const grid = buildSpatialGrid(path.segments, 75);
```

---

### clipSegmentToViewport

```typescript
export function clipSegmentToViewport(
  p1: Point,
  p2: Point,
  viewport: PathBounds
): [Point, Point] | null
```

**Purpose**: Clips line segment to viewport rectangle using Cohen-Sutherland algorithm.

**Returns**: 
- Clipped segment endpoints if any part visible
- `null` if segment entirely outside viewport

**Example**:
```typescript
const clipped = clipSegmentToViewport(
  { x: -10, y: 50 },
  { x: 110, y: 50 },
  { minX: 0, minY: 0, maxX: 100, maxY: 100 }
);
```

---

### simplifyPath

```typescript
export function simplifyPath(
  segments: Float32Array,
  epsilon: number = 1.5
): Float32Array
```

**Purpose**: Reduces segment count using Ramer-Douglas-Peucker algorithm.

**Parameters**:
- `segments`: Original path segments
- `epsilon`: Tolerance in pixels (higher = more aggressive simplification)

**Returns**: Simplified segments array (fewer points)

**Usage**: Call during idle time (via `requestIdleCallback`) to optimize very long paths

**Example**:
```typescript
requestIdleCallback(() => {
  const simplified = simplifyPath(path.segments, 1.5);
  updatePath(simplified);
});
```

---

### calculatePathBounds

```typescript
export function calculatePathBounds(segments: Float32Array): PathBounds
```

**Purpose**: Computes axis-aligned bounding box for path.

**Returns**: Min/max X/Y coordinates encompassing all segments

**Example**:
```typescript
const bounds = calculatePathBounds(path.segments);
```

---

### lineLineIntersection

```typescript
export function lineLineIntersection(
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point
): Point | null
```

**Purpose**: Calculates intersection point of two line segments.

**Returns**: 
- Intersection point if segments cross
- `null` if parallel or non-intersecting

**Algorithm**: Parametric line equation with bounds checking

**Example**:
```typescript
const intersection = lineLineIntersection(
  { x: 0, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
  { x: 10, y: 0 }
);
```

---

## Constants

```typescript
export const SPATIAL_GRID_CELL_SIZE = 75;
export const PATH_SIMPLIFICATION_EPSILON = 1.5;
export const INITIAL_SLIDER_WIDTH = 200;
```

---

## Dependencies

None (pure TypeScript, no external libraries)

---

## Performance Notes

- Use `Float32Array` instead of `Float64Array` for 50% memory savings
- Spatial grid reduces intersection detection from O(n²) to ~O(n)
- LUT binary search achieves O(log n) positioning queries
- Path simplification deferred to idle callbacks to avoid blocking

---

## Testing Contract

### Unit Tests

- ✅ `createInitialPath` returns 200px horizontal line
- ✅ `addPathSegment` appends coordinates to segments array
- ✅ `computeLUT` generates correct cumulative distances
- ✅ `positionFromDistance` interpolates correctly between LUT entries
- ✅ `distanceFromPosition` finds closest point on path
- ✅ `detectIntersections` identifies self-intersecting segments
- ✅ `buildSpatialGrid` assigns segments to correct cells
- ✅ `clipSegmentToViewport` handles all Cohen-Sutherland cases (inside, outside, partial)
- ✅ `simplifyPath` reduces points while preserving shape
- ✅ `lineLineIntersection` correctly computes intersection or null

### Property-Based Tests (optional)

- ✅ `positionFromDistance(distanceFromPosition(p)) ≈ p` (round-trip)
- ✅ Simplified path within `epsilon` of original
- ✅ LUT distances monotonically increasing

---

## Example Usage

```typescript
import {
  createInitialPath,
  addPathSegment,
  finalizePath,
  positionFromDistance
} from './core/geometry/PathGeometry';

let path = createInitialPath(960, 540);

while (drawing) {
  path = addPathSegment(path, currentMousePos);
}

path = finalizePath(path);

const markerPos = positionFromDistance(150, path.lut, path.segments);
```
