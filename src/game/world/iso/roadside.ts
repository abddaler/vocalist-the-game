import { scale } from '../ambience';
import { boxAt } from './shapes';
import { panel } from './planes';
import { patch, shade, shift, skin } from './prop';
import type { Draw } from './prop';

/**
 * Придорожное оборудование: щит с афишей, светофор, ящик с газетами,
 * почтовый ящик, столбик, гидрант, доска в песке и ковёр.
 *
 * У каждого есть сторона, которой он обращён к улице, и `ctx.facing`
 * говорит, вдоль какой оси она идёт: щит поперёк дороги читался бы
 * наклейкой, а не щитом.
 */

const BILLBOARD_ART = [0xe85f8a, 0x5fb8e8, 0xe8c25f];

const RUG = [0x6f3a4c, 0x3a5a6f, 0x6f6238];

const BOARD = [0xe86a6a, 0x5fc9e8, 0xe8c45f];

/** Щит с афишей: две стойки и полотно в плоскости своей стороны улицы. */
const billboard: Draw = (ctx) => {
  shade(ctx, 0.5, 0.3);
  const axis = ctx.facing;
  const post = skin(ctx, 0x4a4450);
  for (const a of [-0.3, 0.3]) {
    boxAt(
      ctx.painter,
      shift(ctx.at, axis === 'x' ? a : 0, axis === 'y' ? a : 0),
      { w: 0.12, d: 0.12, h: 21 },
      post,
    );
  }
  const art = BILLBOARD_ART[ctx.variant % BILLBOARD_ART.length]!;
  const lit = ctx.ambience.lampsOn;
  panel(ctx.painter, ctx.at, axis, { span: 1.7, top: 52, height: 31 }, scale(0x2e3240, ctx.ambience.light));
  panel(ctx.painter, ctx.at, axis, { span: 1.55, top: 50, height: 26 }, lit ? art : scale(art, ctx.ambience.light));
  panel(ctx.painter, ctx.at, axis, { span: 1.1, top: 42, height: 2 }, 0xffffff, 0.6);
  panel(ctx.painter, ctx.at, axis, { span: 0.85, top: 35, height: 2 }, 0xffffff, 0.4);
};

/** Ковёр: он лежит на полу, а значит — ромбом, а не прямоугольником. */
const rug: Draw = (ctx) => {
  const base = scale(RUG[ctx.variant % RUG.length]!, ctx.ambience.light);
  patch(ctx, 3.2, 2.4, base);
  patch(ctx, 2.9, 2.1, scale(base, 1.2), 1, 1);
  patch(ctx, 2.4, 1.7, base, 1, 2);
  patch(ctx, 1.6, 1.1, scale(base, 1.35), 1, 3);
};

/** Светофор: столб, короб и три глазка на его лицевой грани. */
const trafficLight: Draw = (ctx) => {
  shade(ctx, 0.3, 0.3);
  const axis = ctx.facing;
  boxAt(ctx.painter, ctx.at, { w: 0.14, d: 0.14, h: 44 }, skin(ctx, 0x3a3f4a));
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 42), { w: 0.4, d: 0.4, h: 18 }, skin(ctx, 0x22242c, 0.3));
  const on = ctx.ambience.lampsOn ? 1 : 0.75;
  const eyes = [[0xe84a4a, on], [0xe8c44a, on * 0.5], [0x4ae87a, on * 0.5]] as const;
  eyes.forEach(([color, alpha], i) => {
    panel(ctx.painter, ctx.at, axis, { span: 0.22, across: 0.2, top: 56 - i * 5, height: 4 }, color, alpha);
  });
};

/**
 * Доска, воткнутая в песок. Тонкая, но не бесплотная: у неё есть кант, и
 * без него она читается наклейкой, повёрнутой к камере.
 */
const surfboard: Draw = (ctx) => {
  shade(ctx, 0.3, 0.3);
  const deck = scale(BOARD[ctx.variant % BOARD.length]!, ctx.ambience.light);
  const axis = ctx.facing;
  // Силуэт сужается к носу и хвосту: три полотна вместо одного бруска.
  panel(ctx.painter, ctx.at, axis, { span: 0.5, top: 34, height: 26 }, deck);
  panel(ctx.painter, ctx.at, axis, { span: 0.36, top: 42, height: 8 }, deck);
  panel(ctx.painter, ctx.at, axis, { span: 0.36, top: 8, height: 8 }, deck);
  panel(ctx.painter, ctx.at, axis, { span: 0.08, top: 39, height: 34 }, 0xffffff, 0.45);
  // Кант с теневой стороны: он и даёт доске толщину.
  panel(
    ctx.painter,
    ctx.at,
    axis === 'x' ? 'y' : 'x',
    { span: 0.12, top: 39, height: 36 },
    scale(deck, 0.62),
  );
};

const newsbox: Draw = (ctx) => {
  shade(ctx, 0.5, 0.4);
  boxAt(ctx.painter, ctx.at, { w: 0.2, d: 0.2, h: 8 }, skin(ctx, 0x4a4f58));
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 8), { w: 0.5, d: 0.4, h: 16 }, skin(ctx, 0x3f7fa8));
  // Газета за стеклом — на лицевой грани ящика.
  panel(
    ctx.painter,
    ctx.at,
    'x',
    { span: 0.34, across: 0.2, top: 20, height: 6 },
    scale(0xd8d4c8, ctx.ambience.light),
  );
};

const mailbox: Draw = (ctx) => {
  shade(ctx, 0.5, 0.4);
  boxAt(ctx.painter, ctx.at, { w: 0.22, d: 0.22, h: 13 }, skin(ctx, 0x4a4f58));
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 13), { w: 0.55, d: 0.42, h: 17 }, skin(ctx, 0x3f6fa8));
};

const bollard: Draw = (ctx) => {
  shade(ctx, 0.3, 0.3);
  boxAt(ctx.painter, ctx.at, { w: 0.22, d: 0.22, h: 14 }, skin(ctx, 0x4a4f58));
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 14), { w: 0.3, d: 0.3, h: 3 }, skin(ctx, 0x6d7481));
};

const hydrant: Draw = (ctx) => {
  shade(ctx, 0.35, 0.35);
  const red = skin(ctx, 0xc9453f);
  boxAt(ctx.painter, ctx.at, { w: 0.3, d: 0.3, h: 12 }, red);
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 12), { w: 0.44, d: 0.44, h: 3 }, skin(ctx, 0xe05a52));
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 15), { w: 0.2, d: 0.2, h: 4 }, red);
};

export const ROADSIDE_PROPS = {
  billboard,
  rug,
  trafficLight,
  surfboard,
  newsbox,
  mailbox,
  bollard,
  hydrant,
};
