import type { TileKind } from '@core/types';
import type { Painter } from '@ui/widgets/Painter';
import { mix, scale } from '../ambience';
import type { Ambience } from '../ambience';
import { cellAt } from './map';
import type { IsoMap } from './map';
import { TILE, toScreen } from './project';
import type { ScreenPoint } from './project';
import { TILES } from './tiles';
import { edge, face, tileHalf } from './shapes';

/**
 * Земля карты целиком. Плитки идут диагоналями, от дальней к ближней:
 * при таком порядке стенка уровня встаёт ровно между своей плиткой и
 * нижним соседом и ничего не перекрывает.
 *
 * Всё это запекается в текстуру размером с район и в кадре только
 * сдвигается, поэтому цена рисунка — один раз на время суток.
 */

/** Из чего сложена стенка под плиткой этого покрытия. */
const WALL: Readonly<Record<TileKind, number>> = {
  road: 0x8a8378,
  roadLine: 0x8a8378,
  pavement: 0xa89c88,
  plaza: 0xb8a68c,
  deck: 0x8a5f34,
  sand: 0xc8b184,
  water: 0x2f6f8f,
  grass: 0x6b5a3a,
  carpet: 0x6a2438,
  steps: 0xa89c88,
  wood: 0x6a4a2c,
  marble: 0xb8b0a4,
  dance: 0x2a2f52,
  stage: 0x2f2622,
  rug: 0x6a2f42,
  void: 0x000000,
};

/** Насколько глубоко уходит обрез карты по её краю. */
const SKIRT = 10;

export function drawGround(
  painter: Painter,
  map: IsoMap,
  ambience: Ambience,
  origin: ScreenPoint,
): void {
  const at = (x: number, y: number, z: number): ScreenPoint => {
    const p = toScreen({ x, y, z });
    return { x: origin.x + p.x, y: origin.y + p.y };
  };

  for (let sum = 0; sum <= map.width + map.depth - 2; sum += 1) {
    for (let x = Math.max(0, sum - map.depth + 1); x <= Math.min(map.width - 1, sum); x += 1) {
      const y = sum - x;
      const cell = cellAt(map, x, y);
      if (cell === null) continue;

      const north = at(x, y, cell.level);
      TILES[cell.kind]({ painter, ambience, at: north, tx: x, ty: y });

      // Пена там, где вода подходит к песку: полоса прибоя рисуется на
      // воде, а не на песке, иначе она тонет под следующей плиткой.
      if (cell.kind === 'water' && cellAt(map, x, y - 1)?.kind === 'sand') {
        tileHalf(painter, north, 0xffffff, 'far', 0.5);
        edge(painter, north, at(x + 1, y, cell.level), 0xffffff, 0.75);
        edge(painter, north, at(x, y + 1, cell.level), 0xffffff, 0.75);
      }

      drawDrop(painter, map, cell.kind, cell.level, x, y, at, ambience);
    }
  }
}

/** Стенки под ближними рёбрами плитки: обрыв к соседу или за край карты. */
function drawDrop(
  painter: Painter,
  map: IsoMap,
  kind: TileKind,
  level: number,
  x: number,
  y: number,
  at: (x: number, y: number, z: number) => ScreenPoint,
  ambience: Ambience,
): void {
  const stone = scale(mix(WALL[kind], ambience.pavement, 0.25), ambience.light);
  const east = at(x + 1, y, level);
  const south = at(x + 1, y + 1, level);
  const west = at(x, y + 1, level);

  const right = cellAt(map, x + 1, y);
  const rightDrop = right === null ? SKIRT : (level - right.level) * TILE.level;
  if (rightDrop > 0) {
    face(painter, east, south, rightDrop, scale(stone, 0.82));
    edge(painter, east, south, scale(stone, 1.2));
    band(painter, east, south, rightDrop, scale(stone, 0.6));
  }

  const near = cellAt(map, x, y + 1);
  const nearDrop = near === null ? SKIRT : (level - near.level) * TILE.level;
  if (nearDrop > 0) {
    face(painter, west, south, nearDrop, scale(stone, 1.02));
    edge(painter, west, south, scale(stone, 1.35));
    band(painter, west, south, nearDrop, scale(stone, 0.7));
  }
}

/** Тень у основания стенки: без неё обрыв читается наклейкой. */
function band(
  painter: Painter,
  from: ScreenPoint,
  to: ScreenPoint,
  height: number,
  color: number,
): void {
  const base = { x: from.x, y: from.y + height - 2 };
  const end = { x: to.x, y: to.y + height - 2 };
  face(painter, base, end, 2, color);
}
