import { scale } from '../ambience';
import { boxAt } from './shapes';
import { mast, panel, plate } from './planes';
import { patch, shade, shift, skin } from './prop';
import type { Draw } from './prop';

/**
 * Мелочь, которая лежит на улице, — объёмами. Скамейка, машина, ящик и
 * лежак в изометрии обязаны иметь верх и две грани: нарисованные щитом,
 * они лежат на земле плашмя и выдают, что мир на самом деле плоский.
 *
 * Высокое и тонкое — пальмы, фонари, столбы — остаётся щитами: у них нет
 * грани, которую камера показала бы боком.
 */

const bench: Draw = (ctx) => {
  shade(ctx, 1.2, 0.5);
  const wood = skin(ctx, 0xa87a4a);
  const iron = skin(ctx, 0x3f4450);
  // Ножки, сиденье, спинка по дальнему ребру — три коробки, а не доска.
  boxAt(ctx.painter, shift(ctx.at, -0.45, 0), { w: 0.12, d: 0.42, h: 7 }, iron);
  boxAt(ctx.painter, shift(ctx.at, 0.45, 0), { w: 0.12, d: 0.42, h: 5 }, iron);
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 7), { w: 1.2, d: 0.5, h: 4 }, wood);
  boxAt(ctx.painter, shift(ctx.at, 0, -0.22, 11), { w: 1.2, d: 0.12, h: 12 }, wood);
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

  for (const [dx, dy] of [[-0.72, -0.32], [-0.72, 0.32], [0.72, -0.32], [0.72, 0.32]] as const) {
    boxAt(ctx.painter, shift(ctx.at, dx, dy), { w: 0.26, d: 0.2, h: 5 }, tyre);
  }
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 4), { w: 2.15, d: 0.88, h: 11 }, body);
  // Кабина сдвинута назад, как у настоящей машины.
  boxAt(
    ctx.painter,
    shift(ctx.at, -0.22, 0, 15),
    { w: 1.15, d: 0.72, h: 10 },
    { top: body.top, left: glass.left, right: glass.right, outline: body.outline },
  );
  // Фары в плоскости торца кузова: щитом они смотрели мимо машины.
  const lit = ctx.ambience.lampsOn;
  panel(
    ctx.painter,
    ctx.at,
    'y',
    { span: 0.7, across: 1.07, top: 13, height: 4 },
    lit ? 0xfff0c0 : scale(0xe8e8e0, ctx.ambience.light),
  );
  panel(
    ctx.painter,
    ctx.at,
    'y',
    { span: 0.7, across: -1.07, top: 13, height: 4 },
    lit ? 0xff6a5c : scale(0x8f4a44, ctx.ambience.light),
  );
};

const bin: Draw = (ctx) => {
  shade(ctx, 0.5, 0.5);
  boxAt(ctx.painter, ctx.at, { w: 0.5, d: 0.5, h: 16 }, skin(ctx, 0x545a66));
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 16), { w: 0.62, d: 0.62, h: 3 }, skin(ctx, 0x6d7481));
};

const crate: Draw = (ctx) => {
  shade(ctx, 0.6, 0.6);
  const wood = skin(ctx, ctx.variant % 2 === 0 ? 0xa8804a : 0x8f6a3f);
  boxAt(ctx.painter, ctx.at, { w: 0.6, d: 0.6, h: 14 }, wood);
  // Обвязка по обеим видимым граням, каждая в своей плоскости.
  panel(ctx.painter, ctx.at, 'x', { span: 0.6, across: 0.3, top: 9, height: 1 }, wood.left);
  panel(ctx.painter, ctx.at, 'y', { span: 0.6, across: 0.3, top: 7, height: 1 }, wood.right);
};

const planter: Draw = (ctx) => {
  shade(ctx, 0.7, 0.6);
  boxAt(ctx.painter, ctx.at, { w: 0.7, d: 0.6, h: 10 }, skin(ctx, 0xa89078));
  // Куст ярусами коробок: щитом он лежал бы поперёк кашпо.
  const leaf = skin(ctx, 0x4f9f5f, 0.4);
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 10), { w: 0.62, d: 0.52, h: 9 }, leaf);
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 19), { w: 0.42, d: 0.34, h: 7 }, skin(ctx, 0x62b872, 0.4));
  boxAt(ctx.painter, shift(ctx.at, 0.08, -0.05, 26), { w: 0.16, d: 0.14, h: 4 }, skin(ctx, 0xe86a9a, 0.3));
};

const flowerbed: Draw = (ctx) => {
  shade(ctx, 1, 0.7);
  boxAt(ctx.painter, ctx.at, { w: 1, d: 0.7, h: 5 }, skin(ctx, 0xb8ac98));
  patch(ctx, 0.86, 0.56, scale(0x4a7f42, ctx.ambience.light), 1, 4);
  for (let i = 0; i < 7; i += 1) {
    boxAt(
      ctx.painter,
      shift(ctx.at, -0.35 + (i % 4) * 0.22, -0.18 + Math.floor(i / 4) * 0.2, 4),
      { w: 0.12, d: 0.12, h: 3 },
      skin(ctx, [0xffd35f, 0xff7fb8, 0xff5f5f][i % 3]!, 0.3),
    );
  }
};

const table: Draw = (ctx) => {
  shade(ctx, 0.9, 0.7);
  boxAt(ctx.painter, ctx.at, { w: 0.18, d: 0.18, h: 13 }, skin(ctx, 0x8f8a80));
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 13), { w: 0.95, d: 0.75, h: 3 }, skin(ctx, 0xd8d0c4));
};

const CHAIR = [0xe8705f, 0x5fb8e8, 0xe8c45f];

const deckchair: Draw = (ctx) => {
  shade(ctx, 0.8, 0.6);
  const cloth = skin(ctx, CHAIR[ctx.variant % CHAIR.length]!);
  boxAt(ctx.painter, ctx.at, { w: 0.75, d: 0.5, h: 5 }, skin(ctx, 0xd8c8a8));
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 5), { w: 0.8, d: 0.55, h: 3 }, cloth);
  // Спинка под наклоном: три ступеньки вместо диагонали.
  for (let i = 0; i < 3; i += 1) {
    boxAt(ctx.painter, shift(ctx.at, 0, -0.12 - i * 0.1, 7 + i * 4), { w: 0.72, d: 0.12, h: 5 }, cloth);
  }
};

const boat: Draw = (ctx) => {
  shade(ctx, 1.6, 1);
  const hull = skin(ctx, ctx.variant % 2 === 0 ? 0xe8e4dc : 0x5f8fc9);
  // Корпус сужается к носу и корме: три коробки вместо одной.
  boxAt(ctx.painter, ctx.at, { w: 1.5, d: 0.75, h: 7 }, hull);
  boxAt(ctx.painter, shift(ctx.at, -0.85, 0, 1), { w: 0.4, d: 0.4, h: 4 }, hull);
  boxAt(ctx.painter, shift(ctx.at, 0.85, 0, 1), { w: 0.4, d: 0.4, h: 4 }, hull);
  patch(ctx, 1.15, 0.5, scale(0x3a2f22, ctx.ambience.light), 1, 5);
  const rig = scale(0x9a7a4a, ctx.ambience.light);
  mast(ctx.painter, shift(ctx.at, 0, 0, 7), 36, rig);
  // Рей идёт вдоль корпуса, а не поперёк экрана.
  panel(ctx.painter, ctx.at, 'x', { span: 0.9, top: 40, height: 3 }, rig);
};

const TOWEL = [0xe8705f, 0x5fc9a8, 0xe8c45f, 0xb87fd0];

const towel: Draw = (ctx) => {
  const cloth = scale(TOWEL[ctx.variant % TOWEL.length]!, ctx.ambience.light);
  patch(ctx, 1.05, 0.75, scale(cloth, 0.78));
  patch(ctx, 0.9, 0.6, cloth, 1, 1);
  patch(ctx, 0.2, 0.6, scale(cloth, 1.3), 1, 2);
  boxAt(ctx.painter, shift(ctx.at, 0.6, 0.1), { w: 0.3, d: 0.26, h: 8 }, skin(ctx, 0xd8c8a8));
};

/**
 * Велосипед: рама стоит вдоль своей оси, а колёса — тонкие диски в той же
 * плоскости. Нарисованный щитом, он висел поперёк дороги и был первым,
 * что выдавало плоский мир.
 */
const bike: Draw = (ctx) => {
  shade(ctx, 1, 0.4);
  const iron = skin(ctx, 0x2f3440, 0.3);
  const paint = scale(0x4f9fd8, ctx.ambience.light);
  const axis = ctx.facing;
  const along = (a: number, lift: number): { dx: number; dy: number; lift: number } =>
    axis === 'x' ? { dx: a, dy: 0, lift } : { dx: 0, dy: a, lift };

  for (const a of [-0.34, 0.34]) {
    const w = along(a, 0);
    boxAt(
      ctx.painter,
      shift(ctx.at, w.dx, w.dy),
      axis === 'x' ? { w: 0.42, d: 0.07, h: 11 } : { w: 0.07, d: 0.42, h: 14 },
      iron,
    );
  }
  // Рама и седло: полотна в плоскости велосипеда.
  panel(ctx.painter, ctx.at, axis, { span: 0.68, top: 18, height: 4 }, paint);
  panel(ctx.painter, ctx.at, axis, { span: 0.12, along: -0.1, top: 27, height: 10 }, paint);
  panel(ctx.painter, ctx.at, axis, { span: 0.28, along: -0.16, top: 29, height: 3 }, iron.left);
  panel(ctx.painter, ctx.at, axis, { span: 0.24, along: 0.3, top: 26, height: 3 }, iron.top);
  plate(ctx.painter, ctx.at, { w: 0.2, d: 0.2, dx: axis === 'x' ? -0.16 : 0, dy: axis === 'y' ? -0.16 : 0, lift: 29 }, iron.top);
};

export const STREET_PROPS = {
  bench,
  car,
  bin,
  crate,
  planter,
  flowerbed,
  table,
  deckchair,
  boat,
  towel,
  bike,
};
