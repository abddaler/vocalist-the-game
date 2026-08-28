import type { DecorDef, DecorKind } from '@core/types';
import type { Painter } from '@ui/widgets/Painter';
import { mix, scale } from './ambience';
import type { Ambience } from './ambience';

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
}

type Draw = (ctx: DecorContext) => void;

const box = (ctx: DecorContext, dx: number, dy: number, w: number, h: number, color: number, alpha = 1): void =>
  ctx.painter.fill(
    { x: Math.round(ctx.x + dx), y: Math.round(ctx.y + dy), w, h },
    color,
    alpha,
  );

/** Цвет под текущим светом: ночью мелочь не должна светиться сама. */
const tone = (ctx: DecorContext, color: number): number => scale(color, ctx.ambience.light);

const PALM_HEIGHTS = [30, 38, 46];
const CAR_BODIES = [0xd9534f, 0x4f7fd9, 0xe8c46a, 0xe8e8ee];

const palm: Draw = (ctx) => {
  const height = PALM_HEIGHTS[ctx.variant % PALM_HEIGHTS.length]!;
  const trunk = tone(ctx, 0x7a5f42);
  const frond = tone(ctx, 0x3f8f52);
  const frondLit = tone(ctx, 0x5fbf6a);

  // Ствол с наклоном: прямая палка читается как столб, а не как пальма.
  for (let i = 0; i < height; i += 1) {
    const bend = Math.round(Math.sin(i / height) * 3);
    box(ctx, bend - 1, -i - 1, 3, 2, i % 6 < 3 ? trunk : scale(trunk, 1.2));
  }

  const topX = 3;
  const topY = -height - 1;
  const frondArm = (dx: number, dy: number, length: number, lit: boolean): void => {
    for (let i = 1; i <= length; i += 1) {
      const spread = Math.round((i * i) / (length * 2));
      box(ctx, topX + dx * i, topY + dy * i + spread, 2, 2, lit ? frondLit : frond);
    }
  };
  frondArm(-1, -1, 7, true);
  frondArm(1, -1, 7, true);
  frondArm(-1.6, 0, 6, false);
  frondArm(1.6, 0, 6, false);
  frondArm(-0.6, 1, 5, false);
  frondArm(0.9, 1, 5, false);
  box(ctx, topX - 2, topY - 2, 5, 4, tone(ctx, 0x2f6b3f));
};

const lamp: Draw = (ctx) => {
  const post = tone(ctx, 0x4a4f5c);
  box(ctx, -1, -28, 2, 28, post);
  box(ctx, -4, -32, 9, 4, post);
  const glass = ctx.ambience.lampsOn ? 0xffe6a8 : tone(ctx, 0x8f94a0);
  box(ctx, -3, -30, 7, 2, glass);
  if (ctx.ambience.lampsOn) {
    // Пятно света на асфальте: фонарь без пятна не горит, а просто жёлтый.
    box(ctx, -9, -4, 19, 5, 0xffd98f, 0.16);
    box(ctx, -6, -2, 13, 3, 0xffd98f, 0.2);
  }
};

const bench: Draw = (ctx) => {
  const wood = tone(ctx, 0xa87a4a);
  const iron = tone(ctx, 0x3f4450);
  box(ctx, -12, -4, 24, 3, wood);
  box(ctx, -12, -10, 24, 3, wood);
  box(ctx, -11, -2, 2, 2, iron);
  box(ctx, 9, -2, 2, 2, iron);
  box(ctx, -11, -10, 2, 7, iron);
  box(ctx, 9, -10, 2, 7, iron);
};

const car: Draw = (ctx) => {
  const body = tone(ctx, CAR_BODIES[ctx.variant % CAR_BODIES.length]!);
  const glass = tone(ctx, 0x9fd0ea);
  const tyre = tone(ctx, 0x1e2029);

  box(ctx, -18, -9, 36, 7, body);
  box(ctx, -12, -15, 23, 7, scale(body, 0.88));
  box(ctx, -10, -14, 8, 5, glass);
  box(ctx, 0, -14, 8, 5, glass);
  box(ctx, -18, -5, 36, 3, scale(body, 0.7));
  box(ctx, -13, -3, 6, 3, tyre);
  box(ctx, 7, -3, 6, 3, tyre);
  // Габариты горят, когда стемнело: улица оживает без единого спрайта.
  const front = ctx.ambience.lampsOn ? 0xfff0c0 : tone(ctx, 0xd8d8d0);
  const back = ctx.ambience.lampsOn ? 0xff6a5c : tone(ctx, 0x8f4a44);
  box(ctx, 15, -8, 3, 2, front);
  box(ctx, -18, -8, 3, 2, back);
};

const BILLBOARD_ART = [0xe85f8a, 0x5fb8e8, 0xe8c25f];

const billboard: Draw = (ctx) => {
  const post = tone(ctx, 0x4a4450);
  box(ctx, -2, -18, 3, 18, post);
  box(ctx, 4, -18, 3, 18, post);

  const w = 40;
  const h = 26;
  const frame = tone(ctx, 0x2e3240);
  box(ctx, -w / 2 + 2, -18 - h, w, h, frame);
  const art = BILLBOARD_ART[ctx.variant % BILLBOARD_ART.length]!;
  box(ctx, -w / 2 + 4, -16 - h, w - 4, h - 4, ctx.ambience.lampsOn ? art : tone(ctx, art));
  // Пара полос вместо текста: надпись в 4 пикселя всё равно не прочесть.
  box(ctx, -w / 2 + 7, -10 - h, w - 14, 3, 0xffffff, 0.55);
  box(ctx, -w / 2 + 7, -5 - h, w - 22, 2, 0xffffff, 0.35);
  if (ctx.ambience.lampsOn) box(ctx, -w / 2 + 2, -18 - h, w, h, art, 0.14);
};

const hydrant: Draw = (ctx) => {
  const red = tone(ctx, 0xc9453f);
  box(ctx, -3, -9, 6, 9, red);
  box(ctx, -5, -7, 10, 3, scale(red, 0.85));
  box(ctx, -2, -11, 4, 2, scale(red, 1.15));
};

const planter: Draw = (ctx) => {
  const pot = tone(ctx, 0xa89078);
  const leaf = tone(ctx, 0x4f9f5f);
  box(ctx, -7, -7, 14, 7, pot);
  box(ctx, -6, -13, 12, 6, leaf);
  box(ctx, -4, -16, 8, 4, scale(leaf, 1.15));
  box(ctx, -1, -18, 3, 3, tone(ctx, 0xe86a9a));
};

const bin: Draw = (ctx) => {
  const metal = tone(ctx, 0x545a66);
  box(ctx, -5, -12, 10, 12, metal);
  box(ctx, -6, -14, 12, 3, scale(metal, 1.25));
  box(ctx, -3, -11, 2, 9, scale(metal, 0.8));
  box(ctx, 1, -11, 2, 9, scale(metal, 0.8));
};

const busStop: Draw = (ctx) => {
  const frame = tone(ctx, 0x3f4552);
  const glass = mix(tone(ctx, 0x8fbcd8), ctx.ambience.skyLow, 0.4);
  box(ctx, -20, -26, 40, 3, frame);
  box(ctx, -20, -23, 3, 23, frame);
  box(ctx, 17, -23, 3, 23, frame);
  box(ctx, -17, -23, 34, 18, glass, 0.45);
  box(ctx, -14, -10, 28, 3, tone(ctx, 0xa8814a));
  if (ctx.ambience.lampsOn) box(ctx, -16, -22, 10, 16, 0xffe6a8, 0.3);
};

const crate: Draw = (ctx) => {
  const size = ctx.variant % 2 === 0 ? 20 : 15;
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

const bollard: Draw = (ctx) => {
  const iron = tone(ctx, 0x4a4f58);
  box(ctx, -3, -10, 6, 10, iron);
  box(ctx, -4, -12, 8, 3, scale(iron, 1.2));
};

const newsbox: Draw = (ctx) => {
  const shell = tone(ctx, 0x3f7fa8);
  box(ctx, -6, -16, 12, 16, shell);
  box(ctx, -4, -14, 8, 6, tone(ctx, 0xd8d4c8));
  box(ctx, -6, -3, 12, 3, scale(shell, 0.7));
};

const PARASOL_COLORS = [0xe8705f, 0xe8c25f, 0x5fb8a8];

const parasol: Draw = (ctx) => {
  const cloth = tone(ctx, PARASOL_COLORS[ctx.variant % PARASOL_COLORS.length]!);
  box(ctx, -1, -24, 2, 24, tone(ctx, 0x8f7a5a));
  box(ctx, -13, -28, 26, 4, cloth);
  box(ctx, -10, -31, 20, 3, scale(cloth, 1.15));
  box(ctx, -5, -33, 10, 2, scale(cloth, 1.25));
  // Столик под зонтом: зонт сам по себе висит в воздухе.
  box(ctx, -8, -8, 16, 2, tone(ctx, 0xd8d0c4));
  box(ctx, -1, -7, 2, 7, tone(ctx, 0x8f8a80));
};

const gull: Draw = (ctx) => {
  const body = mix(0xffffff, ctx.ambience.skyLow, 0.3);
  const span = ctx.variant % 2 === 0 ? 1 : -1;
  box(ctx, -4, span, 4, 1, body);
  box(ctx, 0, span, 4, 1, body);
  box(ctx, -1, 0, 2, 1, body);
};

const DRAW: Readonly<Record<DecorKind, Draw>> = {
  palm,
  lamp,
  bench,
  car,
  billboard,
  hydrant,
  planter,
  bin,
  busStop,
  crate,
  bollard,
  newsbox,
  parasol,
  gull,
};

/** Насколько широкую тень отбрасывает предмет. Ноль — тени нет. */
const SHADOW_WIDTH: Readonly<Record<DecorKind, number>> = {
  palm: 10,
  lamp: 6,
  bench: 22,
  car: 34,
  billboard: 12,
  hydrant: 8,
  planter: 14,
  bin: 11,
  busStop: 38,
  crate: 20,
  bollard: 7,
  newsbox: 12,
  parasol: 24,
  gull: 0,
};

export function drawDecor(
  painter: Painter,
  item: DecorDef,
  screenX: number,
  screenY: number,
  ambience: Ambience,
): void {
  DRAW[item.kind]({ painter, ambience, x: screenX, y: screenY, variant: item.variant ?? 0 });
}

export const shadowWidth = (kind: DecorKind): number => SHADOW_WIDTH[kind];
