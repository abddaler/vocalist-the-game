import type { DecorDef, GameState, WorldPoint, WorldRect } from '@core/types';
import { t } from '@ui/i18n';
import { COLORS, CONTENT, LAYOUT } from '@ui/theme';
import type { Hotspots, Rect } from '@ui/widgets/Hotspots';
import type { Painter } from '@ui/widgets/Painter';
import { actorTexture } from '../art';
import type { ActorPose } from '../art';
import { ambienceOf, mix, scale } from './ambience';
import type { Ambience } from './ambience';
import { drawFarSide, drawGround, drawShadow, drawSky, drawWash } from './backdrop';
import type { Backdrop } from './backdrop';
import { drawDecor, shadowWidth } from './decor';
import { facade, sign } from './facade';
import { cameraOffset, nearest } from './movement';
import { drawProp } from './props';
import type { Layer } from './layers';
import { REACH } from './targets';
import type { WorldTarget } from './targets';
import type { CrowdActor } from './Crowd';
import { lookFor } from './actorSprite';
import type { Facing } from './actorSprite';

/** Ночью в комнате свет включён: игрок дома, а не сидит в темноте. */
const ROOM_AMBIENCE: Ambience = ambienceOf('day', 'hills');

const DOOR_SHUT = 0x181c26;
const DOOR_OPEN = 0xffd98f;

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

  const outdoors = layer.district !== null;
  const ambience = outdoors ? ambienceOf(layer.slot, layer.district!) : ROOM_AMBIENCE;

  if (outdoors) drawOutside(painter, layer, camera, ambience);
  else {
    painter.fill({ x: 0, y: CONTENT.y, w: CONTENT.width, h: CONTENT.height }, COLORS.bg);
    painter.fill(
      toScreen({ x: 0, y: 0, w: layer.bounds.width, h: layer.bounds.height }),
      layer.floor,
    );
  }

  for (const block of layer.blocks) {
    const rect = toScreen(block.rect);
    if (rect.x > CONTENT.width || rect.x + rect.w < 0) continue;

    if (!block.nameKey) {
      painter.fill(rect, outdoors ? scale(block.color, ambience.light) : block.color);
      painter.stroke(rect, COLORS.border);
      continue;
    }

    // Вывеска по центру дома: у верхнего ряда дверь снизу, у нижнего —
    // сверху, и надпись у любого края попадала бы под проём.
    const board = { x: rect.x + 3, y: rect.y + Math.round(rect.h / 2) - 7, w: rect.w - 6, h: 14 };
    const door = block.doorRect ? toScreen(block.doorRect) : null;
    facade(painter, {
      rect,
      color: block.color,
      seed: block.nameKey,
      ambience,
      reserved: door ? [board, door] : [board],
      shopfront: door !== null,
    });

    sign(painter, board, block.color, ambience);
    painter.label(board, t(block.nameKey), { align: 'center', color: COLORS.text });
  }

  const focus = nearest(position, layer.targets, REACH);

  for (const target of layer.targets) {
    const rect = toScreen(target.rect);
    const active = focus?.id === target.id;
    drawTarget(painter, target, rect, active, layer, ambience);

    hotspots.add({
      rect: tapRect(rect),
      label: target.id,
      enabled: true,
      onActivate: () => params.onActivate(target),
    });
  }

  drawInhabitants(painter, params, layer, camera, ambience);

  if (outdoors) {
    drawWash(
      painter,
      { x: 0, y: CONTENT.y, w: CONTENT.width, h: CONTENT.height },
      ambience,
    );
  }

  if (focus) {
    const bar = { x: 0, y: CONTENT.y + CONTENT.height - 12, w: CONTENT.width, h: 12 };
    painter.fill(bar, COLORS.panelAlt, 0.9);
    painter.label(bar, promptFor(focus), {
      align: 'center',
      color: focus.locked ? COLORS.textMuted : COLORS.accent,
    });
  }
}

/** Небо, дальний план и мостовая — всё, что лежит под домами. */
function drawOutside(
  painter: Painter,
  layer: Layer,
  camera: WorldPoint,
  ambience: Ambience,
): void {
  const skyHeight = Math.round(CONTENT.height * 0.18);
  const area: Backdrop = {
    sky: { x: 0, y: CONTENT.y, w: CONTENT.width, h: skyHeight },
    road: { x: 0, y: CONTENT.y + skyHeight, w: CONTENT.width, h: CONTENT.height - skyHeight },
    cameraX: camera.x,
    worldWidth: layer.bounds.width,
  };

  drawSky(painter, area, ambience);
  drawFarSide(painter, area, ambience, layer.district!);
  drawGround(painter, area, ambience);
}

function drawTarget(
  painter: Painter,
  target: WorldTarget,
  rect: Rect,
  active: boolean,
  layer: Layer,
  ambience: Ambience,
): void {
  if (target.kind === 'gate') {
    drawGate(painter, rect, active, ambience);
    return;
  }

  const color = layer.pointColors.get(target.id);
  if (target.prop && color !== undefined) {
    drawProp(painter, target.prop, rect, color, active);
    if (active) painter.stroke(rect, COLORS.borderFocus);
  } else {
    // Дверь — тёмный проём с подсветкой над ним, а не яркая метка.
    painter.fill(rect, DOOR_SHUT);
    painter.fill({ x: rect.x + 1, y: rect.y + 1, w: rect.w - 2, h: 2 }, scale(DOOR_SHUT, 2.4));
    if (ambience.lampsOn && !target.locked) {
      painter.fill({ x: rect.x - 3, y: rect.y - 2, w: rect.w + 6, h: rect.h + 4 }, DOOR_OPEN, 0.14);
    }
    painter.stroke(rect, active ? COLORS.borderFocus : COLORS.border);
  }

  // Подпись только у того, к которому подошли: узнаваемая мебель в
  // подписи не нуждается, а лес ярлыков забивает комнату.
  if (target.kind === 'point' && active && rect.w >= 20) {
    const caption = { x: rect.x - 40, y: rect.y - 13, w: rect.w + 80, h: 12 };
    const label = painter.label(caption, t(target.nameKey), {
      align: 'center',
      color: COLORS.accent,
    });
    const width = Math.ceil(label.width) + 6;
    painter.fill(
      { x: rect.x + rect.w / 2 - width / 2, y: caption.y, w: width, h: caption.h },
      COLORS.bg,
      0.78,
    );
  }
}

/** Створ в соседний район: арка со стрелкой, а не невидимая грань экрана. */
function drawGate(painter: Painter, rect: Rect, active: boolean, ambience: Ambience): void {
  const stone = scale(0x8f94a8, ambience.light);
  painter.fill(rect, mix(stone, ambience.skyLow, 0.35));
  painter.fill({ x: rect.x, y: rect.y, w: rect.w, h: 3 }, scale(stone, 1.3));
  painter.fill(
    { x: rect.x + 2, y: rect.y + 5, w: rect.w - 4, h: rect.h - 9 },
    mix(ambience.asphalt, ambience.skyMid, 0.3),
  );
  painter.stroke(rect, active ? COLORS.borderFocus : scale(stone, 0.6));
}

/**
 * Живность и обстановка рисуются одним списком по возрастанию Y: тот,
 * кто ниже, заслоняет того, кто дальше. Иначе прохожие протыкают пальмы,
 * а машины наезжают на людей.
 */
function drawInhabitants(
  painter: Painter,
  params: WorldViewParams,
  layer: Layer,
  camera: WorldPoint,
  ambience: Ambience,
): void {
  type Piece = { y: number; draw: () => void };
  const pieces: Piece[] = [];

  const screen = (point: WorldPoint): WorldPoint => ({
    x: point.x - camera.x,
    y: CONTENT.y + point.y - camera.y,
  });

  for (const item of layer.decor) {
    const at = screen(item);
    pieces.push({
      y: item.y,
      draw: () => {
        const width = shadowWidth(item.kind);
        if (width > 0) drawShadow(painter, at.x, at.y, width, ambience);
        drawDecor(painter, item as DecorDef, at.x, at.y, ambience);
      },
    });
  }

  const person = (
    at: WorldPoint,
    palette: number,
    look: { pose: ActorPose; flipX: boolean },
  ): void => {
    const point = screen(at);
    drawShadow(painter, point.x, point.y, 8, ambience);
    painter.sprite(point.x, point.y, actorTexture(palette, look.pose), look.flipX);
  };

  for (const actor of params.crowd) {
    pieces.push({
      y: actor.position.y,
      draw: () =>
        person(
          actor.position,
          actor.member.palette + 1,
          lookFor(actor.facing, actor.walked, actor.moving),
        ),
    });
  }

  pieces.push({
    y: params.position.y,
    draw: () =>
      person(params.position, 0, lookFor(params.facing, params.walked, params.moving)),
  });

  pieces.sort((a, b) => a.y - b.y);
  for (const piece of pieces) piece.draw();
}

/** У выхода и створа собственная подпись, у двери и точки — глагол перед названием. */
function promptFor(target: WorldTarget): string {
  if (target.kind === 'exit') return t(target.nameKey);
  if (target.kind === 'gate') return `${t('ui.goTo')}: ${t(target.nameKey)}`;
  if (target.locked) return `${t(target.nameKey)} — ${t('ui.closedNow')}`;
  return `${t(target.kind === 'door' ? 'ui.enter' : 'ui.open')}: ${t(target.nameKey)}`;
}

/** Точка мира под тапом: экранные координаты обратно в мировые. */
export function screenToWorld(tap: WorldPoint, position: WorldPoint, layer: Layer): WorldPoint {
  const camera = cameraOffset(position, layer.bounds, CONTENT.width, CONTENT.height);
  return { x: tap.x + camera.x, y: tap.y - CONTENT.y + camera.y };
}
