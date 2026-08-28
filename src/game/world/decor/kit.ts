import type { Painter } from '@ui/widgets/Painter';
import { scale } from '../ambience';
import type { Ambience } from '../ambience';

/**
 * Уличная мелочь. Рисуется процедурами, а не спрайтами: предметов много,
 * а различаются они парой размеров, так что таблица из четырнадцати
 * коротких функций дешевле четырнадцати текстур.
 *
 * У всех одна точка опоры — низ по центру, как у персонажа: тогда
 * предмет и человек сортируются по одной координате и правильно
 * заслоняют друг друга.
 */
export interface DecorContext {
  readonly painter: Painter;
  readonly ambience: Ambience;
  /** Экранные координаты точки опоры. */
  readonly x: number;
  readonly y: number;
  readonly variant: number;
  /** Во сколько раз мир крупнее экранного пикселя. */
  readonly unit: number;
}

export type Draw = (ctx: DecorContext) => void;

export const box = (ctx: DecorContext, dx: number, dy: number, w: number, h: number, color: number, alpha = 1): void =>
  ctx.painter.fill(
    {
      x: Math.round(ctx.x + dx * ctx.unit),
      y: Math.round(ctx.y + dy * ctx.unit),
      w: Math.max(1, Math.round(w * ctx.unit)),
      h: Math.max(1, Math.round(h * ctx.unit)),
    },
    color,
    alpha,
  );

/** Цвет под текущим светом: ночью мелочь не должна светиться сама. */
export const tone = (ctx: DecorContext, color: number): number => scale(color, ctx.ambience.light);

