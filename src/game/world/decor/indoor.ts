import { box, tone } from './kit';
import type { Draw } from './kit';
import { scale } from '../ambience';

/**
 * Обстановка помещений: ящики, ковры, афиши, полки, столики. Ящики
 * стоят и на причале — граница проходит по виду предмета, а не по тому,
 * где он лежит.
 */
const RUG_COLORS = [0x6f3a4c, 0x3a5a6f, 0x6f6238];
const POSTER_ART = [0xe85f8a, 0x5fb8e8, 0xe8c25f, 0x8f5fe8];
const crate: Draw = (ctx) => {
  const size = ctx.variant % 2 === 0 ? 12 : 9;
  const wood = tone(ctx, ctx.variant % 2 === 0 ? 0xb08a52 : 0x8a9f6a);
  const stack = ctx.variant % 2 === 0 ? 2 : 1;
  for (let i = 0; i < stack; i += 1) {
    const w = size - i * 4;
    const y = -size * (i + 1) + i * 2;
    box(ctx, -w / 2, y, w, size, scale(wood, 1 - i * 0.12));
    box(ctx, -w / 2, y, w, 2, scale(wood, 1.3));
    box(ctx, -w / 2, y + size / 2 - 1, w, 2, scale(wood, 0.7));
    box(ctx, -w / 2, y, 2, size, scale(wood, 0.8));
    box(ctx, w / 2 - 2, y, 2, size, scale(wood, 0.8));
  }
};

/** Ковёр: пятно цвета на полу, от которого комната перестаёт быть коробкой. */
const rug: Draw = (ctx) => {
  const base = tone(ctx, RUG_COLORS[ctx.variant % RUG_COLORS.length]!);
  box(ctx, -26, -9, 52, 18, base);
  box(ctx, -24, -7, 48, 14, scale(base, 1.2));
  box(ctx, -20, -5, 40, 10, base);
  box(ctx, -14, -3, 28, 6, scale(base, 1.35));
};

/** Афиша на стене: у певицы дома должны висеть чужие концерты. */
const poster: Draw = (ctx) => {
  const art = tone(ctx, POSTER_ART[ctx.variant % POSTER_ART.length]!);
  box(ctx, -9, -22, 18, 22, tone(ctx, 0x2a2430));
  box(ctx, -8, -21, 16, 20, art);
  box(ctx, -6, -18, 12, 8, 0x000000, 0.28);
  box(ctx, -6, -8, 12, 2, 0xffffff, 0.45);
  box(ctx, -6, -5, 8, 2, 0xffffff, 0.3);
};

/** Полка: пара досок с мелочью, чтобы стена не была пустой. */
const shelf: Draw = (ctx) => {
  const wood = tone(ctx, 0x8a6a44);
  box(ctx, -14, -14, 28, 3, wood);
  box(ctx, -14, -4, 28, 3, wood);
  box(ctx, -11, -20, 4, 6, tone(ctx, 0xc95f5f));
  box(ctx, -6, -19, 3, 5, tone(ctx, 0x5fa8c9));
  box(ctx, 2, -21, 5, 7, tone(ctx, 0xc9a85f));
  box(ctx, -10, -10, 6, 6, tone(ctx, 0x6a8f5f));
  box(ctx, 3, -9, 8, 5, tone(ctx, 0xa88fc9));
};

const table: Draw = (ctx) => {
  const top = tone(ctx, 0xd8d0c4);
  box(ctx, -9, -11, 19, 3, top);
  box(ctx, -1, -8, 3, 8, tone(ctx, 0x8f8a80));
  box(ctx, -5, -1, 11, 2, tone(ctx, 0x8f8a80));
  box(ctx, -6, -14, 4, 3, tone(ctx, 0x6fc9d8));
  box(ctx, 2, -14, 3, 3, tone(ctx, 0xe8c45f));
};

export const INDOOR = { crate, rug, poster, shelf, table };
