import type { Rect } from '@ui/widgets/Hotspots';
import type { Painter } from '@ui/widgets/Painter';
import { mix, scale } from './ambience';
import type { Ambience } from './ambience';

/** Устойчивый хеш строки: свет в окнах должен быть одинаков между кадрами. */
function hash(text: string, salt: number): number {
  let value = 0x811c9dc5 ^ salt;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 0x01000193);
  }
  return (value >>> 0) / 0x100000000;
}

export function shade(color: number, factor: number): number {
  return scale(color, factor);
}

const WINDOW_LIT = [0xffe0a0, 0xffc478, 0xf0e08a, 0xa8d8f0];
const AWNING = [0xd9534f, 0x4a8fd9, 0x3f9f6a, 0xd9a23f, 0xa85fc9];

const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export interface FacadeParams {
  readonly rect: Rect;
  readonly color: number;
  /** Ключ дома: по нему разложены окна, маркиза и свет. Один дом — одна картинка. */
  readonly seed: string;
  readonly ambience: Ambience;
  /** Куда рисовать нельзя: вывеска и дверной проём. */
  readonly reserved: readonly Rect[];
  /** Дверь снизу — значит, у дома есть первый этаж с витриной. */
  readonly shopfront: boolean;
}

/**
 * Фасад дома: карниз, этажи с окнами, первый этаж с витриной и маркизой.
 * Раньше здесь был прямоугольник с рядом окошек; города из таких домов
 * не получается — глазу не за что зацепиться, все дома на одно лицо.
 */
export function facade(painter: Painter, params: FacadeParams): void {
  const { rect, color, seed, ambience, reserved } = params;
  const wall = scale(color, ambience.light);

  painter.fill(rect, wall);

  // Карниз и цоколь: без верха и низа стена не читается как дом.
  painter.fill({ x: rect.x, y: rect.y, w: rect.w, h: 4 }, scale(wall, 1.3));
  painter.fill({ x: rect.x, y: rect.y + 4, w: rect.w, h: 1 }, scale(wall, 0.6));
  painter.fill(
    { x: rect.x, y: rect.y + rect.h - 4, w: rect.w, h: 4 },
    scale(wall, 0.62),
  );

  // Вертикальные пилястры разбивают ширину: сплошная стена выглядит забором.
  const bays = Math.max(2, Math.round(rect.w / 34));
  const bayW = rect.w / bays;
  for (let i = 1; i < bays; i += 1) {
    painter.fill(
      { x: Math.round(rect.x + i * bayW), y: rect.y + 5, w: 1, h: rect.h - 9 },
      scale(wall, 0.82),
    );
  }

  const floorTop = rect.y + 7;
  const floorBottom = rect.y + rect.h - (params.shopfront ? 20 : 6);
  const rows = Math.max(1, Math.floor((floorBottom - floorTop) / 15));

  for (let row = 0; row < rows; row += 1) {
    for (let bay = 0; bay < bays; bay += 1) {
      const w = Math.min(11, Math.round(bayW) - 8);
      if (w < 5) continue;
      const x = Math.round(rect.x + bay * bayW + (bayW - w) / 2);
      const y = floorTop + row * 15;
      const box = { x, y, w, h: 9 };
      if (reserved.some((area) => overlaps(area, box))) continue;

      const roll = hash(`${seed}:${row}:${bay}`, 7);
      const lit = ambience.lampsOn && roll > 0.42;
      const glass = lit
        ? WINDOW_LIT[Math.floor(roll * 977) % WINDOW_LIT.length]!
        : mix(scale(color, ambience.light * 0.45), ambience.skyMid, 0.35);

      painter.fill({ x: x - 1, y: y - 1, w: w + 2, h: 11 }, scale(wall, 0.72));
      painter.fill(box, glass);
      // Переплёт: без него окно — просто светлое пятно.
      painter.fill({ x, y: y + 4, w, h: 1 }, scale(glass, 0.7));
      if (lit) {
        painter.fill({ x: x - 2, y: y + 9, w: w + 4, h: 3 }, glass, 0.22);
      }
    }
  }

  if (params.shopfront) drawShopfront(painter, params, wall);
}

/** Первый этаж: витрина во всю ширину и маркиза над ней. */
function drawShopfront(painter: Painter, params: FacadeParams, wall: number): void {
  const { rect, seed, ambience, reserved } = params;
  const top = rect.y + rect.h - 18;
  const glassColor = ambience.lampsOn
    ? 0xffdf9f
    : mix(scale(wall, 0.5), ambience.skyLow, 0.45);

  const awning = AWNING[Math.floor(hash(seed, 31) * AWNING.length) % AWNING.length]!;
  painter.fill(
    { x: rect.x + 1, y: top - 5, w: rect.w - 2, h: 5 },
    scale(awning, ambience.light),
  );
  // Фестоны маркизы: три зубца хватает, чтобы она не была доской.
  const teeth = Math.max(3, Math.floor(rect.w / 12));
  for (let i = 0; i < teeth; i += 1) {
    const x = Math.round(rect.x + 1 + (i * (rect.w - 2)) / teeth);
    painter.fill(
      { x, y: top, w: Math.ceil((rect.w - 2) / teeth / 2), h: 2 },
      scale(awning, ambience.light * 0.85),
    );
  }

  for (let i = 0; i < 3; i += 1) {
    const w = Math.round((rect.w - 12) / 3) - 3;
    if (w < 6) break;
    const box = { x: rect.x + 6 + i * (w + 3), y: top + 4, w, h: 10 };
    if (reserved.some((area) => overlaps(area, box))) continue;
    painter.fill({ x: box.x - 1, y: box.y - 1, w: box.w + 2, h: box.h + 2 }, scale(wall, 0.66));
    painter.fill(box, glassColor);
    if (ambience.lampsOn) {
      painter.fill({ x: box.x - 2, y: box.y + box.h, w: box.w + 4, h: 4 }, glassColor, 0.2);
    }
  }
}

/**
 * Вывеска. Ночью она светится и роняет отсвет на стену — это и есть
 * половина ночного города.
 */
export function sign(
  painter: Painter,
  rect: Rect,
  color: number,
  ambience: Ambience,
): void {
  painter.fill({ x: rect.x, y: rect.y, w: rect.w, h: rect.h }, 0x0e1016, 0.82);
  const border = ambience.lampsOn ? scale(color, 1.7) : scale(color, ambience.light * 1.25);
  painter.stroke(rect, border);
  if (ambience.lampsOn) {
    painter.fill({ x: rect.x - 2, y: rect.y - 2, w: rect.w + 4, h: rect.h + 4 }, border, 0.16);
  }
}
