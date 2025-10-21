import { useEffect, useRef, useState } from 'react';
import { createInitialPath, positionFromDistance } from '@/core/geometry/PathGeometry';
import { distanceToDate, formatDate } from '@/core/state/DateCalculations';
import { setupCanvas, clearCanvas, drawBackground, drawPath, drawMarker, drawEndButton, drawDateLabel } from '@/utils/canvas';
import { handleDragStart, handleDragMove, handleDragEnd } from '@/core/interactions/DragHandler';
import { handleDrawStart, handleDrawMove, handleDrawEnd } from '@/core/interactions/DrawHandler';
import { MARKER_RADIUS, END_BUTTON_RADIUS, DATE_DISPLAY_OFFSET } from '@/types';
import type { Path, Marker, EndButton } from '@/types';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const pathCanvasRef = useRef<HTMLCanvasElement>(null);
  const markerCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [path, setPath] = useState<Path | null>(null);
  const [marker, setMarker] = useState<Marker | null>(null);
  const [endButtons, setEndButtons] = useState<EndButton[]>([]);
  const [activeDrawButton, setActiveDrawButton] = useState<EndButton | null>(null);
  const [hoveredButton, setHoveredButton] = useState<EndButton | null>(null);
  
  const rafIdRef = useRef<number | null>(null);
  const targetDistanceRef = useRef<number | null>(null);
  
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;
    
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    const initialPath = createInitialPath(centerX, centerY);
    setPath(initialPath);
    
    const initialMarker: Marker = {
      position: positionFromDistance(100, initialPath.lut),
      pathDistance: 100,
      date: distanceToDate(100, initialPath.startOffset),
      isDragging: false,
      dragOffset: { x: 0, y: 0 }
    };
    setMarker(initialMarker);
    
    const buttons: EndButton[] = [
      {
        type: 'start',
        center: { x: initialPath.segments[0], y: initialPath.segments[1] },
        radius: END_BUTTON_RADIUS,
        isActive: false
      },
      {
        type: 'end',
        center: { 
          x: initialPath.segments[initialPath.segments.length - 2], 
          y: initialPath.segments[initialPath.segments.length - 1] 
        },
        radius: END_BUTTON_RADIUS,
        isActive: false
      }
    ];
    setEndButtons(buttons);
  }, [dimensions]);
  
  useEffect(() => {
    if (!backgroundCanvasRef.current || !pathCanvasRef.current || !markerCanvasRef.current) return;
    if (dimensions.width === 0 || dimensions.height === 0) return;
    
    const bgCtx = setupCanvas(backgroundCanvasRef.current, dimensions.width, dimensions.height);
    const pathCtx = setupCanvas(pathCanvasRef.current, dimensions.width, dimensions.height);
    const markerCtx = setupCanvas(markerCanvasRef.current, dimensions.width, dimensions.height);
    
    if (!bgCtx || !pathCtx || !markerCtx) return;
    
    const render = () => {
      if (bgCtx) {
        clearCanvas(bgCtx, dimensions.width, dimensions.height);
        drawBackground(bgCtx, dimensions.width, dimensions.height);
      }
      
      if (pathCtx && path) {
        clearCanvas(pathCtx, dimensions.width, dimensions.height);
        drawPath(pathCtx, path.segments);
        
        endButtons.forEach(button => {
          drawEndButton(pathCtx, button.center, button.radius, button.isActive);
        });
      }
      
      if (markerCtx && marker && path) {
        if (marker.isDragging && targetDistanceRef.current !== null) {
          const currentDistance = marker.pathDistance;
          const targetDistance = targetDistanceRef.current;
          const distanceDiff = targetDistance - currentDistance;
          
          if (Math.abs(distanceDiff) >= 0.5) {
            const MAX_SPEED_PER_FRAME = 10;
            const step = Math.sign(distanceDiff) * Math.min(Math.abs(distanceDiff), MAX_SPEED_PER_FRAME);
            const newDistance = Math.max(0, Math.min(currentDistance + step, path.totalLength));
            const newPosition = positionFromDistance(newDistance, path.lut);
            const newDate = distanceToDate(newDistance, path.startOffset);
            
            setMarker({
              ...marker,
              position: newPosition,
              pathDistance: newDistance,
              date: newDate
            });
          }
        }
        
        clearCanvas(markerCtx, dimensions.width, dimensions.height);
        drawMarker(markerCtx, marker.position, MARKER_RADIUS, 'rgba(0, 0, 0, 0.1)', marker.isDragging);
        
        const labelPosition = {
          x: marker.position.x + DATE_DISPLAY_OFFSET.x,
          y: marker.position.y + DATE_DISPLAY_OFFSET.y
        };
        drawDateLabel(markerCtx, labelPosition, formatDate(marker.date));
      }
      
      rafIdRef.current = requestAnimationFrame(render);
    };
    
    rafIdRef.current = requestAnimationFrame(render);
    
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [dimensions, path, marker, endButtons]);
  
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!marker || !path) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dragStarted = handleDragStart(x, y, marker, setMarker);
    if (!dragStarted) {
      const button = handleDrawStart(x, y, endButtons, setEndButtons);
      setActiveDrawButton(button);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!marker || !path) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hoveredBtn = endButtons.find(button => {
      const dx = x - button.center.x;
      const dy = y - button.center.y;
      return Math.sqrt(dx * dx + dy * dy) <= button.radius;
    });

    const isOverMarker = marker && (() => {
      const dx = x - marker.position.x;
      const dy = y - marker.position.y;
      return Math.sqrt(dx * dx + dy * dy) <= MARKER_RADIUS;
    })();

    setHoveredButton(hoveredBtn || null);

    if (containerRef.current) {
      if (isOverMarker) {
        containerRef.current.style.cursor = marker.isDragging ? 'grabbing' : 'grab';
      } else if (hoveredBtn) {
        containerRef.current.style.cursor = 'crosshair';
      } else {
        containerRef.current.style.cursor = 'default';
      }
    }

    if (marker.isDragging) {
      targetDistanceRef.current = handleDragMove(x, y, marker, path);
    } else if (activeDrawButton) {
      handleDrawMove(x, y, activeDrawButton, path, endButtons, marker, setPath, setEndButtons, setMarker);
    }
  };

  const handlePointerUp = () => {
    if (!marker || !path) return;

    if (marker.isDragging) {
      handleDragEnd(marker, setMarker);
      targetDistanceRef.current = null;
    } else if (activeDrawButton) {
      handleDrawEnd(activeDrawButton, path, marker, setPath, setEndButtons, setMarker);
      setActiveDrawButton(null);
    }
  };
  
  return (
    <div 
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        touchAction: 'none'
      }}
    >
      <canvas
        ref={backgroundCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1
        }}
      />
      <canvas
        ref={pathCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 2
        }}
      />
      <canvas
        ref={markerCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 3,
          pointerEvents: 'none'
        }}
      />
      {hoveredButton && !activeDrawButton && (
        <div
          style={{
            position: 'absolute',
            left: hoveredButton.center.x,
            top: hoveredButton.center.y + hoveredButton.radius + 10,
            transform: 'translateX(-50%)',
            color: '#666',
            fontSize: '14px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
            pointerEvents: 'none',
            animation: 'fadeIn 0.2s ease-in',
            zIndex: 4
          }}
        >
          Click to draw
        </div>
      )}
      <a
        href="https://github.com/MidasMinnegal/date-slider"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: '#24292e',
          color: '#ffffff',
          textDecoration: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 600,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
          transition: 'background-color 0.2s',
          zIndex: 5,
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#2c3237';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#24292e';
        }}
      >
        <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        View on GitHub
      </a>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default App;
