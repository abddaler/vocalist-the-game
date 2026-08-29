import type { DecorKind } from '@core/types';
import type { Painter } from '@ui/widgets/Painter';
import { mix, scale } from '../ambience';
import type { Ambience } from '../ambience';
import { TILE } from './project';
import type { ScreenPoint } from './project';
import { boxAt, quad } from './shapes';
import type { BoxSkin } from './shapes';

/**
 * Мелочь, которая лежит на земле, — объёмами. Скамейка, машина, ящик и
 * лежак в изометрии обязаны иметь верх и две грани: нарисованные щитом,
 * они лежат на земле плашмя и выдают, что мир на самом деле плоский.
 *
 * Высокое и тонкое — пальмы, фонари, зонты, столбы — остаётся щитами:
 * так делает и сама Miami Nights, и вблизи это читается лучше объёма.
 */
export interface IsoProp {
  readonly painter: Painter;
  readonly ambience: Ambience;
  readonly at: ScreenPoint;
  readonly variant: number;
}

type Draw = (ctx: IsoProp) => void;

const skin = (ctx: IsoProp, color: number, outline = 0.55): BoxSkin => {
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
const shift = (at: ScreenPoint, dx: number, dy: number, lift = 0): ScreenPoint => ({
  x: at.x + (dx - dy) * TILE.halfW,
  y: at.y + (dx + dy) * TILE.halfH - lift,
});

/** Плоское пятно на земле: тень, полотенце, клумба. */
const patch = (
  ctx: IsoProp,
  w: number,
  d: number,
  color: number,
  alpha = 1,
  lift = 0,
): void => {
  const c = (sx: number, sy: number): ScreenPoint => ({
    x: ctx.at.x + (sx - sy) * TILE.halfW,
    y: ctx.at.y + (sx + sy) * TILE.halfH - lift,
  });
  quad(
    ctx.painter,
    [c(-w / 2, -d / 2), c(w / 2, -d / 2), c(w / 2, d / 2), c(-w / 2, d / 2)],
    color,
    alpha,
  );
};

/** Тень под предметом: она и сажает его на землю. */
const shade = (ctx: IsoProp, w: number, d: number): void => {
  if (ctx.ambience.shadow <= 0) return;
  patch(ctx, w * 1.15, d * 1.15, 0x000000, ctx.ambience.shadow * 0.8);
};

const bench: Draw = (ctx) => {
  shade(ctx, 1.2, 0.5);
  const wood = skin(ctx, 0xa87a4a);
  const iron = skin(ctx, 0x3f4450);
  // Ножки, сиденье, спинка по дальнему ребру — три коробки, а не доска.
  boxAt(ctx.painter, shift(ctx.at, -0.45, 0), { w: 0.12, d: 0.42, h: 5 }, iron);
  boxAt(ctx.painter, shift(ctx.at, 0.45, 0), { w: 0.12, d: 0.42, h: 5 }, iron);
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 5), { w: 1.2, d: 0.5, h: 3 }, wood);
  boxAt(ctx.painter, shift(ctx.at, 0, -0.22, 8), { w: 1.2, d: 0.12, h: 9 }, wood);
};

const CAR_BODIES = [0xd9534f, 0x4f7fd9, 0xe8c46a, 0xe8e8ee];

const car: Draw = (ctx) => {
  shade(ctx, 2.2, 1);
  const paint = CAR_BODIES[ctx.variant % CAR_BODIES.length]!;
  const body = skin(ctx, paint, 0.6);
  // Стекло своего цвета: смешанное с краской, у белой машины оно
  // становилось белым, и кабина читалась холодильником.
  const glass = skin(ctx, 0x5f7f9a, 0.5);
  const tyre = skin(ctx, 0x1a1c24, 0.2);

  // Колёса по углам: без них машина стоит на брюхе.
  for (const [dx, dy] of [[-0.72, -0.32], [-0.72, 0.32], [0.72, -0.32], [0.72, 0.32]] as const) {
    boxAt(ctx.painter, shift(ctx.at, dx, dy), { w: 0.26, d: 0.2, h: 4 }, tyre);
  }
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 3), { w: 2.15, d: 0.88, h: 8 }, body);
  // Кабина сдвинута назад, как у настоящей машины.
  boxAt(
    ctx.painter,
    shift(ctx.at, -0.22, 0, 11),
    { w: 1.15, d: 0.72, h: 8 },
    { top: body.top, left: glass.left, right: glass.right, outline: body.outline },
  );
  const lit = ctx.ambience.lampsOn;
  const nose = shift(ctx.at, 1.05, 0, 8);
  const tail = shift(ctx.at, -1.05, 0, 8);
  ctx.painter.fill({ x: nose.x - 3, y: nose.y - 2, w: 5, h: 3 }, lit ? 0xfff0c0 : scale(0xe8e8e0, ctx.ambience.light));
  ctx.painter.fill({ x: tail.x - 2, y: tail.y - 2, w: 5, h: 3 }, lit ? 0xff6a5c : scale(0x8f4a44, ctx.ambience.light));
};

const bin: Draw = (ctx) => {
  shade(ctx, 0.5, 0.5);
  const metal = skin(ctx, 0x545a66);
  boxAt(ctx.painter, ctx.at, { w: 0.5, d: 0.5, h: 12 }, metal);
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 12), { w: 0.62, d: 0.62, h: 2 }, skin(ctx, 0x6d7481));
};

const crate: Draw = (ctx) => {
  shade(ctx, 0.6, 0.6);
  const wood = skin(ctx, ctx.variant % 2 === 0 ? 0xa8804a : 0x8f6a3f);
  boxAt(ctx.painter, ctx.at, { w: 0.6, d: 0.6, h: 11 }, wood);
  ctx.painter.fill({ x: ctx.at.x - 6, y: ctx.at.y - 7, w: 12, h: 1 }, wood.left);
};

const planter: Draw = (ctx) => {
  shade(ctx, 0.7, 0.6);
  boxAt(ctx.painter, ctx.at, { w: 0.7, d: 0.6, h: 8 }, skin(ctx, 0xa89078));
  const leaf = scale(0x4f9f5f, ctx.ambience.light);
  const top = shift(ctx.at, 0, 0, 8);
  ctx.painter.fill({ x: top.x - 7, y: top.y - 9, w: 14, h: 9 }, leaf);
  ctx.painter.fill({ x: top.x - 5, y: top.y - 13, w: 10, h: 5 }, scale(leaf, 1.15));
  ctx.painter.fill({ x: top.x - 2, y: top.y - 15, w: 4, h: 3 }, scale(0xe86a9a, ctx.ambience.light));
};

const flowerbed: Draw = (ctx) => {
  shade(ctx, 1, 0.7);
  boxAt(ctx.painter, ctx.at, { w: 1, d: 0.7, h: 4 }, skin(ctx, 0xb8ac98));
  patch(ctx, 0.86, 0.56, scale(0x4a7f42, ctx.ambience.light), 1, 4);
  for (let i = 0; i < 7; i += 1) {
    const at = shift(ctx.at, -0.35 + (i % 4) * 0.22, -0.18 + Math.floor(i / 4) * 0.2, 5);
    ctx.painter.fill(
      { x: at.x - 1, y: at.y - 3, w: 2, h: 3 },
      scale([0xffd35f, 0xff7fb8, 0xff5f5f][i % 3]!, ctx.ambience.light),
    );
  }
};

const table: Draw = (ctx) => {
  shade(ctx, 0.9, 0.7);
  const legs = skin(ctx, 0x8f8a80);
  boxAt(ctx.painter, ctx.at, { w: 0.18, d: 0.18, h: 10 }, legs);
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 10), { w: 0.95, d: 0.75, h: 2 }, skin(ctx, 0xd8d0c4));
};

const CHAIR = [0xe8705f, 0x5fb8e8, 0xe8c45f];

const deckchair: Draw = (ctx) => {
  shade(ctx, 0.8, 0.6);
  const cloth = skin(ctx, CHAIR[ctx.variant % CHAIR.length]!);
  const frame = skin(ctx, 0xd8c8a8);
  boxAt(ctx.painter, ctx.at, { w: 0.75, d: 0.5, h: 4 }, frame);
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 4), { w: 0.8, d: 0.55, h: 2 }, cloth);
  // Спинка под наклоном: три ступеньки вместо диагонали.
  for (let i = 0; i < 3; i += 1) {
    boxAt(
      ctx.painter,
      shift(ctx.at, 0, -0.12 - i * 0.1, 5 + i * 3),
      { w: 0.72, d: 0.12, h: 4 },
      cloth,
    );
  }
};

const boat: Draw = (ctx) => {
  shade(ctx, 1.6, 1);
  const hull = skin(ctx, ctx.variant % 2 === 0 ? 0xe8e4dc : 0x5f8fc9);
  // Корпус сужается к носу и корме: три коробки вместо одной.
  boxAt(ctx.painter, ctx.at, { w: 1.5, d: 0.75, h: 5 }, hull);
  boxAt(ctx.painter, shift(ctx.at, -0.85, 0, 1), { w: 0.4, d: 0.4, h: 4 }, hull);
  boxAt(ctx.painter, shift(ctx.at, 0.85, 0, 1), { w: 0.4, d: 0.4, h: 4 }, hull);
  patch(ctx, 1.15, 0.5, scale(0x3a2f22, ctx.ambience.light), 1, 5);
  const deck = shift(ctx.at, 0, 0, 5);
  ctx.painter.fill({ x: deck.x - 1, y: deck.y - 28, w: 2, h: 28 }, scale(0x9a7a4a, ctx.ambience.light));
  ctx.painter.fill({ x: deck.x - 7, y: deck.y - 26, w: 14, h: 2 }, scale(0x9a7a4a, ctx.ambience.light));
};

const busStop: Draw = (ctx) => {
  shade(ctx, 2.2, 0.8);
  const frame = skin(ctx, 0x39404d);
  const glass = mix(scale(0x9fd0e8, ctx.ambience.light), ctx.ambience.skyLow, 0.35);
  // Задняя стенка стеклом, крыша сверху, стойки по краям, лавка внутри.
  boxAt(ctx.painter, shift(ctx.at, 0, -0.35), { w: 2.2, d: 0.1, h: 30 }, {
    top: scale(glass, 1.1),
    left: glass,
    right: scale(glass, 0.9),
  });
  boxAt(ctx.painter, shift(ctx.at, -1.05, 0.3), { w: 0.16, d: 0.16, h: 30 }, frame);
  boxAt(ctx.painter, shift(ctx.at, 1.05, 0.3), { w: 0.16, d: 0.16, h: 30 }, frame);
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 30), { w: 2.4, d: 0.9, h: 4 }, frame);
  boxAt(ctx.painter, shift(ctx.at, 0, -0.1, 4), { w: 1.7, d: 0.3, h: 3 }, skin(ctx, 0xb08a52));
  boxAt(ctx.painter, shift(ctx.at, -0.6, -0.1), { w: 0.12, d: 0.25, h: 4 }, frame);
  boxAt(ctx.painter, shift(ctx.at, 0.6, -0.1), { w: 0.12, d: 0.25, h: 4 }, frame);
};

const newsbox: Draw = (ctx) => {
  shade(ctx, 0.5, 0.4);
  const shell = skin(ctx, 0x3f7fa8);
  boxAt(ctx.painter, ctx.at, { w: 0.2, d: 0.2, h: 6 }, skin(ctx, 0x4a4f58));
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 6), { w: 0.5, d: 0.4, h: 12 }, shell);
  const top = shift(ctx.at, 0, 0, 12);
  ctx.painter.fill({ x: top.x - 5, y: top.y - 4, w: 10, h: 5 }, scale(0xd8d4c8, ctx.ambience.light));
};

const mailbox: Draw = (ctx) => {
  shade(ctx, 0.5, 0.4);
  boxAt(ctx.painter, ctx.at, { w: 0.22, d: 0.22, h: 10 }, skin(ctx, 0x4a4f58));
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 10), { w: 0.55, d: 0.42, h: 13 }, skin(ctx, 0x3f6fa8));
};

const bollard: Draw = (ctx) => {
  shade(ctx, 0.3, 0.3);
  const iron = skin(ctx, 0x4a4f58);
  boxAt(ctx.painter, ctx.at, { w: 0.22, d: 0.22, h: 11 }, iron);
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 11), { w: 0.3, d: 0.3, h: 2 }, skin(ctx, 0x6d7481));
};

const hydrant: Draw = (ctx) => {
  shade(ctx, 0.35, 0.35);
  const red = skin(ctx, 0xc9453f);
  boxAt(ctx.painter, ctx.at, { w: 0.3, d: 0.3, h: 9 }, red);
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 9), { w: 0.44, d: 0.44, h: 2 }, skin(ctx, 0xe05a52));
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 11), { w: 0.2, d: 0.2, h: 3 }, red);
};

const TOWEL = [0xe8705f, 0x5fc9a8, 0xe8c45f, 0xb87fd0];

const towel: Draw = (ctx) => {
  const cloth = scale(TOWEL[ctx.variant % TOWEL.length]!, ctx.ambience.light);
  patch(ctx, 1.05, 0.75, scale(cloth, 0.78));
  patch(ctx, 0.9, 0.6, cloth, 1, 1);
  patch(ctx, 0.2, 0.6, scale(cloth, 1.3), 1, 2);
  boxAt(ctx.painter, shift(ctx.at, 0.6, 0.1), { w: 0.3, d: 0.26, h: 6 }, skin(ctx, 0xd8c8a8));
};

const bike: Draw = (ctx) => {
  shade(ctx, 1, 0.4);
  const iron = scale(0x2f3440, ctx.ambience.light);
  const paint = scale(0x4f9fd8, ctx.ambience.light);
  // Велосипед стоит боком: два колеса и рама щитом поверх тени.
  for (const dx of [-9, 9]) {
    ctx.painter.fill({ x: ctx.at.x + dx - 5, y: ctx.at.y - 12, w: 10, h: 2 }, iron);
    ctx.painter.fill({ x: ctx.at.x + dx - 5, y: ctx.at.y - 2, w: 10, h: 2 }, iron);
    ctx.painter.fill({ x: ctx.at.x + dx - 6, y: ctx.at.y - 11, w: 2, h: 9 }, iron);
    ctx.painter.fill({ x: ctx.at.x + dx + 4, y: ctx.at.y - 11, w: 2, h: 9 }, iron);
  }
  ctx.painter.fill({ x: ctx.at.x - 9, y: ctx.at.y - 11, w: 18, h: 2 }, paint);
  ctx.painter.fill({ x: ctx.at.x - 2, y: ctx.at.y - 18, w: 2, h: 8 }, paint);
  ctx.painter.fill({ x: ctx.at.x - 6, y: ctx.at.y - 19, w: 8, h: 2 }, iron);
  ctx.painter.fill({ x: ctx.at.x + 5, y: ctx.at.y - 17, w: 6, h: 2 }, iron);
};

const shelf: Draw = (ctx) => {
  const wood = skin(ctx, 0x8a6a44);
  boxAt(ctx.painter, ctx.at, { w: 1, d: 0.3, h: 30 }, wood);
  for (let i = 0; i < 3; i += 1) {
    const y = ctx.at.y - 26 + i * 9;
    ctx.painter.fill({ x: ctx.at.x - 12, y, w: 24, h: 2 }, wood.top);
    for (let k = 0; k < 3; k += 1) {
      ctx.painter.fill(
        { x: ctx.at.x - 10 + k * 7, y: y - 5, w: 4, h: 5 },
        scale([0xd85f6a, 0x5fb8d8, 0xd8c45f][(i + k) % 3]!, ctx.ambience.light),
      );
    }
  }
};

/** Мелочь, у которой есть объём. Остальное рисуется щитом, как прежде. */
export const ISO_PROPS: Partial<Record<DecorKind, Draw>> = {
  bench,
  car,
  bin,
  crate,
  planter,
  flowerbed,
  table,
  deckchair,
  boat,
  busStop,
  newsbox,
  mailbox,
  bollard,
  hydrant,
  towel,
  bike,
  shelf,
};
