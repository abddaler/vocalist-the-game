import type { DistrictDef } from '@core/types';
import { band, curbs, decor, fill, gateLeft, house, stairs } from './plan';

const WIDTH = 640;
const HEIGHT = 192;

/**
 * Ocean Drive: набережная. Репетируют и пишутся здесь же, в бывших
 * ангарах у самой воды, поэтому дневная работа соседствует с пляжем.
 *
 * Ради этого района вся земля и разбита на плиты: улица наверху, за
 * парапетом обрыв, ниже настил, песок и прибой. Спуститься можно только
 * по двум лестницам — и от этого набережная читается как берег, а не как
 * ещё одна полоса асфальта.
 */
export const PIER: DistrictDef = {
  id: 'pier',
  nameKey: 'district.pier',
  map: { x: 4, y: 48, w: 54, h: 26 },
  width: WIDTH,
  height: HEIGHT,
  spawn: { x: 300, y: 80 },

  terrain: [
    band('pavement', 66, 20, WIDTH),
    band('road', 86, 24, WIDTH),
    band('pavement', 110, 12, WIDTH, 10),
    stairs(120, 122, 26, 10),
    stairs(430, 122, 26, 10),
    band('boardwalk', 132, 26, WIDTH),
    band('sand', 158, 22, WIDTH),
    band('water', 180, 12, WIDTH),
  ],

  buildings: [
    house('rehearsal_base', 'warehouse', 108, 92, 0x8fb0c0),
    house('record_studio', 'record', 296, 92, 0xa0c090),
  ],

  scenery: [
    fill('shack', 16, 80, 0xd8b890, 'sign.garage'),
    fill('shack', 210, 74, 0xe0c8a0, 'sign.hangar'),
    fill('market', 398, 82, 0x90c0b8, 'sign.market'),
    fill('shack', 492, 76, 0xd8a890, 'sign.icehouse'),
    fill('warehouse', 578, 58, 0xb8c0c8, 'sign.warehouse'),
  ],

  decor: [
    // Улица у ангаров.
    decor('palm', 8, 80, 2),
    decor('palm', 96, 78, 1),
    decor('palm', 196, 80, 2),
    decor('palm', 288, 78, 0),
    decor('palm', 388, 80, 1),
    decor('palm', 486, 78, 2),
    decor('palm', 570, 80, 0),
    decor('palm', 632, 79, 1),
    decor('crate', 62, 82),
    decor('crate', 84, 84, 1),
    decor('surfboard', 172, 80, 0),
    decor('surfboard', 182, 80, 2),
    decor('lamp', 148, 82),
    decor('lamp', 356, 82),
    decor('lamp', 556, 82),
    decor('car', 240, 104, 1),
    decor('car', 520, 106, 0),

    // Парапет над набережной.
    decor('bollard', 60, 120),
    decor('bollard', 330, 120),
    decor('bollard', 366, 120),
    decor('bollard', 402, 120),
    decor('bin', 268, 120),
    decor('bench', 200, 120),
    decor('bike', 484, 120),

    // Настил: скамьи, чайки, велосипеды.
    decor('bench', 236, 146),
    decor('bench', 512, 146),
    decor('bin', 452, 146),
    decor('palm', 60, 144, 1),
    decor('palm', 300, 144, 2),
    decor('palm', 560, 144, 0),
    decor('dog', 306, 150, 1),
    decor('newsbox', 396, 146),

    // Пляж.
    decor('lifeguard', 466, 172),
    decor('deckchair', 56, 170, 0),
    decor('deckchair', 82, 174, 1),
    decor('umbrella', 70, 172, 0),
    decor('deckchair', 146, 174, 2),
    decor('umbrella', 418, 172, 1),
    decor('deckchair', 450, 174, 0),
    decor('boat', 244, 176, 0),
    decor('surfboard', 350, 170, 1),
    decor('gull', 200, 12, 0),
    decor('gull', 340, 6, 1),
    decor('gull', 448, 16, 0),
  ],

  gates: [gateLeft('boulevard', 90)],
  solids: curbs(WIDTH),
  points: [],
};
