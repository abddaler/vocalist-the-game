import type { DistrictDef } from '@core/types';
import { STREET, curbs, decor, fill, gateLeft, gateRight, house } from './plan';

const WIDTH = 700;

/**
 * Neon Boulevard: клуб, ресторан и витрины. Ночная часть карьеры целиком
 * здесь, поэтому и красок больше всего — маркизы, неон, афиши, красная
 * дорожка от клуба до края кадра.
 */
export const BOULEVARD: DistrictDef = {
  id: 'boulevard',
  nameKey: 'district.boulevard',
  ground: 'street',
  strip: { y: 96, h: 5, kind: 'carpet' },
  map: { x: 62, y: 40, w: 70, h: 26 },
  width: WIDTH,
  height: STREET.height,
  spawn: { x: 340, y: 86 },

  buildings: [
    house('club_vertigo', 'club', 20, 96, 0x6a3f8f),
    house('restaurant', 'restaurant', 214, 88, 0xd8a070),
    house('clothes_shop', 'shop', 396, 84, 0xd88fb0),
  ],

  scenery: [
    fill('bar', 128, 70, 0x6f5aa8, 'sign.bar'),
    fill('shop', 312, 70, 0x70b8d8, 'sign.tattoo'),
    fill('cinema', 492, 90, 0xd87080, 'sign.cinema'),
    fill('theatre', 594, 84, 0xc8a05f, 'sign.theatre'),
  ],

  decor: [
    decor('palm', 10, 78, 1),
    decor('palm', 118, 76, 2),
    decor('palm', 204, 78, 0),
    decor('palm', 306, 76, 2),
    decor('palm', 388, 78, 1),
    decor('palm', 484, 76, 2),
    decor('palm', 586, 78, 0),
    decor('palm', 690, 77, 1),
    decor('tree', 160, 76, 1),
    decor('tree', 440, 76, 0),
    decor('billboard', 198, 74, 0),
    decor('billboard', 388, 74, 2),
    decor('lamp', 60, 74),
    decor('lamp', 254, 74),
    decor('lamp', 434, 74),
    decor('lamp', 640, 74),
    decor('table', 272, 92),
    decor('table', 310, 92),
    decor('parasol', 272, 98),
    decor('parasol', 310, 98),
    decor('bench', 152, 97),
    decor('bench', 520, 97),
    decor('bin', 438, 97),
    decor('bollard', 100, 98),
    decor('bollard', 128, 98),
    decor('car', 80, 99, 2),
    decor('car', 366, 99, 0),
    decor('car', 606, 99, 1),
  ],

  gates: [gateLeft('downtown'), gateRight('pier', WIDTH)],
  solids: curbs(WIDTH),
  points: [
    {
      id: 'orders_board',
      nameKey: 'venue.corporate',
      rect: { x: 666, y: 70, w: 22, h: 20 },
      color: 0x8f7a4a,
      prop: 'board',
      activities: [],
      venues: ['corporate'],
    },
  ],
};
