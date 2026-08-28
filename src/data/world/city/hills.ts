import type { DistrictDef } from '@core/types';
import { band, curbs, decor, fill, gateRight, house, patch, stairs } from './plan';

const WIDTH = 700;
const HEIGHT = 162;

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
    band('plaza', 66, 30, WIDTH, 6),
    // Палисадники у стен, с разрывами напротив подъездов: сплошная
    // зелёная полоса во всю улицу читается газонной дорожкой, а не садом.
    patch('grass', 0, 66, 40, 9),
    patch('grass', 86, 66, 149, 9),
    patch('grass', 281, 66, 134, 9),
    patch('grass', 461, 66, 239, 9),
    stairs(176, 96, 24, 6),
    stairs(468, 96, 24, 6),
    band('pavement', 102, 18, WIDTH),
    band('road', 120, 26, WIDTH),
    band('grass', 146, 16, WIDTH),
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
    // Мебель — у самой кромки террасы: посреди неё она перегородила бы
    // проход, а вдоль перил её и ставят.
    decor('mailbox', 96, 94),
    decor('bench', 116, 94),
    decor('bench', 512, 94),
    decor('planter', 250, 95),
    decor('planter', 396, 95),
    decor('lamp', 64, 95),
    decor('lamp', 264, 95),
    decor('lamp', 462, 95),
    decor('lamp', 646, 95),

    // Тротуар под террасой.
    decor('hydrant', 244, 118),
    decor('bin', 520, 118),
    decor('newsbox', 348, 118),
    decor('dog', 190, 116, 0),
    decor('bike', 340, 119),
    decor('bench', 596, 118),

    // Мостовая и газон у нижнего края.
    decor('car', 96, 140, 0),
    decor('car', 300, 142, 3),
    decor('car', 610, 138, 1),
    decor('tree', 60, 160, 1),
    decor('tree', 214, 161, 0),
    decor('tree', 388, 160, 2),
    decor('tree', 556, 161, 1),
    decor('bush', 148, 158),
    decor('bush', 470, 158),
    decor('bush', 650, 159),
  ],

  gates: [gateRight('downtown', WIDTH, 104)],
  solids: curbs(WIDTH),
  points: [],
};
