import { describe, expect, it } from 'vitest';
import { ACTIVITIES, hasActivity } from '../activities';
import { LOCATIONS } from '../locations';
import { hasVenue } from '../venues';
import { CITY, HOME_DISTRICT, getDistrict } from './city';
import { ROOMS, getRoom, hasRoom } from './rooms';
import { crowdIn } from './crowd';
import { CONTENT, WORLD_ZOOM } from '../../ui/theme';
import { ACTOR, overlaps } from '../../game/world/movement';
import { REACH } from '../../game/world/targets';
import { groundBelow, standable } from '../../game/world/terrain';
import type { DistrictDef } from '@core/types';

const inside = (outer: { width: number; height: number }, rect: { x: number; y: number; w: number; h: number }) =>
  rect.x >= 0 && rect.y >= 0 && rect.x + rect.w <= outer.width && rect.y + rect.h <= outer.height;

/** Есть ли под этой точкой района земля, на которой можно стоять. */
const canStand = (district: DistrictDef, x: number, y: number): boolean =>
  standable(district.terrain, { x, y });

/** До чего можно дотянуться: хоть одна стоячая точка в пределах прямоугольника. */
const reachable = (district: DistrictDef, rect: { x: number; y: number; w: number; h: number }): boolean => {
  const x = rect.x + rect.w / 2;
  for (let y = rect.y; y <= rect.y + rect.h; y += 1) {
    if (canStand(district, x, y)) return true;
  }
  return false;
};

describe('город', () => {
  it('район выше кадра: по нему ходят и вглубь, а не только вбок', () => {
    // Ровно на высоту кадра — это коридор без ландшафта, из-за которого
    // район и читался одной дорогой налево-направо.
    for (const district of CITY) {
      expect(district.height, district.id).toBeGreaterThan(CONTENT.height / WORLD_ZOOM);
    }
  });

  it('земля сплошная там, где она есть, и разорвана только обрывами', () => {
    // Разрыв между плитами — это и есть перепад уровня; каждый обязан
    // быть перекрыт лестницей, иначе нижний ярус недостижим.
    for (const district of CITY) {
      for (const plate of district.terrain) {
        const riser = plate.riser ?? 0;
        if (riser <= 0) continue;
        const gapY = plate.rect.y + plate.rect.h + riser / 2;
        const bridged = district.terrain.some(
          (other) =>
            other.surface === 'steps' &&
            other.rect.y <= gapY &&
            other.rect.y + other.rect.h >= gapY,
        );
        expect(bridged, `${district.id} @ ${plate.rect.y}`).toBe(true);
      }
    }
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

  it('игрок появляется на земле, а не внутри стены', () => {
    for (const district of CITY) {
      expect(canStand(district, district.spawn.x, district.spawn.y), district.id).toBe(true);
      for (const building of district.buildings) {
        expect(overlaps({ ...district.spawn, w: 8, h: 12 }, building.rect), district.id).toBe(false);
      }
    }
  });

  it('до створа и уличной площадки можно дойти ногами', () => {
    for (const district of CITY) {
      for (const gate of district.gates) {
        expect(reachable(district, gate.rect), `${district.id} → ${gate.to}`).toBe(true);
      }
      for (const point of district.points) {
        expect(reachable(district, point.rect), point.id).toBe(true);
      }
    }
  });

  it('прохожие ходят по земле района, а не сквозь стену и не по воде', () => {
    for (const district of CITY) {
      for (const member of crowdIn(district.id)) {
        for (const point of member.path) {
          expect(canStand(district, point.x, point.y), `${member.id} @ ${point.x},${point.y}`).toBe(true);
        }
      }
    }
  });

  it('мелочь стоит на земле, а не висит над обрывом и не тонет', () => {
    for (const district of CITY) {
      for (const item of district.decor) {
        // Чайки летают: им земля не нужна.
        if (item.kind === 'gull') continue;
        expect(canStand(district, item.x, item.y), `${district.id}: ${item.kind} @ ${item.x},${item.y}`).toBe(true);
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
      // Вышедший встаёт на первую плиту под дверью, и его тело при этом
      // не должно оставаться в стене дома.
      const district = CITY.find((d) => d.buildings.some((b) => b.locationId === locationId))!;
      const feet = groundBelow(
        district.terrain,
        door.x + door.w / 2,
        rect.y + rect.h + ACTOR.h,
        district.height,
      );
      expect(feet, locationId).not.toBeNull();
      // И оттуда до двери должно хватать вытянутой руки.
      expect(feet! - (door.y + door.h / 2), locationId).toBeLessThanOrEqual(REACH);
    }
  });
});
