import type { Painter } from '@ui/widgets/Painter';
import { mix, scale } from '../ambience';
import type { Ambience } from '../ambience';
import type { ScreenPoint } from './project';
import { isoAt, plate } from './planes';
import type { BoxSkin } from './shapes';

/**
 * Общее для всей мелочи: где она стоит, чем освещена и вдоль какой стены
 * развёрнута. Предмет рисует себя сам, но опору, свет и ось берёт отсюда.
 */
export interface IsoProp {
  readonly painter: Painter;
  readonly ambience: Ambience;
  readonly at: ScreenPoint;
  readonly variant: number;
  /** Вдоль какой оси мира стоит предмет: у стены по x или у стены по y. */
  readonly facing: 'x' | 'y';
}

export type Draw = (ctx: IsoProp) => void;

export const skin = (ctx: IsoProp, color: number, outline = 0.55): BoxSkin => {
  const body = scale(color, ctx.ambience.light);
  return {
    top: scale(body, 1.2),
    left: scale(body, 0.68),
    right: scale(body, 0.9),
    outline: mix(body, 0x0d0b14, outline),
  };
};

/**
 * Сдвиг опоры в плитках и подъём в пикселях. Смешивать плитки с
 * пикселями напрямую нельзя: коробка, сдвинутая «на три пикселя вверх»,
 * повисает над своим же основанием.
 */
export const shift = (at: ScreenPoint, dx: number, dy: number, lift = 0): ScreenPoint =>
  isoAt(at, dx, dy, lift);

/** Плоское пятно на земле: тень, полотенце, отсвет. */
export const patch = (
  ctx: IsoProp,
  w: number,
  d: number,
  color: number,
  alpha = 1,
  lift = 0,
): void => {
  plate(ctx.painter, ctx.at, { w, d, lift }, color, alpha);
};

/** Тень под предметом: она и сажает его на землю. */
export const shade = (ctx: IsoProp, w: number, d: number): void => {
  if (ctx.ambience.shadow <= 0) return;
  patch(ctx, w * 1.15, d * 1.15, 0x000000, ctx.ambience.shadow * 0.8);
};
