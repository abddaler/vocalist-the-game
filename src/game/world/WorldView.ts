import { DISTRICT } from '@data/world';
import type { GameState, RoomDef, RoomPointDef, WorldPoint, WorldRect } from '@core/types';
import { t } from '@ui/i18n';
import { COLORS, CONTENT, LAYOUT } from '@ui/theme';
import type { Hotspots, Rect } from '@ui/widgets/Hotspots';
import type { Painter } from '@ui/widgets/Painter';
import { actorTexture } from '../art';
import type { ActorPose } from '../art';
import { cameraOffset, nearest } from './movement';
import { facade, shade } from './facade';
import type { Layer } from './layers';
import { REACH } from './targets';
import type { WorldTarget } from './targets';
import type { CrowdActor } from './Crowd';
import { lookFor } from './actorSprite';
import type { Facing } from './actorSprite';

const DOOR_SHUT = 0x14171f;
const DOOR_OPEN = 0x6b7a55;

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

