import type { DistrictDef } from '@core/types';
import { STREET, curbs, decor, fillLower, fillUpper, gateRight, lower, upper } from './plan';

const WIDTH = 680;

/**
 * Холмы: жилой склон над городом. Здесь игрок живёт и держит себя в
 * форме, поэтому район сделан самым спокойным — светлая штукатурка,
 * пальмы вдоль тротуара, ни одной вывески в неоне.
 */
export const HILLS: DistrictDef = {
  id: 'hills',
  nameKey: 'district.hills',
  map: { x: 30, y: 2, w: 84, h: 30 },
  width: WIDTH,
  height: STREET.height,
  spawn: { x: 300, y: 126 },

  buildings: [
    upper('apartment', 34, 132, 0x6f7fa8),
    upper('phoniatrist', 356, 132, 0x7fa894),
    lower('gym', 92, 130, 0xa87f7f),
  ],

  scenery: [
    fillUpper(190, 140, 0x8f86b8, 'sign.villa'),
    fillUpper(514, 130, 0xb89b7a, 'sign.terrace'),
    fillLower(248, 120, 0x8ba0b8, 'sign.laundry'),
    fillLower(392, 140, 0xb8a877, 'sign.coffee'),
    fillLower(556, 110, 0x9bb888, 'sign.florist'),
  ],

  decor: [
    decor('palm', 24, 102, 2),
    decor('palm', 176, 100, 1),
    decor('palm', 330, 102, 2),
    decor('palm', 496, 100, 0),
    decor('palm', 648, 102, 1),
    decor('lamp', 108, 101),
    decor('lamp', 410, 101),
    decor('lamp', 268, 148),
    decor('lamp', 604, 148),
    decor('bench', 232, 148),
    decor('bench', 546, 148),
    decor('planter', 70, 148),
    decor('planter', 368, 148),
    decor('hydrant', 300, 101),
    decor('car', 150, 147, 0),
    decor('car', 470, 147, 3),
  ],

  gates: [gateRight('downtown', WIDTH)],
  solids: curbs(WIDTH),
  points: [],
};
