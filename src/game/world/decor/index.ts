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
const DRAW: Readonly<Record<DecorKind, Draw>> = { ...STREET, ...INDOOR, ...NATURE };

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
 * Что предмет занимает на земле: ширина и глубина следа в мировых
 * пикселях, ноль — сквозь него проходят. След мелкий по глубине: скамейка
 * должна мешать пройти сквозь себя, но не перекрывать тротуар целиком.
 */
const FOOTPRINT: Readonly<Record<DecorKind, readonly [number, number]>> = {
  palm: [5, 3],
  lamp: [3, 3],
  bench: [20, 5],
  car: [32, 9],
  billboard: [8, 3],
  hydrant: [5, 3],
  planter: [12, 6],
  bin: [8, 4],
  busStop: [34, 6],
  crate: [11, 6],
  bollard: [4, 3],
  newsbox: [9, 4],
  parasol: [6, 3],
  gull: [0, 0],
  rug: [0, 0],
  poster: [0, 0],
  shelf: [16, 4],
  bike: [16, 3],
  trafficLight: [4, 3],
  mailbox: [10, 4],
  // Собака ходит сама и в столкновениях не участвует: стоячий барьер из
  // живности читается как баг, а не как препятствие.
  dog: [0, 0],
  surfboard: [5, 3],
  table: [16, 8],
  tree: [7, 4],
  bush: [10, 5],
  flowerbed: [18, 8],
  lifeguard: [16, 8],
  deckchair: [13, 6],
  umbrella: [6, 3],
  boat: [26, 10],
};

/** След предмета на земле или null, если сквозь него ходят. */
export function footprintOf(item: DecorDef): WorldRect | null {
  const [w, h] = FOOTPRINT[item.kind];
  if (w === 0 || h === 0) return null;
  return { x: item.x - w / 2, y: item.y - h, w, h };
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
