import type { Colors } from '../palettes';
import { BUILD } from './pose';
import type { Joints, Point } from './pose';
import { blob, limb, lit, shape, stroke, tone, trunk } from './draw';
import type { Brush } from './draw';

/**
 * Сборка фигуры: тело, одежда, причёска, лицо. Порядок тот же, что был
 * у слоёв из строк, — сначала то, что дальше от зрителя.
 */
export interface Figure {
  readonly colors: Colors;
  readonly hair: string;
  readonly outfit: string;
  readonly accessory: string;
}

const at = (x: number, y: number): Point => ({ x, y });
const lift = (point: Point, by: number): Point => ({ x: point.x, y: point.y - by });

/** Какая рука и нога дальше от зрителя: их пишут первыми и глуше. */
const FAR = 0;
const NEAR = 1;

/**
 * Ширины в профиль. Сбоку человек узок: тот же корпус, что и анфас,
 * превращает его в доску, повёрнутую к зрителю ребром только ногами.
 */
const SIDE_BUILD = { shoulders: 9.6, waist: 8.8, headRx: 5.5 } as const;

const girth = (view: string): { shoulders: number; waist: number; headRx: number } =>
  view === 'side'
    ? SIDE_BUILD
    : { shoulders: BUILD.shoulders, waist: BUILD.waist, headRx: BUILD.headRx };

export function paintFigure(brush: Brush, figure: Figure, joints: Joints): void {
  const { colors } = figure;
  const up = joints.lift;
  const sleeve = SLEEVES[figure.outfit] ?? 'short';
  const skirt = SKIRTS.has(figure.outfit);

  const skin = lit(brush, colors.skin, 8, 28);
  const dim = tone(colors.skin, 0.8);
  const cloth = lit(brush, colors.cloth, 8, 28);
  const trousers = lit(brush, colors.legs, 10, 26);
  const shoes = tone(colors.shoes, 1);

  // Дальняя нога и рука — приглушённые: так читается, что они за корпусом.
  leg(brush, joints, FAR, up, skirt ? tone(colors.skin, 0.72) : tone(colors.legs, 0.74), tone(colors.shoes, 0.75));
  if (sleeve !== 'long') arm(brush, joints, FAR, up, tone(colors.skin, 0.74), sleeve, tone(colors.cloth, 0.74));
  else arm(brush, joints, FAR, up, tone(colors.cloth, 0.74), sleeve, tone(colors.cloth, 0.74));

  leg(brush, joints, NEAR, up, skirt ? skin : trousers, shoes);

  // Корпус: сперва кожа, потом одежда поверх — так вырез и лямки
  // остаются кожей, а не дырой.
  const size = girth(joints.view);
  trunk(brush, lift(at(18, joints.shoulder[0]!.y), up), lift(joints.hip, up), size.shoulders, size.waist, skin);
  dressTrunk(brush, figure, joints, up, cloth);
  if (skirt) dressSkirt(brush, figure, joints, up);

  arm(brush, joints, NEAR, up, sleeve === 'long' ? cloth : skin, sleeve, cloth);

  // Шея и голова.
  limb(brush, lift(joints.neck, up), lift(at(joints.head.x, joints.head.y + 5), up), BUILD.neck, BUILD.neck, dim);
  hairBehind(brush, figure, joints, up);
  blob(brush, lift(joints.head, up), size.headRx, BUILD.headRy, skin);
  if (joints.view !== 'back') face(brush, figure, joints, up);
  hairOver(brush, figure, joints, up);
}

/** Рукав по типу одежды: голое плечо, до локтя или до кисти. */
const SLEEVES: Readonly<Record<string, 'bare' | 'short' | 'long'>> = {
  tank: 'bare',
  crop: 'bare',
  dress: 'bare',
  tee: 'short',
  hoodie: 'long',
  track: 'long',
  jacket: 'long',
  suit: 'long',
  coat: 'long',
};

const SKIRTS = new Set(['crop', 'dress']);

function arm(
  brush: Brush,
  joints: Joints,
  which: number,
  up: number,
  fill: string | CanvasGradient,
  sleeve: 'bare' | 'short' | 'long',
  cloth: string | CanvasGradient,
): void {
  const from = lift(joints.shoulder[which]!, up);
  const to = lift(joints.hand[which]!, up);
  limb(brush, from, to, BUILD.arm, BUILD.wrist, fill);
  if (sleeve === 'short') {
    // Рукав начинается ровно в суставе и той же ширины, что скруглённое
    // плечо: смещённая капсула вылезала из плеча отдельным серпом.
    const elbow = at(from.x + (to.x - from.x) * 0.4, from.y + (to.y - from.y) * 0.4);
    limb(brush, from, elbow, BUILD.arm + 1.6, BUILD.arm - 0.4, cloth);
  }
  blob(brush, to, BUILD.wrist * 0.62, BUILD.wrist * 0.62, fill);
}

function leg(
  brush: Brush,
  joints: Joints,
  which: number,
  up: number,
  fill: string | CanvasGradient,
  shoe: string,
): void {
  const hip = lift(at(joints.hip.x + (which === 0 ? -2.9 : 2.9), joints.hip.y - 1), up);
  const knee = lift(joints.knee[which]!, up);
  const foot = lift(joints.foot[which]!, up);
  limb(brush, hip, knee, BUILD.thigh, BUILD.ankle + 0.6, fill);
  limb(brush, knee, foot, BUILD.ankle + 0.6, BUILD.ankle, fill);
  // Стопа овалом, вытянутым вперёд: у ботинка есть носок.
  const toe = joints.view === 'side' ? 1.5 : 0.35;
  blob(brush, at(foot.x + toe, foot.y + 1), BUILD.foot / 2, 1.9, shoe);
}

function dressTrunk(
  brush: Brush,
  figure: Figure,
  joints: Joints,
  up: number,
  cloth: string | CanvasGradient,
): void {
  const shoulderY = joints.shoulder[0]!.y;
  const size = girth(joints.view);
  const bare = SLEEVES[figure.outfit] === 'bare';
  const top = bare ? shoulderY + 2.5 : shoulderY - 2.2;
  const wide = bare ? size.shoulders - 3 : size.shoulders;
  trunk(brush, lift(at(18, top), up), lift(at(joints.hip.x, joints.hip.y + 1.5), up), wide, size.waist - 0.5, cloth);
  if (!bare) {
    // Дельта плеча — часть корпуса, а не рукав: без неё стык плеча и
    // руки читается прямым углом.
    for (const joint of joints.shoulder) {
      blob(brush, lift(at(joint.x, joint.y + 0.4), up), BUILD.arm / 2 + 0.8, BUILD.arm / 2 + 1.2, cloth);
    }
  }

  if (bare && joints.view !== 'side') {
    // Лямки: без них топ висит на груди сам по себе.
    const strap = tone(figure.colors.cloth, 1.05);
    stroke(brush, lift(at(14.4, shoulderY - 1), up), lift(at(14.8, shoulderY + 1), up), lift(at(15.2, top + 1), up), 1.5, strap);
    stroke(brush, lift(at(21.6, shoulderY - 1), up), lift(at(21.2, shoulderY + 1), up), lift(at(20.8, top + 1), up), 1.5, strap);
  }
  DETAIL[figure.outfit]?.(brush, figure, joints, up);
}

function dressSkirt(brush: Brush, figure: Figure, joints: Joints, up: number): void {
  const y = joints.hip.y + 1;
  const fill = lit(brush, figure.colors.legs, 10, 26);
  shape(
    brush,
    [
      lift(at(18 - BUILD.waist / 2, y), up),
      lift(at(18 + BUILD.waist / 2, y), up),
      lift(at(18 + BUILD.waist / 2 + 4, y + 8), up),
      lift(at(18 - BUILD.waist / 2 - 4, y + 8), up),
    ],
    fill,
  );
}

/** Приметы одежды: лацканы, галстук, лампасы, карман, пояс. */
const DETAIL: Readonly<
  Record<string, (brush: Brush, figure: Figure, joints: Joints, up: number) => void>
> = {
  suit: (brush, figure, joints, up) => {
    const y = joints.shoulder[0]!.y;
    shape(brush, [lift(at(15.4, y), up), lift(at(20.6, y), up), lift(at(18, y + 8), up)], tone(figure.colors.trim, 1));
    stroke(brush, lift(at(18, y + 3), up), lift(at(18, y + 7), up), lift(at(18, y + 11), up), 1.9, tone(figure.colors.accent, 1));
  },
  jacket: (brush, figure, joints, up) => {
    const y = joints.shoulder[0]!.y;
    shape(brush, [lift(at(15.4, y), up), lift(at(20.6, y), up), lift(at(18, y + 7), up)], tone(figure.colors.trim, 1));
  },
  hoodie: (brush, figure, joints, up) => {
    const y = joints.shoulder[0]!.y;
    const half = girth(joints.view).waist / 2 - 1.4;
    stroke(brush, lift(at(18 - half, y + 1), up), lift(at(18, y + 3.4), up), lift(at(18 + half, y + 1), up), 2.2, tone(figure.colors.trim, 1));
    stroke(brush, lift(at(18 - half, joints.hip.y - 6), up), lift(at(18, joints.hip.y - 4), up), lift(at(18 + half, joints.hip.y - 6), up), 2.4, tone(figure.colors.cloth, 0.86));
  },
  track: (brush, figure, joints, up) => {
    const accent = tone(figure.colors.accent, 1);
    for (const which of [0, 1]) {
      const from = lift(joints.shoulder[which]!, up);
      const to = lift(joints.hand[which]!, up);
      stroke(brush, from, at((from.x + to.x) / 2, (from.y + to.y) / 2), to, 1.1, accent);
    }
  },
  coat: (brush, figure, joints, up) => {
    // Пояс по талии: раньше он был шире корпуса и торчал в стороны.
    const half = girth(joints.view).waist / 2 - 0.6;
    stroke(
      brush,
      lift(at(18 - half, joints.hip.y - 5), up),
      lift(at(18, joints.hip.y - 4), up),
      lift(at(18 + half, joints.hip.y - 5), up),
      1.8,
      tone(figure.colors.accent, 0.8),
    );
  },
};

/** Лицо: брови, глаза, нос, рот. В профиль видно половину. */
function face(brush: Brush, figure: Figure, joints: Joints, up: number): void {
  const head = lift(joints.head, up);
  const side = joints.view === 'side';
  void BUILD;
  const brow = tone(figure.colors.hair, 0.62);
  const eyes: Array<[number, number]> = side ? [[2.2, 0.9]] : [[-2.2, 0.9], [2.2, 0.9]];

  for (const [dx, dy] of eyes) {
    // В профиль белка не видно: сбоку глаз читается тёмной миндалиной,
    // а белое пятно на скуле превращает лицо в маску.
    if (!side) blob(brush, at(head.x + dx, head.y + dy), 1, 1.15, '#f4f1f7');
    blob(brush, at(head.x + dx + (side ? 0.2 : 0), head.y + dy + 0.1), side ? 0.85 : 0.62, 0.8, '#2a2430');
    stroke(
      brush,
      at(head.x + dx - 1.5, head.y + dy - 2),
      at(head.x + dx, head.y + dy - 2.5),
      at(head.x + dx + 1.5, head.y + dy - 2.1),
      0.7,
      brow,
    );
  }

  const nose = tone(figure.colors.skin, 0.8);
  stroke(
    brush,
    at(head.x + (side ? 3.6 : 0.2), head.y + 2.4),
    at(head.x + (side ? 4.4 : 0.6), head.y + 3.2),
    at(head.x + (side ? 3.4 : 0.2), head.y + 3.8),
    0.8,
    nose,
  );
  stroke(
    brush,
    at(head.x + (side ? 1.4 : -1.5), head.y + 5.2),
    at(head.x + (side ? 2.8 : 0), head.y + 5.9),
    at(head.x + (side ? 3.8 : 1.5), head.y + 5.2),
    0.85,
    tone(figure.colors.skin, 0.55),
  );
}

/** Масса волос за головой: она должна лежать под лицом, а не на нём. */
function hairBehind(brush: Brush, figure: Figure, joints: Joints, up: number): void {
  const style = figure.hair;
  const drop = style === 'long' ? 17 : style === 'bob' ? 7 : 0;
  if (drop === 0) return;
  const head = lift(joints.head, up);
  const rx = girth(joints.view).headRx;
  const fill = lit(brush, figure.colors.hair, head.x - 9, head.x + 9);
  // Масса идёт по черепу и чуть расходится книзу. Прямоугольник шире
  // плеч превращал затылок в шлем.
  shape(
    brush,
    [
      at(head.x - rx + 0.6, head.y - 5),
      at(head.x + rx - 0.6, head.y - 5),
      at(head.x + rx + 0.6, head.y + drop * 0.55),
      at(head.x + rx - 0.4, head.y + drop),
      at(head.x - rx + 0.4, head.y + drop),
      at(head.x - rx - 0.6, head.y + drop * 0.55),
    ],
    joints.view === 'side' ? tone(figure.colors.hair, 0.88) : fill,
  );
}

/** Шапка волос поверх головы: чёлка, кудри, хвост, кепка. */
function hairOver(brush: Brush, figure: Figure, joints: Joints, up: number): void {
  const style = figure.hair;
  if (style === 'bald') return;

  const head = lift(joints.head, up);
  const colors = figure.colors;
  const fill = lit(brush, colors.hair, head.x - 9, head.x + 9);
  const back = joints.view === 'back';
  const side = joints.view === 'side';
  const rx = girth(joints.view).headRx;

  // Шапка обрезается по черепу: волосы лежат на голове, а не поверх неё.
  const { ctx, scale } = brush;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(head.x * scale, head.y * scale, (rx + 0.5) * scale, (BUILD.headRy + 0.5) * scale, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = fill;
  const drop = back ? BUILD.headRy : style === 'cap' ? -3 : -1.8;
  ctx.fillRect(0, 0, ctx.canvas.width, (head.y + drop) * scale);
  // Прядь у виска: без неё чёлка обрывается ровной линией.
  if (!back) {
    const edge = side ? [-1] : [-1, 1];
    for (const dir of edge) {
      ctx.fillRect(
        (head.x + dir * (rx - 1.9)) * scale,
        0,
        dir * 2.6 * scale,
        (head.y + 3) * scale,
      );
    }
  }
  ctx.restore();

  if (style === 'curly') {
    for (const dx of [-5.4, -1.9, 1.9, 5.4]) {
      blob(brush, at(head.x + dx, head.y - 5.2 + Math.abs(dx) * 0.34), 2.9, 2.6, fill);
    }
  }
  if (style === 'ponytail') {
    const x = head.x - (side ? 7.2 : 6.4);
    shape(brush, [at(x, head.y - 3), at(x + 2.4, head.y - 2), at(x + 1.6, head.y + 8.5), at(x - 2.3, head.y + 7.5)], fill);
  }
  if (style === 'cap') {
    blob(brush, at(head.x, head.y - 2.2), rx + 0.8, 2.8, tone(colors.accent, 0.92));
    blob(brush, at(head.x + (side ? 4.4 : 0), head.y - 0.5), side ? 3.6 : rx - 0.6, 1.3, tone(colors.accent, 0.7));
  }
}
