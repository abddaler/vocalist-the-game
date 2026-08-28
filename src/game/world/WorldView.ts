import type { DistrictId, GameState, WorldPoint, WorldRect } from '@core/types';
import { t } from '@ui/i18n';
import { STREET } from '@data/world';
import { COLORS, CONTENT, LAYOUT, WORLD_ZOOM } from '@ui/theme';
import type { Hotspots, Rect } from '@ui/widgets/Hotspots';
import type { Painter } from '@ui/widgets/Painter';
import { ambienceOf, scale } from './ambience';
import type { Ambience } from './ambience';
import { drawFarSide, drawSky, drawTerrain, drawWash } from './backdrop';
import type { Backdrop } from './backdrop';
import { drawInhabitants } from './inhabitants';
import { drawTarget, promptFor } from './marks';
import type { WorldCanvas } from './WorldCanvas';
import { drawRoom, interiorLight } from './interior';
import { facade, sign } from './facade';
import { cameraOffset, nearest } from './movement';
import type { Layer } from './layers';
import { REACH } from './targets';
import type { WorldTarget } from './targets';
import type { CrowdActor } from './Crowd';
import type { Facing } from './actorSprite';

export interface WorldViewParams {
  /** Живая часть мира: она рисуется поверх подложки. */
  readonly painter: Painter;
  /** Небо и дальний план: они лежат под подложкой. */
  readonly back: Painter;
  readonly canvas: WorldCanvas;
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
  const camera = cameraOffset(
    position,
    layer.bounds,
    CONTENT.width / WORLD_ZOOM,
    CONTENT.height / WORLD_ZOOM,
  );
  const toScreen = (rect: WorldRect): Rect => ({
    x: Math.round((rect.x - camera.x) * WORLD_ZOOM),
    y: Math.round(CONTENT.y + (rect.y - camera.y) * WORLD_ZOOM),
    w: Math.round(rect.w * WORLD_ZOOM),
    h: Math.round(rect.h * WORLD_ZOOM),
  });

  const outdoors = layer.district !== null;
  const ambience = outdoors ? ambienceOf(layer.slot, layer.district) : interiorLight(layer.slot);

  // Неподвижная часть — земля и дома — запекается в текстуру размером с
  // район и в кадре только сдвигается. Небо и дальний план остаются
  // живыми: они едут не со скоростью мира.
  params.canvas.show();
  params.canvas.ensure(
    `${layer.district ?? 'room'}:${layer.slot}:${layer.bounds.width}x${layer.bounds.height}`,
    Math.round(layer.bounds.width * WORLD_ZOOM),
    Math.round(layer.bounds.height * WORLD_ZOOM),
    (into) => paintStatic(into, layer, ambience),
  );

  if (outdoors) drawOutside(params.back, layer, camera, ambience, layer.district);

  params.canvas.place(
    -camera.x * WORLD_ZOOM,
    CONTENT.y - camera.y * WORLD_ZOOM,
  );

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

  drawWash(painter, { x: 0, y: CONTENT.y, w: CONTENT.width, h: CONTENT.height }, ambience);

  if (focus) {
    // Подсказка — табличка по центру снизу, а не полоса во всю ширину:
    // полоса резала кадр пополам и спорила с нижними вкладками.
    const text = promptFor(focus);
    const width = Math.min(CONTENT.width - 20, text.length * 6 + 20);
    const bar = {
      x: Math.round((CONTENT.width - width) / 2),
      y: CONTENT.y + CONTENT.height - 15,
      w: width,
      h: 14,
    };
    painter.plate(bar, COLORS.panelDeep, focus.locked ? COLORS.textMuted : COLORS.accent, !focus.locked);
    painter.label(bar, text, {
      align: 'center',
      color: focus.locked ? COLORS.textMuted : COLORS.accent,
    });
  }
}

/**
 * Всё, что не двигается: мостовая и дома. Рисуется в координатах района,
 * а не экрана, поэтому камеры здесь нет вовсе.
 */
function paintStatic(painter: Painter, layer: Layer, ambience: Ambience): void {
  const toTexture = (rect: WorldRect): Rect => ({
    x: Math.round(rect.x * WORLD_ZOOM),
    y: Math.round(rect.y * WORLD_ZOOM),
    w: Math.round(rect.w * WORLD_ZOOM),
    h: Math.round(rect.h * WORLD_ZOOM),
  });

  const outdoors = layer.district !== null;
  if (outdoors) {
    drawTerrain(painter, { plates: layer.terrain, unit: WORLD_ZOOM, ambience });
  } else {
    const room = { x: 0, y: 0, w: layer.bounds.width, h: layer.bounds.height };
    drawRoom(painter, toTexture(room), layer.floor, ambience, layer.slot);
  }

  for (const block of layer.blocks) {
    const rect = toTexture(block.rect);
    if (!block.nameKey) {
      painter.fill(rect, outdoors ? scale(block.color, ambience.light) : block.color);
      painter.stroke(rect, COLORS.border);
      continue;
    }

    // Вывеска крупная и по центру фасада: при такой близкой камере она
    // и есть главный опознавательный знак дома.
    const board = { x: rect.x + 6, y: rect.y + Math.round(rect.h / 2) - 9, w: rect.w - 12, h: 17 };
    const door = block.doorRect ? toTexture(block.doorRect) : null;
    facade(painter, {
      rect,
      color: block.color,
      kind: block.kind,
      seed: block.nameKey,
      ambience,
      reserved: door ? [board, door] : [board],
      door,
    });

    sign(painter, board, block.color, ambience);
    // Цвет подписи — из палитры, а не из цвета дома: каждый новый цвет
    // текста заводит собственный атлас шрифта, и на прогулке по городу
    // их набегали десятки.
    painter.label(board, t(block.nameKey), {
      align: 'center',
      color: ambience.lampsOn ? COLORS.money : COLORS.text,
    });
  }
}

/** Небо и дальний план: они едут медленнее мира, поэтому не запекаются. */
function drawOutside(
  painter: Painter,
  layer: Layer,
  camera: WorldPoint,
  ambience: Ambience,
  district: DistrictId,
): void {
  // Небо кончается там, где начинаются крыши: полоса считается из мира,
  // а не из доли экрана, иначе она разъезжается с домами. Спустившись к
  // воде, игрок уводит небо за верхний край — тогда рисовать нечего.
  const skyHeight = Math.round((STREET.skyH - camera.y) * WORLD_ZOOM);
  if (skyHeight <= 0) return;

  const area: Backdrop = {
    sky: { x: 0, y: CONTENT.y, w: CONTENT.width, h: skyHeight },
    road: {
      x: 0,
      y: CONTENT.y + skyHeight,
      w: CONTENT.width,
      h: CONTENT.height - skyHeight,
    },
    cameraX: camera.x * WORLD_ZOOM,
    worldWidth: layer.bounds.width * WORLD_ZOOM,
    unit: WORLD_ZOOM,
  };

  // Силуэт за крышами растёт вверх от линии крыш: без окна он налезал бы
  // на панель ресурсов, как только район прокрутится вниз.
  painter.clip({ x: 0, y: CONTENT.y, w: CONTENT.width, h: skyHeight });
  drawSky(painter, area, ambience);
  drawFarSide(painter, area, ambience, district);
  painter.clip(null);
}

/** Точка мира под тапом: экранные координаты обратно в мировые. */
export function screenToWorld(tap: WorldPoint, position: WorldPoint, layer: Layer): WorldPoint {
  const camera = cameraOffset(
    position,
    layer.bounds,
    CONTENT.width / WORLD_ZOOM,
    CONTENT.height / WORLD_ZOOM,
  );
  return {
    x: tap.x / WORLD_ZOOM + camera.x,
    y: (tap.y - CONTENT.y) / WORLD_ZOOM + camera.y,
  };
}
