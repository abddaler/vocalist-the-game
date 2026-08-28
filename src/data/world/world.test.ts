import { describe, expect, it } from 'vitest';
import { ACTIVITIES, hasActivity } from '../activities';
import { LOCATIONS } from '../locations';
import { hasVenue } from '../venues';
import { DISTRICT } from './district';
import { ROOMS, getRoom, hasRoom } from './rooms';
import { CONTENT } from '../../ui/theme';
import { overlaps } from '../../game/world/movement';

const inside = (outer: { width: number; height: number }, rect: { x: number; y: number; w: number; h: number }) =>
  rect.x >= 0 && rect.y >= 0 && rect.x + rect.w <= outer.width && rect.y + rect.h <= outer.height;

describe('экран района', () => {
  it('ровно по высоте игрового поля: вертикально он не прокручивается', () => {
    // Иначе улица уезжает под верхнюю панель — так и было до правки.
    expect(DISTRICT.height).toBe(CONTENT.height);
  });

  it('дом на каждую локацию, кроме самой улицы', () => {
    const built = new Set(DISTRICT.buildings.map((b) => b.locationId));
    for (const location of LOCATIONS) {
      if (location.id === 'district') continue;
      expect(built.has(location.id), location.id).toBe(true);
    }
    expect(built.size).toBe(9);
  });

  it('всё помещается в карту', () => {
    const bounds = { width: DISTRICT.width, height: DISTRICT.height };
    for (const building of DISTRICT.buildings) {
      expect(inside(bounds, building.rect), building.locationId).toBe(true);
      expect(inside(bounds, building.door), building.locationId).toBe(true);
    }
    for (const point of DISTRICT.points) expect(inside(bounds, point.rect), point.id).toBe(true);
  });

  it('дома не налезают друг на друга', () => {
    for (let i = 0; i < DISTRICT.buildings.length; i += 1) {
      for (let j = i + 1; j < DISTRICT.buildings.length; j += 1) {
        const a = DISTRICT.buildings[i]!;
        const b = DISTRICT.buildings[j]!;
        expect(overlaps(a.rect, b.rect), `${a.locationId} и ${b.locationId}`).toBe(false);
      }
    }
  });

  it('игрок появляется не внутри стены', () => {
    for (const building of DISTRICT.buildings) {
      expect(overlaps({ ...DISTRICT.spawn, w: 8, h: 12 }, building.rect)).toBe(false);
    }
  });

  it('уличные площадки ссылаются на существующие сцены', () => {
    for (const point of DISTRICT.points) {
      for (const venue of point.venues) expect(hasVenue(venue), venue).toBe(true);
    }
  });
});

describe('комнаты локаций', () => {
  it('есть у каждого дома', () => {
    for (const building of DISTRICT.buildings) {
      expect(hasRoom(building.locationId), building.locationId).toBe(true);
    }
  });

  it('точки взаимодействия помещаются в комнату и не перекрываются', () => {
    for (const room of ROOMS) {
      const bounds = { width: room.width, height: room.height };
      expect(inside(bounds, room.exit), room.locationId).toBe(true);
      for (const point of room.points) {
        expect(inside(bounds, point.rect), `${room.locationId}/${point.id}`).toBe(true);
      }
      for (let i = 0; i < room.points.length; i += 1) {
        for (let j = i + 1; j < room.points.length; j += 1) {
          const a = room.points[i]!;
          const b = room.points[j]!;
          expect(overlaps(a.rect, b.rect), `${room.locationId}: ${a.id} и ${b.id}`).toBe(false);
        }
      }
    }
  });

  it('ссылаются только на существующие дела и сцены', () => {
    for (const room of ROOMS) {
      for (const point of room.points) {
        for (const id of point.activities) expect(hasActivity(id), id).toBe(true);
        for (const id of point.venues) expect(hasVenue(id), id).toBe(true);
      }
    }
  });

  it('каждое дело локации досягаемо хотя бы из одной точки', () => {
    // Иначе действие есть в данных, но игрок до него не дойдёт.
    for (const location of LOCATIONS) {
      if (!hasRoom(location.id)) continue;
      const reachable = new Set(getRoom(location.id).points.flatMap((p) => p.activities));
      for (const id of location.activities) {
        expect(reachable.has(id), `${location.id}: ${id}`).toBe(true);
      }
    }
  });

  it('все дела игры вообще где-то стоят', () => {
    const placed = new Set([
      ...ROOMS.flatMap((room) => room.points.flatMap((p) => p.activities)),
    ]);
    for (const activity of ACTIVITIES) {
      expect(placed.has(activity.id), activity.id).toBe(true);
    }
  });
});
