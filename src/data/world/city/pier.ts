import type { DistrictDef } from '@core/types';
import { band, curbs, decor, fill, gateLeft, house, stairs } from './plan';

const WIDTH = 640;
const HEIGHT = 210;

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
    band('pavement', 110, 14, WIDTH, 10),
    stairs(120, 124, 26, 10),
    stairs(430, 124, 26, 10),
    band('boardwalk', 134, 24, WIDTH),
    band('sand', 158, 32, WIDTH),
    band('water', 190, 20, WIDTH),
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
    decor('bollard', 60, 122),
    decor('bollard', 330, 122),
    decor('bollard', 366, 122),
    decor('bollard', 402, 122),
    decor('bin', 268, 122),
    decor('bench', 200, 122),
    decor('bike', 484, 122),

    // Настил: скамьи, пальмы, велосипеды.
    decor('bench', 236, 150),
    decor('bench', 512, 150),
    decor('bin', 452, 150),
    decor('palm', 60, 148, 1),
    decor('palm', 300, 148, 2),
    decor('palm', 560, 148, 0),
    decor('dog', 340, 154, 1),
    decor('newsbox', 396, 150),
    decor('parasol', 156, 152),
    decor('table', 176, 150),

    // Пляж: полотенца, лежаки, зонты, спасательная вышка.
    decor('lifeguard', 466, 176),
    decor('deckchair', 56, 170, 0),
    decor('deckchair', 84, 178, 1),
    decor('umbrella', 70, 174, 0),
    decor('towel', 118, 182, 0),
    decor('deckchair', 152, 178, 2),
    decor('umbrella', 140, 172, 1),
    decor('towel', 214, 176, 1),
    decor('boat', 268, 186, 0),
    decor('surfboard', 350, 172, 1),
    decor('towel', 384, 184, 2),
    decor('umbrella', 418, 174, 1),
    decor('deckchair', 440, 180, 0),
    decor('deckchair', 496, 178, 1),
    decor('umbrella', 520, 172, 0),
    decor('towel', 566, 182, 3),
    decor('crate', 604, 168, 1),
    decor('gull', 200, 12, 0),
    decor('gull', 340, 6, 1),
    decor('gull', 448, 16, 0),
  ],

  gates: [gateLeft('boulevard', 90)],
  solids: curbs(WIDTH),
  points: [],
};
