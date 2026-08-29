import { describe, expect, it } from 'vitest';
import type { DistrictDef, WorldPoint, WorldRect } from '@core/types';
import { CITY } from './city';
import { footprintOf } from '../../game/world/decor';
import { parseMap, standable as onTile, stepAllowed } from '../../game/world/iso/map';
import { ACTOR_RADIUS, REACH_TILES } from '../../game/world/iso/walk';
import { STREET } from './city';

/**
 * Проходимость района целиком. Одна скамейка поперёк узкой полосы
 * запирает половину улицы — глазами это не видно, а ногами упирается.
 * Поэтому связность считается заливкой по той же геометрии, по которой
 * ходит игрок: шаг разрешён между плитками одного уровня и по ступеням.
 */
const inside = (rect: WorldRect, p: WorldPoint): boolean =>
  p.x >= rect.x && p.x < rect.x + rect.w && p.y >= rect.y && p.y < rect.y + rect.h;

/** Заливка от места появления игрока: множество достижимых плиток. */
function reachable(district: DistrictDef): { seen: Set<number>; free: Set<number> } {
  const map = parseMap(district.tiles);
  const solids: WorldRect[] = [
    ...district.buildings.map((b) => b.rect),
    ...district.scenery.map((s) => s.rect),
    ...district.decor.map(footprintOf).filter((rect): rect is WorldRect => rect !== null),
  ];
  const key = (x: number, y: number): number => y * map.width + x;
  const standable = (x: number, y: number): boolean => {
    if (!onTile(map, x, y)) return false;
    const center = { x: x + 0.5, y: y + 0.5 };
    const r = ACTOR_RADIUS;
    const probes = [
      center,
      { x: center.x - r, y: center.y },
      { x: center.x + r, y: center.y },
      { x: center.x, y: center.y - r },
      { x: center.x, y: center.y + r },
    ];
    return !probes.some((probe) => solids.some((rect) => inside(rect, probe)));
  };

  // Считается только земля перед домами: закутки между ними за фасадами
  // никому не нужны, а в долю «отрезанного» шумят.
  const free = new Set<number>();
  for (let y = STREET.frontY; y < map.depth; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      if (standable(x, y)) free.add(key(x, y));
    }
  }

  const start = { x: Math.floor(district.spawn.x), y: Math.floor(district.spawn.y) };
  const seen = new Set<number>([key(start.x, start.y)]);
  const queue = [start];
  while (queue.length > 0) {
    const { x, y } = queue.pop()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      const id = key(nx, ny);
      if (seen.has(id) || !free.has(id)) continue;
      if (!stepAllowed(map, { x: x + 0.5, y: y + 0.5 }, { x: nx + 0.5, y: ny + 0.5 })) continue;
      seen.add(id);
      queue.push({ x: nx, y: ny });
    }
  }
  return { seen, free };
}

describe('по району можно пройти ногами', () => {
  for (const district of CITY) {
    const map = parseMap(district.tiles);

    it(`${district.id}: до каждой двери, площадки и створа есть дорога`, () => {
      const { seen } = reachable(district);
      const near = (rect: WorldRect): boolean => {
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        for (const id of seen) {
          const x = (id % map.width) + 0.5;
          const y = Math.floor(id / map.width) + 0.5;
          if (Math.hypot(x - cx, y - cy) <= REACH_TILES) return true;
        }
        return false;
      };

      for (const building of district.buildings) {
        expect(near(building.door), `${district.id}: ${building.locationId}`).toBe(true);
      }
      for (const gate of district.gates) {
        expect(near(gate.rect), `${district.id} → ${gate.to}`).toBe(true);
      }
      for (const point of district.points) {
        expect(near(point.rect), `${district.id}: ${point.id}`).toBe(true);
      }
    });

    it(`${district.id}: ни одна полоса земли не заперта мелочью`, () => {
      const { seen, free } = reachable(district);
      const cut = [...free].filter((id) => !seen.has(id)).length;
      expect(cut / free.size, `${district.id}: отрезано ${cut} из ${free.size}`).toBeLessThan(0.04);
    });
  }
});
