import type { DistrictDef } from '@core/types';
import { band, curbs, decor, fill, gateLeft, gateRight, house, patch } from './plan';

const WIDTH = 700;
const HEIGHT = 166;

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
    band('pavement', 66, 30, WIDTH),
    // Красная дорожка от дверей клуба вдоль всего его фасада.
    patch('carpet', 16, 82, 132, 14),
    band('road', 96, 28, WIDTH),
    band('grass', 124, 12, WIDTH),
    band('road', 136, 22, WIDTH),
    band('pavement', 158, 8, WIDTH),
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
    decor('lamp', 60, 94),
    decor('lamp', 254, 94),
    decor('lamp', 434, 94),
    decor('lamp', 640, 94),
    // Зонт рисует и столик под собой: второй столик рядом с ним лишний.
    decor('parasol', 268, 94),
    decor('parasol', 300, 92),
    decor('parasol', 332, 94),
    decor('bench', 152, 94),
    decor('bench', 520, 94),
    decor('bin', 438, 94),
    decor('bollard', 100, 95),
    decor('bollard', 128, 95),
    decor('newsbox', 480, 94),

    // Первая проезжая часть.
    decor('car', 80, 118, 2),
    decor('car', 366, 120, 0),
    decor('car', 606, 116, 1),

    // Зелёный островок между полосами: пальмы бульвара растут здесь.
    decor('palm', 66, 135, 2),
    decor('palm', 190, 134, 1),
    decor('palm', 314, 135, 2),
    decor('palm', 438, 134, 0),
    decor('palm', 562, 135, 2),
    decor('palm', 686, 134, 1),
    decor('bush', 128, 134),
    decor('bush', 376, 134),
    decor('bush', 624, 134),
    decor('flowerbed', 252, 135),
    decor('flowerbed', 500, 135),

    // Дальняя полоса и тротуар у нижнего края.
    decor('car', 150, 154, 3),
    decor('car', 460, 156, 2),
    decor('lamp', 220, 164),
    decor('lamp', 540, 164),
    decor('bin', 380, 165),
  ],

  gates: [gateLeft('downtown', 98), gateRight('pier', WIDTH, 98)],
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
