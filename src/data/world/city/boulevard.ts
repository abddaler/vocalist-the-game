import type { DistrictDef } from '@core/types';
import { decor, fill, gateLeft, gateRight, house } from './plan';

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
  spawn: { x: 20.5, y: 3.5 },

  tiles: {
    legend: {
      '~': { kind: 'pavement', level: 0 },
      '.': { kind: 'road', level: 0 },
      '|': { kind: 'roadLine', level: 0 },
      ',': { kind: 'grass', level: 0 },
    },
    rows: [
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '..........................................',
      '||||||||||||||||||||||||||||||||||||||||||',
      '..........................................',
      ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
      '..........................................',
      '||||||||||||||||||||||||||||||||||||||||||',
      '..........................................',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    ],
  },

  buildings: [
    house('club_vertigo', 'club', 1, 6, 68, 0x6a3f8f),
    house('restaurant', 'restaurant', 13, 5, 52, 0xd8a070),
    house('clothes_shop', 'shop', 24, 5, 50, 0xd88fb0),
  ],

  scenery: [
    fill('bar', 8, 4, 46, 0x6f5aa8, 'sign.bar'),
    fill('shop', 19, 4, 44, 0x70b8d8, 'sign.tattoo'),
    fill('cinema', 30, 5, 60, 0xd87080, 'sign.cinema'),
    fill('theatre', 36, 5, 54, 0xc8a05f, 'sign.theatre'),
  ],

  decor: [
    // Тротуар у витрин: терраса кафе, очередь, афиши. Мебель стоит
    // вразбежку по двум рядам — сплошная линия предметов запирает
    // тротуар не хуже стены.
    decor('palm', 0.5, 2.5, 1),
    decor('palm', 12.5, 2.5, 0),
    decor('palm', 23.5, 2.5, 1),
    decor('palm', 35.5, 2.5, 0),
    decor('tree', 7.5, 2.5, 1),
    decor('tree', 31.5, 2.5, 0),
    decor('billboard', 17.5, 2.5, 0),
    decor('billboard', 27.5, 2.5, 2),
    decor('lamp', 3.5, 4.5),
    decor('lamp', 15.5, 4.5),
    decor('lamp', 28.5, 4.5),
    decor('lamp', 38.5, 4.5),
    decor('parasol', 12.5, 4.5),
    decor('parasol', 14.5, 3.5),
    decor('bench', 9.5, 4.5),
    decor('bench', 33.5, 4.5),
    decor('bin', 20.5, 4.5),
    decor('bollard', 5.5, 4.5),
    decor('newsbox', 25.5, 4.5),
    decor('stall', 6.5, 3.5, 1),
    decor('stall', 30.5, 3.5, 3),
    decor('kiosk', 24.5, 3.5),
    decor('table', 13.5, 3.5),
    decor('hydrant', 36.5, 4.5),
    decor('trafficLight', 18.5, 4.5),

    // Первая проезжая часть.
    decor('car', 4.5, 6.5, 2),
    decor('car', 21.5, 6.5, 0),
    decor('car', 36.5, 6.5, 1),

    // Зелёный островок между полосами: пальмы бульвара растут здесь.
    decor('palm', 3.5, 8.5, 2),
    decor('palm', 11.5, 8.5, 1),
    decor('palm', 19.5, 8.5, 2),
    decor('palm', 27.5, 8.5, 0),
    decor('palm', 35.5, 8.5, 2),
    decor('bush', 7.5, 8.5),
    decor('bush', 23.5, 8.5),
    decor('bush', 39.5, 8.5),
    decor('flowerbed', 15.5, 8.5),
    decor('flowerbed', 31.5, 8.5),

    // Дальняя полоса и тротуар у нижнего края.
    decor('car', 9.5, 10.5, 3),
    decor('car', 28.5, 10.5, 2),
    decor('lamp', 13.5, 13.5),
    decor('lamp', 32.5, 13.5),
    decor('bin', 23.5, 13.5),
  ],

  gates: [gateLeft('downtown', 6), gateRight('pier', 42, 6)],
  points: [
    {
      id: 'orders_board',
      nameKey: 'venue.corporate',
      rect: { x: 40, y: 3, w: 1, h: 1 },
      color: 0x8f7a4a,
      prop: 'board',
      activities: [],
      venues: ['corporate'],
    },
  ],
};
