import type { DistrictDef } from '@core/types';
import { STREET, curbs, decor, fillLower, fillUpper, gateLeft, upper } from './plan';

const WIDTH = 620;

/**
 * Причал: склады, в которых репетируют и пишутся. Работа тут дневная и
 * грязноватая, поэтому и палитра выцветшая — бетон, ржавчина, вода.
 */
export const PIER: DistrictDef = {
  id: 'pier',
  nameKey: 'district.pier',
  map: { x: 4, y: 48, w: 54, h: 26 },
  width: WIDTH,
  height: STREET.height,
  spawn: { x: 300, y: 126 },

  buildings: [
    upper('rehearsal_base', 46, 146, 0x7f9ba8),
    upper('record_studio', 226, 146, 0x8fa87f),
  ],

  scenery: [
    fillUpper(406, 140, 0xa89a7f, 'sign.warehouse'),
    fillLower(28, 128, 0x8a8f96, 'sign.garage'),
    fillLower(186, 118, 0xa8927f, 'sign.hangar'),
    fillLower(336, 152, 0x7fa8a0, 'sign.market'),
    fillLower(512, 96, 0x96a87f, 'sign.icehouse'),
  ],

  decor: [
    decor('crate', 22, 102, 0),
    decor('crate', 40, 103, 1),
    decor('crate', 194, 101, 1),
    decor('crate', 574, 102, 0),
    decor('bollard', 116, 148),
    decor('bollard', 168, 148),
    decor('bollard', 220, 148),
    decor('bollard', 272, 148),
    decor('gull', 380, 26, 0),
    decor('gull', 452, 18, 1),
    decor('gull', 508, 30, 0),
    decor('lamp', 100, 101),
    decor('lamp', 350, 101),
    decor('lamp', 528, 101),
    decor('bin', 480, 148),
    decor('car', 420, 147, 3),
  ],

  gates: [gateLeft('boulevard')],
  solids: curbs(WIDTH),
  points: [],
};
