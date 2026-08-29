import type { Point } from './pose';

/**
 * Кисти для фигуры. Всё рисуется путями на обычном холсте: у пути есть
 * сглаженный край и градиент, а у строки из символов — только пиксель
 * и его цвет. Отсюда и мягкая форма вместо лесенки.
 *
 * Холст берётся втрое крупнее кадра и потом ужимается: сглаживание тогда
 * считается по трём пикселям на один, и кромка выходит ровной, а не
 * размытой.
 */
export interface Brush {
  readonly ctx: CanvasRenderingContext2D;
  /** Во сколько раз холст крупнее кадра. */
  readonly scale: number;
}

/** Осветление и затемнение цвета: тени и блики выводятся, а не задаются. */
export function tone(hex: string, factor: number): string {
  const value = parseInt(hex.slice(1), 16);
  const channel = (offset: number): number =>
    Math.max(0, Math.min(255, Math.round(((value >> offset) & 0xff) * factor)));
  return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
}

/**
 * Заливка с боковым светом: слева светлее, справа темнее. В изометрии
 * свет падает слева сверху, и фигура держит объём тем же, чем его держит
 * коробка, — разницей между гранями.
 */
export function lit(brush: Brush, color: string, left: number, right: number): CanvasGradient {
  const gradient = brush.ctx.createLinearGradient(left * brush.scale, 0, right * brush.scale, 0);
  gradient.addColorStop(0, tone(color, 1.14));
  gradient.addColorStop(0.45, color);
  gradient.addColorStop(1, tone(color, 0.72));
  return gradient;
}

/** Овал: голова, кисть, стопа. */
export function blob(brush: Brush, at: Point, rx: number, ry: number, fill: string | CanvasGradient): void {
  const { ctx, scale } = brush;
  ctx.beginPath();
  ctx.ellipse(at.x * scale, at.y * scale, rx * scale, ry * scale, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

/**
 * Сужающаяся конечность: рука от плеча к запястью, нога от бедра к
 * щиколотке. Концы скруглены, поэтому сустав не выглядит обрубленным.
 */
export function limb(
  brush: Brush,
  from: Point,
  to: Point,
  wide: number,
  thin: number,
  fill: string | CanvasGradient,
): void {
  const { ctx, scale } = brush;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  const at = (point: Point, off: number, w: number): [number, number] => [
    (point.x + nx * off * w) * scale,
    (point.y + ny * off * w) * scale,
  ];

  ctx.beginPath();
  ctx.moveTo(...at(from, -0.5, wide));
  ctx.lineTo(...at(to, -0.5, thin));
  ctx.arc((to.x) * scale, (to.y) * scale, (thin / 2) * scale, Math.atan2(ny, nx) + Math.PI, Math.atan2(ny, nx));
  ctx.lineTo(...at(from, 0.5, wide));
  ctx.arc((from.x) * scale, (from.y) * scale, (wide / 2) * scale, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/**
 * Корпус: трапеция от плеч к бёдрам со скруглёнными плечами. Прямые
 * плечи делают из человека доску, а круглые — фигуру.
 */
export function trunk(
  brush: Brush,
  top: Point,
  bottom: Point,
  wide: number,
  narrow: number,
  fill: string | CanvasGradient,
): void {
  const { ctx, scale } = brush;
  const s = (v: number): number => v * scale;
  const round = Math.min(wide, narrow) * 0.42;
  ctx.beginPath();
  ctx.moveTo(s(top.x - wide / 2 + round), s(top.y));
  ctx.lineTo(s(top.x + wide / 2 - round), s(top.y));
  ctx.quadraticCurveTo(s(top.x + wide / 2), s(top.y), s(top.x + wide / 2), s(top.y + round));
  ctx.lineTo(s(bottom.x + narrow / 2), s(bottom.y));
  ctx.lineTo(s(bottom.x - narrow / 2), s(bottom.y));
  ctx.lineTo(s(top.x - wide / 2), s(top.y + round));
  ctx.quadraticCurveTo(s(top.x - wide / 2), s(top.y), s(top.x - wide / 2 + round), s(top.y));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Мазок по дуге: прядь волос, бровь, складка одежды. */
export function stroke(
  brush: Brush,
  from: Point,
  control: Point,
  to: Point,
  width: number,
  color: string,
): void {
  const { ctx, scale } = brush;
  ctx.beginPath();
  ctx.moveTo(from.x * scale, from.y * scale);
  ctx.quadraticCurveTo(control.x * scale, control.y * scale, to.x * scale, to.y * scale);
  ctx.lineWidth = width * scale;
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.stroke();
}

/** Замкнутый контур по точкам: причёска, юбка, пола пиджака. */
export function shape(brush: Brush, points: readonly Point[], fill: string | CanvasGradient): void {
  const { ctx, scale } = brush;
  if (points.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(points[0]!.x * scale, points[0]!.y * scale);
  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1]!;
    const point = points[i]!;
    const next = points[(i + 1) % points.length]!;
    // Сглаживание по соседям: ломаная из десятка точек иначе выдаёт себя углами.
    const cx = (previous.x + point.x * 2 + next.x) / 4;
    const cy = (previous.y + point.y * 2 + next.y) / 4;
    ctx.quadraticCurveTo(point.x * scale, point.y * scale, cx * scale, cy * scale);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}
