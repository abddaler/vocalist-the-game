import type { DistrictDef } from '@core/types';
import { decor, fill, gateRight, house } from './plan';

/**
 * Sunset Hills: жилой склон над городом. Здесь игрок живёт и держит себя
 * в форме, поэтому район самый спокойный — светлая штукатурка, черепица,
 * газон с деревьями, ни одной вывески в неоне.
 *
 * Дома стоят на террасе над улицей: от подъездов к тротуару спускаются
 * две лестницы, и это первое место, где видно, что район не полоса.
 */
export const HILLS: DistrictDef = {
  id: 'hills',
  nameKey: 'district.hills',
  map: { x: 30, y: 2, w: 84, h: 30 },
  spawn: { x: 19.5, y: 3.5 },

  tiles: {
    legend: {
      '#': { kind: 'plaza', level: 1 },
      ',': { kind: 'grass', level: 1 },
      '"': { kind: 'grass', level: 0 },
      '/': { kind: 'steps', level: 1 },
      '~': { kind: 'pavement', level: 0 },
      '.': { kind: 'road', level: 0 },
    },
    rows: [
      '########################################',
      '########################################',
      ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
      '########################################',
      '#########///###############///##########',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '........................................',
      '........................................',
      '........................................',
      '""""""""""""""""""""""""""""""""""""""""',
      '""""""""""""""""""""""""""""""""""""""""'
    ],
  },

  buildings: [
    house('apartment', 'apartment', 1, 6, 74, 0x8494c4),
    house('gym', 'gym', 14, 5, 54, 0xc48a8a),
    house('phoniatrist', 'clinic', 25, 5, 58, 0xa8ccc0),
  ],

  scenery: [
    fill('villa', 8, 5, 46, 0xc0a894, 'sign.villa'),
    fill('villa', 20, 4, 44, 0xb8c0a0, 'sign.terrace'),
    fill('shop', 31, 4, 48, 0xd0b888, 'sign.coffee'),
    fill('shop', 36, 4, 44, 0xa8d098, 'sign.florist'),
  ],

  decor: [
    // Палисадник вдоль террасы, мимо подъездов: перед дверью должно
    // оставаться место, чтобы к ней подойти.
    decor('palm', 0.5, 2.5, 2),
    decor('tree', 7.5, 2.5, 0),
    decor('palm', 10.5, 2.5, 1),
    decor('bush', 9.5, 2.5),
    decor('bush', 11.5, 2.5),
    decor('tree', 19.5, 2.5, 1),
    decor('palm', 22.5, 2.5, 2),
    decor('bush', 21.5, 2.5),
    decor('flowerbed', 24.5, 2.5),
    decor('tree', 31.5, 2.5, 2),
    decor('palm', 34.5, 2.5, 0),
    decor('bush', 33.5, 2.5),
    decor('bush', 36.5, 2.5),
    decor('flowerbed', 38.5, 2.5),

    // Кромка террасы: мебель у самых перил.
    decor('mailbox', 4.5, 3.5),
    decor('bench', 6.5, 3.5),
    decor('bench', 31.5, 3.5),
    decor('planter', 14.5, 3.5),
    decor('planter', 23.5, 3.5),
    decor('lamp', 2.5, 3.5),
    decor('lamp', 17.5, 3.5),
    decor('lamp', 34.5, 3.5),

    // Тротуар под террасой.
    decor('hydrant', 13.5, 5.5),
    decor('bin', 29.5, 5.5),
    decor('newsbox', 20.5, 5.5),
    decor('dog', 11.5, 6.5, 0),
    decor('bike', 19.5, 6.5),
    decor('bench', 35.5, 5.5),

    // Мостовая и газон у нижнего края.
    decor('car', 5.5, 8.5, 0),
    decor('car', 17.5, 8.5, 3),
    decor('car', 33.5, 8.5, 1),
    decor('tree', 3.5, 11.5, 1),
    decor('tree', 12.5, 11.5, 0),
    decor('tree', 22.5, 11.5, 2),
    decor('tree', 31.5, 11.5, 1),
    decor('bush', 8.5, 11.5),
    decor('bush', 27.5, 11.5),
    decor('bush', 37.5, 11.5),
  ],

  gates: [gateRight('downtown', 40, 6)],
  points: [],
};
