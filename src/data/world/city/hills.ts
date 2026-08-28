import type { DistrictDef } from '@core/types';
import { band, curbs, decor, fill, gateRight, house, patch, stairs } from './plan';

const WIDTH = 700;
const HEIGHT = 156;

/**
 * Sunset Hills: жилой склон над городом. Здесь игрок живёт и держит себя
 * в форме, поэтому район самый спокойный — светлая штукатурка, черепица,
 * газон с деревьями, ни одной вывески в неоне.
 *
 * Дома стоят на террасе над улицей: от подъезда к тротуару спускаются
 * две лестницы, и это первое место, где видно, что район не полоса.
 */
export const HILLS: DistrictDef = {
  id: 'hills',
  nameKey: 'district.hills',
  map: { x: 30, y: 2, w: 84, h: 30 },
  width: WIDTH,
  height: HEIGHT,
  spawn: { x: 300, y: 84 },

  terrain: [
    band('plaza', 66, 22, WIDTH, 6),
    // Палисадники у стен, с разрывами напротив подъездов: сплошная
    // зелёная полоса во всю улицу читается газонной дорожкой, а не садом.
    patch('grass', 0, 66, 40, 9),
    patch('grass', 86, 66, 149, 9),
    patch('grass', 281, 66, 134, 9),
    patch('grass', 461, 66, 239, 9),
    stairs(176, 88, 24, 6),
    stairs(468, 88, 24, 6),
    band('pavement', 94, 18, WIDTH),
    band('road', 112, 30, WIDTH),
    band('grass', 142, 14, WIDTH),
  ],

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
    // Палисадник на террасе.
    decor('palm', 16, 75, 2),
    decor('tree', 106, 74, 0),
    decor('palm', 202, 75, 1),
    decor('tree', 300, 74, 1),
    decor('palm', 386, 75, 2),
    decor('tree', 478, 74, 2),
    decor('palm', 570, 75, 0),
    decor('tree', 668, 74, 0),
    decor('bush', 100, 74),
    decor('bush', 154, 74),
    decor('bush', 250, 74),
    decor('bush', 344, 74),
    decor('bush', 438, 74),
    decor('bush', 528, 74),
    decor('bush', 624, 74),
    decor('flowerbed', 140, 75),
    decor('flowerbed', 424, 75),
    decor('mailbox', 96, 86),
    decor('bench', 116, 86),
    decor('bench', 512, 86),
    decor('planter', 250, 87),
    decor('planter', 396, 87),
    decor('lamp', 64, 87),
    decor('lamp', 264, 87),
    decor('lamp', 462, 87),
    decor('lamp', 646, 87),

    // Тротуар под террасой.
    decor('hydrant', 244, 108),
    decor('bin', 520, 108),
    decor('newsbox', 348, 108),
    decor('dog', 190, 109, 0),
    decor('bike', 340, 110),
    decor('bench', 596, 108),

    // Мостовая и газон у нижнего края.
    decor('car', 96, 136, 0),
    decor('car', 300, 138, 3),
    decor('car', 610, 134, 1),
    decor('tree', 60, 154, 1),
    decor('tree', 214, 155, 0),
    decor('tree', 388, 154, 2),
    decor('tree', 556, 155, 1),
    decor('bush', 148, 152),
    decor('bush', 470, 152),
    decor('bush', 650, 153),
  ],

  gates: [gateRight('downtown', WIDTH, 96)],
  solids: curbs(WIDTH),
  points: [],
};
