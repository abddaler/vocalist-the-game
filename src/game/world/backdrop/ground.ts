import type { Rect } from '@ui/widgets/Hotspots';
import type { Painter } from '@ui/widgets/Painter';
import type { Ambience } from '../ambience';

/**
 * Свет поверх готовой картинки и тени под предметами. Сама земля живёт
 * в surface.ts: она собирается из плит, а не из полос экрана.
 */

/**
 * Общий тон поверх готовой улицы. Кладётся последним, поверх домов,
 * людей и мелочи: это свет, а не фон, и он должен коснуться всего.
 */
export function drawWash(painter: Painter, area: Rect, ambience: Ambience): void {
  if (ambience.washAlpha <= 0) return;
  painter.fill(area, ambience.wash, ambience.washAlpha);
}

/** Тень под предметом: овал ей не по карману, полоска работает не хуже. */
export function drawShadow(
  painter: Painter,
  x: number,
  y: number,
  width: number,
  ambience: Ambience,
): void {
  if (ambience.shadow <= 0) return;
  painter.fill(
    { x: Math.round(x - width / 2), y: Math.round(y) - 1, w: width, h: 2 },
    0x000000,
    ambience.shadow,
  );
}
