import type { DistrictDef } from '@core/types';
import { STREET, curbs, decor, fill, gateRight, house } from './plan';

const WIDTH = 660;

/**
 * Sunset Hills: жилой склон над городом. Здесь игрок живёт и держит себя
 * в форме, поэтому район самый спокойный — светлая штукатурка, пальмы
 * вдоль тротуара, ни одной вывески в неоне.
 */
export const HILLS: DistrictDef = {
  id: 'hills',
  nameKey: 'district.hills',
  map: { x: 30, y: 2, w: 84, h: 30 },
  width: WIDTH,
  height: STREET.height,
  spawn: { x: 300, y: 84 },

  buildings: [
    house('apartment', 20, 86, 0x7f8fc0),
    house('gym', 206, 80, 0xc08a8a),
    house('phoniatrist', 378, 84, 0x8fc0a8),
  ],

  scenery: [
    fill(118, 74, 0xa08fd0, 'sign.villa'),
    fill(298, 66, 0x8fb0d0, 'sign.laundry'),
    fill(474, 74, 0xd0b888, 'sign.coffee'),
    fill(560, 82, 0xa8d098, 'sign.florist'),
  ],

  decor: [
    decor('palm', 12, 74, 2),
    decor('palm', 108, 72, 1),
    decor('palm', 200, 74, 2),
    decor('palm', 292, 72, 0),
    decor('palm', 372, 74, 1),
    decor('palm', 468, 72, 2),
    decor('palm', 556, 74, 0),
    decor('palm', 648, 73, 1),
    decor('lamp', 64, 71),
    decor('lamp', 250, 71),
    decor('lamp', 430, 71),
    decor('lamp', 604, 71),
    decor('bench', 156, 97),
    decor('dog', 178, 97, 0),
    decor('mailbox', 96, 71),
    decor('bike', 330, 97),
    decor('surfboard', 512, 71, 1),
    decor('bench', 420, 97),
    decor('planter', 60, 97),
    decor('planter', 344, 97),
    decor('planter', 524, 97),
    decor('hydrant', 232, 97),
    decor('bin', 500, 97),
    decor('car', 96, 99, 0),
    decor('car', 290, 99, 3),
    decor('car', 592, 99, 1),
  ],

  gates: [gateRight('downtown', WIDTH)],
  solids: curbs(WIDTH),
  points: [],
};
