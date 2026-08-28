import type { DistrictDef } from '@core/types';
import { STREET, curbs, decor, fill, gateLeft, house } from './plan';

const WIDTH = 640;

/**
 * Ocean Drive: набережная. Репетируют и пишутся здесь же, в бывших
 * ангарах у самой воды, поэтому дневная работа соседствует с пляжем.
 *
 * Это единственный район, где за домами не город, а океан, и земля не
 * асфальт, а доски настила и песок. Ради этого контраста он и сделан:
 * четыре одинаково устроенные улицы — не город, а один длинный коридор.
 */
export const PIER: DistrictDef = {
  id: 'pier',
  nameKey: 'district.pier',
  ground: 'boardwalk',
  kerb: 86,
  map: { x: 4, y: 48, w: 54, h: 26 },
  width: WIDTH,
  height: STREET.height,
  spawn: { x: 300, y: 86 },

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
    decor('palm', 8, 78, 2),
    decor('palm', 96, 76, 1),
    decor('palm', 196, 78, 2),
    decor('palm', 288, 76, 0),
    decor('palm', 388, 78, 1),
    decor('palm', 486, 76, 2),
    decor('palm', 570, 78, 0),
    decor('palm', 632, 77, 1),
    decor('lifeguard', 466, 101),
    decor('deckchair', 56, 99, 0),
    decor('deckchair', 82, 102, 1),
    decor('umbrella', 70, 100, 0),
    decor('deckchair', 146, 102, 2),
    decor('umbrella', 418, 100, 1),
    decor('deckchair', 450, 102, 0),
    decor('surfboard', 172, 74, 0),
    decor('surfboard', 182, 74, 2),
    decor('boat', 244, 101, 0),
    decor('crate', 62, 76, 0),
    decor('crate', 84, 78, 1),
    decor('bollard', 330, 97),
    decor('bollard', 366, 97),
    decor('bollard', 402, 97),
    decor('gull', 200, 12, 0),
    decor('gull', 340, 6, 1),
    decor('gull', 448, 16, 0),
    decor('lamp', 148, 74),
    decor('lamp', 356, 74),
    decor('lamp', 556, 74),
    decor('bin', 452, 97),
    decor('bike', 520, 97),
    decor('dog', 306, 97, 1),
    decor('bench', 236, 97),
  ],

  gates: [gateLeft('boulevard')],
  solids: curbs(WIDTH),
  points: [],
};
