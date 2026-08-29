import { describe, expect, it } from 'vitest';
import { ACTIVITIES, hasActivity } from '../activities';
import { LOCATIONS } from '../locations';
import { hasVenue } from '../venues';
import { CITY, HOME_DISTRICT, getDistrict } from './city';
import { ROOMS, getRoom, hasRoom } from './rooms';
import { crowdIn } from './crowd';
import type { DistrictDef, RoomDef, WorldRect } from '@core/types';
import { cellAt, parseMap } from '../../game/world/iso/map';
import { footprintOf } from '../../game/world/decor';

const overlaps = (a: WorldRect, b: WorldRect): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/** Есть ли под точкой плитка, на которой можно стоять. */
const onGround = (source: DistrictDef | RoomDef, x: number, y: number): boolean =>
  cellAt(parseMap(source.tiles), Math.floor(x), Math.floor(y)) !== null;

const sizeOf = (source: DistrictDef | RoomDef): { width: number; depth: number } => {
  const map = parseMap(source.tiles);
  return { width: map.width, depth: map.depth };
};

const inside = (outer: { width: number; depth: number }, rect: WorldRect): boolean =>
  rect.x >= 0 && rect.y >= 0 && rect.x + rect.w <= outer.width && rect.y + rect.h <= outer.depth;

describe('город', () => {
  it('у каждого района есть земля и она не вырождена в полосу', () => {
    // Полоса в один-два ряда — это коридор без ландшафта, ради ухода от
    // которого мир и переведён в изометрию.
    for (const district of CITY) {
      const { width, depth } = sizeOf(district);
      expect(width, district.id).toBeGreaterThan(20);
      expect(depth, district.id).toBeGreaterThan(6);
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
      const bounds = sizeOf(district);
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
      expect(onGround(district, district.spawn.x, district.spawn.y), district.id).toBe(true);
      for (const building of district.buildings) {
        const { x, y } = district.spawn;
        expect(
          overlaps({ x: x - 0.3, y: y - 0.3, w: 0.6, h: 0.6 }, building.rect),
          district.id,
        ).toBe(false);
      }
    }
  });

  it('дверь открывается на землю, а не в стену', () => {
    for (const district of CITY) {
      for (const building of district.buildings) {
        expect(onGround(district, building.door.x + 0.5, building.door.y + 0.5), building.locationId).toBe(true);
        // Порог стоит вплотную к дому: иначе дверь висит посреди улицы.
        expect(building.door.y, building.locationId).toBe(building.rect.y + building.rect.h);
      }
    }
  });

  it('прохожие ходят по земле района, а не сквозь стену и не по воде', () => {
    for (const district of CITY) {
      for (const member of crowdIn(district.id)) {
        for (let i = 0; i < member.path.length; i += 1) {
          const from = member.path[i]!;
          const to = member.path[(i + 1) % member.path.length]!;
          const steps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) * 2);
          for (let k = 0; k <= steps; k += 1) {
            const x = from.x + ((to.x - from.x) * k) / Math.max(1, steps);
            const y = from.y + ((to.y - from.y) * k) / Math.max(1, steps);
            expect(onGround(district, x, y), `${member.id} @ ${x.toFixed(1)},${y.toFixed(1)}`).toBe(true);
          }
        }
      }
    }
  });

  it('порог двери свободен: на него не поставили фонарь', () => {
    // Предмет ровно на пороге отрезает дверь, и понять это по картинке
    // нельзя — только упереться в неё ногами.
    for (const district of CITY) {
      for (const building of district.buildings) {
        const { door } = building;
        for (const item of district.decor) {
          const rect = footprintOf(item);
          if (!rect) continue;
          expect(
            overlaps(rect, door),
            `${district.id}: ${item.kind} на пороге ${building.locationId}`,
          ).toBe(false);
        }
      }
    }
  });

  it('мелочь стоит на земле, а не висит в воздухе', () => {
    for (const district of CITY) {
      for (const item of district.decor) {
        // Чайки летают: им земля не нужна.
        if (item.kind === 'gull') continue;
        expect(onGround(district, item.x, item.y), `${district.id}: ${item.kind} @ ${item.x},${item.y}`).toBe(true);
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
      const bounds = sizeOf(room);
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
