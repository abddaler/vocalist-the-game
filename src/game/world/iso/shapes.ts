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

/**
 * Ромб одной плитки. Точка — северный угол, ромб лежит под ней.
 *
 * Ромб чуть шире и ниже своей клетки: соседние плитки кладутся внахлёст,
 * и между ними не остаётся волосяных щелей, через которые просвечивал бы
 * фон. Порядок отрисовки — от дальней к ближней, так что перекрытие
 * ничего не портит.
 */
const BLEED = 1;

export function tile(painter: Painter, north: ScreenPoint, color: number, alpha = 1): void {
  painter.polygon(
    [
      { x: north.x, y: north.y - BLEED },
      { x: north.x + TILE.halfW + BLEED, y: north.y + TILE.halfH },
      { x: north.x, y: north.y + TILE.halfH * 2 + BLEED },
      { x: north.x - TILE.halfW - BLEED, y: north.y + TILE.halfH },
    ],
    color,
    alpha,
  );
}

/** Половина ромба: дальняя (верхняя) или ближняя. Нужна кромкам покрытий. */
export function tileHalf(
  painter: Painter,
  north: ScreenPoint,
  color: number,
  half: 'far' | 'near',
  alpha = 1,
): void {
  const middle = TILE.halfH;
  const corners: ScreenPoint[] =
    half === 'far'
      ? [
          { x: north.x, y: north.y },
          { x: north.x + TILE.halfW, y: north.y + middle },
          { x: north.x - TILE.halfW, y: north.y + middle },
        ]
      : [
          { x: north.x + TILE.halfW, y: north.y + middle },
          { x: north.x, y: north.y + middle * 2 },
          { x: north.x - TILE.halfW, y: north.y + middle },
        ];
  painter.polygon(corners, color, alpha);
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
  if (Math.abs(to.x - from.x) < 1 || height <= 0) return;
  painter.polygon(
    [from, to, { x: to.x, y: to.y + height }, { x: from.x, y: from.y + height }],
    color,
    alpha,
  );
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
  painter.polygon(corners, color, alpha);
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
