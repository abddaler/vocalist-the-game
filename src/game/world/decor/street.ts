import { box, tone } from './kit';
import type { Draw } from './kit';
import { mix, scale } from '../ambience';

/**
 * Уличная мелочь, у которой нет объёма: пальма, фонарь и живность. У
 * тонкого столба нет грани, которую камера показала бы боком, а чайка и
 * собака — те же персонажи, только мельче.
 */
const PALM_HEIGHTS = [30, 38, 46];
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

const gull: Draw = (ctx) => {
  const body = mix(0xffffff, ctx.ambience.skyLow, 0.3);
  const span = ctx.variant % 2 === 0 ? 1 : -1;
  box(ctx, -4, span, 4, 1, body);
  box(ctx, 0, span, 4, 1, body);
  box(ctx, -1, 0, 2, 1, body);
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

export const STREET = { palm, lamp, gull, dog };
