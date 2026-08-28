import { describe, expect, it } from 'vitest';
import type { TerrainDef } from '@core/types';
import { groundBelow, stairRoute, standable, surfaceAt } from './terrain';

/**
 * Улица наверху, набережная внизу, между ними разрыв в восемь пикселей,
 * перекрытый одной лестницей.
 */
const SHORE: TerrainDef[] = [
  { rect: { x: 0, y: 0, w: 200, h: 40 }, surface: 'road', riser: 8 },
  { rect: { x: 0, y: 48, w: 200, h: 30 }, surface: 'boardwalk' },
  { rect: { x: 0, y: 78, w: 200, h: 20 }, surface: 'water' },
  { rect: { x: 60, y: 40, w: 20, h: 8 }, surface: 'steps' },
];

describe('terrain', () => {
  it('holds a walker on paved plates and drops them off the map', () => {
    expect(standable(SHORE, { x: 100, y: 20 })).toBe(true);
    expect(standable(SHORE, { x: 100, y: 60 })).toBe(true);
    expect(standable(SHORE, { x: 100, y: 200 })).toBe(false);
  });

  it('keeps water out of reach', () => {
    expect(standable(SHORE, { x: 100, y: 90 })).toBe(false);
    expect(surfaceAt(SHORE, { x: 100, y: 90 })).toBe('water');
  });

  it('lets nobody cross the drop off except by the stairs', () => {
    expect(standable(SHORE, { x: 30, y: 44 })).toBe(false);
    expect(standable(SHORE, { x: 70, y: 44 })).toBe(true);
    expect(surfaceAt(SHORE, { x: 70, y: 44 })).toBe('steps');
  });
});

describe('stairRoute', () => {
  it('sends a walker round to the nearest stairs before crossing', () => {
    const route = stairRoute(SHORE, { x: 10, y: 20 }, { x: 190, y: 60 });
    expect(route).toEqual([
      { x: 70, y: 39 },
      { x: 70, y: 49 },
    ]);
  });

  it('reverses the same stairs when climbing back up', () => {
    const route = stairRoute(SHORE, { x: 190, y: 60 }, { x: 10, y: 20 });
    expect(route).toEqual([
      { x: 70, y: 49 },
      { x: 70, y: 39 },
    ]);
  });

  it('stays out of the way when both ends are on one level', () => {
    expect(stairRoute(SHORE, { x: 10, y: 60 }, { x: 190, y: 70 })).toEqual([]);
  });
});

describe('groundBelow', () => {
  it('drops someone leaving a door onto the first plate under it', () => {
    expect(groundBelow(SHORE, 100, 42, 98)).toBe(48);
  });
});
