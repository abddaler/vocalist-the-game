import type { Colors } from '../palettes';
import { BUILD, facesCamera, isTurned } from './pose';
import type { Joints, Point, Side } from './pose';
import { bands, blob, limb, shade, shape, stroke, tone, trunk } from './draw';
import type { Brush, Paint } from './draw';

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

/**
 * Какая рука и нога дальше от зрителя: их пишут первыми и глуше. В три
 * четверти ближе та половина, в которую повёрнут корпус, и у взгляда от
 * камеры это другая сторона, чем у взгляда к ней.
 */
const sides = (joints: Joints): { far: 0 | 1; near: 0 | 1 } =>
  joints.near === 1 ? { far: 0, near: 1 } : { far: 1, near: 0 };

/**
 * Ширины в три четверти. Повёрнутый корпус уже развёрнутого: тот же
 * анфас превращает поворот в человека, у которого повёрнуты только ноги.
 */
const TURNED = { shoulders: 12.2, waist: 10.4, headRx: 6.2 } as const;

/**
 * На сколько глаза уезжают в сторону поворота. Повернуть голову набором
 * точек нельзя — поворот читается тем, что дальний глаз ушёл к краю
 * черепа, а ближний остался на месте.
 */
const TURN_EYES = 1.1;

const girth = (view: Side): { shoulders: number; waist: number; headRx: number } =>
  isTurned(view)
    ? TURNED
    : { shoulders: BUILD.shoulders, waist: BUILD.waist, headRx: BUILD.headRx };

export function paintFigure(brush: Brush, figure: Figure, joints: Joints): void {
  const { colors } = figure;
  const up = joints.lift;
  const sleeve = SLEEVES[figure.outfit] ?? 'short';
  const skirt = SKIRTS.has(figure.outfit);

  const { far: FAR, near: NEAR } = sides(joints);
  const skin = shade(colors.skin);
  const dim = tone(colors.skin, 0.8);
  const cloth = shade(colors.cloth);
  const trousers = shade(colors.legs);
  const shoes = tone(colors.shoes, 1);

  // Дальняя нога и рука — приглушённые: так читается, что они за корпусом.
  const far = { leg: skirt ? colors.skin : colors.legs, shoe: colors.shoes };
  const near = { skin: colors.skin, cloth: colors.cloth };
  leg(brush, joints, FAR, up, skirt ? tone(colors.skin, 0.72) : tone(colors.legs, 0.74), tone(colors.shoes, 0.75), far);
  if (sleeve !== 'long') arm(brush, joints, FAR, up, tone(colors.skin, 0.74), sleeve, tone(colors.cloth, 0.74), near);
  else arm(brush, joints, FAR, up, tone(colors.cloth, 0.74), sleeve, tone(colors.cloth, 0.74), near);

  leg(brush, joints, NEAR, up, skirt ? skin : trousers, shoes, far);

  // Корпус: сперва кожа, потом одежда поверх — так вырез и лямки
  // остаются кожей, а не дырой.
  const size = girth(joints.view);
  trunk(brush, lift(at(18, joints.shoulder[0]!.y), up), lift(joints.hip, up), size.shoulders, size.waist, skin, colors.skin);
  dressTrunk(brush, figure, joints, up, cloth);
  if (skirt) dressSkirt(brush, figure, joints, up);

  arm(brush, joints, NEAR, up, sleeve === 'long' ? cloth : skin, sleeve, cloth, near);
  if (joints.mic) microphone(brush, lift(joints.hand[NEAR]!, up));

  // Шея и голова.
  limb(brush, lift(joints.neck, up), lift(at(joints.head.x, joints.head.y + 5), up), BUILD.neck, BUILD.neck, dim);
  hairBehind(brush, figure, joints, up);
  blob(brush, lift(joints.head, up), size.headRx, BUILD.headRy, skin, colors.skin);
  if (facesCamera(joints.view)) face(brush, figure, joints, up);
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
  fill: Paint,
  sleeve: 'bare' | 'short' | 'long',
  cloth: Paint,
  outline: { skin: string; cloth: string },
): void {
  const from = lift(joints.shoulder[which]!, up);
  const to = lift(joints.hand[which]!, up);
  const bend = joints.elbow?.[which];
  // Локоть — середина: без него плечо и кисть соединяет прямая, и
  // поднятая рука прячется в корпусе.
  const mid = bend ? lift(bend, up) : at(from.x + (to.x - from.x) * 0.5, from.y + (to.y - from.y) * 0.5);
  const forearm = BUILD.arm - (BUILD.arm - BUILD.wrist) * 0.45;

  const bare = sleeve === 'long' ? outline.cloth : outline.skin;
  limb(brush, from, mid, BUILD.arm, forearm, fill, bare);
  limb(brush, mid, to, forearm, BUILD.wrist, fill, bare);
  // Шар в локте: две капсулы встык дают на сгибе видимый угол.
  blob(brush, mid, forearm / 2, forearm / 2, fill);

  if (sleeve === 'short') {
    // Рукав начинается ровно в суставе и той же ширины, что скруглённое
    // плечо: смещённая капсула вылезала из плеча отдельным серпом.
    const cuff = at(from.x + (mid.x - from.x) * 0.8, from.y + (mid.y - from.y) * 0.8);
    limb(brush, from, cuff, BUILD.arm + 1.6, BUILD.arm - 0.4, cloth, outline.cloth);
  }
  blob(brush, to, BUILD.wrist * 0.62, BUILD.wrist * 0.62, fill);
}

function leg(
  brush: Brush,
  joints: Joints,
  which: number,
  up: number,
  fill: Paint,
  shoe: string,
  outline: { leg: string; shoe: string },
): void {
  const hip = lift(at(joints.hip.x + (which === 0 ? -2.9 : 2.9), joints.hip.y - 1), up);
  const knee = lift(joints.knee[which]!, up);
  const foot = lift(joints.foot[which]!, up);
  limb(brush, hip, knee, BUILD.thigh, BUILD.ankle + 0.6, fill, outline.leg);
  limb(brush, knee, foot, BUILD.ankle + 0.6, BUILD.ankle, fill, outline.leg);
  // Стопа овалом, вытянутым вперёд: у ботинка есть носок.
  const toe = isTurned(joints.view) ? 1 : 0.35;
  blob(brush, at(foot.x + toe, foot.y + 1), BUILD.foot / 2, 1.9, shoe, outline.shoe);
}

function dressTrunk(
  brush: Brush,
  figure: Figure,
  joints: Joints,
  up: number,
  cloth: Paint,
): void {
  const shoulderY = joints.shoulder[0]!.y;
  const size = girth(joints.view);
  const bare = SLEEVES[figure.outfit] === 'bare';
  const top = bare ? shoulderY + 2.5 : shoulderY - 2.9;
  const wide = bare ? size.shoulders - 3 : size.shoulders;
  trunk(brush, lift(at(18, top), up), lift(at(joints.hip.x, joints.hip.y + 1.5), up), wide, size.waist - 0.5, cloth, figure.colors.cloth);
  if (!bare) {
    // Дельта плеча — часть корпуса, а не рукав: без неё стык плеча и
    // руки читается прямым углом.
    for (const joint of joints.shoulder) {
      blob(brush, lift(at(joint.x, joint.y + 0.4), up), BUILD.arm / 2 + 0.8, BUILD.arm / 2 + 1.2, cloth);
    }
  }

  if (bare) {
    // Лямки: без них топ висит на груди сам по себе.
    const strap = tone(figure.colors.cloth, 1.05);
    stroke(brush, lift(at(14.4, shoulderY - 1), up), lift(at(14.8, shoulderY + 1), up), lift(at(15.2, top + 1), up), 1.5, strap);
    stroke(brush, lift(at(21.6, shoulderY - 1), up), lift(at(21.2, shoulderY + 1), up), lift(at(20.8, top + 1), up), 1.5, strap);
  }
  DETAIL[figure.outfit]?.(brush, figure, joints, up);
}

function dressSkirt(brush: Brush, figure: Figure, joints: Joints, up: number): void {
  const y = joints.hip.y + 1;
  const fill = shade(figure.colors.legs);
  shape(
    brush,
    [
      lift(at(18 - BUILD.waist / 2, y), up),
      lift(at(18 + BUILD.waist / 2, y), up),
      lift(at(18 + BUILD.waist / 2 + 4, y + 8), up),
      lift(at(18 - BUILD.waist / 2 - 4, y + 8), up),
    ],
    fill,
    figure.colors.legs,
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

/**
 * Лицо. В три четверти глаза сдвинуты в сторону поворота, а дальний —
 * ближе к краю черепа и уже: этим и читается поворот головы, потому что
 * повернуть саму голову набором точек нельзя.
 */
function face(brush: Brush, figure: Figure, joints: Joints, up: number): void {
  const head = lift(joints.head, up);
  const turn = isTurned(joints.view) ? TURN_EYES : 0;
  const brow = tone(figure.colors.hair, 0.62);
  const eyes: Array<[number, number]> = [
    [-2.1 + turn * 0.5, 0.9],
    [2.1 + turn, 0.9],
  ];

  if (joints.shut) {
    // Спящему рисуется дуга вместо глаза: закрытый глаз — это веко,
    // а не отсутствие глаза, и пустое лицо читается сломанным.
    for (const dx of eyes.map(([dx]) => dx)) {
      stroke(
        brush,
        at(head.x + dx - 1.2, head.y + 0.6),
        at(head.x + dx, head.y + 1.4),
        at(head.x + dx + 1.2, head.y + 0.6),
        0.7,
        tone(figure.colors.skin, 0.5),
      );
    }
  }

  eyes.forEach(([dx, dy], index) => {
    if (joints.shut) return;
    // Дальний глаз уже ближнего: на повороте он уходит за скулу.
    const narrow = turn > 0 && index === 1 ? 0.78 : 1;
    blob(brush, at(head.x + dx, head.y + dy), 1 * narrow, 1.15, '#f4f1f7');
    blob(brush, at(head.x + dx, head.y + dy + 0.1), 0.62 * narrow, 0.8, '#2a2430');
    stroke(
      brush,
      at(head.x + dx - 1.5, head.y + dy - 2),
      at(head.x + dx, head.y + dy - 2.5),
      at(head.x + dx + 1.5, head.y + dy - 2.1),
      0.7,
      brow,
    );
  });

  // Носа нет, рот — короткий штрих. На тридцати шести пикселях нос и
  // полный рот сливаются в пятно под глазами, которое читается бородой;
  // узнают персонажа всё равно по причёске, а не по чертам.
  const mouth = turn * 0.8;
  stroke(
    brush,
    at(head.x - 1.2 + mouth, head.y + 5),
    at(head.x + mouth, head.y + 5.3),
    at(head.x + 1.2 + mouth, head.y + 5),
    0.7,
    tone(figure.colors.skin, 0.62),
  );
}

/** Масса волос за головой: она должна лежать под лицом, а не на нём. */
function hairBehind(brush: Brush, figure: Figure, joints: Joints, up: number): void {
  const style = figure.hair;
  const drop = style === 'long' ? 17 : style === 'bob' ? 7 : 0;
  if (drop === 0) return;
  const head = lift(joints.head, up);
  const rx = girth(joints.view).headRx;
  const fill = shade(figure.colors.hair);
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
    fill,
    figure.colors.hair,
  );
}

/** Шапка волос поверх головы: чёлка, кудри, хвост, кепка. */
function hairOver(brush: Brush, figure: Figure, joints: Joints, up: number): void {
  const style = figure.hair;
  if (style === 'bald') return;

  const head = lift(joints.head, up);
  const colors = figure.colors;
  const back = !facesCamera(joints.view);
  const turned = isTurned(joints.view);
  const rx = girth(joints.view).headRx;
  // Шапка волос кладётся прямоугольником с обрезкой по черепу, поэтому
  // тона ей нужны готовыми — по ширине самой головы.
  const fill = bands(brush, colors.hair, head.x - rx, head.x + rx);

  // Шапка обрезается по черепу: волосы лежат на голове, а не поверх неё.
  const { ctx, scale } = brush;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(head.x * scale, head.y * scale, (rx + 0.5) * scale, (BUILD.headRy + 0.5) * scale, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = fill;
  const drop = back ? BUILD.headRy : style === 'cap' ? -3 : -1.8;
  // Прямоугольник задаётся в координатах кадра, а не холста: портрет
  // рисует ту же фигуру со сдвигом и увеличением, и заливка «от нуля до
  // ширины холста» промахнулась бы мимо головы.
  ctx.fillRect((head.x - 30) * scale, (head.y - 30) * scale, 60 * scale, (30 + drop) * scale);
  // Прядь у виска: без неё чёлка обрывается ровной линией.
  if (!back) {
    const edge = turned ? [-1] : [-1, 1];
    for (const dir of edge) {
      ctx.fillRect(
        (head.x + dir * (rx - 1.9)) * scale,
        (head.y - 30) * scale,
        dir * 2.6 * scale,
        33 * scale,
      );
    }
  }
  ctx.restore();

  if (style === 'curly') {
    for (const dx of [-5.4, -1.9, 1.9, 5.4]) {
      blob(brush, at(head.x + dx, head.y - 5.2 + Math.abs(dx) * 0.34), 2.9, 2.6, shade(colors.hair));
    }
  }
  if (style === 'ponytail') {
    const x = head.x - (turned ? 7 : 6.4);
    shape(brush, [at(x, head.y - 3), at(x + 2.4, head.y - 2), at(x + 1.6, head.y + 8.5), at(x - 2.3, head.y + 7.5)], shade(colors.hair));
  }
  if (style === 'cap') {
    blob(brush, at(head.x, head.y - 2.2), rx + 0.8, 2.8, tone(colors.accent, 0.92));
    // Козырёк смотрит в сторону поворота.
    blob(brush, at(head.x + (turned ? 2.2 : 0), head.y - 0.5), rx - 0.6, 1.3, tone(colors.accent, 0.7));
  }
}

/**
 * Микрофон в кисти. Головка шаром, ручка вниз: без него поющий держит
 * руку у рта непонятно зачем.
 */
function microphone(brush: Brush, hand: Point): void {
  const body = '#2b2733';
  limb(brush, at(hand.x, hand.y), at(hand.x + 0.6, hand.y + 5.4), 2, 1.6, body);
  blob(brush, at(hand.x - 0.4, hand.y - 1.8), 1.9, 2, '#8f8ba0');
  blob(brush, at(hand.x - 0.6, hand.y - 2.4), 0.9, 0.9, '#c2bed0');
}
