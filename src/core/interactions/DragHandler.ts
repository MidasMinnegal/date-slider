import { distanceFromPosition, positionFromDistance } from '@/core/geometry/PathGeometry';
import { distanceToDate } from '@/core/state/DateCalculations';
import { MARKER_RADIUS } from '@/types';
import type { Marker, Path } from '@/types';

export function isPointInMarker(x: number, y: number, marker: Marker): boolean {
  const dx = x - marker.position.x;
  const dy = y - marker.position.y;
  return Math.sqrt(dx * dx + dy * dy) <= MARKER_RADIUS;
}

export function handleDragStart(
  x: number,
  y: number,
  marker: Marker,
  setMarker: (marker: Marker) => void
): boolean {
  if (isPointInMarker(x, y, marker)) {
    setMarker({
      ...marker,
      isDragging: true,
      dragOffset: {
        x: x - marker.position.x,
        y: y - marker.position.y
      }
    });
    return true;
  }
  return false;
}

export function handleDragMove(
  x: number,
  y: number,
  marker: Marker,
  path: Path,
  setMarker: (marker: Marker) => void
): void {
  if (!marker.isDragging) return;

  const adjustedX = x - marker.dragOffset.x;
  const adjustedY = y - marker.dragOffset.y;

  const newDistance = distanceFromPosition(
    { x: adjustedX, y: adjustedY },
    path
  );

  const clampedDistance = Math.max(0, Math.min(newDistance, path.totalLength));

  const newPosition = positionFromDistance(clampedDistance, path.lut);
  const newDate = distanceToDate(clampedDistance);

  setMarker({
    ...marker,
    position: newPosition,
    pathDistance: clampedDistance,
    date: newDate
  });
}

export function handleDragEnd(
  marker: Marker,
  setMarker: (marker: Marker) => void
): void {
  if (marker.isDragging) {
    setMarker({
      ...marker,
      isDragging: false,
      dragOffset: { x: 0, y: 0 }
    });
  }
}
