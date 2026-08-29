import type { WorldPoint } from '@core/types';
import { blockedIn } from './scene';
import type { IsoScene } from './scene';
import { standable } from './map';
import { distance } from './walk';

/**
 * Свободная плитка рядом с целью. Дверь врезана в стену, стойка стоит в
 * мебели: идти в их центр значит упереться и заглохнуть в шаге от цели.
 * Поэтому цель — ближайшее к игроку место, где можно стоять.
 */
export function freeSpotNear(scene: IsoScene, goal: WorldPoint, from: WorldPoint): WorldPoint {
  const blocked = blockedIn(scene);
  const stands = (point: WorldPoint): boolean =>
    standable(scene.map, point.x, point.y) && !blocked(point);

  if (stands(goal)) return goal;

  let best: WorldPoint | null = null;
  let bestDistance = Infinity;
  for (let radius = 1; radius <= 4 && best === null; radius += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
        const point = { x: goal.x + dx, y: goal.y + dy };
        if (!stands(point)) continue;
        const away = distance(point, from);
        if (away < bestDistance) {
          bestDistance = away;
          best = point;
        }
      }
    }
  }
  return best ?? goal;
}
