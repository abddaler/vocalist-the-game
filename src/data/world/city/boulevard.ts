import type { DistrictDef } from '@core/types';
import { STREET, curbs, decor, fillLower, fillUpper, gateLeft, gateRight, lower, upper } from './plan';

const WIDTH = 720;

/**
 * Бульвар: клуб, ресторан и витрины. Ночная часть карьеры целиком здесь,
 * поэтому и красок больше всего — маркизы, неон, афиши на каждом шагу.
 */
export const BOULEVARD: DistrictDef = {
  id: 'boulevard',
  nameKey: 'district.boulevard',
  map: { x: 62, y: 40, w: 70, h: 26 },
  width: WIDTH,
  height: STREET.height,
  spawn: { x: 360, y: 126 },

  buildings: [
    upper('club_vertigo', 40, 144, 0xa86fb8),
    upper('restaurant', 214, 140, 0xb88a5f),
    lower('clothes_shop', 78, 134, 0xb87f9c),
  ],

  scenery: [
    fillUpper(386, 118, 0x7f8fb8, 'sign.theatre'),
    fillUpper(534, 152, 0xb85f6f, 'sign.cinema'),
    fillLower(240, 124, 0x8f7fb8, 'sign.bar'),
    fillLower(392, 128, 0x5f9fb8, 'sign.tattoo'),
    fillLower(548, 140, 0xb8a05f, 'sign.pizza'),
  ],

  decor: [
    decor('palm', 22, 102, 1),
    decor('palm', 196, 100, 2),
    decor('palm', 372, 102, 0),
    decor('palm', 528, 100, 2),
    decor('palm', 700, 102, 1),
    decor('billboard', 199, 101, 0),
    decor('billboard', 519, 101, 2),
    decor('parasol', 300, 149),
    decor('parasol', 344, 149),
    decor('bench', 224, 148),
    decor('bin', 500, 148),
    decor('lamp', 168, 101),
    decor('lamp', 358, 101),
    decor('lamp', 508, 101),
    decor('lamp', 596, 101),
    decor('lamp', 128, 148),
    decor('lamp', 428, 148),
    decor('car', 60, 147, 2),
    decor('car', 420, 147, 0),
    decor('car', 662, 147, 1),
  ],

  gates: [gateLeft('downtown'), gateRight('pier', WIDTH)],
  solids: curbs(WIDTH),
  points: [
    {
      id: 'orders_board',
      nameKey: 'venue.corporate',
      rect: { x: 632, y: 98, w: 32, h: 24 },
      color: 0x7a6a3f,
      prop: 'board',
      activities: [],
      venues: ['corporate'],
    },
  ],
};
