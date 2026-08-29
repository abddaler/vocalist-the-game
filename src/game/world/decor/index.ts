import type { DecorDef, DecorKind, WorldRect } from '@core/types';
import type { Painter } from '@ui/widgets/Painter';
import type { Ambience } from '../ambience';
import { NATURE } from './nature';
import { STREET } from './street';
import type { Draw } from './kit';

export type { DecorContext } from './kit';

/**
 * Реестр щитовых рисунков. Здесь остались только предметы без объёма:
 * пальма, фонарь, светофор, доска и живность. Всё остальное рисуется
 * изометрическими объёмами из ISO_PROPS, и щита у него нет.
 *
 * Реестр неполон намеренно, а полноту каталога — «у каждого вида есть
 * либо объём, либо щит» — держит проверка в тестах: пустой Record тут
 * лишь заставлял бы дописывать заглушку на каждый новый вид.
 */
const DRAW: Readonly<Partial<Record<DecorKind, Draw>>> = {
  ...STREET,
  ...NATURE,
};

/**
 * Насколько широкую тень отбрасывает щитовой предмет. У объёмной мелочи
 * тень своя, по следу на земле, и сюда она не попадает.
 */
const SHADOW_WIDTH: Readonly<Partial<Record<DecorKind, number>>> = {
  palm: 10,
  lamp: 6,
  dog: 11,
  tree: 16,
  bush: 12,
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
  DRAW[item.kind]?.({
    painter,
    ambience,
    x: screenX,
    y: screenY,
    variant: item.variant ?? 0,
    unit,
  });
}

export const shadowWidth = (kind: DecorKind): number => SHADOW_WIDTH[kind] ?? 0;

/** Есть ли у вида щитовой рисунок. Нужно проверке полноты каталога. */
export const hasBillboard = (kind: DecorKind): boolean => DRAW[kind] !== undefined;
