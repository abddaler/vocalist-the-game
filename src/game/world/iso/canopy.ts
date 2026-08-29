import { scale, mix } from '../ambience';
import { boxAt } from './shapes';
import { mast, panel, ramp } from './planes';
import { shade, shift, skin } from './prop';
import type { Draw, IsoProp } from './prop';

/**
 * Всё, что накрывает человека сверху: навес лотка, крыша киоска и
 * остановки, соломенная кровля хижины, купол зонта.
 *
 * Такой предмет разделён надвое. Опоры и прилавок стоят на земле и
 * сортируются вместе с людьми; полотно навеса рисуется отдельным
 * проходом после всех — иначе прохожий, оказавшийся ближе к камере,
 * встаёт поверх крыши и выглядит забравшимся на неё.
 */

const AWNING = [0xe85f6a, 0x4f9fd8, 0xe8c45f, 0x5fc9a8];

/** Прилавок лотка: тумба, столешница, товар и четыре стойки. */
const stall: Draw = (ctx) => {
  shade(ctx, 2.2, 1.4);
  const wood = skin(ctx, 0xa8804a);
  const post = skin(ctx, 0x6a4f34);

  boxAt(ctx.painter, ctx.at, { w: 2, d: 1, h: 16 }, wood);
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 16), { w: 2.2, d: 1.15, h: 3 }, skin(ctx, 0xd8c8a8));
  // Товар на прилавке коробками: щитом он лежал бы поперёк столешницы.
  for (let i = 0; i < 6; i += 1) {
    boxAt(
      ctx.painter,
      shift(ctx.at, -0.7 + (i % 3) * 0.7, -0.25 + Math.floor(i / 3) * 0.5, 19),
      { w: 0.4, d: 0.3, h: 5 },
      skin(ctx, [0xe8705f, 0xe8c45f, 0x7fc95f, 0xd85f9a][i % 4]!, 0.4),
    );
  }
  for (const [dx, dy] of [[-0.95, -0.5], [0.95, -0.5], [-0.95, 0.5], [0.95, 0.5]] as const) {
    boxAt(ctx.painter, shift(ctx.at, dx, dy), { w: 0.12, d: 0.12, h: 34 }, post);
  }
};

/** Полосатый навес лотка со скатом к покупателю. */
const stallRoof: Draw = (ctx) => {
  const tone = scale(AWNING[ctx.variant % AWNING.length]!, ctx.ambience.light);
  ramp(ctx.painter, ctx.at, { w: 2.5, d: 1.6, far: 42, near: 32 }, scale(tone, 0.86));
  for (let i = 0; i < 5; i += 1) {
    ramp(
      ctx.painter,
      ctx.at,
      { w: 0.25, d: 1.6, dx: -1.125 + i * 0.5, far: 42, near: 32 },
      tone,
    );
  }
  // Кромка навеса: полотно, свисающее по ближнему ребру.
  panel(ctx.painter, ctx.at, 'x', { span: 2.5, across: 0.8, top: 32, height: 3 }, scale(tone, 0.7));
};

/** Киоск: будка с окошком и вывеской. */
const kiosk: Draw = (ctx) => {
  shade(ctx, 1.4, 1.2);
  boxAt(ctx.painter, ctx.at, { w: 1.3, d: 1.1, h: 40 }, skin(ctx, 0x6a7f9a));
  // Окно и вывеска лежат в плоскости лицевой грани, а не в плоскости экрана.
  const glass = mix(scale(0x9fd0e8, ctx.ambience.light), ctx.ambience.skyLow, 0.3);
  panel(ctx.painter, ctx.at, 'x', { span: 1.05, across: 0.55, top: 32, height: 14 }, glass);
  panel(ctx.painter, ctx.at, 'x', { span: 1.05, across: 0.55, top: 32, height: 2 }, scale(glass, 1.4));
  panel(
    ctx.painter,
    ctx.at,
    'x',
    { span: 1.2, across: 0.55, top: 39, height: 6 },
    scale(0xe8c45f, ctx.ambience.light),
  );
};

const kioskRoof: Draw = (ctx) => {
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 40), { w: 1.55, d: 1.35, h: 4 }, skin(ctx, 0x3f4a5c));
};

/** Хижина у воды: стойки и прилавок под соломенной кровлей. */
const hut: Draw = (ctx) => {
  shade(ctx, 3.2, 2.4);
  const post = skin(ctx, 0x8a6a3f);
  for (const [dx, dy] of [[-1.4, -1], [1.4, -1], [-1.4, 1], [1.4, 1]] as const) {
    boxAt(ctx.painter, shift(ctx.at, dx, dy), { w: 0.2, d: 0.2, h: 40 }, post);
  }
  boxAt(ctx.painter, shift(ctx.at, 0, 0.6, 12), { w: 2.4, d: 0.7, h: 14 }, skin(ctx, 0xb08a52));
};

const hutRoof: Draw = (ctx) => {
  const straw = scale(0xd8b45f, ctx.ambience.light);
  for (let i = 0; i < 6; i += 1) {
    boxAt(
      ctx.painter,
      shift(ctx.at, 0, 0, 40 + i * 3),
      { w: 3.4 - i * 0.45, d: 2.6 - i * 0.34, h: 4 },
      {
        top: scale(straw, 1.16 - i * 0.02),
        left: scale(straw, 0.7),
        right: scale(straw, 0.9),
        outline: mix(straw, 0x2a1f10, 0.6),
      },
    );
  }
};

/** Остановка: стеклянная стенка, стойки и лавка под козырьком. */
const busStop: Draw = (ctx) => {
  shade(ctx, 2.2, 0.8);
  const frame = skin(ctx, 0x39404d);
  const glass = mix(scale(0x9fd0e8, ctx.ambience.light), ctx.ambience.skyLow, 0.35);
  boxAt(ctx.painter, shift(ctx.at, 0, -0.35), { w: 2.2, d: 0.1, h: 30 }, {
    top: scale(glass, 1.1),
    left: glass,
    right: scale(glass, 0.9),
  });
  boxAt(ctx.painter, shift(ctx.at, -1.05, 0.3), { w: 0.16, d: 0.16, h: 30 }, frame);
  boxAt(ctx.painter, shift(ctx.at, 1.05, 0.3), { w: 0.16, d: 0.16, h: 30 }, frame);
  boxAt(ctx.painter, shift(ctx.at, 0, -0.1, 4), { w: 1.7, d: 0.3, h: 3 }, skin(ctx, 0xb08a52));
  boxAt(ctx.painter, shift(ctx.at, -0.6, -0.1), { w: 0.12, d: 0.25, h: 4 }, frame);
  boxAt(ctx.painter, shift(ctx.at, 0.6, -0.1), { w: 0.12, d: 0.25, h: 4 }, frame);
};

const busStopRoof: Draw = (ctx) => {
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 30), { w: 2.4, d: 0.9, h: 4 }, skin(ctx, 0x39404d));
};

const SHADE = [0xe8705f, 0x5fc9a8, 0xe8c45f];
const PARASOL = [0xe8705f, 0xe8c25f, 0x5fb8a8];

/** Купол зонта: ярусы ромбов со скатом наружу и полотно по кромке. */
function dome(ctx: IsoProp, radius: number, base: number, tone: number): void {
  const layers = 5;
  for (let i = 0; i < layers; i += 1) {
    const k = i / layers;
    const size = radius * 2 * (1 - k * 0.78);
    ramp(
      ctx.painter,
      ctx.at,
      { w: size, d: size, far: base + i * 4 + 4, near: base + i * 4 },
      scale(tone, 0.9 + k * 0.34),
    );
  }
  // Свисающая кромка по двум ближним рёбрам купола.
  panel(ctx.painter, ctx.at, 'x', { span: radius * 2, across: radius, top: base, height: 3 }, scale(tone, 0.8));
  panel(ctx.painter, ctx.at, 'y', { span: radius * 2, across: radius, top: base, height: 3 }, scale(tone, 0.66));
}

const umbrella: Draw = (ctx) => {
  shade(ctx, 0.5, 0.5);
  mast(ctx.painter, ctx.at, 44, scale(0xd8c8a8, ctx.ambience.light));
};

const umbrellaTop: Draw = (ctx) => {
  dome(ctx, 1.1, 44, scale(SHADE[ctx.variant % SHADE.length]!, ctx.ambience.light));
};

/** Зонт со столиком: терраса кафе узнаётся именно по ним. */
const parasol: Draw = (ctx) => {
  shade(ctx, 0.9, 0.7);
  boxAt(ctx.painter, ctx.at, { w: 0.18, d: 0.18, h: 11 }, skin(ctx, 0x8f8a80));
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 11), { w: 0.9, d: 0.7, h: 2 }, skin(ctx, 0xd8d0c4));
  mast(ctx.painter, ctx.at, 46, scale(0x8f7a5a, ctx.ambience.light));
};

const parasolTop: Draw = (ctx) => {
  dome(ctx, 1.15, 46, scale(PARASOL[ctx.variant % PARASOL.length]!, ctx.ambience.light));
};

export const CANOPY_BASE = { stall, kiosk, hut, busStop, umbrella, parasol };
export const CANOPY_TOP = {
  stall: stallRoof,
  kiosk: kioskRoof,
  hut: hutRoof,
  busStop: busStopRoof,
  umbrella: umbrellaTop,
  parasol: parasolTop,
};
