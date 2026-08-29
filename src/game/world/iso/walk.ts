import type { WorldPoint, WorldRect } from '@core/types';
import { standable, stepAllowed } from './map';
import type { IsoMap } from './map';

/**
 * Ходьба по сетке плиток. Чистая математика без Phaser: её видно в
 * тестах, а на симуляцию она не влияет вовсе — время на ходьбу не
 * тратится (раздел 4), иначе перемещение превращается в наказание.
 */

/** Скорость ходьбы, плиток в секунду. */
export const WALK_TILES = 2.6;

/** Половина следа человека на земле, в плитках. */
export const ACTOR_RADIUS = 0.3;

/** Насколько близко надо подойти к цели, чтобы взаимодействовать. */
export const REACH_TILES = 1.9;

/** Насколько близко к точке маршрута считается «дошёл». */
export const ARRIVE_EPSILON = 0.08;

export function contains(rect: WorldRect, point: WorldPoint): boolean {
  return (
    point.x >= rect.x && point.x < rect.x + rect.w && point.y >= rect.y && point.y < rect.y + rect.h
  );
}

export function centerOf(rect: WorldRect): WorldPoint {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

export function distance(a: WorldPoint, b: WorldPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function withinReach(position: WorldPoint, rect: WorldRect): boolean {
  return distance(position, centerOf(rect)) <= REACH_TILES;
}

/** Что мешает встать в точку сверх самой земли: стены, стойки, мебель. */
export type Blocked = (point: WorldPoint) => boolean;

/**
 * Свободна ли точка. Проверяются середина и четыре края следа: иначе
 * человек наполовину повисает над водой и просачивается в угол стойки.
 */
function free(map: IsoMap, from: WorldPoint, to: WorldPoint, blocked: Blocked): boolean {
  const r = ACTOR_RADIUS;
  const probes: WorldPoint[] = [
    to,
    { x: to.x - r, y: to.y },
    { x: to.x + r, y: to.y },
    { x: to.x, y: to.y - r },
    { x: to.x, y: to.y + r },
  ];
  for (const probe of probes) {
    if (!standable(map, probe.x, probe.y)) return false;
    if (blocked(probe)) return false;
  }
  return stepAllowed(map, from, to);
}

/**
 * Шаг по осям по отдельности: так человек скользит вдоль стены вместо
 * того, чтобы залипать в неё углом.
 */
export function step(
  map: IsoMap,
  position: WorldPoint,
  dx: number,
  dy: number,
  blocked: Blocked,
): WorldPoint {
  let point = position;
  if (dx !== 0) {
    const next = { x: point.x + dx, y: point.y };
    if (free(map, point, next, blocked)) point = next;
  }
  if (dy !== 0) {
    const next = { x: point.x, y: point.y + dy };
    if (free(map, point, next, blocked)) point = next;
  }
  return point;
}

/** Шаг в сторону цели. Возвращает, дошли ли. */
export function stepToward(
  map: IsoMap,
  position: WorldPoint,
  target: WorldPoint,
  span: number,
  blocked: Blocked,
): { position: WorldPoint; arrived: boolean } {
  const dx = target.x - position.x;
  const dy = target.y - position.y;
  const length = Math.hypot(dx, dy);
  if (length <= ARRIVE_EPSILON) return { position, arrived: true };

  const scale = Math.min(span, length) / length;
  const moved = step(map, position, dx * scale, dy * scale, blocked);

  /*
   * Цель за стеной считается достигнутой, когда шаг перестал к ней
   * приближать. Сравнивать позиции недостаточно: упёршись в стену по
   * одной оси, человек продолжает ползти по другой всё меньшими долями
   * плитки — и «дошёл» не наступает никогда.
   */
  const left = Math.hypot(target.x - moved.x, target.y - moved.y);
  return { position: moved, arrived: length - left < span * 0.2 };
}

/** Ближайшая к человеку цель в пределах досягаемости. */
export function nearest<T extends { rect: WorldRect }>(
  position: WorldPoint,
  items: readonly T[],
  reach = REACH_TILES,
): T | null {
  let best: T | null = null;
  let bestDistance = reach;
  for (const item of items) {
    const at = distance(position, centerOf(item.rect));
    if (at <= bestDistance) {
      bestDistance = at;
      best = item;
    }
  }
  return best;
}
