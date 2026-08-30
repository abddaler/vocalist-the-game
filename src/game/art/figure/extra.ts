import { BUILD, isTurned } from './pose';
import type { Joints, Point } from './pose';
import { blob, shape, stroke, tone } from './draw';
import type { Brush } from './draw';
import type { Figure } from './paint';

/**
 * Приметы поверх всего: очки на лицо, наушники на голову, шарф на шею,
 * сумка через плечо. По ним названных персонажей узнают с другого конца
 * улицы, поэтому они крупные и одного цвета — акцентного.
 */
const at = (x: number, y: number): Point => ({ x, y });
const lift = (point: Point, by: number): Point => ({ x: point.x, y: point.y - by });

type Paint = (brush: Brush, figure: Figure, joints: Joints, up: number) => void;

export const EXTRA: Readonly<Record<string, Paint>> = {
  none: () => undefined,

  headphones: (brush, figure, joints, up) => {
    const head = lift(joints.head, up);
    const color = tone(figure.colors.accent, 1);
    // Дужка лежит на темени, чашки — на ушах. Раньше она висела над
    // головой, а чашки закрывали глаза.
    stroke(
      brush,
      at(head.x - BUILD.headRx + 0.4, head.y - 1),
      at(head.x, head.y - BUILD.headRy - 0.8),
      at(head.x + BUILD.headRx - 0.4, head.y - 1),
      1.5,
      color,
    );
    const cups = [-BUILD.headRx + 0.2, BUILD.headRx - 0.2];
    for (const dx of cups) blob(brush, at(head.x + dx, head.y + 1.4), 1.7, 2.1, color);
  },

  glasses: (brush, figure, joints, up) => lenses(brush, figure, joints, up, '#cfe6f5', 0.55),
  shades: (brush, figure, joints, up) => lenses(brush, figure, joints, up, '#221c2c', 1),

  earrings: (brush, figure, joints, up) => {
    const head = lift(joints.head, up);
    const color = tone(figure.colors.accent, 1);
    const spots = [-BUILD.headRx + 0.5, BUILD.headRx - 0.5];
    for (const dx of spots) blob(brush, at(head.x + dx, head.y + 3.6), 1.1, 1.3, color);
  },

  scarf: (brush, figure, joints, up) => {
    const y = joints.neck.y + 1;
    const color = tone(figure.colors.accent, 1);
    stroke(brush, lift(at(15, y), up), lift(at(18, y + 1.8), up), lift(at(21, y), up), 3.2, color);
    shape(
      brush,
      [
        lift(at(17.2, y + 1.6), up),
        lift(at(19.8, y + 1.6), up),
        lift(at(19.4, y + 9), up),
        lift(at(16.8, y + 9), up),
      ],
      tone(figure.colors.accent, 0.78),
    );
  },

  necklace: (brush, figure, joints, up) => {
    const y = joints.shoulder[0]!.y + 2;
    stroke(
      brush,
      lift(at(15.2, y), up),
      lift(at(18, y + 3.8), up),
      lift(at(20.8, y), up),
      1,
      tone(figure.colors.accent, 1.1),
    );
  },

  /**
   * Очки на цепочке. Не на глазах, а на груди: педагог снимает их, когда
   * слушает, и это её примета вернее любой другой.
   */
  spectacles: (brush, figure, joints, up) => {
    const y = joints.shoulder[0]!.y + 3;
    const frame = tone(figure.colors.trim, 1);
    // Цепочка идёт от висков вниз и сходится на груди.
    for (const dir of [-1, 1]) {
      stroke(
        brush,
        lift(at(joints.head.x + dir * (BUILD.headRx - 0.5), joints.head.y + 3), up),
        lift(at(18 + dir * 5.4, y - 1), up),
        lift(at(18 + dir * 2, y + 1.6), up),
        0.7,
        tone(figure.colors.accent, 0.9),
      );
      blob(brush, lift(at(18 + dir * 2.6, y + 3), up), 1.5, 1.3, '#dceef8');
    }
    // Перемычка между стёклами: без неё две линзы сливаются в тёмную
    // полосу и читаются кошельком, а не очками.
    stroke(
      brush,
      lift(at(16.4, y + 3), up),
      lift(at(18, y + 3.4), up),
      lift(at(19.6, y + 3), up),
      0.7,
      frame,
    );
  },

  /**
   * Наушники на шее. Звукорежиссёр не снимает их и на улице — по ним его
   * узнают раньше, чем по лицу.
   */
  collar: (brush, figure, joints, up) => {
    const y = joints.neck.y + 2.5;
    const color = tone(figure.colors.accent, 1);
    stroke(brush, lift(at(14.6, y), up), lift(at(18, y + 2.2), up), lift(at(21.4, y), up), 1.6, color);
    for (const dx of [-4.4, 4.4]) {
      blob(brush, lift(at(18 + dx, y + 1.4), up), 1.8, 2.2, color, figure.colors.accent);
    }
  },

  /** Телефон в ближней руке: у блогера он там всегда. */
  phone: (brush, figure, joints, up) => {
    const hand = lift(joints.hand[joints.near]!, up);
    shape(
      brush,
      [
        at(hand.x - 1.6, hand.y - 2.6),
        at(hand.x + 1.6, hand.y - 2.6),
        at(hand.x + 1.6, hand.y + 2.6),
        at(hand.x - 1.6, hand.y + 2.6),
      ],
      '#26242e',
      '#26242e',
    );
    shape(
      brush,
      [
        at(hand.x - 1, hand.y - 2),
        at(hand.x + 1, hand.y - 2),
        at(hand.x + 1, hand.y + 1.6),
        at(hand.x - 1, hand.y + 1.6),
      ],
      tone(figure.colors.accent, 1.1),
    );
  },

  bag: (brush, figure, joints, up) => {
    const color = tone(figure.colors.accent, 1);
    stroke(
      brush,
      lift(at(14, joints.shoulder[0]!.y - 1), up),
      lift(at(18, joints.hip.y - 8), up),
      lift(at(23.4, joints.hip.y - 3), up),
      1.6,
      color,
    );
    shape(
      brush,
      [
        lift(at(22, joints.hip.y - 4), up),
        lift(at(26.6, joints.hip.y - 3.2), up),
        lift(at(26.6, joints.hip.y + 2.6), up),
        lift(at(22, joints.hip.y + 2), up),
      ],
      tone(figure.colors.accent, 0.8),
    );
  },
};

/** Очки: оправа по глазам и дужка к уху. */
function lenses(
  brush: Brush,
  figure: Figure,
  joints: Joints,
  up: number,
  glass: string,
  alpha: number,
): void {
  const head = lift(joints.head, up);
  const frame = tone(figure.colors.accent, 0.65);
  // Очки едут вместе с глазами: на повороте оправа уходит в его сторону.
  const turn = isTurned(joints.view) ? 0.8 : 0;
  const spots = [-2.9 + turn * 0.5, 2.9 + turn];
  brush.ctx.globalAlpha = alpha;
  for (const dx of spots) {
    blob(brush, at(head.x + dx, head.y + 0.2), 2.5, 2.2, glass);
  }
  brush.ctx.globalAlpha = 1;
  stroke(
    brush,
    at(head.x - BUILD.headRx, head.y - 0.4),
    at(head.x + turn, head.y - 0.2),
    at(head.x + BUILD.headRx, head.y - 0.4),
    0.9,
    frame,
  );
}
