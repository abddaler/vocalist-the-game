import type { DistrictDef } from '@core/types';
import { decor, gateLeft, house, fill } from './plan';

/**
 * Ocean Drive: набережная. Репетируют и пишутся здесь же, в бывших
 * ангарах у самой воды, поэтому дневная работа соседствует с пляжем.
 *
 * Ради этого района земля и разбита на плитки: улица наверху, за
 * парапетом обрыв, ниже настил, песок и прибой. Спуститься можно только
 * по двум лестницам — и от этого набережная читается как берег, а не как
 * ещё одна полоса асфальта.
 */
export const PIER: DistrictDef = {
  id: 'pier',
  nameKey: 'district.pier',
  map: { x: 4, y: 48, w: 54, h: 26 },
  spawn: { x: 21.5, y: 5.5 },

  tiles: {
    legend: {
      '#': { kind: 'pavement', level: 1 },
      '.': { kind: 'road', level: 1 },
      '|': { kind: 'roadLine', level: 1 },
      '-': { kind: 'pavement', level: 1 },
      '/': { kind: 'steps', level: 1 },
      '=': { kind: 'deck', level: 0 },
      ':': { kind: 'sand', level: 0 },
      '~': { kind: 'water', level: 0 },
    },
    rows: [
      '############################################',
      '############################################',
      '############################################',
      '############################################',
      '............................................',
      '||||||||||||||||||||||||||||||||||||||||||||',
      '............................................',
      '--------------------------------------------',
      '--------///-------------------///-----------',
      '============================================',
      '============================================',
      '============================================',
      '::::::::::::::::::::::::::::::::::::::::::::',
      '::::::::::::::::::::::::::::::::::::::::::::',
      '::::::::::::::::::::::::::::::::::::::::::::',
      '::::::::::::::::::::::::::::::::::::::::::::',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    ],
  },

  buildings: [
    house('rehearsal_base', 'warehouse', 7, 6, 62, 0x8fb0c0),
    house('record_studio', 'record', 21, 6, 66, 0xa0c090),
  ],

  scenery: [
    fill('shack', 1, 5, 50, 0xd8b890, 'sign.garage'),
    fill('shack', 14, 6, 46, 0xe0c8a0, 'sign.hangar'),
    fill('market', 28, 5, 52, 0x90c0b8, 'sign.market'),
    fill('shack', 34, 4, 44, 0xd8a890, 'sign.icehouse'),
    fill('warehouse', 39, 5, 58, 0xb8c0c8, 'sign.warehouse'),
  ],

  decor: [
    // Улица у ангаров.
    decor('palm', 0.5, 2.5, 2),
    decor('palm', 6.5, 2.5, 1),
    decor('palm', 13.5, 2.5, 2),
    decor('palm', 20.5, 2.5, 0),
    decor('palm', 27.5, 2.5, 1),
    decor('palm', 33.5, 2.5, 2),
    decor('palm', 40.5, 2.5, 0),
    decor('crate', 4.5, 2.5),
    decor('crate', 5.5, 2.2, 1),
    decor('surfboard', 12.2, 2.6, 0),
    decor('surfboard', 12.8, 2.6, 2),
    decor('lamp', 11.5, 2.5),
    decor('lamp', 26.5, 2.5),
    decor('lamp', 38.5, 2.5),
    decor('car', 16.5, 5.5, 1),
    decor('car', 35.5, 5.5, 0),

    // Парапет над набережной: всё вдоль перил, проход свободен.
    decor('bollard', 3.5, 8.5),
    decor('bollard', 21.5, 8.5),
    decor('bollard', 25.5, 8.5),
    decor('bin', 18.5, 7.5),
    decor('bench', 14.5, 7.5),
    decor('bike', 34.5, 7.5),

    // Настил: скамьи, пальмы, кафе.
    decor('bench', 16.5, 10.5),
    decor('bench', 36.5, 10.5),
    decor('bin', 31.5, 10.5),
    decor('palm', 4.5, 10.5, 1),
    decor('palm', 20.5, 10.5, 2),
    decor('palm', 39.5, 10.5, 0),
    decor('dog', 23.5, 11.5, 1),
    decor('newsbox', 27.5, 10.5),
    decor('parasol', 10.5, 10.5),
    decor('hut', 6.5, 10.5),
    decor('stall', 25.5, 10.5, 0),
    decor('stall', 37.5, 10.5, 2),
    decor('kiosk', 16.5, 10.5),
    decor('crate', 30.5, 10.5, 1),
    decor('bench', 8.5, 7.5),
    decor('bin', 6.5, 7.5),
    decor('bollard', 12.5, 8.5),
    decor('bollard', 16.5, 8.5),
    decor('bollard', 38.5, 8.5),

    // Пляж: полотенца, лежаки, зонты, спасательная вышка.
    decor('lifeguard', 32.5, 13.5),
    decor('deckchair', 3.5, 12.5, 0),
    decor('deckchair', 5.5, 14.5, 1),
    decor('umbrella', 4.5, 13.5, 0),
    decor('towel', 8.5, 14.5, 0),
    decor('deckchair', 10.5, 14.5, 2),
    decor('umbrella', 9.5, 12.5, 1),
    decor('towel', 15.5, 13.5, 1),
    decor('boat', 18.5, 15.2, 0),
    decor('surfboard', 24.5, 12.5, 1),
    decor('towel', 26.5, 14.5, 2),
    decor('umbrella', 28.5, 13.5, 1),
    decor('deckchair', 30.5, 14.5, 0),
    decor('deckchair', 35.5, 14.5, 1),
    decor('umbrella', 36.5, 12.5, 0),
    decor('towel', 40.5, 14.5, 3),
    decor('crate', 42.5, 12.5, 1),
    decor('umbrella', 12.5, 13.5, 2),
    decor('deckchair', 13.5, 14.5, 1),
    decor('towel', 20.5, 13.5, 1),
    decor('umbrella', 22.5, 14.5, 0),
    decor('deckchair', 21.5, 12.5, 2),
    decor('towel', 33.5, 12.5, 0),
    decor('deckchair', 38.5, 13.5, 2),
    decor('umbrella', 39.5, 14.5, 1),
    decor('gull', 14, -1.0, 0),
    decor('gull', 24, -2.0, 1),
    decor('gull', 32, 0.0, 0),
  ],

  gates: [gateLeft('boulevard', 5)],
  points: [],
};
