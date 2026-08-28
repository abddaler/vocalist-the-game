import { describe, expect, it } from 'vitest';
import type { DistrictDef, WorldPoint, WorldRect } from '@core/types';
import { CITY } from './city';
import { ACTOR, actorRect, overlaps } from '../../game/world/movement';
import { footprintOf } from '../../game/world/decor';
import { standable } from '../../game/world/terrain';
import { REACH } from '../../game/world/targets';

/**
 * Проходимость района целиком. Полосы земли всего в рост человека, и
 * одна скамейка поперёк такой полосы запирает половину улицы — глазами
 * это не видно, а ногами упирается. Поэтому связность считается заливкой
 * по той же геометрии, по которой ходит игрок.
 */
function walkableMap(district: DistrictDef): (x: number, y: number) => boolean {
  const solids: WorldRect[] = [
    ...district.buildings.map((b) => b.rect),
    ...district.scenery.map((s) => s.rect),
    ...district.solids,
  ];
  const footprints = district.decor
    .map(footprintOf)
    .filter((rect): rect is WorldRect => rect !== null);

  return (x, y) => {
    const feet = { x, y };
    const edge = ACTOR.w / 2 - 1;
    for (const dx of [-edge, 0, edge]) {
      if (!standable(district.terrain, { x: x + dx, y })) return false;
    }
    if (footprints.some((rect) => inside(rect, feet))) return false;
    const body = actorRect(feet);
    return !solids.some((solid) => overlaps(body, solid));
  };
}

const inside = (rect: WorldRect, p: WorldPoint): boolean =>
  p.x >= rect.x && p.x < rect.x + rect.w && p.y >= rect.y && p.y < rect.y + rect.h;

/** Куда игрок может дойти со своего места появления. */
function reachable(district: DistrictDef): Set<number> {
  const walkable = walkableMap(district);
  const key = (x: number, y: number): number => y * district.width + x;
  const start = { x: Math.round(district.spawn.x), y: Math.round(district.spawn.y) };
  const seen = new Set<number>();
  const queue: Array<{ x: number; y: number }> = [start];
  seen.add(key(start.x, start.y));

  while (queue.length > 0) {
    const { x, y } = queue.pop()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= district.width || ny >= district.height) continue;
      const id = key(nx, ny);
      if (seen.has(id) || !walkable(nx, ny)) continue;
      seen.add(id);
      queue.push({ x: nx, y: ny });
    }
  }
  return seen;
}

describe('по району можно пройти ногами', () => {
  for (const district of CITY) {
    it(`${district.id}: до каждой двери, площадки и створа есть дорога`, () => {
      const seen = reachable(district);
      const near = (rect: WorldRect): boolean => {
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        for (const id of seen) {
          const x = id % district.width;
          const y = Math.floor(id / district.width);
          if (Math.hypot(x - cx, y - cy) <= REACH) return true;
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
      // Заливка обязана покрыть почти всю землю: если предмет перегородил
      // полосу, за ним остаётся заметный неохваченный кусок.
      const walkable = walkableMap(district);
      const seen = reachable(district);
      let total = 0;
      let cut = 0;
      for (let y = 0; y < district.height; y += 1) {
        for (let x = 0; x < district.width; x += 1) {
          if (!walkable(x, y)) continue;
          total += 1;
          if (!seen.has(y * district.width + x)) cut += 1;
        }
      }
      expect(cut / total, `${district.id}: отрезано ${cut} из ${total}`).toBeLessThan(0.02);
    });
  }
});
