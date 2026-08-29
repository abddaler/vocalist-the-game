import type { WorldPoint } from '@core/types';
import { blockedIn } from './scene';
import type { IsoScene } from './scene';
import { standable, stepAllowed } from './map';
import type { IsoMap } from './map';
import { ACTOR_RADIUS, distance } from './walk';

/**
 * Путь по сетке плиток. Изометрия сделала мир похожим на настоящую
 * улицу, а вместе с ней и на препятствия: между игроком и дверью теперь
 * стоят лотки, скамейки и парапеты. Шаг «просто в сторону цели» на таком
 * мире глохнет в первом же зонте, поэтому путь ищется поиском в ширину —
 * сетка маленькая, и он стоит доли миллисекунды.
 */
export interface Walkable {
  readonly map: IsoMap;
  readonly free: (point: WorldPoint) => boolean;
}

/** Проверка «сюда можно встать» для сцены: земля, стены и мелочь. */
export function walkableIn(scene: IsoScene): Walkable {
  const blocked = blockedIn(scene);
  return {
    map: scene.map,
    free: (point) => {
      const r = ACTOR_RADIUS;
      const probes: WorldPoint[] = [
        point,
        { x: point.x - r, y: point.y },
        { x: point.x + r, y: point.y },
        { x: point.x, y: point.y - r },
        { x: point.x, y: point.y + r },
      ];
      return probes.every((probe) => standable(scene.map, probe.x, probe.y) && !blocked(probe));
    },
  };
}

const center = (x: number, y: number): WorldPoint => ({ x: x + 0.5, y: y + 0.5 });

/**
 * Свободная плитка рядом с целью. Дверь врезана в стену, стойка стоит в
 * мебели: идти в их центр значит упереться и заглохнуть в шаге от цели.
 */
export function freeSpotNear(scene: IsoScene, goal: WorldPoint, from: WorldPoint): WorldPoint {
  const walkable = walkableIn(scene);
  if (walkable.free(goal)) return goal;

  let best: WorldPoint | null = null;
  let bestDistance = Infinity;
  for (let radius = 1; radius <= 4 && best === null; radius += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
        const point = { x: goal.x + dx, y: goal.y + dy };
        if (!walkable.free(point)) continue;
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

/**
 * Путь от точки до точки по плиткам. Возвращает список путевых точек без
 * начальной; пустой список — идти некуда. Прямые участки сливаются в
 * один отрезок, иначе человек дёргается на каждой плитке.
 */
export function findPath(scene: IsoScene, from: WorldPoint, to: WorldPoint): WorldPoint[] {
  const { map, free } = walkableIn(scene);
  const start = { x: Math.floor(from.x), y: Math.floor(from.y) };
  const goal = { x: Math.floor(to.x), y: Math.floor(to.y) };
  if (start.x === goal.x && start.y === goal.y) return [to];

  const key = (x: number, y: number): number => y * map.width + x;
  const cameFrom = new Map<number, number>();
  const seen = new Set<number>([key(start.x, start.y)]);
  let frontier: Array<{ x: number; y: number }> = [start];
  let found = false;

  while (frontier.length > 0 && !found) {
    const next: Array<{ x: number; y: number }> = [];
    for (const cell of frontier) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = cell.x + dx;
        const ny = cell.y + dy;
        const id = key(nx, ny);
        if (seen.has(id)) continue;
        if (!free(center(nx, ny))) continue;
        if (!stepAllowed(map, center(cell.x, cell.y), center(nx, ny))) continue;
        seen.add(id);
        cameFrom.set(id, key(cell.x, cell.y));
        if (nx === goal.x && ny === goal.y) {
          found = true;
          break;
        }
        next.push({ x: nx, y: ny });
      }
      if (found) break;
    }
    frontier = next;
  }

  if (!found) return [];

  const cells: Array<{ x: number; y: number }> = [];
  let cursor = key(goal.x, goal.y);
  const startId = key(start.x, start.y);
  while (cursor !== startId) {
    cells.push({ x: cursor % map.width, y: Math.floor(cursor / map.width) });
    const previous = cameFrom.get(cursor);
    if (previous === undefined) return [];
    cursor = previous;
  }
  cells.reverse();

  return simplify(cells).map((cell) => center(cell.x, cell.y)).concat([to]);
}

/** Выбрасывает промежуточные плитки прямых участков. */
function simplify(
  cells: ReadonlyArray<{ x: number; y: number }>,
): Array<{ x: number; y: number }> {
  const kept: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < cells.length; i += 1) {
    const previous = cells[i - 1];
    const current = cells[i]!;
    const next = cells[i + 1];
    if (previous === undefined || next === undefined) {
      kept.push(current);
      continue;
    }
    const turns =
      next.x - current.x !== current.x - previous.x || next.y - current.y !== current.y - previous.y;
    if (turns) kept.push(current);
  }
  return kept;
}
