import { DISTRICT } from '@data/world';
import { getLocation } from '@data/locations';
import { SLOTS } from '@core/types';
import type { GameState, RoomDef, RoomPointDef, WorldPoint, WorldRect } from '@core/types';
import { t } from '@ui/i18n';
import { COLORS, CONTENT, LAYOUT } from '@ui/theme';
import type { Hotspots, Rect } from '@ui/widgets/Hotspots';
import type { Painter } from '@ui/widgets/Painter';
import { actorTexture } from '../art';
import type { ActorPose } from '../art';
import { cameraOffset, centerOf, nearest } from './movement';
import type { CrowdActor } from './Crowd';
import { lookFor } from './actorSprite';
import type { Facing } from './actorSprite';

/** Насколько близко надо подойти, чтобы взаимодействовать. */
export const REACH = 26;

const DOOR_SHUT = 0x14171f;
const DOOR_OPEN = 0x6b7a55;

/** Цель в пределах досягаемости? */
export function withinReach(position: WorldPoint, rect: WorldRect): boolean {
  const center = centerOf(rect);
  return Math.hypot(center.x - position.x, center.y - position.y) <= REACH;
}

export interface WorldTarget {
  readonly kind: 'door' | 'exit' | 'point';
  readonly id: string;
  readonly nameKey: string;
  readonly rect: WorldRect;
  /** Дверь заперта по часам работы локации (раздел 8). */
  readonly locked?: boolean | undefined;
}

export interface WorldViewParams {
  readonly painter: Painter;
  readonly hotspots: Hotspots;
  readonly state: GameState;
  readonly position: WorldPoint;
  readonly facing: Facing;
  readonly walked: number;
  readonly moving: boolean;
  readonly crowd: readonly CrowdActor[];
  readonly onActivate: (target: WorldTarget) => void;
  readonly onWalk: (point: WorldPoint) => void;
}

/** Прямоугольник тапа: не меньше требуемых 16x16 вокруг центра. */
function tapRect(rect: Rect): Rect {
  const w = Math.max(rect.w, LAYOUT.minTap);
  const h = Math.max(rect.h, LAYOUT.minTap);
  return { x: rect.x + (rect.w - w) / 2, y: rect.y + (rect.h - h) / 2, w, h };
}

interface Layer {
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

export function renderWorld(params: WorldViewParams, layer: Layer): void {
  const { painter, hotspots, position } = params;
  const camera = cameraOffset(position, layer.bounds, CONTENT.width, CONTENT.height);
  const toScreen = (rect: WorldRect): Rect => ({
    x: Math.round(rect.x - camera.x),
    y: Math.round(CONTENT.y + rect.y - camera.y),
    w: Math.round(rect.w),
    h: Math.round(rect.h),
  });

  painter.fill({ x: 0, y: CONTENT.y, w: CONTENT.width, h: CONTENT.height }, COLORS.bg);
  painter.fill(toScreen({ x: 0, y: 0, w: layer.bounds.width, h: layer.bounds.height }), layer.floor);

  for (const block of layer.blocks) {
    const rect = toScreen(block.rect);
    painter.fill(rect, block.color);

    if (block.nameKey && rect.h >= 24) {
      // Вывеска по центру дома: у верхнего ряда дверь снизу, у нижнего —
      // сверху, и надпись у любого края попадала бы под проём.
      const sign = { x: rect.x + 2, y: rect.y + Math.round(rect.h / 2) - 7, w: rect.w - 4, h: 14 };
      const door = block.doorRect ? toScreen(block.doorRect) : null;
      facade(painter, rect, block.color, block.nameKey, door ? [sign, door] : [sign]);

      painter.fill(sign, 0x0e1016, 0.86);
      painter.stroke(sign, shade(block.color, 1.5));
      painter.label(sign, t(block.nameKey), { align: 'center', color: COLORS.text });
    } else if (block.nameKey) {
      facade(painter, rect, block.color, block.nameKey, []);
    }

    painter.stroke(rect, COLORS.border);
  }

  const focus = nearest(position, layer.targets, REACH);

  for (const target of layer.targets) {
    const rect = toScreen(target.rect);
    const active = focus?.id === target.id;
    // Дверь — тёмный проём, а не яркая метка; светится только та,
    // до которой игрок дошёл.
    const color =
      layer.pointColors.get(target.id) ?? (active ? DOOR_OPEN : DOOR_SHUT);
    painter.fill(rect, color);
    painter.stroke(rect, active ? COLORS.borderFocus : COLORS.border);

    // Пока вместо мебели прямоугольники, подпись — единственный способ
    // понять, что это. На вехе 7 её заменит узнаваемый спрайт.
    if (target.kind === 'point' && rect.w >= 24) {
      const caption = { x: rect.x - 40, y: rect.y - 13, w: rect.w + 80, h: 12 };
      const label = painter.label(caption, t(target.nameKey), {
        align: 'center',
        color: active ? COLORS.accent : COLORS.textDim,
      });
      // Подложка ровно по ширине надписи: подпись ложится на стену дома
      // и без неё сливается. Фигуры рисуются под текстом, поэтому
      // порядок вызовов роли не играет.
      const width = Math.ceil(label.width) + 6;
      painter.fill(
        { x: rect.x + rect.w / 2 - width / 2, y: caption.y, w: width, h: caption.h },
        COLORS.bg,
        0.78,
      );
    }

    const hotspot = {
      rect: tapRect(rect),
      label: target.id,
      enabled: true,
      onActivate: () => params.onActivate(target),
    };
    hotspots.add(hotspot);
  }

  // Персонажи рисуются по возрастанию Y: тот, кто ниже, заслоняет
  // того, кто дальше. Без этого прохожие «протыкают» друг друга.
  const people = [
    ...params.crowd.map((actor) => ({
      position: actor.position,
      palette: actor.member.palette + 1,
      look: lookFor(actor.facing, actor.walked, actor.moving),
    })),
    {
      position,
      palette: 0,
      look: lookFor(params.facing, params.walked, params.moving),
    },
  ].sort((a, b) => a.position.y - b.position.y);

  for (const person of people) {
    drawPerson(painter, person.position, person.palette, person.look, camera);
  }

  if (focus) {
    const bar = { x: 0, y: CONTENT.y + CONTENT.height - 12, w: CONTENT.width, h: 12 };
    painter.fill(bar, COLORS.panelAlt);
    painter.label(bar, promptFor(focus), {
      align: 'center',
      color: focus.locked ? COLORS.textMuted : COLORS.accent,
    });
  }
}

/** Устойчивый хеш строки: свет в окнах должен быть одинаков между кадрами. */
function hash(text: string, salt: number): number {
  let value = 0x811c9dc5 ^ salt;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 0x01000193);
  }
  return (value >>> 0) / 0x100000000;
}

function shade(color: number, factor: number): number {
  const r = Math.min(255, Math.round(((color >> 16) & 0xff) * factor));
  const g = Math.min(255, Math.round(((color >> 8) & 0xff) * factor));
  const b = Math.min(255, Math.round((color & 0xff) * factor));
  return (r << 16) | (g << 8) | b;
}

const WINDOW_LIT = [0xf0c874, 0xe8a75c, 0xd9d06a];

const overlapsRect = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/**
 * Фасад ночного дома: цоколь, ряды окон, часть которых горит, и полоса
 * вывески под крышей. Свет в окнах детерминирован по адресу дома —
 * иначе он мерцал бы на каждой перерисовке.
 */
function facade(
  painter: Painter,
  rect: Rect,
  color: number,
  nameKey: string,
  reserved: readonly Rect[],
): void {
  // Полоса вывески и тёмный цоколь задают дому верх и низ.
  painter.fill({ x: rect.x, y: rect.y, w: rect.w, h: 3 }, shade(color, 1.55));
  painter.fill({ x: rect.x, y: rect.y + rect.h - 5, w: rect.w, h: 5 }, shade(color, 0.55));

  const cols = Math.max(2, Math.floor((rect.w - 10) / 18));
  const rows = Math.max(1, Math.floor((rect.h - 26) / 16));
  const stepX = (rect.w - 10) / cols;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = Math.round(rect.x + 5 + col * stepX + stepX / 2 - 5);
      const y = rect.y + 10 + row * 16;
      // Окно не рисуем там, где вывеска или дверной проём.
      const box = { x, y, w: 10, h: 8 };
      if (reserved.some((area) => overlapsRect(area, box))) continue;

      const roll = hash(`${nameKey}:${row}:${col}`, 7);
      const lit = roll > 0.45;
      painter.fill(
        box,
        lit ? (WINDOW_LIT[Math.floor(roll * WINDOW_LIT.length) % WINDOW_LIT.length] as number) : shade(color, 0.4),
      );
      if (lit) {
        // Свет из окна ложится на стену: без этого окна выглядят наклейками.
        painter.fill({ x: x - 1, y: y + 8, w: 12, h: 2 }, shade(color, 1.35), 0.5);
      }
    }
  }
}

/** У выхода собственная подпись, у двери и точки — глагол перед названием. */
function promptFor(target: WorldTarget): string {
  if (target.kind === 'exit') return t(target.nameKey);
  if (target.locked) return `${t(target.nameKey)} — ${t('ui.closedNow')}`;
  return `${t(target.kind === 'door' ? 'ui.enter' : 'ui.open')}: ${t(target.nameKey)}`;
}

function drawPerson(
  painter: Painter,
  position: WorldPoint,
  paletteIndex: number,
  look: { pose: ActorPose; flipX: boolean },
  camera: WorldPoint,
): void {
  painter.sprite(
    position.x - camera.x,
    CONTENT.y + position.y - camera.y,
    actorTexture(paletteIndex, look.pose),
    look.flipX,
  );
}

/** Точка мира под тапом: экранные координаты обратно в мировые. */
export function screenToWorld(tap: WorldPoint, position: WorldPoint, layer: Layer): WorldPoint {
  const camera = cameraOffset(position, layer.bounds, CONTENT.width, CONTENT.height);
  return { x: tap.x + camera.x, y: tap.y - CONTENT.y + camera.y };
}

export function pointOf(room: RoomDef | null, id: string): RoomPointDef | undefined {
  const source = room ? room.points : DISTRICT.points;
  return source.find((point) => point.id === id);
}

/** Затемнение цвета закрытого дома. */
function dim(color: number): number {
  const r = Math.round(((color >> 16) & 0xff) * 0.45);
  const g = Math.round(((color >> 8) & 0xff) * 0.45);
  const b = Math.round((color & 0xff) * 0.45);
  return (r << 16) | (g << 8) | b;
}

export { centerOf };
