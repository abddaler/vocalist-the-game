import type { Point } from './pose';

/**
 * Кисти для фигуры. Форма задаётся путями — так поза строится из десятка
 * чисел, а не из сорока восьми строк по пикселю, — но выглядеть должна
 * пиксельной: три плоских тона на материал, тёмная обводка в пиксель и
 * жёсткая кромка.
 *
 * Плавная растяжка цвета и мягкий край — то, чем векторный рисунок себя
 * и выдаёт. Заливка поэтому разбита на три полосы с резкими границами,
 * а холст ужимается без сглаживания: кромка получается ступенькой, как
 * ей и положено.
 */
export interface Brush {
  readonly ctx: CanvasRenderingContext2D;
  /** Во сколько раз холст крупнее кадра. */
  readonly scale: number;
}

/**
 * Ширина обводки в пикселях кадра. Обводка не чёрная, а затемнённая
 * версия своего же цвета: чёрный контур на такой палитре читается
 * флеш-игрой, а тёмный оттенок соседа даёт тёплый вид.
 */
const EDGE = 1.6;

/** Насколько обводка темнее того, что обводит. */
const EDGE_TONE = 0.38;

/** Обвести уже построенный путь тоном материала. */
function edge(brush: Brush, color: string | undefined): void {
  if (!color) return;
  const { ctx, scale } = brush;
  ctx.lineWidth = EDGE * scale;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = tone(color, EDGE_TONE);
  ctx.stroke();
}

/** Осветление и затемнение цвета: тени и блики выводятся, а не задаются. */
export function tone(hex: string, factor: number): string {
  const value = parseInt(hex.slice(1), 16);
  const channel = (offset: number): number =>
    Math.max(0, Math.min(255, Math.round(((value >> offset) & 0xff) * factor)));
  return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
}

/** Доли ширины, на которых блик переходит в базу, а база в тень. */
const BANDS = [0.34, 0.68] as const;

/** Множители трёх тонов: блик, база, тень. */
const TONES = [1.16, 1, 0.7] as const;

/** Уже этого деталь красится одним тоном, а не тремя. */
const NARROW = 7;

/**
 * Ось света по кадру. По ней узкая деталь понимает, в чью полосу она
 * попала: свет один на всю фигуру, и рука не может быть освещена иначе,
 * чем плечо, из которого растёт.
 */
const LIGHT = { left: 8, right: 28 } as const;

/**
 * Чем красить деталь: готовым цветом или тремя тонами по её собственной
 * ширине.
 *
 * Разница видна сразу. Одна растяжка на всю фигуру ставит границы полос
 * по общей вертикали, и рубашка получает полосу поперёк, а тонкая рука
 * целиком попадает в одну полосу. Тень должна идти по форме той детали,
 * которую она лепит: у каждой свой левый край и свой правый.
 */
export type Paint = string | { readonly shade: string };

/** Красить тремя тонами по собственной ширине детали. */
export const shade = (color: string): Paint => ({ shade: color });

/**
 * Три плоских тона: блик слева, база, тень справа. Свет падает слева
 * сверху, одинаково для всех деталей и всех направлений.
 *
 * Границы полос резкие — стоп повторяется дважды. Плавный переход на
 * тридцати шести пикселях даёт грязь из десятков оттенков, а три тона
 * держат объём тем же, чем его держит коробка: разницей между гранями.
 */
export function bands(
  brush: Brush,
  color: string,
  left: number,
  right: number,
): string | CanvasGradient {
  // Узкая деталь берёт один тон — тот, в чью полосу она попала по
  // фигуре. Три полосы на руке шириной в четыре пикселя дают её
  // собственный блик вплотную к тени корпуса, и рука отрывается от тела
  // светлым швом. Вручную тонкую руку и красят одним тоном.
  if (right - left < NARROW) {
    const middle = ((left + right) / 2 - LIGHT.left) / (LIGHT.right - LIGHT.left);
    const index = middle < BANDS[0] ? 0 : middle < BANDS[1] ? 1 : 2;
    return tone(color, TONES[index] as number);
  }

  const { ctx, scale } = brush;
  const gradient = ctx.createLinearGradient(left * scale, 0, right * scale, 0);
  gradient.addColorStop(0, tone(color, TONES[0]));
  gradient.addColorStop(BANDS[0], tone(color, TONES[0]));
  gradient.addColorStop(BANDS[0], tone(color, TONES[1]));
  gradient.addColorStop(BANDS[1], tone(color, TONES[1]));
  gradient.addColorStop(BANDS[1], tone(color, TONES[2]));
  gradient.addColorStop(1, tone(color, TONES[2]));
  return gradient;
}

/** Заливка детали по её собственным краям. */
function resolve(brush: Brush, paint: Paint, left: number, right: number): string | CanvasGradient {
  return typeof paint === 'string' ? paint : bands(brush, paint.shade, left, right);
}

/** Овал: голова, кисть, стопа. */
export function blob(
  brush: Brush,
  at: Point,
  rx: number,
  ry: number,
  fill: Paint,
  outline?: string,
): void {
  const { ctx, scale } = brush;
  ctx.beginPath();
  ctx.ellipse(at.x * scale, at.y * scale, rx * scale, ry * scale, 0, 0, Math.PI * 2);
  ctx.fillStyle = resolve(brush, fill, at.x - rx, at.x + rx);
  ctx.fill();
  edge(brush, outline);
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
  fill: Paint,
  outline?: string,
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
  ctx.fillStyle = resolve(
    brush,
    fill,
    Math.min(from.x - wide / 2, to.x - thin / 2),
    Math.max(from.x + wide / 2, to.x + thin / 2),
  );
  ctx.fill();
  edge(brush, outline);
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
  fill: Paint,
  outline?: string,
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
  ctx.fillStyle = resolve(brush, fill, top.x - wide / 2, top.x + wide / 2);
  ctx.fill();
  edge(brush, outline);
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
export function shape(
  brush: Brush,
  points: readonly Point[],
  fill: Paint,
  outline?: string,
): void {
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
  const xs = points.map((point) => point.x);
  ctx.fillStyle = resolve(brush, fill, Math.min(...xs), Math.max(...xs));
  ctx.fill();
  edge(brush, outline);
}
