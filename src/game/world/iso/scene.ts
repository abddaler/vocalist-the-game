import { SLOTS } from '@core/types';
import type {
  BuildingKind,
  DecorDef,
  DistrictDef,
  DistrictId,
  GameState,
  RoomDef,
  Slot,
  WorldPoint,
  WorldRect,
} from '@core/types';
import { getDistrict } from '@data/world';
import { getLocation } from '@data/locations';
import { ROOM_WALL_H } from '@data/world';
import { footprintOf } from '../decor';
import type { WorldTarget } from '../targets';
import { parseMap } from './map';
import type { IsoMap } from './map';
import type { Blocked } from './walk';

/**
 * Сцена мира: сетка земли, объёмы на ней, цели и мелочь. Улица и комната
 * приводятся к одному описанию, чтобы рендер не знал между ними разницы.
 */
export interface IsoBlock {
  /** Основание в плитках. */
  readonly rect: WorldRect;
  /** Высота на экране, в пикселях. */
  readonly tall: number;
  readonly color: number;
  readonly kind: BuildingKind;
  /** Вывеска: у рабочих домов — имя локации, у чужих — своя. */
  readonly nameKey?: string | undefined;
  readonly doorRect?: WorldRect | undefined;
  /** Стена комнаты: рисуется обоями, а не фасадом с витриной. */
  readonly wall?: boolean | undefined;
}

export interface IsoScene {
  readonly map: IsoMap;
  readonly blocks: readonly IsoBlock[];
  readonly targets: readonly WorldTarget[];
  readonly pointColors: ReadonlyMap<string, number>;
  readonly decor: readonly DecorDef[];
  /** Под открытым небом: район задаёт небо и дальний план, комната — нет. */
  readonly district: DistrictId | null;
  readonly slot: Slot;
  /** Гамма помещения: ею красится и полумрак за стенами комнаты. */
  readonly floorColor: number;
  /** Ключ запечённой подложки: пока он тот же, текстуру не переделывают. */
  readonly key: string;
}

export function districtScene(state: GameState, districtId: DistrictId): IsoScene {
  const district = getDistrict(districtId);
  const slot = SLOTS[state.slotIndex] ?? 'morning';
  const open = (locationId: string): boolean => getLocation(locationId).openSlots.includes(slot);

  return {
    map: mapOf(district),
    blocks: [
      ...district.scenery.map((house) => ({
        rect: house.rect,
        tall: house.tall,
        color: house.color,
        kind: house.kind,
        nameKey: house.signKey,
      })),
      ...district.buildings.map((building) => ({
        rect: building.rect,
        tall: building.tall,
        color: open(building.locationId) ? building.color : dim(building.color),
        kind: building.kind,
        nameKey: building.signKey,
        doorRect: building.door,
      })),
    ],
    targets: [
      ...district.buildings.map((building) => ({
        kind: 'door' as const,
        id: building.locationId,
        nameKey: getLocation(building.locationId).nameKey,
        rect: building.door,
        locked: !open(building.locationId),
      })),
      ...district.points.map((point) => ({
        kind: 'point' as const,
        id: point.id,
        nameKey: point.nameKey,
        rect: point.rect,
        prop: point.prop,
      })),
      ...district.gates.map((gate) => ({
        kind: 'gate' as const,
        id: gate.to,
        nameKey: getDistrict(gate.to).nameKey,
        rect: gate.rect,
      })),
    ],
    pointColors: new Map(district.points.map((point) => [point.id, point.color])),
    decor: district.decor,
    district: district.id,
    floorColor: 0x1a1626,
    slot,
    key: `${district.id}:${slot}`,
  };
}

export function roomScene(room: RoomDef, slot: Slot): IsoScene {
  return {
    map: mapOf(room),
    // Стены комнаты — те же объёмы, только без вывески и рода занятий.
    blocks: room.solids.map((rect) => ({
      rect,
      tall: ROOM_WALL_H,
      color: room.floor,
      kind: 'apartment' as BuildingKind,
      wall: true,
    })),
    targets: [
      { kind: 'exit', id: room.locationId, nameKey: 'ui.exit', rect: room.exit },
      ...room.points.map((point) => ({
        kind: 'point' as const,
        id: point.id,
        nameKey: point.nameKey,
        rect: point.rect,
        prop: point.prop,
      })),
    ],
    pointColors: new Map(room.points.map((point) => [point.id, point.color])),
    decor: room.decor,
    district: null,
    floorColor: room.floor,
    slot,
    key: `${room.locationId}:${slot}`,
  };
}

/**
 * Разбор сетки кешируется: строки в плитки переводятся один раз на
 * карту, а не на каждый кадр ходьбы.
 */
const PARSED = new WeakMap<object, IsoMap>();

function mapOf(source: DistrictDef | RoomDef): IsoMap {
  const cached = PARSED.get(source);
  if (cached) return cached;
  const map = parseMap(source.tiles);
  PARSED.set(source, map);
  return map;
}

/** Что занято объёмами и мелочью: туда не встать. */
export function blockedIn(scene: IsoScene): Blocked {
  const rects: WorldRect[] = [
    ...scene.blocks.map((block) => block.rect),
    ...scene.decor.map(footprintOf).filter((rect): rect is WorldRect => rect !== null),
  ];
  return (point: WorldPoint): boolean =>
    rects.some(
      (rect) =>
        point.x >= rect.x &&
        point.x < rect.x + rect.w &&
        point.y >= rect.y &&
        point.y < rect.y + rect.h,
    );
}

/** Где на улице стоит дверь этой локации. */
export function doorOf(district: DistrictDef, locationId: string): WorldRect | null {
  return district.buildings.find((b) => b.locationId === locationId)?.door ?? null;
}

/** Затемнение цвета закрытого дома. */
function dim(color: number): number {
  const r = Math.round(((color >> 16) & 0xff) * 0.5);
  const g = Math.round(((color >> 8) & 0xff) * 0.5);
  const b = Math.round((color & 0xff) * 0.5);
  return (r << 16) | (g << 8) | b;
}
