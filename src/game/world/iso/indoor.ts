import { mix, scale } from '../ambience';
import { boxAt } from './shapes';
import { panel, plate } from './planes';
import { patch, shade, shift, skin } from './prop';
import type { Draw } from './prop';

/**
 * Обстановка помещений. Всё, что висит на стене — окно, экран, афиша, —
 * лежит в плоскости этой стены: `ctx.facing` говорит, вдоль какой оси
 * она идёт. Стена у задней кромки комнаты идёт вдоль x, боковая — вдоль
 * y, и полотно, нарисованное поперёк, сразу читается наклейкой.
 */

/** Барный стул: ножка и круглое сиденье. */
const stool: Draw = (ctx) => {
  shade(ctx, 0.45, 0.45);
  const iron = skin(ctx, 0x4a505c);
  boxAt(ctx.painter, ctx.at, { w: 0.16, d: 0.16, h: 13 }, iron);
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 13), { w: 0.5, d: 0.5, h: 3 }, skin(ctx, 0x8f5a4a));
};

/** Стойка: длинный прилавок со столешницей и подсветкой цоколя. */
const counter: Draw = (ctx) => {
  shade(ctx, 2.2, 1);
  boxAt(ctx.painter, ctx.at, { w: 2.1, d: 0.9, h: 18 }, skin(ctx, 0x5a4a6a));
  boxAt(ctx.painter, shift(ctx.at, 0, 0, 18), { w: 2.35, d: 1.05, h: 3 }, skin(ctx, 0xd8c8a8));
  // Подсветка идёт по цоколю лицевой грани, а не поперёк неё.
  panel(ctx.painter, ctx.at, 'x', { span: 2.1, across: 0.45, top: 3, height: 2 }, 0x5fd8ff, 0.55);
  panel(ctx.painter, ctx.at, 'y', { span: 0.9, across: 1.05, top: 3, height: 2 }, 0x5fd8ff, 0.35);
};

/** Колонка: чёрный столб с динамиками на лицевой грани. */
const speaker: Draw = (ctx) => {
  shade(ctx, 0.7, 0.7);
  boxAt(ctx.painter, ctx.at, { w: 0.7, d: 0.7, h: 44 }, skin(ctx, 0x232733));
  for (const [top, height] of [[42, 10], [28, 10], [14, 6]] as const) {
    panel(ctx.painter, ctx.at, 'x', { span: 0.5, across: 0.35, top, height }, 0x14161d);
    panel(ctx.painter, ctx.at, 'x', { span: 0.34, across: 0.35, top: top - 2, height: height - 4 }, 0x3a4050);
  }
};

/** Стойка с гантелями: блины стоят рядом, каждый со своей толщиной. */
const weights: Draw = (ctx) => {
  shade(ctx, 1.6, 0.9);
  const frame = skin(ctx, 0x3f4450);
  boxAt(ctx.painter, ctx.at, { w: 1.5, d: 0.7, h: 6 }, frame);
  boxAt(ctx.painter, shift(ctx.at, 0, -0.2, 6), { w: 1.5, d: 0.25, h: 10 }, frame);
  for (let i = 0; i < 5; i += 1) {
    boxAt(
      ctx.painter,
      shift(ctx.at, -0.55 + i * 0.28, 0.1, 6),
      { w: 0.16, d: 0.42, h: 5 },
      skin(ctx, 0x1e2029, 0.3),
    );
    boxAt(
      ctx.painter,
      shift(ctx.at, -0.55 + i * 0.28, 0.1, 8),
      { w: 0.2, d: 0.16, h: 2 },
      skin(ctx, 0x8f96a8, 0.3),
    );
  }
};

/** Стеллаж: доски полок площадками, товар — коробочками на них. */
const shelf: Draw = (ctx) => {
  const wood = skin(ctx, 0x8a6a44);
  boxAt(ctx.painter, ctx.at, { w: 1, d: 0.3, h: 30 }, wood);
  for (let i = 0; i < 3; i += 1) {
    const lift = 6 + i * 9;
    plate(ctx.painter, ctx.at, { w: 1.1, d: 0.42, lift: lift + 2 }, wood.top);
    panel(ctx.painter, ctx.at, 'x', { span: 1.1, across: 0.21, top: lift + 2, height: 2 }, wood.right);
    for (let k = 0; k < 3; k += 1) {
      boxAt(
        ctx.painter,
        shift(ctx.at, -0.3 + k * 0.3, 0, lift + 2),
        { w: 0.22, d: 0.2, h: 5 },
        skin(ctx, [0xd85f6a, 0x5fb8d8, 0xd8c45f][(i + k) % 3]!, 0.4),
      );
    }
  }
};

const NEON = [0x2fd8a8, 0x7f5fff, 0xff5fb8, 0x5fc9ff];

/** Пуф в клубе: низкий блок со светящейся кромкой по верхним рёбрам. */
const seat: Draw = (ctx) => {
  shade(ctx, 1.4, 1);
  const glow = NEON[ctx.variant % NEON.length]!;
  const body = mix(glow, 0x14121f, 0.55);
  boxAt(ctx.painter, ctx.at, { w: 1.3, d: 0.95, h: 12 }, {
    top: scale(body, 1.35),
    left: scale(body, 0.6),
    right: scale(body, 0.85),
    outline: 0x0b0a12,
  });
  panel(ctx.painter, ctx.at, 'x', { span: 1.3, across: 0.475, top: 12, height: 2 }, glow, 0.85);
  panel(ctx.painter, ctx.at, 'y', { span: 0.95, across: 0.65, top: 12, height: 2 }, glow, 0.6);
  patch(ctx, 2, 1.6, glow, 0.14);
};

/** Светодиодная стена: клетки лежат в плоскости стены, а не в плоскости кадра. */
const screen: Draw = (ctx) => {
  const axis = ctx.facing;
  const span = 2;
  panel(ctx.painter, ctx.at, axis, { span: span + 0.12, across: 0, top: 56, height: 50 }, 0x0d0b16);
  for (let i = 0; i < 48; i += 1) {
    const on = (i * 7 + ctx.variant * 3) % 5 !== 0;
    panel(
      ctx.painter,
      ctx.at,
      axis,
      {
        span: span / 8 - 0.06,
        along: -span / 2 + (span / 8) * ((i % 8) + 0.5),
        across: 0,
        top: 53 - Math.floor(i / 8) * 8,
        height: 6,
      },
      on ? NEON[(i + ctx.variant) % NEON.length]! : 0x1a1730,
      on ? 0.9 : 1,
    );
  }
  panel(ctx.painter, ctx.at, axis, { span: span + 0.16, across: 0, top: 58, height: 2 }, 0x3a3556);
};

/** Окно в стене помещения: рама и стекло лежат в плоскости стены. */
const windowPane: Draw = (ctx) => {
  const axis = ctx.facing;
  const glass = mix(scale(0x9fd0e8, ctx.ambience.light), ctx.ambience.skyLow, 0.25);
  const frame = scale(0x6a5a48, ctx.ambience.light);
  panel(ctx.painter, ctx.at, axis, { span: 1.7, across: 0, top: 52, height: 44 }, frame);
  panel(ctx.painter, ctx.at, axis, { span: 1.5, across: 0, top: 49, height: 38 }, glass);
  panel(ctx.painter, ctx.at, axis, { span: 1.5, across: 0, top: 49, height: 12 }, scale(glass, 1.12));
  // Переплёт: горбылёк вдоль стены и стойка поперёк неё.
  panel(ctx.painter, ctx.at, axis, { span: 1.5, across: 0, top: 31, height: 2 }, frame);
  panel(ctx.painter, ctx.at, axis, { span: 0.07, across: 0, top: 49, height: 38 }, frame);
  // Отсвет на полу: без него окно приклеено к стене.
  patch(ctx, 2.4, 1.6, glass, 0.16, 0);
};

const POSTER = [0xd8455f, 0x4f7fd8, 0xd8a83f, 0x6a4fd8];

/** Афиша: лист на стене, в её же плоскости. */
const poster: Draw = (ctx) => {
  const axis = ctx.facing;
  const art = scale(POSTER[ctx.variant % POSTER.length]!, ctx.ambience.light);
  panel(ctx.painter, ctx.at, axis, { span: 1.15, across: 0, top: 44, height: 28 }, scale(0x2a2430, ctx.ambience.light));
  panel(ctx.painter, ctx.at, axis, { span: 1, across: 0, top: 43, height: 26 }, art);
  panel(ctx.painter, ctx.at, axis, { span: 0.8, across: 0, top: 40, height: 10 }, 0x000000, 0.28);
  panel(ctx.painter, ctx.at, axis, { span: 0.8, across: 0, top: 28, height: 2 }, 0xffffff, 0.45);
  panel(ctx.painter, ctx.at, axis, { span: 0.5, across: 0, top: 24, height: 2 }, 0xffffff, 0.3);
};

export const INDOOR_PROPS = {
  stool,
  counter,
  speaker,
  weights,
  shelf,
  seat,
  screen,
  poster,
  window: windowPane,
};
