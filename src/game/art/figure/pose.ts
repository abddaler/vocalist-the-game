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
  readonly knee: readonly [Point, Point];
  readonly foot: readonly [Point, Point];
  /** Подъём корпуса на проносе: походка держится на нём. */
  readonly lift: number;
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
 * Позы. A — опора на обе ноги, B и C — контакты шага. В профиль они
 * зеркальны: в одном впереди ближняя нога, в другом дальняя.
 */
export const POSE: Readonly<Record<string, Joints>> = {
  downA: { ...stand('front'), lift: 1 },
  downB: striding('front'),
  upA: { ...stand('back'), lift: 1 },
  upB: striding('back'),
  sideA: { ...profile(0, 0), lift: 1 },
  sideB: profile(6, -5),
  sideC: profile(-5, 6),
};

export type ActorPose = keyof typeof POSE;
export const POSES = Object.keys(POSE) as readonly ActorPose[];

/** Размер кадра. Спрайт ставится ногами в точку, отсюда origin (0.5, 1). */
export const ACTOR_SPRITE = { width: 36, height: 62 } as const;
