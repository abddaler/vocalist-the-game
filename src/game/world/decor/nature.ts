import { box, tone } from './kit';
import type { Draw } from './kit';
import { mix, scale } from '../ambience';

/**
 * Зелень и пляж. Дробные координаты здесь по делу: крупная форма стоит
 * на сетке мира, а лист, доска и спица рисуются в один экранный пиксель —
 * иначе всё живое выходит из тех же квадратов, что и стена дома.
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

const PETALS = [0xe86a9a, 0xe8c45f, 0xe8e8f0, 0xd86ae8];

/** Клумба: зелень и точки цветов. Дешевле всего оживляет газон. */
export const flowerbed: Draw = (ctx) => {
  const soil = tone(ctx, 0x6a4f3a);
  const leaf = tone(ctx, 0x4f9a5f);
  box(ctx, -9, -3, 18, 3, soil);
  box(ctx, -8, -6, 16, 3, leaf);
  for (let i = 0; i < 6; i += 1) {
    box(ctx, -7 + i * 2.5, -7.5, 1.5, 1.5, PETALS[(i + ctx.variant) % PETALS.length]!);
  }
};

/** Вышка спасателя: примета пляжа, которую ни с чем не спутать. */
export const lifeguard: Draw = (ctx) => {
  const wood = tone(ctx, 0xd8b070);
  const dark = scale(wood, 0.66);
  const roof = tone(ctx, 0xe05f5f);

  // Сваи и лестница: вышка стоит над песком, а не на нём.
  for (const side of [-11, 9]) {
    box(ctx, side, -14, 2, 14, wood);
    box(ctx, side + 0.5, -14, 0.5, 14, dark);
  }
  for (let i = 0; i < 4; i += 1) box(ctx, -16, -3 - i * 3, 6, 1, wood);
  box(ctx, -17, -14, 1.5, 12, wood);
  box(ctx, -11, -14, 1.5, 12, wood);

  box(ctx, -13, -16, 26, 2, wood);
  box(ctx, -12, -30, 24, 14, wood);
  box(ctx, -10, -28, 20, 8, dark);
  box(ctx, -10, -28, 20, 1, scale(wood, 1.2));
  box(ctx, -13, -30, 26, 1.5, scale(wood, 1.1));
  box(ctx, -15, -35, 30, 5, roof);
  box(ctx, -12, -38, 24, 3, scale(roof, 1.15));
  box(ctx, -7, -40, 14, 2, scale(roof, 1.3));
  box(ctx, -0.5, -46, 1, 6, wood);
  box(ctx, 0.5, -46, 6, 4, tone(ctx, 0xe8e8f0));
};

const CHAIR = [0xe8705f, 0x5fb8e8, 0xe8c45f];

export const deckchair: Draw = (ctx) => {
  const cloth = tone(ctx, CHAIR[ctx.variant % CHAIR.length]!);
  const frame = tone(ctx, 0xd8c8a8);
  box(ctx, -6, -4, 12, 2, cloth);
  box(ctx, 1, -9, 5, 6, cloth);
  box(ctx, -7, -4, 1.5, 4, frame);
  box(ctx, 5, -4, 1.5, 4, frame);
  box(ctx, 0, -10, 1, 7, frame);
};

const SHADE = [0xe8705f, 0x5fc9a8, 0xe8c45f];

export const umbrella: Draw = (ctx) => {
  const cloth = tone(ctx, SHADE[ctx.variant % SHADE.length]!);
  box(ctx, -0.5, -22, 1.5, 22, tone(ctx, 0xd8c8a8));
  box(ctx, -12, -25, 25, 3, cloth);
  box(ctx, -9, -28, 19, 3, scale(cloth, 1.12));
  box(ctx, -5, -30, 11, 2, scale(cloth, 1.25));
  box(ctx, -1.5, -31, 3, 1, scale(cloth, 0.8));
  // Фестоны: ровный купол выглядит грибом.
  for (let i = 0; i < 4; i += 1) box(ctx, -11 + i * 6, -22, 2, 1, scale(cloth, 0.75));
};

/** Лодка на песке: горизонт без единого судна выглядит бассейном. */
export const boat: Draw = (ctx) => {
  const hull = tone(ctx, ctx.variant % 2 === 0 ? 0xe8e4dc : 0x5f8fc9);
  const wood = tone(ctx, 0x9a7a4a);

  // Вытащенная на песок лодка: борт сужается к носу и корме, внутри
  // видны банки. Мачты нет — с мачтой она читалась белым щитом.
  for (let i = 0; i < 5; i += 1) {
    const inset = i * 1.5;
    box(ctx, -16 + inset, -8 + i * 1.5, 32 - inset * 2, 1.5, scale(hull, 1 - i * 0.07));
  }
  box(ctx, -15, -8, 30, 1, scale(hull, 1.25));
  box(ctx, -13, -7, 26, 2, mix(scale(hull, 0.55), 0x000000, 0.2));
  box(ctx, -8, -7, 3, 2, wood);
  box(ctx, 4, -7, 3, 2, wood);
  box(ctx, -11, -1, 22, 1, scale(hull, 0.6));
  // Вёсла, приткнутые к борту.
  box(ctx, 6, -14, 1, 8, wood);
  box(ctx, 6.5, -16, 2.5, 3, scale(wood, 1.2));
};

const TOWEL = [0xe8705f, 0x5fc9a8, 0xe8c45f, 0xb87fd0];

/** Полотенце на песке: полоски поперёк и брошенная рядом сумка. */
export const towel: Draw = (ctx) => {
  const cloth = tone(ctx, TOWEL[ctx.variant % TOWEL.length]!);
  box(ctx, -10, -6, 20, 6, scale(cloth, 0.8));
  box(ctx, -10, -6, 20, 5, cloth);
  for (let i = 0; i < 4; i += 1) {
    box(ctx, -8 + i * 5, -6, 2, 5, scale(cloth, 1.25));
  }
  box(ctx, -10, -6, 20, 1, scale(cloth, 1.4));
  // Сумка у края: без неё полотенце читается ковриком из комнаты.
  box(ctx, 9, -9, 5, 4, tone(ctx, 0xd8c8a8));
  box(ctx, 10, -10, 3, 1, tone(ctx, 0x9a8a6a));
};

export const NATURE = { tree, bush, flowerbed, lifeguard, deckchair, umbrella, boat, towel };
