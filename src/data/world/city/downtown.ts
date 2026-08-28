import type { DistrictDef } from '@core/types';
import { STREET, curbs, decor, fillLower, fillUpper, gateLeft, gateRight, upper } from './plan';

const WIDTH = 640;

/**
 * Даунтаун: конторы, стекло и подземный переход, в котором начинается
 * карьера. Своих дверей здесь мало — весь район работает на то, чтобы
 * первый заработок случился под ногами у людей, которым не до тебя.
 */
export const DOWNTOWN: DistrictDef = {
  id: 'downtown',
  nameKey: 'district.downtown',
  map: { x: 136, y: 10, w: 60, h: 44 },
  width: WIDTH,
  height: STREET.height,
  spawn: { x: 320, y: 128 },

  buildings: [upper('vocal_studio', 168, 136, 0x8c7fb8)],

  scenery: [
    fillUpper(24, 122, 0x6f8ab8, 'sign.bank'),
    fillUpper(326, 128, 0x7f94a8, 'sign.offices'),
    fillUpper(476, 140, 0xb89a86, 'sign.hotel'),
    fillLower(30, 130, 0x7a8496, 'sign.parking'),
    fillLower(184, 116, 0xb8a06f, 'sign.diner'),
    fillLower(322, 146, 0x9d7fb0, 'sign.mall'),
    fillLower(490, 120, 0x86a8b8, 'sign.pharmacy'),
  ],

  decor: [
    decor('lamp', 92, 100),
    decor('lamp', 246, 100),
    decor('lamp', 400, 100),
    decor('lamp', 556, 100),
    decor('newsbox', 132, 101),
    decor('bin', 438, 101),
    decor('hydrant', 214, 148),
    decor('busStop', 108, 149),
    decor('bollard', 268, 148),
    decor('bollard', 372, 148),
    decor('car', 470, 147, 1),
    decor('car', 606, 147, 2),
    decor('billboard', 628, 100, 1),
  ],

  gates: [gateLeft('hills'), gateRight('boulevard', WIDTH)],
  solids: curbs(WIDTH),
  points: [
    {
      id: 'underpass_stairs',
      nameKey: 'venue.underpass',
      rect: { x: 296, y: 110, w: 48, h: 24 },
      color: 0x39405a,
      prop: 'stairs',
      activities: [],
      venues: ['underpass'],
    },
  ],
};
