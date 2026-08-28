import type { DecorDef, DecorKind } from '@core/types';
import type { Painter } from '@ui/widgets/Painter';
import type { Ambience } from '../ambience';
import { INDOOR } from './indoor';
import { STREET } from './street';
import type { Draw } from './kit';

export type { DecorContext } from './kit';

/**
 * Реестр мелочи. Рисунки разведены по двум файлам — улица и помещение, —
 * а связь «вид предмета — процедура» держится здесь, чтобы забытый вид
 * не собрался.
 */
const DRAW: Readonly<Record<DecorKind, Draw>> = { ...STREET, ...INDOOR };

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
  crate: 20,
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
};

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
