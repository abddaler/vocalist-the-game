import type { WorldPoint, WorldRect } from '@core/types';

/**
 * Ходьба и столкновения. Чистая математика без Phaser: её видно в тестах,
 * а на симуляцию она не влияет вовсе — время на ходьбу не тратится
 * (раздел 4), иначе перемещение превращается в наказание.
 */

/** Размер персонажа во внутренних пикселях. */
export const ACTOR = { w: 8, h: 12 } as const;

/** Скорость ходьбы, внутренних пикселей в секунду. */
export const WALK_SPEED = 46;

/** Насколько близко надо подойти к цели тапа, чтобы считать её достигнутой. */
export const ARRIVE_EPSILON = 1.5;

export function overlaps(a: WorldRect, b: WorldRect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function contains(rect: WorldRect, point: WorldPoint): boolean {
  return (
    point.x >= rect.x && point.x < rect.x + rect.w && point.y >= rect.y && point.y < rect.y + rect.h
  );
}

export function actorRect(position: WorldPoint): WorldRect {
  return { x: position.x - ACTOR.w / 2, y: position.y - ACTOR.h, w: ACTOR.w, h: ACTOR.h };
}

export function centerOf(rect: WorldRect): WorldPoint {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

const clamp = (value: number, min: number, max: number): number =>
  value < min ? min : value > max ? max : value;

function blocked(position: WorldPoint, solids: readonly WorldRect[]): boolean {
  const body = actorRect(position);
  return solids.some((solid) => overlaps(body, solid));
}

export interface Bounds {
  readonly width: number;
  readonly height: number;
}

/**
 * Двигает персонажа на dx/dy, разбирая оси по отдельности: так он
 * скользит вдоль стены вместо того, чтобы залипать в неё углом.
 */
export function step(
  position: WorldPoint,
  dx: number,
  dy: number,
  solids: readonly WorldRect[],
  bounds: Bounds,
): WorldPoint {
  let { x, y } = position;

  if (dx !== 0) {
    const next = clamp(x + dx, ACTOR.w / 2, bounds.width - ACTOR.w / 2);
    if (!blocked({ x: next, y }, solids)) x = next;
  }
  if (dy !== 0) {
    const next = clamp(y + dy, ACTOR.h, bounds.height);
    if (!blocked({ x, y: next }, solids)) y = next;
  }

  return { x, y };
}

/** Шаг в сторону цели. Возвращает null, когда цель достигнута. */
export function stepToward(
  position: WorldPoint,
  target: WorldPoint,
  distance: number,
  solids: readonly WorldRect[],
  bounds: Bounds,
): { position: WorldPoint; arrived: boolean } {
  const dx = target.x - position.x;
  const dy = target.y - position.y;
  const length = Math.hypot(dx, dy);
  if (length <= ARRIVE_EPSILON) return { position, arrived: true };

  const scale = Math.min(distance, length) / length;
  const moved = step(position, dx * scale, dy * scale, solids, bounds);

  /*
   * Цель за стеной считается достигнутой, когда шаг перестал к ней
   * приближать. Сравнивать позиции недостаточно: упёршись в стену
   * по одной оси, персонаж продолжает ползти по другой всё меньшими
   * долями пикселя — и «дошёл» не наступает никогда, а вместе с ним
   * не срабатывает и дверь, к которой шли.
   */
  const left = Math.hypot(target.x - moved.x, target.y - moved.y);
  const progress = length - left;
  return { position: moved, arrived: progress < distance * 0.2 };
}

/** Ближайшая к персонажу точка взаимодействия в пределах досягаемости. */
export function nearest<T extends { rect: WorldRect }>(
  position: WorldPoint,
  items: readonly T[],
  reach: number,
): T | null {
  let best: T | null = null;
  let bestDistance = reach;

  for (const item of items) {
    const center = centerOf(item.rect);
    const distance = Math.hypot(center.x - position.x, center.y - position.y);
    if (distance <= bestDistance) {
      bestDistance = distance;
      best = item;
    }
  }
  return best;
}

/**
 * Смещение камеры в мировых координатах: держит персонажа по центру и не
 * выходит за карту. Карту меньше окна не двигаем, а центрируем — иначе
 * маленькая комната липнет в левый верхний угол.
 */
export function cameraOffset(
  position: WorldPoint,
  bounds: Bounds,
  viewWidth: number,
  viewHeight: number,
): WorldPoint {
  const axis = (value: number, size: number, view: number): number =>
    size <= view ? -Math.round((view - size) / 2) : Math.round(clamp(value - view / 2, 0, size - view));

  return {
    x: axis(position.x, bounds.width, viewWidth),
    y: axis(position.y, bounds.height, viewHeight),
  };
}
