import { addPathSegment, prependPathSegment, finalizePath } from '@/core/geometry/PathGeometry';
import { END_BUTTON_RADIUS } from '@/types';
import type { EndButton, Path } from '@/types';

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
  setPath: (path: Path) => void,
  setEndButtons: (buttons: EndButton[]) => void
): void {
  if (!activeButton) return;

  const newPath = activeButton.type === 'start'
    ? prependPathSegment(path, { x, y })
    : addPathSegment(path, { x, y });
  setPath(newPath);

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
  setPath: (path: Path) => void,
  setEndButtons: (buttons: EndButton[]) => void
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
}
