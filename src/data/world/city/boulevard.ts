import type { DistrictDef } from '@core/types';
import { decor, fill, gateLeft, gateRight, group, house } from './plan';

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
    // Тротуар у витрин. Высокое — строго в разрывах между вывесками,
    // терраса кафе и лотки — рядом с бордюром, где щиты уже не задеть.
    decor('palm', 0.8, 2.5, 1),
    decor('palm', 7.0, 2.5, 0),
    decor('tree', 12.8, 2.5, 1),
    decor('palm', 18.0, 2.5, 1),
    decor('tree', 23.8, 2.5, 0),
    decor('palm', 29.6, 2.5, 0),
    decor('palm', 35.2, 2.5, 2),
    decor('bush', 5.5, 2.5),
    decor('bush', 16.5, 2.5),
    decor('flowerbed', 21.5, 2.5),
    decor('flowerbed', 39.5, 2.5),

    // Бордюр: фонари вразнобой, кафе у ресторана, лотки и киоск.
    decor('lamp', 3.5, 4.5),
    decor('lamp', 15.5, 4.5),
    decor('lamp', 33.5, 4.5),
    ...group.cafe(12.5, 4.5, 0),
    decor('table', 17.5, 4.5),
    ...group.market(6.5, 4.5, 1),
    ...group.market(30.5, 4.5, 3),
    decor('kiosk', 24.5, 4.5),
    ...group.rest(0.6, 4.5),
    ...group.bollards(9.5, 3, 4.5),
    decor('newsbox', 35.5, 4.5),
    decor('trafficLight', 19.5, 4.5),

    // Первая проезжая часть.
    decor('car', 4.5, 6.5, 2),
    decor('car', 21.5, 6.5, 0),
    decor('car', 36.5, 6.5, 1),

    // Зелёный островок между полосами: пальмы бульвара растут здесь.
    decor('palm', 3.5, 8.5, 2),
    decor('palm', 10.2, 8.5, 1),
    decor('palm', 19.5, 8.5, 2),
    decor('palm', 28.9, 8.5, 0),
    decor('bush', 23.5, 8.5),
    decor('flowerbed', 15.5, 8.5),

    // Дальняя полоса и тротуар у нижнего края.
    decor('car', 9.5, 10.5, 3),
    decor('car', 28.5, 10.5, 2),
    ...group.rest(19.5, 13.5),
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
