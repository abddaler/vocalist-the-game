import type { DistrictDef } from '@core/types';
import { STREET, curbs, decor, fill, gateRight, house } from './plan';

const WIDTH = 700;

/**
 * Sunset Hills: жилой склон над городом. Здесь игрок живёт и держит себя
 * в форме, поэтому район самый спокойный — светлая штукатурка, черепица,
 * газон с деревьями вдоль тротуара, ни одной вывески в неоне.
 */
export const HILLS: DistrictDef = {
  id: 'hills',
  nameKey: 'district.hills',
  ground: 'street',
  strip: { y: 68, h: 9, kind: 'grass' },
  map: { x: 30, y: 2, w: 84, h: 30 },
  width: WIDTH,
  height: STREET.height,
  spawn: { x: 300, y: 86 },

  buildings: [
    house('apartment', 'apartment', 20, 86, 0x8494c4),
    house('gym', 'gym', 218, 80, 0xc48a8a),
    house('phoniatrist', 'clinic', 396, 84, 0xa8ccc0),
  ],

  scenery: [
    fill('villa', 118, 84, 0xc0a894, 'sign.villa'),
    fill('villa', 310, 72, 0xb8c0a0, 'sign.terrace'),
    fill('shop', 490, 76, 0xd0b888, 'sign.coffee'),
    fill('shop', 578, 84, 0xa8d098, 'sign.florist'),
  ],

  decor: [
    decor('palm', 12, 78, 2),
    decor('tree', 106, 76, 0),
    decor('palm', 202, 78, 1),
    decor('tree', 300, 76, 1),
    decor('palm', 386, 78, 2),
    decor('tree', 478, 76, 2),
    decor('palm', 570, 78, 0),
    decor('tree', 668, 76, 0),
    decor('bush', 60, 77),
    decor('bush', 154, 77),
    decor('bush', 250, 77),
    decor('bush', 344, 77),
    decor('bush', 438, 77),
    decor('bush', 528, 77),
    decor('bush', 624, 77),
    decor('flowerbed', 172, 76),
    decor('flowerbed', 424, 76),
    decor('lamp', 64, 74),
    decor('lamp', 264, 74),
    decor('lamp', 462, 74),
    decor('lamp', 646, 74),
    decor('bench', 156, 97),
    decor('bench', 440, 97),
    decor('dog', 190, 97, 0),
    decor('mailbox', 96, 74),
    decor('bike', 340, 97),
    decor('surfboard', 542, 74, 1),
    decor('planter', 60, 97),
    decor('planter', 366, 97),
    decor('hydrant', 244, 97),
    decor('bin', 520, 97),
    decor('car', 96, 99, 0),
    decor('car', 300, 99, 3),
    decor('car', 610, 99, 1),
  ],

  gates: [gateRight('downtown', WIDTH)],
  solids: curbs(WIDTH),
  points: [],
};
