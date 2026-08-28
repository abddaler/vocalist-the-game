import { CYRILLIC } from './cyrillic';
import { LATIN } from './latin';
import { SYMBOLS } from './symbols';
import type { Glyph } from './types';

export type { Glyph } from './types';

export const GLYPHS: Readonly<Record<string, Glyph>> = { ...LATIN, ...CYRILLIC, ...SYMBOLS };

/**
 * Метрика шрифта. Прописная буква занимает ряды 0-6, ряды 7 и 8 отданы
 * выносным элементам, отсюда высота 9. Межбуквенный просвет — один
 * пиксель: при ширине 5 это даёт шаг 6, тот же, что был у системного
 * моноширинного шрифта, так что вёрстка экранов не съезжает.
 */
export const FONT_METRICS = {
  height: 9,
  /** Высота строки при переносе: 9 рядов плюс просвет. */
  lineHeight: 11,
  letterSpacing: 1,
  /** Неизвестный символ рисуется этим: пустое место скрывает ошибку. */
  fallback: '?',
} as const;
