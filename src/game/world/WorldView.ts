import type { DistrictId, GameState, WorldPoint, WorldRect } from '@core/types';
import { t } from '@ui/i18n';
import { STREET } from '@data/world';
import { COLORS, CONTENT, LAYOUT, WORLD_ZOOM } from '@ui/theme';
import type { Hotspots, Rect } from '@ui/widgets/Hotspots';
import type { Painter } from '@ui/widgets/Painter';
import { ambienceOf, mix, scale } from './ambience';
import type { Ambience } from './ambience';
import { drawFarSide, drawSky, drawTerrain, drawWash } from './backdrop';
import type { Backdrop } from './backdrop';
import { drawInhabitants } from './inhabitants';
import type { WorldCanvas } from './WorldCanvas';
import { drawRoom, interiorLight } from './interior';
import { facade, sign } from './facade';
import { cameraOffset, nearest } from './movement';
import { drawProp } from './props';
import type { Layer } from './layers';
import { REACH } from './targets';
import type { WorldTarget } from './targets';
import type { CrowdActor } from './Crowd';
import type { Facing } from './actorSprite';

const DOOR_SHUT = 0x181c26;
const DOOR_OPEN = 0xffd98f;

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

/** У выхода и створа собственная подпись, у двери и точки — глагол перед названием. */
function promptFor(target: WorldTarget): string {
  if (target.kind === 'exit') return t(target.nameKey);
  if (target.kind === 'gate') return `${t('ui.goTo')}: ${t(target.nameKey)}`;
  if (target.locked) return `${t(target.nameKey)} — ${t('ui.closedNow')}`;
  return `${t(target.kind === 'door' ? 'ui.enter' : 'ui.open')}: ${t(target.nameKey)}`;
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
