import type { Point } from '@/types';

export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.clearRect(0, 0, width, height);
}

export function drawPath(
  ctx: CanvasRenderingContext2D,
  segments: Float32Array,
  color: string = '#D1D1D6',
  lineWidth: number = 4
): void {
  if (segments.length < 4) return;
  
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  ctx.beginPath();
  ctx.moveTo(segments[0], segments[1]);
  
  for (let i = 2; i < segments.length; i += 2) {
    ctx.lineTo(segments[i], segments[i + 1]);
  }
  
  ctx.stroke();
  
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

export function drawMarker(
  ctx: CanvasRenderingContext2D,
  position: Point,
  radius: number = 14,
  strokeColor: string = 'rgba(0, 0, 0, 0.1)',
  isDragging: boolean = false
): void {
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 3;
  
  if (isDragging) {
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 5;
  }
  
  ctx.beginPath();
  ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
  
  const gradient = ctx.createLinearGradient(
    position.x,
    position.y - radius,
    position.x,
    position.y + radius
  );
  gradient.addColorStop(0, '#FFFFFF');
  gradient.addColorStop(1, '#F5F5F7');
  
  ctx.fillStyle = gradient;
  ctx.fill();
  
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

export function drawEndButton(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radius: number = 6,
  isActive: boolean = false,
  fillColor: string = '#D1D1D6',
  activeColor: string = '#B0B0B5'
): void {
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = isActive ? activeColor : fillColor;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  
  ctx.fillStyle = '#FFFFFF';
  
  const scale = (radius / 12) * 0.5;
  const offsetX = center.x - 12 * scale;
  const offsetY = center.y - 12 * scale;
  
  const path = new Path2D();
  path.moveTo(offsetX + 7.127 * scale, offsetY + 22.562 * scale);
  path.lineTo(offsetX + 0 * scale, offsetY + 24 * scale);
  path.lineTo(offsetX + 1.438 * scale, offsetY + 16.872 * scale);
  path.lineTo(offsetX + 7.127 * scale, offsetY + 22.562 * scale);
  path.closePath();
  
  path.moveTo(offsetX + 8.541 * scale, offsetY + 21.148 * scale);
  path.lineTo(offsetX + 19.769 * scale, offsetY + 9.923 * scale);
  path.lineTo(offsetX + 14.079 * scale, offsetY + 4.231 * scale);
  path.lineTo(offsetX + 2.852 * scale, offsetY + 15.458 * scale);
  path.lineTo(offsetX + 8.541 * scale, offsetY + 21.148 * scale);
  path.closePath();
  
  path.moveTo(offsetX + 18.309 * scale, offsetY + 0 * scale);
  path.lineTo(offsetX + 15.493 * scale, offsetY + 2.817 * scale);
  path.lineTo(offsetX + 21.184 * scale, offsetY + 8.508 * scale);
  path.lineTo(offsetX + 24 * scale, offsetY + 5.689 * scale);
  path.lineTo(offsetX + 18.309 * scale, offsetY + 0 * scale);
  path.closePath();
  
  ctx.fill(path);
}

export function drawDateLabel(
  ctx: CanvasRenderingContext2D,
  position: Point,
  text: string,
  backgroundColor: string = 'rgba(0, 0, 0, 0.75)',
  textColor: string = '#FFFFFF',
  padding: number = 10,
  borderRadius: number = 8
): void {
  ctx.font = '500 15px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif';
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = 15;
  
  const boxWidth = textWidth + padding * 2;
  const boxHeight = textHeight + padding * 2;
  
  const x = position.x - boxWidth / 2;
  const y = position.y - boxHeight / 2;
  
  ctx.fillStyle = backgroundColor;
  ctx.beginPath();
  ctx.roundRect(x, y, boxWidth, boxHeight, borderRadius);
  ctx.fill();
  
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, position.x, position.y);
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  backgroundColor: string = '#FFFFFF'
): void {
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
}

export function setupCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  dpr: number = window.devicePixelRatio || 1
): CanvasRenderingContext2D | null {
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
  }
  
  return ctx;
}
