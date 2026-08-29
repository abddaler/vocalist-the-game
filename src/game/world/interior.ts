import { ambienceOf } from './ambience';
import type { Ambience } from './ambience';
import type { Slot } from '@core/types';

/**
 * Свет в помещении. Пол, стены и обстановка комнаты рисуются той же
 * изометрией, что и улица; здесь остаётся только освещение — им комната
 * и отличается от улицы, а не отдельным рисовальщиком.
 */

/**
 * Свет в комнате. На улице ночь гасит всё, в комнате — включают лампу,
 * поэтому яркость держится, а тон уходит в тёплый.
 */
export function interiorLight(slot: Slot): Ambience {
  const outside = ambienceOf(slot, 'hills');
  const evening = slot === 'evening' || slot === 'night';
  return {
    ...outside,
    light: evening ? 1.0 : 1.16,
    lampsOn: evening,
    shadow: 0.22,
    wash: evening ? 0xffb469 : 0xfff0d8,
    washAlpha: evening ? 0.14 : 0.05,
  };
}
