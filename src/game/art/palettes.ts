/**
 * Палитры пиксель-арта. Ночной город: тёплая кожа и волосы на холодном
 * синем фоне улицы, одежда — единственное цветное пятно на персонаже.
 *
 * Ключи 1..6 совпадают с символами в раскладках кадров (см. actors.ts):
 * 1 — контур, 2 — кожа, 3 — волосы, 4 — одежда, 5 — тень одежды, 6 — обувь.
 */
export interface ActorPalette {
  readonly 0: string;
  readonly 1: string;
  readonly 2: string;
  readonly 3: string;
  readonly 4: string;
  readonly 5: string;
  readonly 6: string;
  readonly 7: string;
  readonly 8: string;
  readonly 9: string;
  readonly A: string;
  readonly B: string;
  readonly C: string;
  readonly D: string;
  readonly E: string;
  readonly F: string;
}

const EMPTY = 'rgba(0,0,0,0)';

function palette(skin: string, hair: string, cloth: string, shade: string, shoes: string): ActorPalette {
  return {
    0: EMPTY,
    1: '#1b1a24',
    2: skin,
    3: hair,
    4: cloth,
    5: shade,
    6: shoes,
    7: EMPTY,
    8: EMPTY,
    9: EMPTY,
    A: EMPTY,
    B: EMPTY,
    C: EMPTY,
    D: EMPTY,
    E: EMPTY,
    F: EMPTY,
  };
}

/** Палитра игрока. */
export const PLAYER_PALETTE = palette('#e8c9a0', '#3b2a1e', '#8fbf7f', '#5f8a55', '#2a2a33');

/**
 * Палитры прохожих. Разные волосы и одежда при одном силуэте дают толпу,
 * в которой не мозолит глаз повтор.
 */
export const CROWD_PALETTES: readonly ActorPalette[] = [
  palette('#e8c9a0', '#2a2028', '#c96a6a', '#8f4747', '#22222b'),
  palette('#d9ac7c', '#4a3020', '#6a8ac9', '#47608f', '#22222b'),
  palette('#f0d6b4', '#6b5030', '#c9a86a', '#8f7547', '#2a2a33'),
  palette('#c99a72', '#1e1a20', '#8a6ac9', '#5f478f', '#22222b'),
  palette('#e8c9a0', '#7a3a3a', '#5fa89a', '#3f776c', '#2a2a33'),
  palette('#d0a37e', '#332a22', '#b8b0a4', '#807a70', '#22222b'),
];
