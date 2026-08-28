import type { DistrictDef } from '@core/types';
import { band, curbs, decor, fill, gateLeft, gateRight, house, patch } from './plan';

const WIDTH = 700;
const HEIGHT = 160;

/**
 * Neon Boulevard: клуб, ресторан и витрины. Ночная часть карьеры целиком
 * здесь, поэтому и красок больше всего — маркизы, неон, афиши, красная
 * дорожка от клуба до края кадра.
 *
 * Уровень один, зато бульвар настоящий: две проезжие части и зелёный
 * островок между ними, по которому тоже ходят.
 */
export const BOULEVARD: DistrictDef = {
  id: 'boulevard',
  nameKey: 'district.boulevard',
  map: { x: 62, y: 40, w: 70, h: 26 },
  width: WIDTH,
  height: HEIGHT,
  spawn: { x: 340, y: 82 },

  terrain: [
    band('pavement', 66, 24, WIDTH),
    // Красная дорожка от дверей клуба вдоль всего его фасада.
    patch('carpet', 16, 76, 132, 14),
    band('road', 90, 28, WIDTH),
    band('grass', 118, 12, WIDTH),
    band('road', 130, 22, WIDTH),
    band('pavement', 152, 8, WIDTH),
  ],

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
    // Тротуар у витрин: терраса ресторана, очередь, афиши.
    decor('palm', 10, 80, 1),
    decor('palm', 204, 80, 0),
    decor('palm', 388, 80, 1),
    decor('palm', 586, 80, 0),
    decor('tree', 160, 79, 1),
    decor('tree', 440, 79, 0),
    decor('billboard', 198, 76, 0),
    decor('billboard', 388, 76, 2),
    decor('lamp', 60, 88),
    decor('lamp', 254, 88),
    decor('lamp', 434, 88),
    decor('lamp', 640, 88),
    decor('table', 272, 84),
    decor('table', 310, 84),
    decor('parasol', 272, 88),
    decor('parasol', 310, 88),
    decor('bench', 152, 88),
    decor('bench', 520, 88),
    decor('bin', 438, 88),
    decor('bollard', 100, 89),
    decor('bollard', 128, 89),
    decor('newsbox', 480, 88),

    // Первая проезжая часть.
    decor('car', 80, 112, 2),
    decor('car', 366, 114, 0),
    decor('car', 606, 110, 1),

    // Зелёный островок между полосами: пальмы бульвара растут здесь.
    decor('palm', 66, 129, 2),
    decor('palm', 190, 128, 1),
    decor('palm', 314, 129, 2),
    decor('palm', 438, 128, 0),
    decor('palm', 562, 129, 2),
    decor('palm', 686, 128, 1),
    decor('bush', 128, 128),
    decor('bush', 376, 128),
    decor('bush', 624, 128),
    decor('flowerbed', 252, 129),
    decor('flowerbed', 500, 129),

    // Дальняя полоса и тротуар у нижнего края.
    decor('car', 150, 148, 3),
    decor('car', 460, 150, 2),
    decor('lamp', 220, 158),
    decor('lamp', 540, 158),
    decor('bin', 380, 159),
  ],

  gates: [gateLeft('downtown', 92), gateRight('pier', WIDTH, 92)],
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
