import type { Frame } from './body';

/**
 * Приметы поверх одежды и лица: наушники звукорежиссёра, очки, сумка,
 * шарф. Символы: B — акцент, C — его тень, E — блик стекла.
 *
 * У каждой приметы свой ряд начала: очки садятся на глаза, шарф на шею,
 * сумка на плечо. Без этого пришлось бы дописывать пустые ряды сверху и
 * рисунок перестал бы читаться в исходнике.
 */
export type Accessory =
  | 'none'
  | 'headphones'
  | 'glasses'
  | 'shades'
  | 'earrings'
  | 'scarf'
  | 'necklace'
  | 'bag';

export interface AccessoryFrames {
  /** Ряд кадра, с которого ложится рисунок. */
  readonly top: number;
  readonly front: Frame;
  readonly back: Frame;
  readonly side: Frame;
}

/** У очков и цепочки нет вида со спины: там их попросту не видно. */
const NONE: Frame = [];

export const ACCESSORY: Readonly<Record<Accessory, AccessoryFrames>> = {
  none: { top: 0, front: NONE, back: NONE, side: NONE },

  headphones: {
    top: 1,
    front: [
      '...1BBBBBB1...',
      '..1B......B1..',
      '.1BB......BB1.',
      '.1BC......CB1.',
      '.1BC......CB1.',
    ],
    back: [
      '...1BBBBBB1...',
      '..1B......B1..',
      '.1BB......BB1.',
      '.1BC......CB1.',
      '.1BC......CB1.',
    ],
    side: [
      '...1BBBBBB1...',
      '..1B..........',
      '.1BB..........',
      '.1BC..........',
      '.1BC..........',
    ],
  },

  glasses: {
    top: 4,
    front: ['..1BBBBBBBB1..', '..1BEB11BEB1..'],
    back: NONE,
    side: ['.....1BBBBB1..', '.....1BEB1B1..'],
  },

  shades: {
    top: 4,
    front: ['..1BBBBBBBB1..', '..1BBB11BBB1..', '...1B1..1B1...'],
    back: NONE,
    side: ['.....1BBBBB1..', '.....1BBB1B1..'],
  },

  earrings: {
    top: 6,
    front: ['..B........B..', '..C........C..'],
    back: ['..B........B..', '..C........C..'],
    side: ['....B.........', '....C.........'],
  },

  scarf: {
    top: 9,
    front: [
      '...1BBBBBB1...',
      '..1BCCCCCCB1..',
      '..1BBBBBBBB1..',
      '...1BB..BB1...',
      '....1B..B1....',
    ],
    back: ['...1BBBBBB1...', '..1BCCCCCCB1..', '..1BBBBBBBB1..'],
    side: [
      '...1BBBBBB1...',
      '..1BCCCCCCB1..',
      '..1BBBBBB1....',
      '..1BB.........',
      '..1B..........',
    ],
  },

  necklace: {
    top: 11,
    front: ['...1BB..BB1...', '.....1BB1.....', '......BB......'],
    back: NONE,
    side: ['.....1BB1.....', '......1B1.....'],
  },

  bag: {
    top: 11,
    front: [
      '.......B......',
      '......B.......',
      '.....B........',
      '....B.........',
      '.CBBB.........',
      '.CBBB.........',
      '.1CCC1........',
    ],
    back: [
      '......B.......',
      '.......B......',
      '........B.....',
      '.........B....',
      '.........BBBC.',
      '.........BBBC.',
      '........1CCC1.',
    ],
    side: [
      '.....BB.......',
      '.....B........',
      '....B.........',
      '...B..........',
      '..CBBB........',
      '..CBBB........',
      '..1CCC1.......',
    ],
  },
};

