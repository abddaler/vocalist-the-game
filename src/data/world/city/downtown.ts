import type { DistrictDef } from '@core/types';
import { band, curbs, decor, fill, gateLeft, gateRight, house, stairs } from './plan';

const WIDTH = 660;
const HEIGHT = 156;

/**
 * Downtown: конторы, стекло и подземный переход, в котором начинается
 * карьера. Своих дверей тут мало — весь район работает на то, чтобы
 * первый заработок случился под ногами у людей, которым не до тебя.
 *
 * Перед башнями поднятая площадь со ступенями вниз, к тротуару: контора
 * в Лос-Анджелесе стоит на стилобате, а не открывается прямо в поток.
 */
export const DOWNTOWN: DistrictDef = {
  id: 'downtown',
  nameKey: 'district.downtown',
  map: { x: 136, y: 10, w: 60, h: 44 },
  width: WIDTH,
  height: HEIGHT,
  spawn: { x: 320, y: 84 },

  terrain: [
    band('plaza', 66, 24, WIDTH, 9),
    stairs(150, 90, 28, 9),
    stairs(438, 90, 28, 9),
    band('pavement', 99, 18, WIDTH),
    band('road', 117, 26, WIDTH),
    band('pavement', 143, 13, WIDTH),
  ],

  buildings: [house('vocal_studio', 'studio', 104, 88, 0xa88fd0)],

  scenery: [
    fill('office', 14, 76, 0x8fa8d0, 'sign.bank'),
    fill('office', 206, 70, 0x9fb0c0, 'sign.offices'),
    fill('diner', 292, 64, 0xd8c088, 'sign.diner'),
    fill('shop', 370, 86, 0xb890c8, 'sign.mall'),
    fill('hotel', 470, 78, 0xd0ac96, 'sign.hotel'),
    fill('clinic', 562, 74, 0xa8ccd8, 'sign.pharmacy'),
  ],

  decor: [
    // Площадь у башен.
    decor('tree', 68, 86, 1),
    decor('tree', 250, 86, 2),
    decor('tree', 440, 86, 1),
    decor('tree', 636, 86, 0),
    decor('flowerbed', 348, 87),
    decor('planter', 92, 88),
    decor('planter', 596, 88),
    decor('bench', 120, 88),
    decor('bench', 396, 88),
    decor('bin', 268, 88),
    decor('lamp', 200, 88),
    decor('lamp', 284, 88),
    decor('lamp', 554, 88),
    decor('billboard', 226, 74, 1),
    decor('billboard', 556, 74, 0),

    // Тротуар под площадью.
    decor('newsbox', 70, 114),
    decor('busStop', 246, 116),
    decor('mailbox', 116, 114),
    decor('bike', 404, 115),
    decor('hydrant', 496, 114),
    decor('trafficLight', 364, 113),
    decor('bollard', 348, 116),
    decor('bollard', 372, 116),

    // Мостовая и дальний тротуар.
    decor('car', 132, 138, 1),
    decor('car', 470, 140, 1),
    decor('car', 600, 136, 2),
    decor('lamp', 84, 152),
    decor('lamp', 320, 152),
    decor('lamp', 588, 152),
    decor('bin', 210, 154),
    decor('bench', 452, 154),
  ],

  gates: [gateLeft('hills', 100), gateRight('boulevard', WIDTH, 100)],
  solids: curbs(WIDTH),
  points: [
    {
      id: 'underpass_stairs',
      nameKey: 'venue.underpass',
      rect: { x: 302, y: 70, w: 36, h: 20 },
      color: 0x4a5270,
      prop: 'stairs',
      activities: [],
      venues: ['underpass'],
    },
  ],
};
