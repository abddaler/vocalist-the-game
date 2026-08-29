import type { Painter } from '@ui/widgets/Painter';
import { TILE } from './project';
import type { ScreenPoint } from './project';
import { face, quad } from './shapes';

/**
 * Плоскости изометрии. Всё, что не человек, обязано лежать в одной из
 * трёх плоскостей мира: пол (ромб), стена вдоль оси x и стена вдоль оси
 * y. Прямоугольник, нарисованный прямо в экранных осях, смотрит в камеру
 * и выдаёт, что предмет — наклейка: окно на стене выглядит приклеенным,
 * дверь — стоящей боком, экран — вырезанным из бумаги.
 *
 * Отсюда и правило: детали предметов задаются в плитках вдоль осей мира,
 * а в пиксели их переводят эти четыре функции.
 */

/** Вдоль какой оси мира развёрнуто полотно. */
export type IsoAxis = 'x' | 'y';

/**
 * Точка рядом с опорой: сдвиг в плитках по осям мира и подъём в
 * пикселях. Плитки и пиксели нельзя складывать напрямую — подъём
 * вертикален, а сдвиг ложится на землю.
 */
export function isoAt(base: ScreenPoint, dx: number, dy: number, lift = 0): ScreenPoint {
  return {
    x: base.x + (dx - dy) * TILE.halfW,
    y: base.y + (dx + dy) * TILE.halfH - lift,
  };
}

export interface PanelDef {
  /** Длина полотна в плитках вдоль своей оси. */
  readonly span: number;
  /** Сдвиг середины полотна вдоль оси, в плитках. */
  readonly along?: number | undefined;
  /** Сдвиг поперёк оси, в плитках: на какой грани предмета висит полотно. */
  readonly across?: number | undefined;
  /** Верхняя кромка над опорой, в пикселях. */
  readonly top: number;
  /** Высота полотна вниз от кромки, в пикселях. */
  readonly height: number;
}

/**
 * Вертикальное полотно в плоскости стены: окно, экран, дверное полотно,
 * фасадная деталь. Кромка идёт вдоль оси, а не по горизонтали экрана.
 */
export function panel(
  painter: Painter,
  base: ScreenPoint,
  axis: IsoAxis,
  def: PanelDef,
  color: number,
  alpha = 1,
): void {
  const half = def.span / 2;
  const mid = def.along ?? 0;
  const across = def.across ?? 0;
  const point = (a: number): ScreenPoint =>
    axis === 'x' ? isoAt(base, a, across, def.top) : isoAt(base, across, a, def.top);
  face(painter, point(mid - half), point(mid + half), def.height, color, alpha);
}

export interface PlateDef {
  /** Размер площадки в плитках. */
  readonly w: number;
  readonly d: number;
  /** Сдвиг середины площадки в плитках. */
  readonly dx?: number | undefined;
  readonly dy?: number | undefined;
  /** Высота над опорой в пикселях. */
  readonly lift?: number | undefined;
}

/** Горизонтальная площадка: столешница, коврик, пятно света, полка. */
export function plate(
  painter: Painter,
  base: ScreenPoint,
  def: PlateDef,
  color: number,
  alpha = 1,
): void {
  const dx = def.dx ?? 0;
  const dy = def.dy ?? 0;
  const lift = def.lift ?? 0;
  const c = (sx: number, sy: number): ScreenPoint => isoAt(base, dx + sx, dy + sy, lift);
  quad(
    painter,
    [c(-def.w / 2, -def.d / 2), c(def.w / 2, -def.d / 2), c(def.w / 2, def.d / 2), c(-def.w / 2, def.d / 2)],
    color,
    alpha,
  );
}

export interface RampDef extends PlateDef {
  /** Высота дальнего и ближнего рёбер: по ним и читается скат. */
  readonly far: number;
  readonly near: number;
}

/** Наклонная площадка: навес, козырёк, скат крыши, крышка пульта. */
export function ramp(
  painter: Painter,
  base: ScreenPoint,
  def: RampDef,
  color: number,
  alpha = 1,
): void {
  const dx = def.dx ?? 0;
  const dy = def.dy ?? 0;
  const c = (sx: number, sy: number, lift: number): ScreenPoint => isoAt(base, dx + sx, dy + sy, lift);
  quad(
    painter,
    [
      c(-def.w / 2, -def.d / 2, def.far),
      c(def.w / 2, -def.d / 2, def.far),
      c(def.w / 2, def.d / 2, def.near),
      c(-def.w / 2, def.d / 2, def.near),
    ],
    color,
    alpha,
  );
}

/**
 * Столбик: единственное, что честно рисуется вертикальной полоской.
 * Ножка, мачта, шест зонта — у них нет ни ширины по осям мира, ни грани,
 * которую камера могла бы показать боком.
 */
export function mast(
  painter: Painter,
  at: ScreenPoint,
  height: number,
  color: number,
  width = 2,
): void {
  painter.fill({ x: at.x - Math.floor(width / 2), y: at.y - height, w: width, h: height }, color);
}
