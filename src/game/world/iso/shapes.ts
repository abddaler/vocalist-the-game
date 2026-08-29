import type { Painter } from '@ui/widgets/Painter';
import { TILE, toScreen } from './project';
import type { ScreenPoint } from './project';

/**
 * Кирпичи изометрии: ромб плитки, вертикальная грань и коробка. Всё
 * рисуется рядами и столбцами в один пиксель, поэтому кромка ложится по
 * сетке экрана и не рябит на диагоналях.
 *
 * Коробка — основа всей обстановки: стойка бара, диван, парапет и дом
 * отличаются только размером и цветом граней.
 */

/** Ромб одной плитки. Точка — северный угол, ромб лежит под ней. */
export function tile(painter: Painter, north: ScreenPoint, color: number, alpha = 1): void {
  const rows = TILE.halfH * 2;
  for (let r = 0; r < rows; r += 1) {
    const w = 2 + 4 * Math.min(r, rows - 1 - r);
    painter.fill({ x: north.x - w / 2, y: north.y + r, w, h: 1 }, color, alpha);
  }
}

/** Половина ромба: дальняя (верхняя) или ближняя. Нужна кромкам покрытий. */
export function tileHalf(
  painter: Painter,
  north: ScreenPoint,
  color: number,
  half: 'far' | 'near',
  alpha = 1,
): void {
  const rows = TILE.halfH * 2;
  const from = half === 'far' ? 0 : TILE.halfH;
  for (let r = from; r < from + TILE.halfH; r += 1) {
    const w = 2 + 4 * Math.min(r, rows - 1 - r);
    painter.fill({ x: north.x - w / 2, y: north.y + r, w, h: 1 }, color, alpha);
  }
}

/**
 * Вертикальная грань между двумя точками верхней кромки. Заливается
 * столбцами: наклон кромки всегда пол-пикселя на пиксель, и столбец
 * ложится точно.
 */
export function face(
  painter: Painter,
  from: ScreenPoint,
  to: ScreenPoint,
  height: number,
  color: number,
  alpha = 1,
): void {
  const span = Math.abs(to.x - from.x);
  if (span < 1 || height <= 0) return;
  const step = to.x > from.x ? 1 : -1;
  const slope = (to.y - from.y) / (to.x - from.x);

  for (let i = 0; i < span; i += 1) {
    const x = from.x + i * step;
    const y = Math.round(from.y + i * step * slope);
    painter.fill({ x: step > 0 ? x : x - 1, y, w: 1, h: height }, color, alpha);
  }
}

/** Линия по кромке: контур в один пиксель вдоль верхнего ребра грани. */
export function edge(
  painter: Painter,
  from: ScreenPoint,
  to: ScreenPoint,
  color: number,
  alpha = 1,
): void {
  face(painter, from, to, 1, color, alpha);
}

export interface BoxSkin {
  /** Верх — самый светлый: на него падает свет. */
  readonly top: number;
  /** Грань, обращённая влево-вниз. */
  readonly left: number;
  /** Грань, обращённая вправо-вниз. */
  readonly right: number;
  /** Контур по силуэту; ноль — без контура. */
  readonly outline?: number | undefined;
}

export interface BoxDef {
  /** Плитка северного угла основания. */
  readonly x: number;
  readonly y: number;
  /** Размер основания в плитках. */
  readonly w: number;
  readonly d: number;
  /** Высота в пикселях экрана. */
  readonly h: number;
  /** Уровень земли под коробкой. */
  readonly z?: number | undefined;
}

/**
 * Коробка на земле: верхняя площадка и две видимые боковые грани.
 * Верх собирается из ромбов плиток, а не одной заливкой: так по нему
 * можно пустить рисунок — доски настила, плитку пола, ткань дивана.
 */
export function box(
  painter: Painter,
  def: BoxDef,
  skin: BoxSkin,
  onTop?: (north: ScreenPoint, ix: number, iy: number) => void,
): void {
  const z = def.z ?? 0;
  const lift = def.h;
  const at = (x: number, y: number): ScreenPoint => {
    const p = toScreen({ x, y, z });
    return { x: p.x, y: p.y - lift };
  };

  const west = at(def.x, def.y + def.d);
  const south = at(def.x + def.w, def.y + def.d);
  const east = at(def.x + def.w, def.y);

  // Грани сначала: верх ложится на них и срезает лишний столбец.
  face(painter, west, south, lift, skin.left);
  face(painter, east, south, lift, skin.right);

  for (let iy = 0; iy < def.d; iy += 1) {
    for (let ix = 0; ix < def.w; ix += 1) {
      const north = at(def.x + ix, def.y + iy);
      tile(painter, north, skin.top);
      onTop?.(north, ix, iy);
    }
  }

  if (skin.outline !== undefined) {
    const north = at(def.x, def.y);
    edge(painter, north, east, skin.outline);
    edge(painter, north, west, skin.outline);
    edge(painter, west, south, skin.outline);
    edge(painter, east, south, skin.outline);
    // Вертикальные рёбра силуэта.
    painter.fill({ x: west.x, y: west.y, w: 1, h: lift }, skin.outline);
    painter.fill({ x: east.x - 1, y: east.y, w: 1, h: lift }, skin.outline);
    painter.fill({ x: south.x - 1, y: south.y, w: 1, h: lift }, skin.outline);
  }
}

/** Столбик: свая настила, ножка стола, стойка перил. */
export function post(
  painter: Painter,
  at: ScreenPoint,
  width: number,
  height: number,
  color: number,
  shade: number,
): void {
  painter.fill({ x: at.x - Math.round(width / 2), y: at.y - height, w: width, h: height }, color);
  painter.fill({ x: at.x + Math.round(width / 2) - 1, y: at.y - height, w: 1, h: height }, shade);
}

/**
 * Выпуклый четырёхугольник по четырём углам: верхняя площадка коробки,
 * если её надо залить одним цветом, а не собирать из плиток.
 */
export function quad(
  painter: Painter,
  corners: readonly [ScreenPoint, ScreenPoint, ScreenPoint, ScreenPoint],
  color: number,
  alpha = 1,
): void {
  const top = Math.round(Math.min(...corners.map((p) => p.y)));
  const bottom = Math.round(Math.max(...corners.map((p) => p.y)));

  for (let y = top; y <= bottom; y += 1) {
    let left = Infinity;
    let right = -Infinity;
    for (let i = 0; i < corners.length; i += 1) {
      const a = corners[i]!;
      const b = corners[(i + 1) % corners.length]!;
      if (a.y === b.y) continue;
      const lo = Math.min(a.y, b.y);
      const hi = Math.max(a.y, b.y);
      if (y < lo || y > hi) continue;
      const x = a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y);
      left = Math.min(left, x);
      right = Math.max(right, x);
    }
    if (right > left) {
      painter.fill({ x: Math.round(left), y, w: Math.max(1, Math.round(right - left)), h: 1 }, color, alpha);
    }
  }
}

/**
 * Коробка вокруг экранной точки: основание задано в плитках, точка —
 * центр этого основания на земле. Так рисуется вся обстановка, которая
 * стоит «в этом месте», а не «на этой плитке».
 */
export function boxAt(
  painter: Painter,
  base: ScreenPoint,
  size: { w: number; d: number; h: number },
  skin: BoxSkin,
): void {
  const { w, d, h } = size;
  const corner = (sx: number, sy: number): ScreenPoint => ({
    x: base.x + (sx - sy) * TILE.halfW,
    y: base.y + (sx + sy) * TILE.halfH,
  });
  const n = corner(-w / 2, -d / 2);
  const e = corner(w / 2, -d / 2);
  const s = corner(w / 2, d / 2);
  const west = corner(-w / 2, d / 2);

  const up = (p: ScreenPoint): ScreenPoint => ({ x: p.x, y: p.y - h });
  face(painter, up(west), up(s), h, skin.left);
  face(painter, up(e), up(s), h, skin.right);
  quad(painter, [up(n), up(e), up(s), up(west)], skin.top);

  if (skin.outline !== undefined) {
    edge(painter, up(n), up(e), skin.outline);
    edge(painter, up(n), up(west), skin.outline);
    edge(painter, up(west), up(s), skin.outline);
    edge(painter, up(e), up(s), skin.outline);
    painter.fill({ x: up(west).x, y: up(west).y, w: 1, h }, skin.outline);
    painter.fill({ x: up(e).x - 1, y: up(e).y, w: 1, h }, skin.outline);
    painter.fill({ x: up(s).x - 1, y: up(s).y, w: 1, h }, skin.outline);
  }
}
