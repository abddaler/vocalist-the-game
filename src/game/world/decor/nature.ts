import { box, tone } from './kit';
import type { Draw } from './kit';
import { scale } from '../ambience';

/**
 * Зелень. Дерево и куст остаются щитами: у кроны нет грани, которую
 * камера показала бы боком, а дробные координаты здесь по делу — лист
 * рисуется в один экранный пиксель, иначе всё живое выходит из тех же
 * квадратов, что и стена дома.
 */

const CROWN = [0x3f8f4a, 0x4f9a5f, 0x2f7f52];
const TRUNK = 0x6f5138;

/** Широколиственное дерево: ствол с развилкой и крона пятнами. */
export const tree: Draw = (ctx) => {
  const leaf = tone(ctx, CROWN[ctx.variant % CROWN.length]!);
  const bark = tone(ctx, TRUNK);
  const height = 26 + (ctx.variant % 3) * 4;

  box(ctx, -1.5, -height, 3, height, bark);
  box(ctx, -0.5, -height, 1, height, scale(bark, 1.3));
  box(ctx, -4, -height * 0.72, 3, 1, bark);
  box(ctx, 1.5, -height * 0.66, 3, 1, bark);

  // Крона: несколько кругов внахлёст, светлее сверху.
  const blob = (dx: number, dy: number, r: number, color: number): void => {
    box(ctx, dx - r, dy - r * 0.7, r * 2, r * 1.4, color);
    box(ctx, dx - r * 0.7, dy - r, r * 1.4, r * 2, color);
  };
  const top = -height - 4;
  blob(0, top, 8, leaf);
  blob(-6, top + 4, 6, scale(leaf, 0.85));
  blob(6, top + 4, 6, scale(leaf, 0.85));
  blob(-2, top - 4, 5, scale(leaf, 1.2));
  blob(4, top - 2, 4, scale(leaf, 1.15));
};

/** Куст: три пятна на земле, без ствола. */
export const bush: Draw = (ctx) => {
  const leaf = tone(ctx, 0x4a8f52);
  box(ctx, -5, -5, 10, 5, leaf);
  box(ctx, -3.5, -7, 7, 3, scale(leaf, 1.15));
  box(ctx, -1.5, -8, 3, 2, scale(leaf, 1.3));
  box(ctx, -5, -1, 10, 1, scale(leaf, 0.7));
};

export const NATURE = { tree, bush };
