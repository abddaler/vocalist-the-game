import type { DistrictDef } from '@core/types';
import { STREET, curbs, decor, fill, gateLeft, house } from './plan';

const WIDTH = 580;

/**
 * Harbor Pier: склады, в которых репетируют и пишутся. Работа тут дневная
 * и грязноватая, поэтому и палитра выцветшая — бетон, ржавчина, вода.
 */
export const PIER: DistrictDef = {
  id: 'pier',
  nameKey: 'district.pier',
  map: { x: 4, y: 48, w: 54, h: 26 },
  width: WIDTH,
  height: STREET.height,
  spawn: { x: 290, y: 84 },

  buildings: [
    house('rehearsal_base', 102, 88, 0x8fb0c0),
    house('record_studio', 284, 88, 0xa0c090),
  ],

  scenery: [
    fill(14, 78, 0xa8aab0, 'sign.garage'),
    fill(202, 70, 0xc0a890, 'sign.hangar'),
    fill(384, 78, 0xc0b490, 'sign.warehouse'),
    fill(474, 86, 0x90c0b8, 'sign.market'),
  ],

  decor: [
    decor('crate', 12, 76, 0),
    decor('crate', 34, 78, 1),
    decor('crate', 196, 76, 1),
    decor('crate', 376, 77, 0),
    decor('bollard', 84, 98),
    decor('bollard', 124, 98),
    decor('bollard', 164, 98),
    decor('bollard', 204, 98),
    decor('bollard', 244, 98),
    decor('gull', 200, 14, 0),
    decor('gull', 330, 8, 1),
    decor('gull', 430, 18, 0),
    decor('lamp', 92, 71),
    decor('lamp', 272, 71),
    decor('lamp', 466, 71),
    decor('bin', 356, 97),
    decor('bench', 440, 97),
    decor('car', 322, 99, 3),
    decor('car', 542, 99, 0),
  ],

  gates: [gateLeft('boulevard')],
  solids: curbs(WIDTH),
  points: [],
};
