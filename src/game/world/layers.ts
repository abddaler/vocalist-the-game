import { DISTRICT } from '@data/world';
import { getLocation } from '@data/locations';
import { SLOTS } from '@core/types';
import type { GameState, RoomDef, WorldRect } from '@core/types';
import type { WorldTarget } from './targets';

/**
 * Слой мира: то, что рисуется и по чему ходят. Улица и комната
 * приводятся к одному описанию, чтобы рендер не знал между ними разницы.
 */
export interface Layer {
  readonly bounds: { width: number; height: number };
  readonly floor: number;
  readonly blocks: readonly {
    rect: WorldRect;
    color: number;
    nameKey?: string;
    doorRect?: WorldRect;
  }[];
  readonly targets: readonly WorldTarget[];
  readonly pointColors: ReadonlyMap<string, number>;
}

export function districtLayer(state: GameState): Layer {
  const slot = SLOTS[state.slotIndex] ?? 'morning';
  const pointColors = new Map(DISTRICT.points.map((p) => [p.id, p.color]));

  return {
    bounds: { width: DISTRICT.width, height: DISTRICT.height },
    floor: 0x1a1d26,
    blocks: [
      ...DISTRICT.solids.map((rect) => ({ rect, color: 0x101319 })),
      ...DISTRICT.buildings.map((b) => ({
        rect: b.rect,
        color: getLocation(b.locationId).openSlots.includes(slot) ? b.color : dim(b.color),
        nameKey: getLocation(b.locationId).nameKey,
        doorRect: b.door,
      })),
    ],
    targets: [
      ...DISTRICT.buildings.map((b) => ({
        kind: 'door' as const,
        id: b.locationId,
        nameKey: getLocation(b.locationId).nameKey,
        rect: b.door,
        locked: !getLocation(b.locationId).openSlots.includes(slot),
      })),
      ...DISTRICT.points.map((p) => ({
        kind: 'point' as const,
        id: p.id,
        nameKey: p.nameKey,
        rect: p.rect,
      })),
    ],
    pointColors,
  };
}

export function roomLayer(room: RoomDef): Layer {
  return {
    bounds: { width: room.width, height: room.height },
    floor: room.floor,
    blocks: room.solids.map((rect) => ({ rect, color: 0x101319 })),
    targets: [
      { kind: 'exit', id: room.locationId, nameKey: 'ui.exit', rect: room.exit },
      ...room.points.map((p) => ({
        kind: 'point' as const,
        id: p.id,
        nameKey: p.nameKey,
        rect: p.rect,
      })),
    ],
    pointColors: new Map(room.points.map((p) => [p.id, p.color])),
  };
}

/** Твёрдые препятствия слоя: по ним считаются столкновения. */
export function solidsOf(layer: Layer): WorldRect[] {
  return layer.blocks.map((block) => block.rect);
}

/** Затемнение цвета закрытого дома. */
function dim(color: number): number {
  const r = Math.round(((color >> 16) & 0xff) * 0.45);
  const g = Math.round(((color >> 8) & 0xff) * 0.45);
  const b = Math.round((color & 0xff) * 0.45);
  return (r << 16) | (g << 8) | b;
}
