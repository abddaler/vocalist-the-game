import { BALANCE } from '@data/balance';
import { CITY, ROOMS } from '@data/world';
import { createInitialState } from '@core/state';
import { districtScene, roomScene } from '@game/world/iso/scene';
import type { IsoScene } from '@game/world/iso/scene';

/**
 * Что аудит считает локацией.
 *
 * Берётся ровно та сцена, которую рисует игра: улица и комната сведены к
 * одному описанию ещё в рендере, и мерить надо его, а не данные рядом с
 * ним. Иначе проверка ручается за файл, а игрок ходит по другому месту.
 */
export interface Location {
  readonly id: string;
  readonly scene: IsoScene;
  /** Какая норма заполненности к нему применяется. */
  readonly norm: keyof typeof BALANCE.scenery.fill;
}

/**
 * Норма по локации. Клуб и студия живут по разным правилам, и одна
 * средняя цифра на всех не сказала бы ничего ни про ту, ни про другую.
 */
const NORMS: Readonly<Record<string, keyof typeof BALANCE.scenery.fill>> = {
  apartment: 'apartment',
  restaurant: 'restaurant',
  club_vertigo: 'club',
  rehearsal_base: 'rehearsal',
  record_studio: 'studio',
  vocal_studio: 'studio',
  clothes_shop: 'shop',
  gym: 'gym',
  phoniatrist: 'clinic',
};

export function locations(): Location[] {
  // Состояние нужно улице: открыта ли дверь, зависит от часов работы.
  const state = createInitialState('audit', 'pop');
  return [
    ...CITY.map((district): Location => ({
      id: district.id,
      scene: districtScene(state, district.id),
      norm: 'street',
    })),
    ...ROOMS.map((room): Location => ({
      id: room.locationId,
      scene: roomScene(room, 'day'),
      norm: NORMS[room.locationId] ?? 'apartment',
    })),
  ];
}
