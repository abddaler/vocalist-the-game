import type { DecorDef, DecorKind, WorldRect } from '@core/types';
import type { Painter } from '@ui/widgets/Painter';
import type { Ambience } from '../ambience';
import { INDOOR } from './indoor';
import { NATURE } from './nature';
import { STREET } from './street';
import type { Draw } from './kit';

export type { DecorContext } from './kit';

/**
 * Реестр мелочи. Рисунки разведены по двум файлам — улица и помещение, —
 * а связь «вид предмета — процедура» держится здесь, чтобы забытый вид
 * не собрался.
 */
const VOLUME_ONLY: Draw = () => undefined;

/**
 * Реестр щитовых рисунков. Лоток, киоск и хижина рисуются только
 * объёмом — щита у них нет и быть не может.
 */
const DRAW: Readonly<Record<DecorKind, Draw>> = {
  ...STREET,
  ...INDOOR,
  ...NATURE,
  stall: VOLUME_ONLY,
  kiosk: VOLUME_ONLY,
  hut: VOLUME_ONLY,
  seat: VOLUME_ONLY,
  screen: VOLUME_ONLY,
  stool: VOLUME_ONLY,
  counter: VOLUME_ONLY,
  speaker: VOLUME_ONLY,
  weights: VOLUME_ONLY,
  window: VOLUME_ONLY,
};

/** Насколько широкую тень отбрасывает предмет. Ноль — тени нет. */
const SHADOW_WIDTH: Readonly<Record<DecorKind, number>> = {
  palm: 10,
  lamp: 6,
  bench: 22,
  car: 34,
  billboard: 9,
  hydrant: 8,
  planter: 14,
  bin: 11,
  busStop: 38,
  crate: 13,
  bollard: 7,
  newsbox: 12,
  parasol: 24,
  gull: 0,
  rug: 0,
  poster: 0,
  shelf: 0,
  bike: 22,
  trafficLight: 7,
  mailbox: 14,
  dog: 11,
  surfboard: 7,
  towel: 0,
  stall: 0,
  kiosk: 0,
  hut: 0,
  seat: 0,
  screen: 0,
  stool: 0,
  counter: 0,
  speaker: 0,
  weights: 0,
  window: 0,
  table: 20,
  tree: 16,
  bush: 12,
  flowerbed: 20,
  lifeguard: 22,
  deckchair: 15,
  umbrella: 22,
  boat: 30,
};

/**
 * След предмета на земле в плитках: ширина и глубина. Ноль — сквозь него
 * проходят. След мелкий: скамейка должна мешать пройти сквозь себя, но
 * не перекрывать тротуар целиком.
 */
const FOOTPRINT: Readonly<Record<DecorKind, readonly [number, number]>> = {
  palm: [0.4, 0.4],
  lamp: [0.3, 0.3],
  bench: [1.1, 0.5],
  car: [2.2, 0.9],
  billboard: [0.5, 0.3],
  hydrant: [0.3, 0.3],
  planter: [0.7, 0.6],
  bin: [0.5, 0.4],
  busStop: [2.2, 0.7],
  crate: [0.6, 0.6],
  bollard: [0.3, 0.3],
  newsbox: [0.5, 0.4],
  parasol: [0.5, 0.4],
  gull: [0, 0],
  rug: [0, 0],
  poster: [0, 0],
  shelf: [1, 0.4],
  bike: [1, 0.4],
  trafficLight: [0.3, 0.3],
  mailbox: [0.6, 0.4],
  // Собака ходит сама и в столкновениях не участвует: стоячий барьер из
  // живности читается как баг, а не как препятствие.
  dog: [0, 0],
  surfboard: [0.3, 0.3],
  // Полотенце лежит плашмя: через него переступают.
  towel: [0, 0],
  stall: [2.2, 1.4],
  kiosk: [1.4, 1.2],
  hut: [3.2, 2.4],
  seat: [1.4, 1],
  screen: [0, 0],
  stool: [0.5, 0.5],
  counter: [2.2, 1],
  speaker: [0.7, 0.7],
  weights: [1.6, 0.9],
  window: [0, 0],
  table: [0.9, 0.7],
  tree: [0.5, 0.5],
  bush: [0.6, 0.5],
  flowerbed: [1, 0.7],
  lifeguard: [1, 0.9],
  deckchair: [0.8, 0.6],
  umbrella: [0.4, 0.4],
  boat: [1.6, 1],
};

/** След предмета на земле или null, если сквозь него ходят. */
export function footprintOf(item: DecorDef): WorldRect | null {
  const [w, d] = FOOTPRINT[item.kind];
  if (w === 0 || d === 0) return null;
  return { x: item.x - w / 2, y: item.y - d / 2, w, h: d };
}

export function drawDecor(
  painter: Painter,
  item: DecorDef,
  screenX: number,
  screenY: number,
  ambience: Ambience,
  unit = 1,
): void {
  DRAW[item.kind]({
    painter,
    ambience,
    x: screenX,
    y: screenY,
    variant: item.variant ?? 0,
    unit,
  });
}

export const shadowWidth = (kind: DecorKind): number => SHADOW_WIDTH[kind];
