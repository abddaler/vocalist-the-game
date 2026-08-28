import type { DistrictDef } from '@core/types';
import { STREET, curbs, decor, fill, gateLeft, gateRight, house } from './plan';

const WIDTH = 660;

/**
 * Downtown: конторы, стекло и подземный переход, в котором начинается
 * карьера. Своих дверей тут мало — весь район работает на то, чтобы
 * первый заработок случился под ногами у людей, которым не до тебя.
 */
export const DOWNTOWN: DistrictDef = {
  id: 'downtown',
  nameKey: 'district.downtown',
  ground: 'plaza',
  map: { x: 136, y: 10, w: 60, h: 44 },
  width: WIDTH,
  height: STREET.height,
  spawn: { x: 320, y: 86 },

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
    decor('lamp', 96, 74),
    decor('lamp', 200, 74),
    decor('lamp', 284, 74),
    decor('lamp', 362, 74),
    decor('lamp', 462, 74),
    decor('lamp', 554, 74),
    decor('tree', 68, 76, 1),
    decor('tree', 250, 76, 2),
    decor('tree', 440, 76, 1),
    decor('tree', 636, 76, 0),
    decor('flowerbed', 330, 76),
    decor('newsbox', 70, 97),
    decor('trafficLight', 364, 74),
    decor('mailbox', 226, 97),
    decor('bike', 404, 97),
    decor('bin', 250, 97),
    decor('hydrant', 420, 97),
    decor('busStop', 160, 99),
    decor('bollard', 348, 98),
    decor('bollard', 372, 98),
    decor('car', 470, 99, 1),
    decor('car', 600, 99, 2),
    decor('billboard', 286, 74, 1),
    decor('billboard', 556, 74, 0),
  ],

  gates: [gateLeft('hills'), gateRight('boulevard', WIDTH)],
  solids: curbs(WIDTH),
  points: [
    {
      id: 'underpass_stairs',
      nameKey: 'venue.underpass',
      rect: { x: 302, y: 74, w: 36, h: 20 },
      color: 0x4a5270,
      prop: 'stairs',
      activities: [],
      venues: ['underpass'],
    },
  ],
};
