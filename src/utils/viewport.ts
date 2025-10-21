import type { Point, PathBounds } from '@/types';

export function isPointInViewport(point: Point, viewport: PathBounds): boolean {
  return (
    point.x >= viewport.minX &&
    point.x <= viewport.maxX &&
    point.y >= viewport.minY &&
    point.y <= viewport.maxY
  );
}

export function clampPointToViewport(point: Point, viewport: PathBounds): Point {
  return {
    x: Math.max(viewport.minX, Math.min(viewport.maxX, point.x)),
    y: Math.max(viewport.minY, Math.min(viewport.maxY, point.y))
  };
}

export function getCanvasCoordinates(
  event: MouseEvent | TouchEvent,
  canvas: HTMLCanvasElement
): Point {
  const rect = canvas.getBoundingClientRect();
  
  let clientX: number;
  let clientY: number;
  
  if ('touches' in event && event.touches.length > 0) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else if ('clientX' in event) {
    clientX = event.clientX;
    clientY = event.clientY;
  } else {
    return { x: 0, y: 0 };
  }
  
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpPoint(p1: Point, p2: Point, t: number): Point {
  return {
    x: lerp(p1.x, p2.x, t),
    y: lerp(p1.y, p2.y, t)
  };
}
