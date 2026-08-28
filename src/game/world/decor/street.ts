import { box, tone } from './kit';
import type { Draw } from './kit';
import { mix, scale } from '../ambience';

/**
 * Уличная мелочь: пальмы, фонари, машины, щиты, светофор, велосипед,
 * почтовый ящик, чайки. Всё рисуется процедурами по точке опоры.
 */
const PALM_HEIGHTS = [30, 38, 46];
const CAR_BODIES = [0xd9534f, 0x4f7fd9, 0xe8c46a, 0xe8e8ee];
const BILLBOARD_ART = [0xe85f8a, 0x5fb8e8, 0xe8c25f];
const PARASOL_COLORS = [0xe8705f, 0xe8c25f, 0x5fb8a8];
/**
 * Пальма. Рисуется в долях мировой клетки, поэтому ствол получает кольца
 * в один экранный пиксель, а лист — сужающуюся кромку: на целой клетке
 * дерево выходило из тех же квадратов, что и стена дома.
 */
const palm: Draw = (ctx) => {
  const height = PALM_HEIGHTS[ctx.variant % PALM_HEIGHTS.length]!;
  const bark = tone(ctx, 0x8a6a48);
  const barkLit = tone(ctx, 0xa8855c);
  const frond = tone(ctx, 0x2f7f46);
  const frondLit = tone(ctx, 0x5cb86a);

  // Ствол клонится: прямая палка читается столбом, а не пальмой.
  const lean = (t: number): number => Math.sin(t * 1.15) * 4;
  for (let i = 0; i < height; i += 1) {
    const t = i / height;
    const x = lean(t);
    const w = 3 - t * 0.8;
    box(ctx, x - w / 2, -i - 1, w, 1, i % 4 === 0 ? bark : barkLit);
    box(ctx, x - w / 2, -i - 1, 0.5, 1, tone(ctx, 0x6a4f36));
  }

  const topX = lean(1);
  const topY = -height - 1;

  // Лист: цепочка сегментов, сужающихся к концу, со светлой кромкой.
  const leaf = (dx: number, dy: number, length: number, droop: number): void => {
    for (let i = 1; i <= length; i += 1) {
      const t = i / length;
      const x = topX + dx * i;
      const y = topY + dy * i + droop * t * t * length * 0.5;
      const w = 2.4 * (1 - t * 0.7);
      box(ctx, x - w / 2, y, w, 1, frond);
      box(ctx, x - w / 2, y - 0.5, w * 0.6, 0.5, frondLit);
    }
  };

  leaf(-1.1, -0.5, 8, 0.8);
  leaf(1.1, -0.5, 8, 0.8);
  leaf(-1.5, 0.1, 7, 0.9);
  leaf(1.5, 0.1, 7, 0.9);
  leaf(-0.7, -0.9, 6, 0.7);
  leaf(0.7, -0.9, 6, 0.7);
  leaf(-1.7, 0.6, 6, 0.6);
  leaf(1.7, 0.6, 6, 0.6);

  // Сердцевина и кокосы.
  box(ctx, topX - 2, topY - 2, 4, 3, tone(ctx, 0x265f38));
  box(ctx, topX - 2.5, topY + 1, 1.5, 1.5, tone(ctx, 0x7a5a34));
  box(ctx, topX + 1, topY + 1.5, 1.5, 1.5, tone(ctx, 0x6a4f2c));
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

const billboard: Draw = (ctx) => {
  const post = tone(ctx, 0x4a4450);
  box(ctx, -2, -14, 2, 14, post);
  box(ctx, 3, -14, 2, 14, post);

  const w = 26;
  const h = 17;
  const frame = tone(ctx, 0x2e3240);
  box(ctx, -w / 2 + 2, -14 - h, w, h, frame);
  const art = BILLBOARD_ART[ctx.variant % BILLBOARD_ART.length]!;
  box(ctx, -w / 2 + 3, -13 - h, w - 2, h - 3, ctx.ambience.lampsOn ? art : tone(ctx, art));
  // Пара полос вместо текста: надпись в 4 пикселя всё равно не прочесть.
  box(ctx, -w / 2 + 6, -9 - h, w - 12, 2, 0xffffff, 0.6);
  box(ctx, -w / 2 + 6, -5 - h, w - 16, 2, 0xffffff, 0.4);
  if (ctx.ambience.lampsOn) box(ctx, -w / 2 + 1, -15 - h, w + 2, h + 2, art, 0.18);
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

/** Велосипед у столба: примета живой улицы, а не декорации. */
const bike: Draw = (ctx) => {
  const frame = tone(ctx, 0x3f6f9a);
  const tyre = tone(ctx, 0x22242a);
  const wheel = (cx: number): void => {
    box(ctx, cx - 5, -11, 10, 2, tyre);
    box(ctx, cx - 5, -3, 10, 2, tyre);
    box(ctx, cx - 6, -10, 2, 8, tyre);
    box(ctx, cx + 4, -10, 2, 8, tyre);
  };
  wheel(-8);
  wheel(8);
  box(ctx, -8, -8, 17, 2, frame);
  box(ctx, -2, -14, 2, 8, frame);
  box(ctx, -5, -15, 8, 2, frame);
  box(ctx, 6, -16, 5, 2, frame);
  box(ctx, 8, -15, 2, 6, frame);
};

const trafficLight: Draw = (ctx) => {
  const post = tone(ctx, 0x3a3f4a);
  box(ctx, -1, -34, 3, 34, post);
  box(ctx, -4, -46, 9, 13, tone(ctx, 0x22242c));
  const on = ctx.ambience.lampsOn ? 1 : 0.75;
  box(ctx, -2, -44, 5, 3, 0xe84a4a, on);
  box(ctx, -2, -40, 5, 3, 0xe8c44a, on * 0.5);
  box(ctx, -2, -36, 5, 3, 0x4ae87a, on * 0.5);
  if (ctx.ambience.lampsOn) box(ctx, -7, -47, 15, 16, 0xe84a4a, 0.12);
};

const mailbox: Draw = (ctx) => {
  const blue = tone(ctx, 0x3a5f9a);
  box(ctx, -6, -16, 13, 13, blue);
  box(ctx, -6, -18, 13, 3, scale(blue, 1.25));
  box(ctx, -4, -13, 9, 2, scale(blue, 0.6));
  box(ctx, -3, -3, 3, 3, tone(ctx, 0x2a2c34));
  box(ctx, 2, -3, 3, 3, tone(ctx, 0x2a2c34));
};

/** Собака на выгуле: единственное, что здесь двигалось бы само. */
const dog: Draw = (ctx) => {
  const fur = tone(ctx, ctx.variant % 2 === 0 ? 0xa8814a : 0x585048);
  box(ctx, -5, -5, 9, 3, fur);
  box(ctx, 3, -7, 4, 3, fur);
  box(ctx, 5, -8, 2, 1, scale(fur, 0.7));
  box(ctx, -6, -7, 2, 2, fur);
  box(ctx, -4, -2, 2, 2, fur);
  box(ctx, 2, -2, 2, 2, fur);
};

/** Доска у стены: без неё этот город не отличить от любого другого. */
const surfboard: Draw = (ctx) => {
  const deck = tone(ctx, [0xe86a6a, 0x5fc9e8, 0xe8c45f][ctx.variant % 3]!);
  box(ctx, -4, -30, 8, 30, deck);
  box(ctx, -3, -33, 6, 4, deck);
  box(ctx, -2, -35, 4, 3, scale(deck, 1.2));
  box(ctx, -1, -28, 2, 24, 0xffffff, 0.35);
};

export const STREET = { palm, lamp, bench, car, billboard, hydrant, planter, bin, busStop, bollard, newsbox, parasol, gull, bike, trafficLight, mailbox, dog, surfboard };
