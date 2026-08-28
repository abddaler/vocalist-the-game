import type { DistrictDef } from '@core/types';
import { STREET, curbs, decor, fill, gateLeft, gateRight, house } from './plan';

const WIDTH = 680;

/**
 * Neon Boulevard: клуб, ресторан и витрины. Ночная часть карьеры целиком
 * здесь, поэтому и красок больше всего — маркизы, неон, афиши.
 */
export const BOULEVARD: DistrictDef = {
  id: 'boulevard',
  nameKey: 'district.boulevard',
  map: { x: 62, y: 40, w: 70, h: 26 },
  width: WIDTH,
  height: STREET.height,
  spawn: { x: 340, y: 84 },

  buildings: [
    house('club_vertigo', 20, 92, 0xc07fd8),
    house('restaurant', 206, 88, 0xd8a070),
    house('clothes_shop', 386, 80, 0xd88fb0),
  ],

  scenery: [
    fill(124, 68, 0xa090d8, 'sign.bar'),
    fill(306, 66, 0x70b8d8, 'sign.tattoo'),
    fill(478, 88, 0xd87080, 'sign.cinema'),
    fill(578, 72, 0xd8b870, 'sign.pizza'),
  ],

  decor: [
    decor('palm', 10, 74, 1),
    decor('palm', 116, 72, 2),
    decor('palm', 200, 74, 0),
    decor('palm', 300, 72, 2),
    decor('palm', 380, 74, 1),
    decor('palm', 470, 72, 2),
    decor('palm', 572, 74, 0),
    decor('palm', 668, 73, 1),
    decor('billboard', 198, 72, 0),
    decor('billboard', 472, 72, 2),
    decor('lamp', 60, 71),
    decor('lamp', 250, 71),
    decor('lamp', 434, 71),
    decor('lamp', 620, 71),
    decor('parasol', 268, 98),
    decor('parasol', 306, 98),
    decor('bench', 148, 97),
    decor('bench', 508, 97),
    decor('bin', 430, 97),
    decor('car', 76, 99, 2),
    decor('car', 360, 99, 0),
    decor('car', 596, 99, 1),
  ],

  gates: [gateLeft('downtown'), gateRight('pier', WIDTH)],
  solids: curbs(WIDTH),
  points: [
    {
      id: 'orders_board',
      nameKey: 'venue.corporate',
      rect: { x: 646, y: 70, w: 22, h: 20 },
      color: 0x8f7a4a,
      prop: 'board',
      activities: [],
      venues: ['corporate'],
    },
  ],
};
