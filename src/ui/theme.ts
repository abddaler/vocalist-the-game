/**
 * Палитра и метрика интерфейса. Это числа отображения, а не баланса,
 * поэтому им место здесь, а не в data/balance.ts.
 *
 * Всё считается во внутренних пикселях 480x270 (раздел 2, ограничение 3).
 */
export const SCREEN = { width: 480, height: 270 } as const;

export const LAYOUT = {
  hudHeight: 34,
  navHeight: 26,
  padding: 6,
  rowHeight: 22,
  /** Минимальная область тапа — ограничение 4 из раздела 2. */
  minTap: 16,
} as const;

export const CONTENT = {
  x: 0,
  y: LAYOUT.hudHeight,
  width: SCREEN.width,
  height: SCREEN.height - LAYOUT.hudHeight - LAYOUT.navHeight,
} as const;

export const COLORS = {
  bg: 0x14161c,
  panel: 0x1c1f28,
  panelAlt: 0x232733,
  border: 0x333949,
  borderFocus: 0x8fbf7f,

  text: 0xf2f2f2,
  textDim: 0x8a90a2,
  textMuted: 0x5d6377,

  accent: 0x8fbf7f,
  money: 0xe8c46a,
  energy: 0x6aa9e8,
  mood: 0xc79ae8,

  /** Здоровье связок выделено цветом — требование 9.6. */
  healthGood: 0x6fcf72,
  healthTired: 0xe8c46a,
  healthHoarse: 0xe89a4a,
  healthCritical: 0xe25555,

  danger: 0xe25555,
  disabled: 0x3a3f4d,
} as const;

/**
 * Канвас физически 480x270 пикселей и растягивается до размера окна,
 * поэтому надпись занимает ровно столько настоящих пикселей, сколько
 * задано здесь: разрешение текстуры на это не влияет. Восьмипиксельный
 * текст на телефоне превращался в 11 CSS-пикселей рваного растра —
 * отсюда десятка как основа.
 */
export const FONT = {
  family: 'monospace',
  small: '10px',
  normal: '12px',
  large: '16px',
} as const;

/** Цвет полоски связок по значению (раздел 6). */
export function healthColor(vocalHealth: number): number {
  if (vocalHealth > 70) return COLORS.healthGood;
  if (vocalHealth >= 40) return COLORS.healthTired;
  if (vocalHealth >= 20) return COLORS.healthHoarse;
  return COLORS.healthCritical;
}

export const hex = (color: number): string => `#${color.toString(16).padStart(6, '0')}`;
