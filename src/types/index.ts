export type Point = {
  x: number;
  y: number;
};

export type PathLUTEntry = {
  distance: number;
  segmentIndex: number;
  x: number;
  y: number;
};

export type PathBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type PathIntersection = {
  segmentIndexA: number;
  segmentIndexB: number;
  point: Point;
  timestamp: number;
};

export type Path = {
  segments: Float32Array;
  lut: PathLUTEntry[];
  totalLength: number;
  bounds: PathBounds;
  spatialGrid: Map<string, number[]>;
  intersections: PathIntersection[];
  startOffset: number;
};

export type Marker = {
  position: Point;
  pathDistance: number;
  date: Date;
  isDragging: boolean;
  dragOffset: Point;
};

export type EndButton = {
  type: 'start' | 'end';
  center: Point;
  radius: number;
  isActive: boolean;
};

export type CanvasLayers = {
  background: HTMLCanvasElement;
  path: HTMLCanvasElement;
  marker: HTMLCanvasElement;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Canvas = {
  width: number;
  height: number;
  dpr: number;
  layers: CanvasLayers;
  viewport: Rect;
};

export type InteractionMode = 'idle' | 'dragging' | 'drawing';

export type PointerState = {
  x: number;
  y: number;
  isDown: boolean;
  startX: number;
  startY: number;
};

export type KeyboardState = {
  shift: boolean;
  alt: boolean;
  ctrl: boolean;
};

export type InteractionState = {
  mode: InteractionMode;
  activeButton: 'start' | 'end' | null;
  pointer: PointerState;
  keyboard: KeyboardState;
};

export type DateState = {
  current: Date;
  formatted: string;
  displayPosition: Point;
};

export const INITIAL_SLIDER_WIDTH = 200;
export const BASE_DATE = new Date(1900, 0, 1);
export const MARKER_RADIUS = 14;
export const END_BUTTON_RADIUS = 12.6;
export const SPATIAL_GRID_CELL_SIZE = 75;
export const PATH_SIMPLIFICATION_EPSILON = 1.5;
export const DATE_DISPLAY_OFFSET = { x: 0, y: -40 };
export const FRAME_BUDGET_MS = 16.67;
export const MAX_PATH_LENGTH = 100000;
