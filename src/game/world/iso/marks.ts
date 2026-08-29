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
import { isoAt, panel, plate } from './planes';
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
      pieces.push({
        depth: Number.POSITIVE_INFINITY,
        over: true,
        draw: () => drawCaption(painter, at, target),
      });
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
  // Свет лужицей на земле: полоски поперёк экрана висели над порогом.
  for (let i = 0; i < 3; i += 1) {
    plate(painter, at, { w: 1.7 - i * 0.45, d: 1.7 - i * 0.45 }, glow, 0.18 + i * 0.08);
  }
}

/**
 * Выход из комнаты: коврик у порога и стрелка над ним. Сама дверь врезана
 * в стену — здесь остаётся только показать, где она.
 */
function drawDoorstep(painter: Painter, at: ScreenPoint, active: boolean, ambience: Ambience): void {
  const stone = scale(mix(ambience.pavement, 0xffffff, 0.24), ambience.light);
  boxAt(painter, at, { w: 0.95, d: 0.95, h: 3 }, {
    top: scale(stone, 0.9),
    left: scale(stone, 0.6),
    right: scale(stone, 0.74),
    outline: mix(stone, 0x0d0b14, 0.55),
  });
  // Стрелка лежит на коврике и сужается к двери: галочка в осях экрана
  // висела над порогом ярлыком, а не указывала на него.
  const tip = active ? COLORS.borderFocus : COLORS.accent;
  for (let i = 0; i < 4; i += 1) {
    plate(painter, at, { w: 0.62 - i * 0.14, d: 0.12, dy: 0.18 - i * 0.14, lift: 4 }, tip);
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
  const height = 60;
  const half = Math.max(1, depth) / 2;
  const pier = {
    top: scale(stone, 1.2),
    left: scale(stone, 0.7),
    right: scale(stone, 0.95),
    outline: mix(stone, 0x0d0b14, 0.5),
  };

  for (const dy of [-half, half]) {
    boxAt(painter, isoAt(at, 0, dy), { w: 0.34, d: 0.34, h: height }, pier);
    boxAt(painter, isoAt(at, 0, dy, height), { w: 0.5, d: 0.5, h: 3 }, {
      ...pier,
      top: scale(stone, 1.4),
    });
  }
  boxAt(painter, isoAt(at, 0, 0, height + 3), { w: 0.5, d: half * 2 + 0.5, h: 6 }, {
    ...pier,
    top: scale(stone, 1.45),
  });

  // Стрелка на перекладине: она лежит в плоскости створа.
  const tip = active ? COLORS.borderFocus : COLORS.accent;
  for (let i = 0; i < 5; i += 1) {
    panel(
      painter,
      at,
      'y',
      {
        span: 0.16,
        along: -0.34 + i * 0.17,
        across: 0.26,
        top: height + 8 - Math.abs(i - 2) * 2,
        height: 2,
      },
      tip,
    );
  }
}

/** Подпись у цели, к которой подошли. */
function drawCaption(painter: Painter, at: ScreenPoint, target: WorldTarget): void {
  const text = t(target.nameKey);
  const caption = { x: at.x - 50, y: at.y - 68, w: 100, h: 12 };
  // Плашка первой, надпись поверх: порядок вызовов — это порядок слоёв.
  const width = Math.ceil(painter.measure(text)) + 6;
  painter.fill(
    { x: Math.round(at.x - width / 2), y: caption.y, w: width, h: caption.h },
    COLORS.bg,
    0.78,
  );
  painter.label(caption, text, { align: 'center', color: COLORS.accent });
}

/** У выхода и створа собственная подпись, у двери и точки — глагол. */
export function promptFor(target: WorldTarget): string {
  if (target.kind === 'exit') return t(target.nameKey);
  if (target.kind === 'gate') return `${t('ui.goTo')}: ${t(target.nameKey)}`;
  if (target.locked) return `${t(target.nameKey)} — ${t('ui.closedNow')}`;
  return `${t(target.kind === 'door' ? 'ui.enter' : 'ui.open')}: ${t(target.nameKey)}`;
}
