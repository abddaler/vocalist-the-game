import { describe, expect, it } from 'vitest';
import { TILE, depthOf, mapOrigin, mapSize, toGround, toScreen } from './project';

describe('изометрическая проекция', () => {
  it('кладёт начало координат в начало координат', () => {
    expect(toScreen({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });

  it('разводит соседние плитки по диагоналям', () => {
    expect(toScreen({ x: 1, y: 0 })).toEqual({ x: TILE.halfW, y: TILE.halfH });
    expect(toScreen({ x: 0, y: 1 })).toEqual({ x: -TILE.halfW, y: TILE.halfH });
  });

  it('поднимает уровень вверх по экрану', () => {
    expect(toScreen({ x: 2, y: 2, z: 1 }).y).toBe(4 * TILE.halfH - TILE.level);
  });

  it('обращается: экранная точка возвращается в свою плитку', () => {
    for (const point of [{ x: 0, y: 0 }, { x: 3, y: 7 }, { x: 12.5, y: 2.25 }]) {
      const back = toGround(toScreen(point));
      expect(back.x).toBeCloseTo(point.x, 6);
      expect(back.y).toBeCloseTo(point.y, 6);
    }
  });

  it('сортирует по удалению от камеры, а не по одной оси', () => {
    expect(depthOf({ x: 4, y: 1 })).toBeLessThan(depthOf({ x: 4, y: 2 }));
    expect(depthOf({ x: 1, y: 4 })).toBeLessThan(depthOf({ x: 2, y: 4 }));
    // Уровень решает только спор равных: иначе верхняя площадка закрывала бы
    // то, что стоит перед ней.
    expect(depthOf({ x: 3, y: 3, z: 1 })).toBeGreaterThan(depthOf({ x: 3, y: 3 }));
    expect(depthOf({ x: 3, y: 3, z: 9 })).toBeLessThan(depthOf({ x: 4, y: 3 }));
  });

  it('карта помещается в свою текстуру целиком', () => {
    const width = 10;
    const depth = 6;
    const size = mapSize(width, depth, 2);
    const origin = mapOrigin(depth, 2);
    for (const [x, y] of [[0, 0], [width, 0], [0, depth], [width, depth]] as const) {
      const at = toScreen({ x, y, z: 2 });
      expect(origin.x + at.x).toBeGreaterThanOrEqual(0);
      expect(origin.x + at.x).toBeLessThanOrEqual(size.w);
      expect(origin.y + at.y).toBeGreaterThanOrEqual(0);
      expect(origin.y + at.y).toBeLessThanOrEqual(size.h);
    }
  });
});
