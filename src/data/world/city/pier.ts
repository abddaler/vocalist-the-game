import type { DistrictDef } from '@core/types';
import { band, curbs, decor, fill, gateLeft, house, stairs } from './plan';

const WIDTH = 640;
const HEIGHT = 216;

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
    band('pavement', 66, 22, WIDTH),
    band('road', 88, 24, WIDTH),
    band('pavement', 112, 18, WIDTH, 10),
    stairs(120, 130, 26, 10),
    stairs(430, 130, 26, 10),
    band('boardwalk', 140, 26, WIDTH),
    band('sand', 166, 32, WIDTH),
    band('water', 198, 18, WIDTH),
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
    decor('car', 240, 106, 1),
    decor('car', 520, 108, 0),

    // Парапет над набережной: всё вдоль перил, проход остаётся свободным.
    decor('bollard', 60, 128),
    decor('bollard', 330, 128),
    decor('bollard', 366, 128),
    decor('bollard', 402, 128),
    decor('bin', 268, 128),
    decor('bench', 200, 128),
    decor('bike', 484, 128),

    // Настил: скамьи, пальмы, кафе.
    decor('bench', 236, 158),
    decor('bench', 512, 158),
    decor('bin', 452, 158),
    decor('palm', 60, 156, 1),
    decor('palm', 300, 156, 2),
    decor('palm', 560, 156, 0),
    decor('dog', 340, 162, 1),
    decor('newsbox', 396, 158),
    decor('parasol', 156, 160),

    // Пляж: полотенца, лежаки, зонты, спасательная вышка.
    decor('lifeguard', 466, 184),
    decor('deckchair', 56, 178, 0),
    decor('deckchair', 84, 186, 1),
    decor('umbrella', 70, 182, 0),
    decor('towel', 118, 190, 0),
    decor('deckchair', 152, 186, 2),
    decor('umbrella', 140, 180, 1),
    decor('towel', 214, 184, 1),
    decor('boat', 268, 194, 0),
    decor('surfboard', 350, 180, 1),
    decor('towel', 384, 192, 2),
    decor('umbrella', 418, 182, 1),
    decor('deckchair', 440, 188, 0),
    decor('deckchair', 496, 186, 1),
    decor('umbrella', 520, 180, 0),
    decor('towel', 566, 190, 3),
    decor('crate', 604, 176, 1),
    decor('gull', 200, 12, 0),
    decor('gull', 340, 6, 1),
    decor('gull', 448, 16, 0),
  ],

  gates: [gateLeft('boulevard', 92)],
  solids: curbs(WIDTH),
  points: [],
};
