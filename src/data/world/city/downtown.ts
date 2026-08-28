import type { DistrictDef } from '@core/types';
import { band, curbs, decor, fill, gateLeft, gateRight, house, stairs } from './plan';

const WIDTH = 660;
const HEIGHT = 162;

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
    band('plaza', 66, 30, WIDTH, 9),
    stairs(150, 96, 28, 9),
    stairs(438, 96, 28, 9),
    band('pavement', 105, 18, WIDTH),
    band('road', 123, 26, WIDTH),
    band('pavement', 149, 13, WIDTH),
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
    decor('tree', 68, 80, 1),
    decor('tree', 250, 80, 2),
    decor('tree', 440, 80, 1),
    decor('tree', 636, 80, 0),
    decor('flowerbed', 348, 94),
    decor('planter', 92, 94),
    decor('planter', 596, 94),
    decor('bench', 120, 94),
    decor('bench', 396, 94),
    decor('bin', 268, 94),
    decor('lamp', 200, 94),
    decor('lamp', 284, 94),
    decor('lamp', 554, 94),
    decor('billboard', 226, 74, 1),
    decor('billboard', 556, 74, 0),

    // Тротуар под площадью.
    decor('newsbox', 70, 121),
    decor('busStop', 246, 122),
    decor('mailbox', 116, 121),
    decor('bike', 404, 122),
    decor('hydrant', 496, 121),
    decor('trafficLight', 364, 120),
    decor('bollard', 348, 122),
    decor('bollard', 372, 122),

    // Мостовая и дальний тротуар.
    decor('car', 132, 144, 1),
    decor('car', 470, 146, 1),
    decor('car', 600, 142, 2),
    decor('lamp', 84, 158),
    decor('lamp', 320, 158),
    decor('lamp', 588, 158),
    decor('bin', 210, 160),
    decor('bench', 452, 160),
  ],

  gates: [gateLeft('hills', 107), gateRight('boulevard', WIDTH, 107)],
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
