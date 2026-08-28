import type { SurfaceKind, TerrainDef, WorldPoint, WorldRect } from '@core/types';

/**
 * Земля района: где стоят и куда не пройти. Чистая геометрия без Phaser —
 * по ней считаются и столкновения, и картинка, и она обязана быть одной
 * и той же: разъехавшись, они дают лестницу, которая никуда не ведёт.
 *
 * Обрыв между уровнями — это не стена, а разрыв в плитах: между улицей и
 * набережной просто нет земли, и перейти можно только там, где разрыв
 * перекрыт лестницей. Поэтому многоуровневость ничего не стоит ходьбе:
 * проверка «есть ли под ногами плита» и так нужна на краю пляжа.
 */

/** По воде не ходят; всё остальное держит. */
const WALKABLE: Readonly<Record<SurfaceKind, boolean>> = {
  road: true,
  pavement: true,
  plaza: true,
  boardwalk: true,
  sand: true,
  grass: true,
  carpet: true,
  steps: true,
  water: false,
};

const inside = (rect: WorldRect, p: WorldPoint): boolean =>
  p.x >= rect.x && p.x <= rect.x + rect.w && p.y >= rect.y && p.y <= rect.y + rect.h;

/**
 * Плита под точкой. Позже положенная перекрывает раньше положенную —
 * так лестница ложится поверх обрыва, а не спорит с ним.
 */
export function plateAt(terrain: readonly TerrainDef[], p: WorldPoint): TerrainDef | null {
  let found: TerrainDef | null = null;
  for (const plate of terrain) {
    if (inside(plate.rect, p)) found = plate;
  }
  return found;
}

/** Можно ли стоять в этой точке. Вне плит земли нет — там край района. */
export function standable(terrain: readonly TerrainDef[], p: WorldPoint): boolean {
  const plate = plateAt(terrain, p);
  return plate !== null && WALKABLE[plate.surface];
}

export function surfaceAt(terrain: readonly TerrainDef[], p: WorldPoint): SurfaceKind | null {
  return plateAt(terrain, p)?.surface ?? null;
}

/**
 * Первая точка ниже заданной, на которой можно стоять. Нужна выходам из
 * домов: дверь висит на фасаде, а вышедший обязан оказаться на земле, а
 * не в разрыве между улицей и набережной.
 */
export function groundBelow(
  terrain: readonly TerrainDef[],
  x: number,
  from: number,
  limit: number,
): number | null {
  for (let y = Math.round(from); y <= limit; y += 1) {
    if (standable(terrain, { x, y })) return y;
  }
  return null;
}

/** Разрыв между уровнями и лестницы, которые его перекрывают. */
interface Crossing {
  readonly top: number;
  readonly bottom: number;
  readonly stairs: readonly TerrainDef[];
}

function crossings(terrain: readonly TerrainDef[]): Crossing[] {
  const bands = new Map<string, TerrainDef[]>();
  for (const plate of terrain) {
    if (plate.surface !== 'steps') continue;
    const key = `${plate.rect.y}:${plate.rect.h}`;
    const list = bands.get(key);
    if (list) list.push(plate);
    else bands.set(key, [plate]);
  }
  return [...bands.values()]
    .map((stairs) => ({
      top: stairs[0]!.rect.y,
      bottom: stairs[0]!.rect.y + stairs[0]!.rect.h,
      stairs,
    }))
    .sort((a, b) => a.top - b.top);
}

/**
 * Путевые точки через лестницы между двумя точками района. Полноценного
 * поиска пути тут нет и не нужно: уровни разделены сплошными полосами,
 * так что достаточно свернуть к ближайшей лестнице каждого разрыва,
 * который приходится пересечь.
 */
export function stairRoute(
  terrain: readonly TerrainDef[],
  from: WorldPoint,
  to: WorldPoint,
): WorldPoint[] {
  const down = to.y > from.y;
  const lo = Math.min(from.y, to.y);
  const hi = Math.max(from.y, to.y);
  const crossed = crossings(terrain).filter((gap) => gap.top >= lo && gap.bottom <= hi);
  if (crossed.length === 0) return [];
  if (!down) crossed.reverse();

  const route: WorldPoint[] = [];
  let x = from.x;
  for (const gap of crossed) {
    const stair = nearestStair(gap.stairs, x);
    if (!stair) continue;
    x = stair.rect.x + stair.rect.w / 2;
    route.push({ x, y: down ? gap.top - 1 : gap.bottom + 1 });
    route.push({ x, y: down ? gap.bottom + 1 : gap.top - 1 });
  }
  return route;
}

function nearestStair(stairs: readonly TerrainDef[], x: number): TerrainDef | null {
  let best: TerrainDef | null = null;
  let bestDistance = Infinity;
  for (const stair of stairs) {
    const distance = Math.abs(stair.rect.x + stair.rect.w / 2 - x);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = stair;
    }
  }
  return best;
}
