import type { Point, PathLUTEntry, PathBounds, PathIntersection, Path } from '@/types';

export const SPATIAL_GRID_CELL_SIZE = 75;
export const PATH_SIMPLIFICATION_EPSILON = 1.5;
export const INITIAL_SLIDER_WIDTH = 200;

export function createInitialPath(
  centerX: number,
  centerY: number,
  width: number = INITIAL_SLIDER_WIDTH
): Path {
  const halfWidth = width / 2;
  const segments = new Float32Array([
    centerX - halfWidth, centerY,
    centerX + halfWidth, centerY
  ]);
  
  const lut = computeLUT(segments);
  const bounds = calculatePathBounds(segments);
  const spatialGrid = buildSpatialGrid(segments, SPATIAL_GRID_CELL_SIZE);
  
  return {
    segments,
    lut,
    totalLength: lut[lut.length - 1].distance,
    bounds,
    spatialGrid,
    intersections: []
  };
}

export function addPathSegment(pathData: Path, point: Point): Path {
  const newSegments = new Float32Array(pathData.segments.length + 2);
  newSegments.set(pathData.segments);
  newSegments[pathData.segments.length] = point.x;
  newSegments[pathData.segments.length + 1] = point.y;
  
  return {
    ...pathData,
    segments: newSegments
  };
}

export function prependPathSegment(pathData: Path, point: Point): Path {
  const newSegments = new Float32Array(pathData.segments.length + 2);
  newSegments[0] = point.x;
  newSegments[1] = point.y;
  newSegments.set(pathData.segments, 2);
  
  return {
    ...pathData,
    segments: newSegments
  };
}

export function finalizePath(pathData: Path): Path {
  const lut = computeLUT(pathData.segments);
  const bounds = calculatePathBounds(pathData.segments);
  const spatialGrid = buildSpatialGrid(pathData.segments, SPATIAL_GRID_CELL_SIZE);
  const intersections = detectIntersections(pathData.segments, spatialGrid);
  
  return {
    ...pathData,
    lut,
    totalLength: lut.length > 0 ? lut[lut.length - 1].distance : 0,
    bounds,
    spatialGrid,
    intersections
  };
}

export function computeLUT(segments: Float32Array): PathLUTEntry[] {
  const lut: PathLUTEntry[] = [];
  let cumulativeDistance = 0;
  
  for (let i = 0; i < segments.length - 2; i += 2) {
    const x1 = segments[i];
    const y1 = segments[i + 1];
    const x2 = segments[i + 2];
    const y2 = segments[i + 3];
    
    lut.push({
      distance: cumulativeDistance,
      segmentIndex: i / 2,
      x: x1,
      y: y1
    });
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);
    cumulativeDistance += segmentLength;
  }
  
  if (segments.length >= 2) {
    const lastIndex = segments.length - 2;
    lut.push({
      distance: cumulativeDistance,
      segmentIndex: lastIndex / 2,
      x: segments[lastIndex],
      y: segments[lastIndex + 1]
    });
  }
  
  return lut;
}

export function positionFromDistance(
  distance: number,
  lut: PathLUTEntry[]
): Point {
  if (lut.length === 0) {
    return { x: 0, y: 0 };
  }
  
  if (distance <= 0) {
    return { x: lut[0].x, y: lut[0].y };
  }
  
  if (distance >= lut[lut.length - 1].distance) {
    const last = lut[lut.length - 1];
    return { x: last.x, y: last.y };
  }
  
  let low = 0;
  let high = lut.length - 1;
  
  while (low < high - 1) {
    const mid = Math.floor((low + high) / 2);
    if (lut[mid].distance <= distance) {
      low = mid;
    } else {
      high = mid;
    }
  }
  
  const a = lut[low];
  const b = lut[high];
  const t = (distance - a.distance) / (b.distance - a.distance);
  
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t
  };
}

export function distanceFromPosition(point: Point, pathData: Path): number {
  let minDistance = Infinity;
  let closestPathDistance = 0;
  
  const cellX = Math.floor(point.x / SPATIAL_GRID_CELL_SIZE);
  const cellY = Math.floor(point.y / SPATIAL_GRID_CELL_SIZE);
  
  const segmentIndices = new Set<number>();
  
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const key = `${cellX + dx},${cellY + dy}`;
      const indices = pathData.spatialGrid.get(key);
      if (indices) {
        indices.forEach(idx => segmentIndices.add(idx));
      }
    }
  }
  
  if (segmentIndices.size === 0) {
    for (let i = 0; i < pathData.segments.length - 2; i += 2) {
      segmentIndices.add(i / 2);
    }
  }
  
  segmentIndices.forEach(segIdx => {
    const i = segIdx * 2;
    const x1 = pathData.segments[i];
    const y1 = pathData.segments[i + 1];
    const x2 = pathData.segments[i + 2];
    const y2 = pathData.segments[i + 3];
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const segmentLengthSq = dx * dx + dy * dy;
    
    let t = 0;
    if (segmentLengthSq > 0) {
      t = Math.max(0, Math.min(1, ((point.x - x1) * dx + (point.y - y1) * dy) / segmentLengthSq));
    }
    
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    
    const distX = point.x - closestX;
    const distY = point.y - closestY;
    const dist = Math.sqrt(distX * distX + distY * distY);
    
    if (dist < minDistance) {
      minDistance = dist;
      
      const segmentStartDistance = pathData.lut[segIdx]?.distance || 0;
      const segmentLength = Math.sqrt(segmentLengthSq);
      closestPathDistance = segmentStartDistance + t * segmentLength;
    }
  });
  
  return closestPathDistance;
}

export function detectIntersections(
  segments: Float32Array,
  spatialGrid: Map<string, number[]>
): PathIntersection[] {
  const intersections: PathIntersection[] = [];
  const timestamp = Date.now();
  
  for (let i = 0; i < segments.length - 2; i += 2) {
    const x1 = segments[i];
    const y1 = segments[i + 1];
    const x2 = segments[i + 2];
    const y2 = segments[i + 3];
    
    const cellMinX = Math.floor(Math.min(x1, x2) / SPATIAL_GRID_CELL_SIZE);
    const cellMaxX = Math.floor(Math.max(x1, x2) / SPATIAL_GRID_CELL_SIZE);
    const cellMinY = Math.floor(Math.min(y1, y2) / SPATIAL_GRID_CELL_SIZE);
    const cellMaxY = Math.floor(Math.max(y1, y2) / SPATIAL_GRID_CELL_SIZE);
    
    const nearbySegments = new Set<number>();
    
    for (let cx = cellMinX; cx <= cellMaxX; cx++) {
      for (let cy = cellMinY; cy <= cellMaxY; cy++) {
        const key = `${cx},${cy}`;
        const indices = spatialGrid.get(key);
        if (indices) {
          indices.forEach(idx => nearbySegments.add(idx));
        }
      }
    }
    
    nearbySegments.forEach(j => {
      if (Math.abs(i / 2 - j) <= 1) return;
      
      const jIdx = j * 2;
      const x3 = segments[jIdx];
      const y3 = segments[jIdx + 1];
      const x4 = segments[jIdx + 2];
      const y4 = segments[jIdx + 3];
      
      const intersection = lineLineIntersection(
        { x: x1, y: y1 },
        { x: x2, y: y2 },
        { x: x3, y: y3 },
        { x: x4, y: y4 }
      );
      
      if (intersection) {
        intersections.push({
          segmentIndexA: Math.min(i / 2, j),
          segmentIndexB: Math.max(i / 2, j),
          point: intersection,
          timestamp
        });
      }
    });
  }
  
  return intersections;
}

export function buildSpatialGrid(
  segments: Float32Array,
  cellSize: number = SPATIAL_GRID_CELL_SIZE
): Map<string, number[]> {
  const grid = new Map<string, number[]>();
  
  for (let i = 0; i < segments.length - 2; i += 2) {
    const x1 = segments[i];
    const y1 = segments[i + 1];
    const x2 = segments[i + 2];
    const y2 = segments[i + 3];
    
    const cellMinX = Math.floor(Math.min(x1, x2) / cellSize);
    const cellMaxX = Math.floor(Math.max(x1, x2) / cellSize);
    const cellMinY = Math.floor(Math.min(y1, y2) / cellSize);
    const cellMaxY = Math.floor(Math.max(y1, y2) / cellSize);
    
    for (let cx = cellMinX; cx <= cellMaxX; cx++) {
      for (let cy = cellMinY; cy <= cellMaxY; cy++) {
        const key = `${cx},${cy}`;
        if (!grid.has(key)) {
          grid.set(key, []);
        }
        grid.get(key)!.push(i / 2);
      }
    }
  }
  
  return grid;
}

export function clipSegmentToViewport(
  p1: Point,
  p2: Point,
  viewport: PathBounds
): [Point, Point] | null {
  const INSIDE = 0;
  const LEFT = 1;
  const RIGHT = 2;
  const BOTTOM = 4;
  const TOP = 8;
  
  const computeOutCode = (p: Point): number => {
    let code = INSIDE;
    if (p.x < viewport.minX) code |= LEFT;
    else if (p.x > viewport.maxX) code |= RIGHT;
    if (p.y < viewport.minY) code |= BOTTOM;
    else if (p.y > viewport.maxY) code |= TOP;
    return code;
  };
  
  let x1 = p1.x, y1 = p1.y;
  let x2 = p2.x, y2 = p2.y;
  let outcode1 = computeOutCode(p1);
  let outcode2 = computeOutCode(p2);
  
  while (true) {
    if ((outcode1 | outcode2) === 0) {
      return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
    }
    
    if ((outcode1 & outcode2) !== 0) {
      return null;
    }
    
    const outcodeOut = outcode1 !== 0 ? outcode1 : outcode2;
    let x = 0, y = 0;
    
    if (outcodeOut & TOP) {
      x = x1 + (x2 - x1) * (viewport.maxY - y1) / (y2 - y1);
      y = viewport.maxY;
    } else if (outcodeOut & BOTTOM) {
      x = x1 + (x2 - x1) * (viewport.minY - y1) / (y2 - y1);
      y = viewport.minY;
    } else if (outcodeOut & RIGHT) {
      y = y1 + (y2 - y1) * (viewport.maxX - x1) / (x2 - x1);
      x = viewport.maxX;
    } else if (outcodeOut & LEFT) {
      y = y1 + (y2 - y1) * (viewport.minX - x1) / (x2 - x1);
      x = viewport.minX;
    }
    
    if (outcodeOut === outcode1) {
      x1 = x;
      y1 = y;
      outcode1 = computeOutCode({ x: x1, y: y1 });
    } else {
      x2 = x;
      y2 = y;
      outcode2 = computeOutCode({ x: x2, y: y2 });
    }
  }
}

export function simplifyPath(
  segments: Float32Array,
  epsilon: number = PATH_SIMPLIFICATION_EPSILON
): Float32Array {
  const points: Point[] = [];
  for (let i = 0; i < segments.length; i += 2) {
    points.push({ x: segments[i], y: segments[i + 1] });
  }
  
  const simplified = ramerDouglasPeucker(points, epsilon);
  
  const result = new Float32Array(simplified.length * 2);
  for (let i = 0; i < simplified.length; i++) {
    result[i * 2] = simplified[i].x;
    result[i * 2 + 1] = simplified[i].y;
  }
  
  return result;
}

function ramerDouglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) {
    return points;
  }
  
  let maxDistance = 0;
  let index = 0;
  const end = points.length - 1;
  
  for (let i = 1; i < end; i++) {
    const distance = perpendicularDistance(points[i], points[0], points[end]);
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }
  
  if (maxDistance > epsilon) {
    const left = ramerDouglasPeucker(points.slice(0, index + 1), epsilon);
    const right = ramerDouglasPeucker(points.slice(index), epsilon);
    return [...left.slice(0, -1), ...right];
  } else {
    return [points[0], points[end]];
  }
}

function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSq = dx * dx + dy * dy;
  
  if (lengthSq === 0) {
    const pdx = point.x - lineStart.x;
    const pdy = point.y - lineStart.y;
    return Math.sqrt(pdx * pdx + pdy * pdy);
  }
  
  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSq;
  const clampedT = Math.max(0, Math.min(1, t));
  const closestX = lineStart.x + clampedT * dx;
  const closestY = lineStart.y + clampedT * dy;
  
  const distX = point.x - closestX;
  const distY = point.y - closestY;
  
  return Math.sqrt(distX * distX + distY * distY);
}

export function calculatePathBounds(segments: Float32Array): PathBounds {
  if (segments.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  
  let minX = segments[0];
  let maxX = segments[0];
  let minY = segments[1];
  let maxY = segments[1];
  
  for (let i = 2; i < segments.length; i += 2) {
    minX = Math.min(minX, segments[i]);
    maxX = Math.max(maxX, segments[i]);
    minY = Math.min(minY, segments[i + 1]);
    maxY = Math.max(maxY, segments[i + 1]);
  }
  
  return { minX, minY, maxX, maxY };
}

export function lineLineIntersection(
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point
): Point | null {
  const dax = a2.x - a1.x;
  const day = a2.y - a1.y;
  const dbx = b2.x - b1.x;
  const dby = b2.y - b1.y;
  
  const denominator = dax * dby - day * dbx;
  
  if (Math.abs(denominator) < 1e-10) {
    return null;
  }
  
  const dx = b1.x - a1.x;
  const dy = b1.y - a1.y;
  
  const t = (dx * dby - dy * dbx) / denominator;
  const u = (dx * day - dy * dax) / denominator;
  
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: a1.x + t * dax,
      y: a1.y + t * day
    };
  }
  
  return null;
}
