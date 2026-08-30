import { DECOR_KINDS } from '@core/types';
import { SCREEN } from '@ui/theme';
import type { Painter } from '@ui/widgets/Painter';
import { ambienceOf } from '../world/ambience';
import { paintProp } from '../world/iso/props';

/**
 * Один предмет крупно на нейтральном фоне — для слепого опознания.
 *
 * Проверка узнаваемости работает только вслепую: если под картинкой
 * написано «микшерный пульт», её опознает кто угодно. Поэтому кадр без
 * подписи, а имена лежат отдельным списком, который открывают уже после
 * ответов.
 *
 * Фон нейтральный серый нарочно: предмет должен читаться сам, а не за
 * счёт того, что он единственное светлое пятно на тёмной улице.
 */
const BACKDROP = 0x8a8f98;

/** Во сколько раз крупнее кадра. На 480x270 предмет в тридцать пикселей не разобрать. */
export const PROP_ZOOM = 4;

/** Все виды предметов в постоянном порядке: список должен совпадать между прогонами. */
export const PROP_LIST: readonly string[] = [...DECOR_KINDS].sort();

export function renderPropShot(painter: Painter, kind: string): void {
  painter.fill({ x: 0, y: 0, w: SCREEN.width, h: SCREEN.height }, BACKDROP);
  // Освещение дневное и одно на всех: разбор сравнивает предметы между
  // собой, а не время суток.
  const ambience = ambienceOf('day', 'hills');
  paintProp(painter, ambience, `${kind}|0|x|b`, {
    x: Math.round(SCREEN.width / 2),
    y: Math.round(SCREEN.height / 2) + 24,
  });
  paintProp(painter, ambience, `${kind}|0|x|t`, {
    x: Math.round(SCREEN.width / 2),
    y: Math.round(SCREEN.height / 2) + 24,
  });
}
