import type { DistrictDef } from '@core/types';
import { STREET, curbs, decor, fill, gateLeft, gateRight, house } from './plan';

const WIDTH = 640;

/**
 * Downtown: конторы, стекло и подземный переход, в котором начинается
 * карьера. Своих дверей тут мало — весь район работает на то, чтобы
 * первый заработок случился под ногами у людей, которым не до тебя.
 */
export const DOWNTOWN: DistrictDef = {
  id: 'downtown',
  nameKey: 'district.downtown',
  map: { x: 136, y: 10, w: 60, h: 44 },
  width: WIDTH,
  height: STREET.height,
  spawn: { x: 320, y: 86 },

  buildings: [house('vocal_studio', 104, 88, 0xa88fd0)],

  scenery: [
    fill(14, 76, 0x8fa8d0, 'sign.bank'),
    fill(206, 70, 0x9fb0c0, 'sign.offices'),
    fill(292, 64, 0xd0b880, 'sign.diner'),
    fill(370, 86, 0xb890c8, 'sign.mall'),
    fill(470, 78, 0xd0ac96, 'sign.hotel'),
    fill(562, 66, 0x96c0d0, 'sign.pharmacy'),
  ],

  decor: [
    decor('lamp', 96, 71),
    decor('lamp', 200, 71),
    decor('lamp', 284, 71),
    decor('lamp', 362, 71),
    decor('lamp', 462, 71),
    decor('lamp', 554, 71),
    decor('newsbox', 70, 97),
    decor('trafficLight', 364, 71),
    decor('mailbox', 226, 97),
    decor('bike', 404, 97),
    decor('bin', 250, 97),
    decor('hydrant', 420, 97),
    decor('busStop', 160, 99),
    decor('bollard', 348, 98),
    decor('bollard', 372, 98),
    decor('car', 470, 99, 1),
    decor('car', 600, 99, 2),
    decor('billboard', 286, 72, 1),
    decor('billboard', 556, 72, 0),
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
