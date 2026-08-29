import type { GameState, WorldPoint, WorldRect } from '@core/types';
import { COLORS, CONTENT, LAYOUT } from '@ui/theme';
import type { Hotspots, Rect } from '@ui/widgets/Hotspots';
import type { Painter } from '@ui/widgets/Painter';
import { ambienceOf, mix, scale } from '../ambience';
import type { Ambience } from '../ambience';
import { drawSky, drawFarSide, drawWash } from '../backdrop';
import type { Backdrop } from '../backdrop';
import { interiorLight } from '../interior';
import type { WorldCanvas } from '../WorldCanvas';
import type { CrowdActor } from '../Crowd';
import type { Facing } from '../actorSprite';
import { drawPieces, inhabitantPieces } from './people';
import { drawBlock, drawBlockSign } from './blocks';
import { drawGround } from './ground';
import { markPieces, markRect, promptFor } from './marks';
import { heightAt } from './height';
import { kindAt } from './map';
import type { IsoMap } from './map';
import { SKY_BAND, TILE, mapOrigin, mapSize, toGround, toScreen } from './project';
import type { ScreenPoint } from './project';
import type { IsoScene } from './scene';
import { nearest } from './walk';
import type { WorldTarget } from '../targets';

export interface IsoViewParams {
  readonly painter: Painter;
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

/**
 * Кадр изометрического мира. Земля и дома запекаются в текстуру размером
 * с район и в кадре только сдвигаются; живое — люди, мелочь и подсветка
 * целей — рисуется поверх и сортируется по удалению от камеры.
 */
export function renderIso(params: IsoViewParams, scene: IsoScene): void {
  const { painter, hotspots, position } = params;
  const outdoors = scene.district !== null;
  const ambience = outdoors ? ambienceOf(scene.slot, scene.district!) : interiorLight(scene.slot);

  const size = mapSize(scene.map.width, scene.map.depth, scene.map.levels);
  const origin = mapOrigin(scene.map.depth, scene.map.levels);
  const sky = outdoors ? SKY_BAND : 0;

  params.canvas.show();
  params.canvas.ensure(scene.key, (into) => {
    paintStatic(into, scene, ambience, { x: origin.x, y: origin.y + sky });
  });

  const camera = cameraOn(params.position, scene.map, origin, size, sky);
  if (outdoors) {
    drawOutside(params.back, camera, ambience, scene.district!);
  } else {
    // За стенами комнаты — не пустота интерфейса, а полумрак помещения.
    params.back.fill(
      { x: 0, y: CONTENT.y, w: CONTENT.width, h: CONTENT.height },
      mix(scene.floorColor, 0x0b0a12, 0.72),
    );
  }
  params.canvas.place(-camera.x, CONTENT.y - camera.y);

  const toView = (point: WorldPoint, z: number): ScreenPoint => {
    const p = toScreen({ x: point.x, y: point.y, z });
    return {
      x: origin.x + p.x - camera.x,
      y: CONTENT.y + origin.y + sky + p.y - camera.y,
    };
  };

  const focus = nearest(position, scene.targets);
  drawPieces([
    ...markPieces(painter, hotspots, scene, params, toView, focus, ambience),
    ...inhabitantPieces(painter, params, scene, toView, ambience),
  ]);

  drawWash(painter, { x: 0, y: CONTENT.y, w: CONTENT.width, h: CONTENT.height }, ambience);

  if (focus) {
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

/** Неподвижная часть: земля и дома, в координатах текстуры. */
function paintStatic(
  painter: Painter,
  scene: IsoScene,
  ambience: Ambience,
  origin: ScreenPoint,
): void {
  drawGround(painter, scene.map, ambience, origin);
  const blocks = [...scene.blocks].sort(
    (a, b) => a.rect.x + a.rect.y + a.rect.h - (b.rect.x + b.rect.y + b.rect.h),
  );
  for (const block of blocks) drawBlock({ painter, ambience, origin }, block);
  for (const block of blocks) drawBlockSign({ painter, ambience, origin }, block);
}

/** Сдвиг камеры: держит человека по центру и не выходит за карту. */
function cameraOn(
  position: WorldPoint,
  map: IsoMap,
  origin: ScreenPoint,
  size: { w: number; h: number },
  sky: number,
): ScreenPoint {
  const z = heightAt(map, position);
  const at = toScreen({ x: position.x, y: position.y, z });
  const axis = (value: number, total: number, view: number): number =>
    total <= view ? -Math.round((view - total) / 2) : Math.round(clamp(value - view / 2, 0, total - view));

  return {
    x: axis(origin.x + at.x, size.w, CONTENT.width),
    y: axis(origin.y + sky + at.y, size.h + sky, CONTENT.height),
  };
}

const clamp = (value: number, min: number, max: number): number =>
  value < min ? min : value > max ? max : value;

/** Небо и дальний план: они едут медленнее мира, поэтому не запекаются. */
function drawOutside(
  painter: Painter,
  camera: ScreenPoint,
  ambience: Ambience,
  district: NonNullable<IsoScene['district']>,
): void {
  // Небо кладётся на всю высоту кадра: изометрическая карта — ромб, и в
  // углы кадра она не достаёт. Ниже горизонта — дымка над городом, чтобы
  // эти углы читались далью, а не дырой в фоне.
  const horizon = Math.max(20, Math.min(CONTENT.height, SKY_BAND - camera.y));
  const area: Backdrop = {
    sky: { x: 0, y: CONTENT.y, w: CONTENT.width, h: horizon },
    road: { x: 0, y: CONTENT.y + horizon, w: CONTENT.width, h: CONTENT.height - horizon },
    cameraX: camera.x,
    worldWidth: CONTENT.width,
    unit: 2,
  };

  painter.clip({ x: 0, y: CONTENT.y, w: CONTENT.width, h: CONTENT.height });
  drawSky(painter, area, ambience);
  drawFarSide(painter, area, ambience, district);

  const haze = mix(ambience.skyLow, ambience.far, 0.45);
  const depth = CONTENT.height - horizon;
  for (let i = 0; i < depth; i += 1) {
    painter.fill(
      { x: 0, y: CONTENT.y + horizon + i, w: CONTENT.width, h: 1 },
      mix(haze, scale(haze, 0.74), Math.min(1, i / 90)),
    );
  }
  painter.clip(null);
}

/** Прямоугольник тапа: не меньше требуемых 16x16 вокруг центра. */
export function tapRect(rect: Rect): Rect {
  const w = Math.max(rect.w, LAYOUT.minTap);
  const h = Math.max(rect.h, LAYOUT.minTap);
  return { x: rect.x + (rect.w - w) / 2, y: rect.y + (rect.h - h) / 2, w, h };
}

/** Точка мира под тапом: экранные координаты обратно в плитки. */
export function screenToWorld(tap: WorldPoint, position: WorldPoint, scene: IsoScene): WorldPoint {
  const size = mapSize(scene.map.width, scene.map.depth, scene.map.levels);
  const origin = mapOrigin(scene.map.depth, scene.map.levels);
  const sky = scene.district !== null ? SKY_BAND : 0;
  const camera = cameraOn(position, scene.map, origin, size, sky);
  return toGround({
    x: tap.x + camera.x - origin.x,
    y: tap.y - CONTENT.y + camera.y - origin.y - sky,
  });
}

export { markRect, kindAt, TILE, type WorldRect };
