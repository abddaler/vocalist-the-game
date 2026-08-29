import type { DistrictDef } from '@core/types';
import { decor, fill, gateLeft, gateRight, group, house } from './plan';

/**
 * Downtown: конторы, стекло и подземный переход, в котором начинается
 * карьера. Своих дверей тут мало — весь район работает на то, чтобы
 * первый заработок случился под ногами у людей, которым не до тебя.
 *
 * Перед башнями поднятая площадь со ступенями вниз: контора в Лос-
 * Анджелесе стоит на стилобате, а не открывается прямо в поток.
 */
export const DOWNTOWN: DistrictDef = {
  id: 'downtown',
  nameKey: 'district.downtown',
  map: { x: 136, y: 10, w: 60, h: 44 },
  spawn: { x: 18.5, y: 3.5 },

  tiles: {
    legend: {
      '%': { kind: 'plaza', level: 1 },
      '/': { kind: 'steps', level: 1 },
      '~': { kind: 'pavement', level: 0 },
      '.': { kind: 'road', level: 0 },
      '|': { kind: 'roadLine', level: 0 },
    },
    rows: [
      '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
      '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
      '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
      '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
      '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
      '%%%%%%%%///%%%%%%%%%%%%%%///%%%%%%%%%%',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '......................................',
      '||||||||||||||||||||||||||||||||||||||',
      '......................................',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
    ],
  },

  buildings: [house('vocal_studio', 'studio', 6, 5, 78, 0xa88fd0)],

  scenery: [
    fill('office', 0, 5, 86, 0x8fa8d0, 'sign.bank'),
    fill('office', 12, 4, 80, 0x9fb0c0, 'sign.offices'),
    fill('diner', 17, 4, 44, 0xd8c088, 'sign.diner'),
    fill('shop', 22, 5, 52, 0xb890c8, 'sign.mall'),
    fill('hotel', 28, 5, 72, 0xd0ac96, 'sign.hotel'),
    fill('clinic', 34, 4, 56, 0xa8ccd8, 'sign.pharmacy'),
  ],

  decor: [
    // Площадь у башен. Высокое стоит в разрывах между башнями: перед
    // фасадом оно закрывает вывеску.
    decor('tree', 5.5, 2.5, 1),
    decor('tree', 11.5, 2.5, 2),
    decor('tree', 16.5, 2.5, 1),
    decor('tree', 27.5, 2.5, 0),
    decor('tree', 33.5, 2.5, 2),
    decor('billboard', 21.5, 2.5, 1),
    decor('flowerbed', 9.5, 2.5),
    decor('flowerbed', 24.5, 2.5),
    decor('planter', 2.5, 2.5),
    decor('planter', 30.5, 2.5),
    decor('planter', 36.5, 2.5),

    decor('lamp', 5.5, 4.5),
    decor('lamp', 11.5, 4.5),
    decor('lamp', 16.5, 4.5),
    decor('lamp', 21.5, 4.5),
    decor('lamp', 27.5, 4.5),
    decor('lamp', 33.5, 4.5),
    ...group.rest(7.5, 4.5),
    ...group.rest(24.5, 4.5),
    decor('planter', 3.5, 4.5),
    decor('planter', 35.5, 4.5),
    ...group.market(12.5, 4.5, 2),
    decor('kiosk', 30.5, 4.5),

    // Тротуар под площадью: остановка, светофор у перехода, столбики
    // вдоль него.
    decor('busStop', 14.5, 6.5),
    decor('trafficLight', 20.5, 6.5),
    ...group.bollards(18.5, 3, 1.4, 7.5),
    decor('newsbox', 3.5, 6.5),
    decor('mailbox', 6.5, 6.5),
    decor('bike', 23.5, 6.5),
    decor('hydrant', 28.5, 6.5),

    // Мостовая и дальний тротуар.
    decor('car', 7.5, 9.5, 1),
    decor('car', 26.5, 9.5, 1),
    decor('car', 34.5, 9.5, 2),
    ...group.lamps(4.5, 33.5, 7.25, 12.5),
    ...group.rest(11.5, 12.5),
    ...group.rest(25.5, 12.5),
  ],

  gates: [gateLeft('hills', 7), gateRight('boulevard', 38, 7)],
  points: [
    {
      id: 'underpass_stairs',
      nameKey: 'venue.underpass',
      rect: { x: 17, y: 3, w: 2, h: 2 },
      color: 0x4a5270,
      prop: 'stairs',
      activities: [],
      venues: ['underpass'],
    },
  ],
};
