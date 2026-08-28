import { STREET, getDistrict } from '@data/world';
import { getLocation } from '@data/locations';
import { SLOTS } from '@core/types';
import type {
  BuildingKind,
  DecorDef,
  GroundKind,
  DistrictDef,
  DistrictId,
  GameState,
  RoomDef,
  Slot,
  WorldRect,
} from '@core/types';
import { footprintOf } from './decor';
import type { WorldTarget } from './targets';

/**
 * Слой мира: то, что рисуется и по чему ходят. Улица и комната
 * приводятся к одному описанию, чтобы рендер не знал между ними разницы.
 */
export interface Block {
  readonly rect: WorldRect;
  readonly color: number;
  /** Чем занят дом: по этому подбирается фасад. */
  readonly kind: BuildingKind;
  /** Вывеска на фасаде: у рабочих домов — имя локации, у чужих — своя. */
  readonly nameKey?: string | undefined;
  readonly doorRect?: WorldRect | undefined;
}

export interface Layer {
  readonly bounds: { width: number; height: number };
  readonly floor: number;
  readonly blocks: readonly Block[];
  /**
   * Непроходимые куски без картинки: небо над крышами и обрез внизу.
   * Отдельно от домов, потому что нарисовать их значит закрасить небо.
   */
  readonly walls: readonly WorldRect[];
  readonly targets: readonly WorldTarget[];
  readonly pointColors: ReadonlyMap<string, number>;
  readonly decor: readonly DecorDef[];
  /** Под открытым небом: район задаёт небо и мостовую, комната — нет. */
  readonly district: DistrictId | null;
  readonly ground: GroundKind;
  readonly strip: DistrictDef['strip'];
  /** Мировая координата кромки мощёной части. */
  readonly kerb: number;
  readonly slot: Slot;
}

export function districtLayer(state: GameState, districtId: DistrictId): Layer {
  const district = getDistrict(districtId);
  const slot = SLOTS[state.slotIndex] ?? 'morning';
  const open = (locationId: string): boolean =>
    getLocation(locationId).openSlots.includes(slot);

  return {
    bounds: { width: district.width, height: district.height },
    floor: 0x2a2f3a,
    walls: district.solids,
    blocks: [
      ...district.scenery.map((house) => ({
        rect: house.rect,
        color: house.color,
        kind: house.kind,
        nameKey: house.signKey,
      })),
      ...district.buildings.map((building) => ({
        rect: building.rect,
        color: open(building.locationId) ? building.color : dim(building.color),
        kind: building.kind,
        nameKey: getLocation(building.locationId).nameKey,
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
    ground: district.ground,
    strip: district.strip,
    kerb: district.kerb ?? STREET.walkBottom,
    slot,
  };
}

export function roomLayer(room: RoomDef, slot: Slot): Layer {
  return {
    bounds: { width: room.width, height: room.height },
    floor: room.floor,
    walls: [],
    // Стены комнаты рисуются заливкой, а не фасадом: род занятий им не нужен.
    blocks: room.solids.map((rect) => ({ rect, color: 0x101319, kind: 'apartment' as BuildingKind })),
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
    ground: 'street',
    strip: undefined,
    kerb: STREET.walkBottom,
    slot,
  };
}

/**
 * Твёрдые препятствия слоя: по ним считаются столкновения. Мелочь тоже
 * считается — сквозь скамейку и машину проходить нельзя, иначе улица
 * ощущается нарисованной, а не построенной.
 */
export function solidsOf(layer: Layer): WorldRect[] {
  const solids: WorldRect[] = [...layer.blocks.map((block) => block.rect), ...layer.walls];
  for (const item of layer.decor) {
    const rect = footprintOf(item);
    if (rect) solids.push(rect);
  }
  return solids;
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
