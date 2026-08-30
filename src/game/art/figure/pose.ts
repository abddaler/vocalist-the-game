/**
 * Скелет персонажа: где у него голова, плечи, кисти и стопы в каждой
 * позе. Раньше поза была картинкой из строк, и каждый новый кадр
 * приходилось рисовать по пикселю; теперь это набор точек, а рисунок
 * строится по ним. Отсюда и берётся плавная походка: фаза шага — это
 * сдвиг двух точек, а не сорок восемь новых строк.
 *
 * Ракурсов два, а не три. В изометрии нет направления, в котором человек
 * виден строго анфас или строго в профиль: оси плитки идут по диагоналям
 * экрана, и все четыре стороны — три четверти. Рисуются две — к камере и
 * от камеры, — а две другие получаются зеркалом.
 *
 * Координаты — в пикселях кадра 36x62, отсчёт от левого верхнего угла.
 */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * Ракурс. `quarter` — три четверти лицом к камере, `quarterBack` — то же
 * со спины. `front` и `back` остались для поз, которые показываются не
 * на улице, а в карточке дела: там человек обращён прямо к игроку.
 */
export type Side = 'front' | 'back' | 'quarter' | 'quarterBack';

/** Видно ли лицо в этом ракурсе. */
export const facesCamera = (view: Side): boolean => view === 'front' || view === 'quarter';

/** Повёрнут ли корпус: у трёх четвертей он уже, чем анфас. */
export const isTurned = (view: Side): boolean => view === 'quarter' || view === 'quarterBack';

export interface Joints {
  readonly view: Side;
  readonly head: Point;
  readonly neck: Point;
  readonly hip: Point;
  /** Левое и правое плечо. В профиль дальняя рука прячется за корпус. */
  readonly shoulder: readonly [Point, Point];
  readonly hand: readonly [Point, Point];
  /**
   * Локоть. У шага его нет: висящая рука и так прямая. Но поднять руку
   * без локтя нельзя — отрезок от плеча к кисти пройдёт сквозь корпус,
   * и жест пропадёт внутри рубашки.
   */
  readonly elbow?: readonly [Point, Point] | undefined;
  readonly knee: readonly [Point, Point];
  readonly foot: readonly [Point, Point];
  /** Подъём корпуса на проносе: походка держится на нём. */
  readonly lift: number;
  /** Микрофон в ближней руке: без него вокалист поёт в кулак. */
  readonly mic?: boolean | undefined;
  /** Закрытые глаза: этим и только этим читается сон. */
  readonly shut?: boolean | undefined;
  /**
   * Какая сторона ближе к камере: 0 — левая на экране, 1 — правая.
   * В три четверти к камере ближе та половина корпуса, в которую человек
   * повёрнут, и её руку с ногой пишут последними и в полный тон.
   */
  readonly near: 0 | 1;
}

const p = (x: number, y: number): Point => ({ x, y });

/** Ширины частей тела в пикселях кадра. */
export const BUILD = {
  headRx: 6.7,
  headRy: 7.9,
  neck: 4.2,
  shoulders: 14.6,
  waist: 12.2,
  arm: 3.9,
  wrist: 2.8,
  thigh: 6.4,
  ankle: 4.4,
  foot: 6.6,
} as const;

/**
 * Направление хода по экрану. Плитка идёт по диагонали, поэтому шаг
 * смещает ногу и вправо, и вниз — в отношении два к одному, как сама
 * плитка. Отсюда походка и читается изометрической: нога уходит вдоль
 * улицы, а не поперёк кадра.
 */
const TRAVEL = { x: 1, y: 0.5 } as const;

/** На сколько нога уходит вперёд в контакте и кисть — назад. */
const STRIDE = 3.4;
const SWING = 2;

/**
 * Три четверти. `away` — спиной к камере: тогда ход идёт вверх по
 * экрану, а ближе к зрителю оказывается правая половина корпуса, а не
 * левая.
 *
 * `step` — фаза: 0 — опора на обе ноги, +1 — вперёд идёт дальняя нога,
 * −1 — ближняя. Руки ходят навстречу ногам, иначе человек марширует.
 */
const quarter = (away: boolean, step: number): Joints => {
  const dy = away ? -TRAVEL.y : TRAVEL.y;
  const near: 0 | 1 = away ? 1 : 0;
  const shift = (base: Point, along: number, part: number): Point =>
    p(base.x + TRAVEL.x * along * part, base.y + dy * along * part);

  // Ближнее плечо ниже и дальше от центра: в изометрии ближнее — ниже.
  const low = 24;
  const high = 22.8;
  const shoulder: [Point, Point] = away
    ? [p(13.1, high), p(23.2, low)]
    : [p(12.8, low), p(23.5, high)];
  const hand: [Point, Point] = away
    ? [p(11.4, 40.8), p(25.2, 41.8)]
    : [p(11, 41.8), p(24.8, 40.8)];
  const knee: [Point, Point] = away
    ? [p(14.8, 48.6), p(21, 49.2)]
    : [p(15, 49.2), p(20.8, 48.6)];
  const foot: [Point, Point] = away
    ? [p(14.9, 56.4), p(20.9, 57.4)]
    : [p(15.1, 57.4), p(20.7, 56.4)];

  // Дальняя нога идёт вперёд при step = +1, ближняя — при −1.
  const legStep: [number, number] = near === 0 ? [-step, step] : [step, -step];
  const armStep: [number, number] = [-legStep[0], -legStep[1]];

  return {
    view: away ? 'quarterBack' : 'quarter',
    // Голова повёрнута туда же, куда корпус: в сторону хода.
    head: p(away ? 17.4 : 18.7, 11),
    neck: p(away ? 17.8 : 18.3, 19),
    hip: p(18, 40),
    shoulder,
    hand: [
      shift(hand[0], SWING, armStep[0]),
      shift(hand[1], SWING, armStep[1]),
    ],
    knee: [
      shift(knee[0], STRIDE * 0.4, legStep[0]),
      shift(knee[1], STRIDE * 0.4, legStep[1]),
    ],
    foot: [
      shift(foot[0], STRIDE, legStep[0]),
      shift(foot[1], STRIDE, legStep[1]),
    ],
    lift: 0,
    near,
  };
};

/**
 * Ходовые позы. A — пронос, корпус приподнят; B и C — контакты, в одном
 * впереди дальняя нога, в другом ближняя.
 *
 * Рисуются только «вправо»: `se` идёт вниз-вправо к камере, `ne` —
 * вверх-вправо от неё. Две другие стороны движок получает отражением, и
 * половина кадров не рисуется вовсе.
 */
const WALK_POSE = {
  seA: { ...quarter(false, 0), lift: 1 },
  seB: quarter(false, 1),
  seC: quarter(false, -1),
  neA: { ...quarter(true, 0), lift: 1 },
  neB: quarter(true, 1),
  neC: quarter(true, -1),
} as const;

/**
 * Поза стоя с переставленными руками: основа всех неходовых. Стойка
 * берётся та же, что у шага к камере, — иначе названный, начав говорить,
 * на кадр становится шире, чем шёл секунду назад.
 */
const posed = (
  elbows: readonly [Point, Point],
  hands: readonly [Point, Point],
  extra: Partial<Joints> = {},
): Joints => ({
  ...quarter(false, 0),
  // Работает правая рука: микрофон, жест, ладонь у горла. Значит она и
  // ближняя — иначе её пишут первой и приглушённой, и жест уходит за
  // корпус вместе с микрофоном.
  near: 1,
  elbow: [elbows[0], elbows[1]],
  hand: [hands[0], hands[1]],
  ...extra,
});

/** Локти висящих рук: ими пользуются позы, где работает только одна. */
const DOWN: readonly [Point, Point] = [p(10.6, 32), p(25.4, 32)];

/**
 * Рука с микрофоном: локоть вниз и наружу, предплечье наискось ко рту.
 * Одинакова во всех кадрах пения — двигается вторая рука и корпус.
 */
const MIC_ELBOW = p(28.4, 32);
const MIC_HAND = p(22.8, 21);

/**
 * Позы дела. Петь, говорить, спать и работать руками — это не шаг на
 * месте, а раньше все занятия показывались именно им: урок вокала,
 * смена в ресторане и сон отличались только значком над головой.
 *
 * Собираются не для всех: поют и разговаривают игрок и названные, а
 * прохожему они не нужны — двенадцать лишних кадров на каждого в толпе
 * это четверть секунды загрузки на телефоне.
 */
const ACT_POSE = {
  // Разговор: свободная рука ведёт речь, корпус чуть переступает.
  talkA: posed([DOWN[0], p(28.6, 32)], [p(9.8, 41), p(29.4, 23.5)], { lift: 1 }),
  talkB: posed([DOWN[0], p(29, 33)], [p(10.2, 40), p(30.4, 28)]),

  // Пение: микрофон у рта в ближней руке, дальняя ходит снизу вверх,
  // корпус поднимается к верхней точке фразы.
  singA: posed([p(8.6, 31), MIC_ELBOW], [p(8.2, 40), MIC_HAND], { mic: true }),
  singB: posed([p(7.6, 30), MIC_ELBOW], [p(6.2, 34), MIC_HAND], { mic: true, lift: 1 }),
  singC: posed([p(6.6, 28), MIC_ELBOW], [p(4.6, 26), MIC_HAND], { mic: true, lift: 2 }),
  singD: posed([p(6, 26), MIC_ELBOW], [p(4, 19), MIC_HAND], { mic: true, lift: 2 }),
  singE: posed([p(7, 29), MIC_ELBOW], [p(5, 28), MIC_HAND], { mic: true, lift: 1 }),
  singF: posed([p(8, 30), MIC_ELBOW], [p(6.6, 35), MIC_HAND], { mic: true }),

  // Сон: руки повисли, глаза закрыты. Закрытые глаза — единственное,
  // чем стоящий спящий отличается от стоящего бодрого.
  restA: posed(DOWN, [p(10.4, 42), p(25.6, 42)], { shut: true, head: p(18, 12.4) }),
  restB: posed(DOWN, [p(10.4, 42), p(25.6, 42)], { shut: true, head: p(18, 12), lift: 1 }),

  // Севший голос: сутулость, рука у горла, голова опущена.
  wornA: posed([DOWN[0], p(26.4, 29.6)], [p(11, 41), p(20.4, 20.4)], {
    head: p(18.7, 13.6),
    neck: p(18.3, 20.4),
    shoulder: [p(13.4, 26), p(22.9, 25.2)],
  }),
  wornB: posed([DOWN[0], p(26.2, 30)], [p(11.2, 40.7), p(20.6, 21)], {
    head: p(18.7, 14),
    neck: p(18.3, 20.8),
    shoulder: [p(13.6, 26.4), p(23.1, 25.6)],
    lift: 1,
  }),

  // Работа руками: зал, смена, сборы. Руки вперёд и вверх.
  liftA: posed([p(7.6, 31), p(28.4, 31)], [p(9.6, 23.5), p(26.4, 23.5)]),
  liftB: posed([p(7, 29), p(29, 29)], [p(9.6, 17.5), p(26.4, 17.5)], { lift: 1 }),
} as const;

export const POSE: Readonly<Record<string, Joints>> = { ...WALK_POSE, ...ACT_POSE };

export type ActorPose = keyof typeof POSE;

/** Позы для всех внешностей. */
export const POSES = Object.keys(WALK_POSE) as readonly ActorPose[];

/** Позы только для игрока и названных. */
export const ACT_POSES = Object.keys(ACT_POSE) as readonly ActorPose[];

/** Размер кадра. Спрайт ставится ногами в точку, отсюда origin (0.5, 1). */
export const ACTOR_SPRITE = { width: 36, height: 62 } as const;
