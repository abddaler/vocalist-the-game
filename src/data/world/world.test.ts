import { describe, expect, it } from 'vitest';
import { ACTIVITIES, hasActivity } from '../activities';
import { LOCATIONS } from '../locations';
import { hasVenue } from '../venues';
import { CITY, HOME_DISTRICT, STREET, getDistrict } from './city';
import { ROOMS, getRoom, hasRoom } from './rooms';
import { CONTENT } from '../../ui/theme';
import { overlaps } from '../../game/world/movement';

const inside = (outer: { width: number; height: number }, rect: { x: number; y: number; w: number; h: number }) =>
  rect.x >= 0 && rect.y >= 0 && rect.x + rect.w <= outer.width && rect.y + rect.h <= outer.height;

/** Полоса, по которой игрок ходит между рядами домов. */
const onPavement = (y: number): boolean => y >= STREET.walkTop && y <= STREET.walkBottom;

describe('город', () => {
  it('каждый район ровно по высоте игрового поля: вертикально он не прокручивается', () => {
    // Иначе улица уезжает под верхнюю панель — так и было до правки.
    for (const district of CITY) expect(district.height, district.id).toBe(CONTENT.height);
  });

  it('дом на каждую локацию, кроме самой улицы, и ровно один', () => {
    const built = CITY.flatMap((district) => district.buildings.map((b) => b.locationId));
    for (const location of LOCATIONS) {
      if (location.id === 'district') continue;
      expect(built.filter((id) => id === location.id).length, location.id).toBe(1);
    }
    expect(built).toHaveLength(9);
  });

  it('связен: из дома можно дойти до любого района', () => {
    const seen = new Set([HOME_DISTRICT]);
    const queue = [HOME_DISTRICT];
    while (queue.length > 0) {
      for (const gate of getDistrict(queue.pop()!).gates) {
        if (seen.has(gate.to)) continue;
        seen.add(gate.to);
        queue.push(gate.to);
      }
    }
    expect(seen.size).toBe(CITY.length);
  });

  it('створы парные: из соседа есть путь обратно', () => {
    for (const district of CITY) {
      for (const gate of district.gates) {
        const back = getDistrict(gate.to).gates.some((other) => other.to === district.id);
        expect(back, `${district.id} → ${gate.to}`).toBe(true);
      }
    }
  });

  it('всё помещается в свой район', () => {
    for (const district of CITY) {
      const bounds = { width: district.width, height: district.height };
      for (const building of district.buildings) {
        expect(inside(bounds, building.rect), building.locationId).toBe(true);
        expect(inside(bounds, building.door), building.locationId).toBe(true);
      }
      for (const house of district.scenery) expect(inside(bounds, house.rect), district.id).toBe(true);
      for (const point of district.points) expect(inside(bounds, point.rect), point.id).toBe(true);
      for (const gate of district.gates) expect(inside(bounds, gate.rect), gate.to).toBe(true);
    }
  });

  it('дома не налезают друг на друга', () => {
    for (const district of CITY) {
      const houses = [...district.buildings.map((b) => b.rect), ...district.scenery.map((s) => s.rect)];
      for (let i = 0; i < houses.length; i += 1) {
        for (let j = i + 1; j < houses.length; j += 1) {
          expect(overlaps(houses[i]!, houses[j]!), `${district.id}: ${i} и ${j}`).toBe(false);
        }
      }
    }
  });

  it('игрок появляется на мостовой, а не внутри стены', () => {
    for (const district of CITY) {
      expect(onPavement(district.spawn.y), district.id).toBe(true);
      for (const building of district.buildings) {
        expect(overlaps({ ...district.spawn, w: 8, h: 12 }, building.rect), district.id).toBe(false);
      }
    }
  });

  it('до створа и уличной площадки можно дойти ногами', () => {
    for (const district of CITY) {
      for (const gate of district.gates) {
        expect(onPavement(gate.rect.y + gate.rect.h / 2), `${district.id} → ${gate.to}`).toBe(true);
      }
      for (const point of district.points) {
        expect(onPavement(point.rect.y + point.rect.h / 2), point.id).toBe(true);
      }
    }
  });

  it('уличные площадки ссылаются на существующие сцены', () => {
    for (const district of CITY) {
      for (const point of district.points) {
        for (const venue of point.venues) expect(hasVenue(venue), venue).toBe(true);
      }
    }
  });

  it('обе уличные сцены где-то стоят: иначе до них не добраться', () => {
    const placed = new Set(CITY.flatMap((d) => d.points.flatMap((p) => p.venues)));
    expect([...placed].sort()).toEqual(['corporate', 'underpass']);
  });
});

describe('комнаты локаций', () => {
  it('есть у каждого дома', () => {
    for (const building of CITY.flatMap((district) => district.buildings)) {
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

describe('двери держатся своих домов', () => {
  it('дверь лежит внутри стены дома, а не посреди улицы', () => {
    // Ровно этот отрыв ломал вход: дверь верхнего ряда осталась на
    // старых координатах после того, как дома стали ниже.
    for (const { rect, door, locationId } of CITY.flatMap((d) => d.buildings)) {
      expect(door.x, locationId).toBeGreaterThanOrEqual(rect.x);
      expect(door.x + door.w, locationId).toBeLessThanOrEqual(rect.x + rect.w);
      expect(door.y, locationId).toBeGreaterThanOrEqual(rect.y);
      expect(door.y + door.h, locationId).toBeLessThanOrEqual(rect.y + rect.h);
    }
  });

  it('к каждой двери можно подойти с мостовой', () => {
    // Дверь должна касаться края дома со стороны улицы, иначе она
    // замурована внутри.
    for (const { rect, door, locationId } of CITY.flatMap((d) => d.buildings)) {
      const touchesTop = door.y === rect.y;
      const touchesBottom = door.y + door.h === rect.y + rect.h;
      expect(touchesTop || touchesBottom, locationId).toBe(true);
      const outside = touchesBottom ? door.y + door.h + 1 : door.y - 1;
      expect(onPavement(outside), locationId).toBe(true);
    }
  });
});
