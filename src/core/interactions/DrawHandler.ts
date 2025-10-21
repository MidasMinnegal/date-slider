import { addPathSegment, prependPathSegment, finalizePath, positionFromDistance } from '@/core/geometry/PathGeometry';
import { distanceToDate } from '@/core/state/DateCalculations';
import { END_BUTTON_RADIUS } from '@/types';
import type { EndButton, Path, Marker } from '@/types';

export function isPointInEndButton(x: number, y: number, button: EndButton): boolean {
  const dx = x - button.center.x;
  const dy = y - button.center.y;
  return Math.sqrt(dx * dx + dy * dy) <= button.radius;
}

export function handleDrawStart(
  x: number,
  y: number,
  endButtons: EndButton[],
  setEndButtons: (buttons: EndButton[]) => void
): EndButton | null {
  for (const button of endButtons) {
    if (isPointInEndButton(x, y, button)) {
      setEndButtons(
        endButtons.map(b =>
          b === button ? { ...b, isActive: true } : b
        )
      );
      return button;
    }
  }
  return null;
}

export function handleDrawMove(
  x: number,
  y: number,
  activeButton: EndButton | null,
  path: Path,
  endButtons: EndButton[],
  marker: Marker,
  setPath: (path: Path) => void,
  setEndButtons: (buttons: EndButton[]) => void,
  setMarker: (marker: Marker) => void
): void {
  if (!activeButton) return;

  const newPath = activeButton.type === 'start'
    ? prependPathSegment(path, { x, y })
    : addPathSegment(path, { x, y });
  
  if (activeButton.type === 'start' && newPath.segments.length >= 4) {
    const lengthAdded = Math.sqrt(
      Math.pow(newPath.segments[2] - newPath.segments[0], 2) + 
      Math.pow(newPath.segments[3] - newPath.segments[1], 2)
    );
    
    const newStartOffset = newPath.startOffset - lengthAdded;
    const newMarkerDistance = marker.pathDistance + lengthAdded;
    
    setPath({
      ...newPath,
      startOffset: newStartOffset
    });
    
    setMarker({
      ...marker,
      pathDistance: newMarkerDistance,
      date: distanceToDate(newMarkerDistance, newStartOffset)
    });
  } else {
    setPath(newPath);
  }

  const updatedButtons = endButtons.map(b => {
    if (b.type === activeButton.type) {
      return {
        ...b,
        center: { x, y }
      };
    }
    return b;
  });
  setEndButtons(updatedButtons);
}

export function handleDrawEnd(
  activeButton: EndButton | null,
  path: Path,
  marker: Marker,
  setPath: (path: Path) => void,
  setEndButtons: (buttons: EndButton[]) => void,
  setMarker: (marker: Marker) => void
): void {
  if (!activeButton) return;

  const finalPath = finalizePath(path);
  setPath(finalPath);

  const updatedButtons: EndButton[] = [
    {
      type: 'start',
      center: {
        x: finalPath.segments[0],
        y: finalPath.segments[1]
      },
      radius: END_BUTTON_RADIUS,
      isActive: false
    },
    {
      type: 'end',
      center: {
        x: finalPath.segments[finalPath.segments.length - 2],
        y: finalPath.segments[finalPath.segments.length - 1]
      },
      radius: END_BUTTON_RADIUS,
      isActive: false
    }
  ];

  setEndButtons(updatedButtons);
  
  const updatedPosition = positionFromDistance(marker.pathDistance, finalPath.lut);
  const updatedDate = distanceToDate(marker.pathDistance, finalPath.startOffset);
  
  setMarker({
    ...marker,
    position: updatedPosition,
    date: updatedDate
  });
}
