/**
 * Скелет персонажа: где у него голова, плечи, кисти и стопы в каждой
 * позе. Раньше поза была картинкой из строк, и каждый новый кадр
 * приходилось рисовать по пикселю; теперь это набор точек, а рисунок
 * строится по ним. Отсюда и берётся плавная походка: фаза шага — это
 * сдвиг двух точек, а не сорок восемь новых строк.
 *
 * Координаты — в пикселях кадра 36x62, отсчёт от левого верхнего угла.
 */
export interface Point {
  readonly x: number;
  readonly y: number;
}

export type Side = 'front' | 'back' | 'side';

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
}

const p = (x: number, y: number): Point => ({ x, y });

/** Ширины частей тела в пикселях кадра. */
export const BUILD = {
  headRx: 6.2,
  headRy: 7.6,
  neck: 4,
  shoulders: 13.8,
  waist: 11.4,
  arm: 3.6,
  wrist: 2.6,
  thigh: 6,
  ankle: 4.2,
  foot: 6.2,
} as const;

const stand = (view: Side): Joints => ({
  view,
  head: p(18, 11),
  neck: p(18, 19),
  hip: p(18, 39),
  shoulder: [p(11.9, 23), p(24.1, 23)],
  hand: [p(9.8, 41), p(26.2, 41)],
  knee: [p(14.3, 48.5), p(21.7, 48.5)],
  foot: [p(14.3, 57), p(21.7, 57)],
  lift: 0,
});

/** Шаг анфас: ноги расходятся, руки идут навстречу им, корпус ниже. */
const striding = (view: Side): Joints => ({
  ...stand(view),
  hand: [p(10.8, 40), p(25.2, 40)],
  knee: [p(12.4, 48.5), p(23.6, 48.5)],
  foot: [p(10.6, 57), p(25.4, 57)],
});

/**
 * Профиль: плечи и бёдра сходятся в одну линию, дальняя рука и нога
 * уходят за корпус — их видно только по краю силуэта.
 */
const profile = (front: number, back: number): Joints => ({
  view: 'side',
  head: p(19.2, 11),
  neck: p(18.6, 19),
  hip: p(18, 39),
  shoulder: [p(17.2, 23), p(19.8, 23)],
  hand: [p(15.4 + back * 0.4, 41), p(21.6 + front * 0.4, 40.5)],
  knee: [p(18 + back * 0.4, 48.5), p(18 + front * 0.4, 48.5)],
  foot: [p(18 + back, 57), p(18 + front, 57)],
  lift: 0,
});

/**
 * Ходовые позы. A — опора на обе ноги, B и C — контакты шага. В профиль
 * они зеркальны: в одном впереди ближняя нога, в другом дальняя.
 * Нужны каждому человеку в кадре, поэтому собираются для всех внешностей.
 */
const WALK_POSE = {
  downA: { ...stand('front'), lift: 1 },
  downB: striding('front'),
  upA: { ...stand('back'), lift: 1 },
  upB: striding('back'),
  sideA: { ...profile(0, 0), lift: 1 },
  sideB: profile(6, -5),
  sideC: profile(-5, 6),
} as const;

/** Поза стоя с переставленными руками: основа всех неходовых. */
const posed = (
  elbows: readonly [Point, Point],
  hands: readonly [Point, Point],
  extra: Partial<Joints> = {},
): Joints => ({
  ...stand('front'),
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
