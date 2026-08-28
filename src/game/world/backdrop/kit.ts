import type { Rect } from '@ui/widgets/Hotspots';

/**
 * Небо, дальний план и мостовая. Дальний план едет медленнее домов —
 * от этого улица получает глубину, которой у плоских прямоугольников
 * не было.
 */
export interface Backdrop {
  /** Полоса неба в экранных координатах. */
  readonly sky: Rect;
  /** Всё, что ниже неба: земля района. */
  readonly road: Rect;
  /** Сдвиг камеры: нужен дальнему плану. */
  readonly cameraX: number;
  readonly worldWidth: number;
  /** Во сколько раз мир крупнее экранного пикселя. */
  readonly unit: number;
}

