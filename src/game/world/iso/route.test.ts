import { describe, expect, it } from 'vitest';
import { CITY, getDistrict } from '@data/world';
import { createInitialState } from '@core/state';
import { districtScene } from './scene';
import { findPath, freeSpotNear, walkableIn } from './route';
import { centerOf, distance } from './walk';
import { REACH_TILES } from './walk';

const state = createInitialState('route-test', 'pop');

describe('поиск пути по кварталу', () => {
  for (const district of CITY) {
    it(`${district.id}: от места появления есть путь к каждой двери и створу`, () => {
      const scene = districtScene(state, district.id);
      const from = district.spawn;
      const goals = [
        ...district.buildings.map((b) => ({ id: b.locationId, rect: b.door })),
        ...district.gates.map((g) => ({ id: `→${g.to}`, rect: g.rect })),
        ...district.points.map((p) => ({ id: p.id, rect: p.rect })),
      ];

      for (const goal of goals) {
        const spot = freeSpotNear(scene, centerOf(goal.rect), from);
        const path = findPath(scene, from, spot);
        expect(path.length, `${district.id}: ${goal.id}`).toBeGreaterThan(0);
        // Путь должен приводить в пределы вытянутой руки.
        expect(distance(path[path.length - 1]!, centerOf(goal.rect))).toBeLessThanOrEqual(REACH_TILES);
      }
    });

    it(`${district.id}: путь идёт только по свободным плиткам`, () => {
      const scene = districtScene(state, district.id);
      const { free } = walkableIn(scene);
      const target = centerOf(getDistrict(district.id).gates[0]!.rect);
      for (const step of findPath(scene, district.spawn, target).slice(0, -1)) {
        expect(free(step), `${district.id} @ ${step.x},${step.y}`).toBe(true);
      }
    });
  }
});
