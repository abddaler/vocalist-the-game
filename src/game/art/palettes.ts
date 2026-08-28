/**
 * Палитры пиксель-арта. Ключи совпадают с символами в раскладках кадров:
 * 1 контур, 2 кожа, 3 тень кожи, 4 волосы, 5 блик волос, 6 одежда,
 * 7 тень одежды, 8 блик одежды, 9 брюки, A обувь, B акцент, C тень
 * акцента, D глаза.
 *
 * Phaser берёт цвет по символу, а точку и пробел пропускает, поэтому
 * прозрачность отдельным цветом задавать не надо.
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

export interface Colors {
  readonly skin: string;
  readonly hair: string;
  readonly cloth: string;
  readonly legs: string;
  readonly shoes: string;
  readonly accent: string;
}

const EMPTY = 'rgba(0,0,0,0)';

/** Затемнение и осветление цвета: тени и блики выводятся, а не задаются. */
function shift(hex: string, factor: number): string {
  const value = parseInt(hex.slice(1), 16);
  const channel = (offset: number): number =>
    Math.max(0, Math.min(255, Math.round(((value >> offset) & 0xff) * factor)));
  return `#${((channel(16) << 16) | (channel(8) << 8) | channel(0)).toString(16).padStart(6, '0')}`;
}

export function palette(colors: Colors): ActorPalette {
  return {
    0: EMPTY,
    1: '#1a1922',
    2: colors.skin,
    3: shift(colors.skin, 0.82),
    4: colors.hair,
    5: shift(colors.hair, 1.35),
    6: colors.cloth,
    7: shift(colors.cloth, 0.7),
    8: shift(colors.cloth, 1.25),
    9: colors.legs,
    A: colors.shoes,
    B: colors.accent,
    C: shift(colors.accent, 0.68),
    D: '#241f2c',
    E: EMPTY,
    F: EMPTY,
  };
}
