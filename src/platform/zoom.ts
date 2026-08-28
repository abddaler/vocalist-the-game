import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from './config';

/**
 * Подбор зума (раздел 2, ограничение 3). Чистые функции без Phaser и DOM:
 * их видно в тестах, а привязка к движку живёт в display.ts.
 *
 * Целочисленный зум даёт честный пиксель, но на телефоне он же и убивает
 * картинку: при вписывании ×1.44 округление вниз до ×1 оставляет игре
 * треть экрана. Поэтому правило компромиссное — целое, когда оно почти
 * ничего не стоит, и дробное, когда округление съедает заметную долю:
 *
 *   ×4.00 -> ×4    (потерь нет)
 *   ×2.08 -> ×2    (теряем 4%)
 *   ×1.85 -> ×1.85 (целое отняло бы 46%)
 */

/** Доля от вписывающегося зума, ниже которой целое округление невыгодно. */
const INTEGER_EFFICIENCY = 0.8;

/** Ýже этого в портрете картинка мельчает настолько, что стоит подсказать. */
const HINT_WIDTH = INTERNAL_WIDTH;

export function chooseZoom(windowWidth: number, windowHeight: number): number {
  const fit = Math.min(windowWidth / INTERNAL_WIDTH, windowHeight / INTERNAL_HEIGHT);
  if (!Number.isFinite(fit) || fit <= 0) return 0.1;
  if (fit < 1) return Math.max(fit, 0.1);

  const integer = Math.floor(fit);
  return integer / fit >= INTEGER_EFFICIENCY ? integer : fit;
}

/**
 * Стоит ли предложить повернуть телефон. Именно предложить: играть можно
 * и так. Прежняя версия прятала игру целиком, и при включённой блокировке
 * поворота выйти из этого экрана было нельзя вовсе.
 */
export function isNarrowPortrait(windowWidth: number, windowHeight: number): boolean {
  return windowHeight > windowWidth && windowWidth < HINT_WIDTH;
}
