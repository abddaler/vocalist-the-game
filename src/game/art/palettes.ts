/**
 * Палитры пиксель-арта. Ключи совпадают с символами в раскладках кадров:
 * 1 контур, 2 кожа, 3 тень кожи, 4 волосы, 5 блик волос, 6 ткань,
 * 7 её тень, 8 вторая ткань, 9 низ (брюки, юбка), A обувь, B акцент,
 * C тень акцента, D тёмная деталь (брови, рот), E белок глаза, F блик
 * кожи, G тень второй ткани, H тень низа, J тень волос, K тень обуви,
 * L блик ткани, M блик низа, N блик второй ткани.
 *
 * Теневых двойников больше, чем видно в раскладках: их не рисуют руками,
 * а подставляют при сборке текстуры — по кромке фигуры справа, с той
 * стороны, куда в изометрии не достаёт свет.
 *
 * Тени и блики выводятся из основных цветов, а не задаются: у пятнадцати
 * человек в толпе они всё равно были бы одним и тем же сдвигом яркости,
 * зато вручную их легко рассогласовать.
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
  readonly G: string;
  readonly H: string;
  readonly J: string;
  readonly K: string;
  readonly L: string;
  readonly M: string;
  readonly N: string;
}

export interface Colors {
  readonly skin: string;
  readonly hair: string;
  readonly cloth: string;
  /** Вторая ткань: подкладка пиджака, вставка на худи, рубашка под пиджаком. */
  readonly trim: string;
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
    8: colors.trim,
    9: colors.legs,
    A: colors.shoes,
    B: colors.accent,
    C: shift(colors.accent, 0.68),
    D: '#2b2331',
    E: '#f4f0f8',
    F: shift(colors.skin, 1.12),
    G: shift(colors.trim, 0.7),
    H: shift(colors.legs, 0.72),
    J: shift(colors.hair, 0.72),
    K: shift(colors.shoes, 0.7),
    L: shift(colors.cloth, 1.18),
    M: shift(colors.legs, 1.2),
    N: shift(colors.trim, 1.18),
  };
}
