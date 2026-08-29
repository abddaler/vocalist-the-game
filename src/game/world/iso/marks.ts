import type { WorldPoint } from '@core/types';
import { t } from '@ui/i18n';
import { COLORS, LAYOUT } from '@ui/theme';
import type { Hotspots, Rect } from '@ui/widgets/Hotspots';
import type { Painter } from '@ui/widgets/Painter';
import { mix, scale } from '../ambience';
import type { Ambience } from '../ambience';
import type { WorldTarget } from '../targets';
import { drawIsoProp } from './furniture';
import { heightAt } from './height';
import { TILE } from './project';
import type { ScreenPoint } from './project';
import { boxAt } from './shapes';
import type { IsoScene } from './scene';
import { centerOf } from './walk';
import type { Piece } from './people';

/**
 * Цели на сцене: дверь, створ в соседний район и площадка с предметом.
 * Сама дверь запечена в фасад — здесь только подсветка, зона тапа и
 * подпись, то есть всё, что зависит от того, где стоит игрок.
 */
export interface MarkParams {
  readonly onActivate: (target: WorldTarget) => void;
}

/** Экранный прямоугольник цели: вокруг центра её плиток. */
export function markRect(
  target: WorldTarget,
  scene: IsoScene,
  toView: (point: WorldPoint, z: number) => ScreenPoint,
): Rect {
  const center = centerOf(target.rect);
  const at = toView(center, heightAt(scene.map, center));
  const w = Math.max(LAYOUT.minTap, target.rect.w * TILE.halfW * 2);
  const h = Math.max(LAYOUT.minTap, 30);
  return { x: Math.round(at.x - w / 2), y: Math.round(at.y - h + 6), w: Math.round(w), h };
}

export function markPieces(
  painter: Painter,
  hotspots: Hotspots,
  scene: IsoScene,
  params: MarkParams,
  toView: (point: WorldPoint, z: number) => ScreenPoint,
  focus: WorldTarget | null,
  ambience: Ambience,
): Piece[] {
  const pieces: Piece[] = [];

  for (const target of scene.targets) {
    const center = centerOf(target.rect);
    const at = toView(center, heightAt(scene.map, center));
    const active = focus?.id === target.id;

    pieces.push({
      depth: center.x + center.y,
      draw: () => {
        if (target.kind === 'gate') {
          drawGate(painter, at, target.rect.h, active, ambience);
        } else if (target.kind === 'point' || target.kind === 'exit') {
          const color = scene.pointColors.get(target.id);
          if (target.prop && color !== undefined) {
            drawIsoProp(painter, target, at, color, active, ambience);
          } else {
            drawDoorstep(painter, at, active, ambience);
          }
        } else if (active) {
          drawDoorGlow(painter, at, ambience);
        }
      },
    });

    // Подпись поверх всего: она нужна, чтобы прочесть, а не чтобы стоять
    // в очереди по глубине.
    if (active && target.kind === 'point') {
      pieces.push({ depth: Number.POSITIVE_INFINITY, draw: () => drawCaption(painter, at, target) });
    }

    hotspots.add({
      rect: markRect(target, scene, toView),
      label: target.id,
      enabled: true,
      onActivate: () => params.onActivate(target),
    });
  }
  return pieces;
}

/** Подсветка порога, когда игрок рядом с дверью. */
function drawDoorGlow(painter: Painter, at: ScreenPoint, ambience: Ambience): void {
  const glow = ambience.lampsOn ? 0xffd98f : COLORS.borderFocus;
  for (let i = 0; i < 3; i += 1) {
    const w = 26 - i * 6;
    painter.fill({ x: at.x - w / 2, y: at.y - 3 - i * 2, w, h: 2 }, glow, 0.3 - i * 0.08);
  }
  painter.fill({ x: at.x - 9, y: at.y - 2, w: 18, h: 2 }, glow, 0.5);
}

/**
 * Выход из комнаты: дверной проём с косяками и светом снаружи. Плита в
 * полу читалась листом бумаги, а выход должен быть виден с порога.
 */
function drawDoorstep(painter: Painter, at: ScreenPoint, active: boolean, ambience: Ambience): void {
  const stone = scale(mix(ambience.pavement, 0xffffff, 0.28), ambience.light);
  const frame = {
    top: stone,
    left: scale(stone, 0.62),
    right: scale(stone, 0.84),
    outline: mix(stone, 0x0d0b14, 0.6),
  };
  // Коврик под ногами.
  boxAt(painter, at, { w: 1.1, d: 1.1, h: 2 }, {
    top: scale(stone, 0.72),
    left: scale(stone, 0.5),
    right: scale(stone, 0.6),
  });
  // Проём: тёмная створка между двумя косяками под перемычкой.
  const height = 40;
  painter.fill({ x: at.x - 13, y: at.y - height, w: 26, h: height - 2 }, 0x14121c);
  painter.fill(
    { x: at.x - 11, y: at.y - height + 4, w: 22, h: height - 8 },
    active ? mix(ambience.skyLow, 0xffffff, 0.4) : mix(ambience.skyLow, 0x14121c, 0.35),
  );
  boxAt(painter, { x: at.x - 14, y: at.y }, { w: 0.2, d: 0.9, h: height }, frame);
  boxAt(painter, { x: at.x + 14, y: at.y }, { w: 0.2, d: 0.9, h: height }, frame);
  painter.fill({ x: at.x - 17, y: at.y - height - 5, w: 34, h: 6 }, stone);
  painter.fill({ x: at.x - 17, y: at.y - height - 5, w: 34, h: 1 }, scale(stone, 1.3));

  const tip = active ? COLORS.borderFocus : COLORS.accent;
  for (let i = 0; i < 5; i += 1) {
    painter.fill({ x: at.x - 5 + i, y: at.y - 14 + i, w: 2, h: 1 }, tip);
    painter.fill({ x: at.x + 4 - i, y: at.y - 14 + i, w: 2, h: 1 }, tip);
  }
}

/** Створ в соседний район: арка со стойками, а не грань экрана. */
function drawGate(
  painter: Painter,
  at: ScreenPoint,
  depth: number,
  active: boolean,
  ambience: Ambience,
): void {
  const stone = scale(0x9aa0b0, ambience.light);
  const height = 46;
  const span = Math.max(1, depth) * TILE.halfW;

  for (const dx of [-span, span]) {
    painter.fill({ x: at.x + dx - 3, y: at.y - height, w: 6, h: height }, stone);
    painter.fill({ x: at.x + dx + 1, y: at.y - height, w: 2, h: height }, scale(stone, 0.7));
    painter.fill({ x: at.x + dx - 4, y: at.y - height - 3, w: 8, h: 3 }, scale(stone, 1.2));
  }
  painter.fill({ x: at.x - span - 4, y: at.y - height - 8, w: span * 2 + 8, h: 6 }, scale(stone, 1.1));
  painter.fill({ x: at.x - span - 4, y: at.y - height - 8, w: span * 2 + 8, h: 2 }, scale(stone, 1.4));

  // Стрелка на перекладине: по ней читается, что здесь выход.
  const tip = active ? COLORS.borderFocus : COLORS.accent;
  for (let i = 0; i < 5; i += 1) {
    painter.fill({ x: at.x - 6 + i, y: at.y - height - 6 + i, w: 2, h: 1 }, tip);
    painter.fill({ x: at.x - 6 + i, y: at.y - height - 2 - i, w: 2, h: 1 }, tip);
  }
}

/** Подпись у цели, к которой подошли. */
function drawCaption(painter: Painter, at: ScreenPoint, target: WorldTarget): void {
  const caption = { x: at.x - 50, y: at.y - 52, w: 100, h: 12 };
  const label = painter.label(caption, t(target.nameKey), {
    align: 'center',
    color: COLORS.accent,
  });
  const width = Math.ceil(label.width) + 6;
  painter.fill(
    { x: Math.round(at.x - width / 2), y: caption.y, w: width, h: caption.h },
    COLORS.bg,
    0.78,
  );
}

/** У выхода и створа собственная подпись, у двери и точки — глагол. */
export function promptFor(target: WorldTarget): string {
  if (target.kind === 'exit') return t(target.nameKey);
  if (target.kind === 'gate') return `${t('ui.goTo')}: ${t(target.nameKey)}`;
  if (target.locked) return `${t(target.nameKey)} — ${t('ui.closedNow')}`;
  return `${t(target.kind === 'door' ? 'ui.enter' : 'ui.open')}: ${t(target.nameKey)}`;
}
