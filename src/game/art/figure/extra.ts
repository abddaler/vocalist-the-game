import { BUILD } from './pose';
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
    const cups = joints.view === 'side' ? [1.4] : [-BUILD.headRx + 0.2, BUILD.headRx - 0.2];
    for (const dx of cups) blob(brush, at(head.x + dx, head.y + 1.4), 1.7, 2.1, color);
  },

  glasses: (brush, figure, joints, up) => lenses(brush, figure, joints, up, '#cfe6f5', 0.55),
  shades: (brush, figure, joints, up) => lenses(brush, figure, joints, up, '#221c2c', 1),

  earrings: (brush, figure, joints, up) => {
    const head = lift(joints.head, up);
    const color = tone(figure.colors.accent, 1);
    const spots = joints.view === 'side' ? [-3.2] : [-BUILD.headRx + 0.5, BUILD.headRx - 0.5];
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
  const spots = joints.view === 'side' ? [2.6] : [-2.9, 2.9];
  brush.ctx.globalAlpha = alpha;
  for (const dx of spots) {
    blob(brush, at(head.x + dx, head.y + 0.2), 2.5, 2.2, glass);
  }
  brush.ctx.globalAlpha = 1;
  stroke(
    brush,
    at(head.x - BUILD.headRx, head.y - 0.4),
    at(head.x, head.y + (joints.view === 'side' ? 0.6 : -0.2)),
    at(head.x + BUILD.headRx, head.y - 0.4),
    0.9,
    frame,
  );
}
