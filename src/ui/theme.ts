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

/**
 * Во сколько раз мир крупнее экранного пикселя. Камера стоит близко:
 * человек ростом сорок пикселей и витрина во весь экран читаются, а
 * улица целиком — нет, и ради этого масштаб зафиксирован здесь.
 */
export const WORLD_ZOOM = 2;

export const CONTENT = {
  x: 0,
  y: LAYOUT.hudHeight,
  width: SCREEN.width,
  height: SCREEN.height - LAYOUT.hudHeight - LAYOUT.navHeight,
} as const;

/**
 * Палитра. Город южный и ночной, поэтому и интерфейс такой: фиолетовая
 * основа, золото на деньгах, бирюза на действии, малиновый на настроении.
 * Серый нейтральный интерфейс поверх такой картинки читался как чужой.
 */
export const COLORS = {
  bg: 0x1a1030,
  panel: 0x2b1c4e,
  panelAlt: 0x3a2568,
  panelDeep: 0x211640,
  border: 0x5c3f9c,
  borderFocus: 0xffd34d,

  text: 0xfff2ff,
  textDim: 0xbba4e8,
  textMuted: 0x8672bc,

  accent: 0x2ee6c8,
  accentDeep: 0x159a86,
  money: 0xffd34d,
  energy: 0x4fc3ff,
  mood: 0xff77d9,

  /** Здоровье связок выделено цветом — требование 9.6. */
  healthGood: 0x5df08a,
  healthTired: 0xffd34d,
  healthHoarse: 0xff9a3d,
  healthCritical: 0xff4d6a,

  danger: 0xff4d6a,
  disabled: 0x453466,
} as const;

/**
 * Шрифт здесь не задаётся: интерфейс набран растровым шрифтом из
 * ui/font — системный моноширинный сглаживался, а канвас 480x270
 * растягивается до окна, и это сглаживание расползалось в кашу.
 */

/** Цвет полоски связок по значению (раздел 6). */
export function healthColor(vocalHealth: number): number {
  if (vocalHealth > 70) return COLORS.healthGood;
  if (vocalHealth >= 40) return COLORS.healthTired;
  if (vocalHealth >= 20) return COLORS.healthHoarse;
  return COLORS.healthCritical;
}

