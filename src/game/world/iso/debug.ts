import { COLORS, CONTENT } from '@ui/theme';
import type { Painter } from '@ui/widgets/Painter';
import type { WorldPoint } from '@core/types';
import { levelAt, standable } from './map';
import { blockedIn } from './scene';
import type { IsoScene } from './scene';
import { TILE } from './project';
import type { ScreenPoint } from './project';

/**
 * Отладочный слой изометрии. Ошибку в сортировке по глубине глазами не
 * поймать: человек за стойкой и человек перед ней отличаются одним
 * числом, а на экране — тем, кто кого закрыл. Слой рисует само это
 * число, границу проходимости и сетку, по которой они считаются.
 *
 * Включается клавишей F1 или адресом `?debug=iso`.
 */
const GRID = {
  line: 0x63e6ff,
  lineAlpha: 0.32,
  blocked: 0xff4d6a,
  blockedAlpha: 0.3,
  step: 0xffd34d,
  stepAlpha: 0.28,
  /** Номер глубины показывается не на каждой плитке: иначе экран — из цифр. */
  labelEvery: 4,
} as const;

export function drawIsoDebug(
  painter: Painter,
  scene: IsoScene,
  toView: (point: WorldPoint, z: number) => ScreenPoint,
  position: WorldPoint,
): void {
  const blocked = blockedIn(scene);
  const clip = { x: 0, y: CONTENT.y, w: CONTENT.width, h: CONTENT.height };
  painter.clip(clip);

  for (let y = 0; y < scene.map.depth; y += 1) {
    for (let x = 0; x < scene.map.width; x += 1) {
      const level = levelAt(scene.map, x + 0.5, y + 0.5);
      if (level === null) continue;

      const at = toView({ x: x + 0.5, y: y + 0.5 }, level);
      // Плитка за кадром: ромб на неё всё равно не ляжет, а вызовов
      // заливки на карту в тысячу клеток уходит столько же.
      if (at.x < -TILE.halfW || at.x > CONTENT.width + TILE.halfW) continue;
      if (at.y < clip.y - TILE.halfH || at.y > clip.y + clip.h + TILE.halfH) continue;

      const diamond = [
        { x: at.x, y: at.y - TILE.halfH },
        { x: at.x + TILE.halfW, y: at.y },
        { x: at.x, y: at.y + TILE.halfH },
        { x: at.x - TILE.halfW, y: at.y },
      ];

      const stuck = blocked({ x: x + 0.5, y: y + 0.5 });
      const stand = standable(scene.map, x + 0.5, y + 0.5);
      if (stuck || !stand) {
        painter.polygon(diamond, GRID.blocked, GRID.blockedAlpha);
      } else if (level > 0) {
        // Уровень выше нулевого: по нему видно, где лестница и парапет.
        painter.polygon(diamond, GRID.step, GRID.stepAlpha * Math.min(1, level / 3));
      }

      outline(painter, diamond);

      if ((x + y) % GRID.labelEvery === 0 && x % GRID.labelEvery === 0) {
        painter.label({ x: at.x - 12, y: at.y - 4, w: 24, h: 8 }, String(x + y), {
          align: 'center',
          color: COLORS.text,
        });
      }
    }
  }

  // Круг досягаемости игрока: по нему видно, почему цель не нажимается.
  const here = toView(position, levelAt(scene.map, position.x, position.y) ?? 0);
  painter.fill({ x: here.x - 1, y: here.y - 1, w: 3, h: 3 }, COLORS.accent);

  painter.clip(null);

  // Ниже строки диагностики: обе живут в левом верхнем углу, и на одной
  // высоте они наезжают друг на друга.
  painter.label({ x: 4, y: CONTENT.y + 12, w: CONTENT.width - 8, h: 9 },
    `iso: ${scene.map.width}x${scene.map.depth} · уровней ${scene.map.levels + 1} · ` +
    `объёмов ${scene.blocks.length} · мелочи ${scene.decor.length} · целей ${scene.targets.length}`,
    { color: COLORS.accent },
  );
}

/** Контур ромба четырьмя тонкими полосами: линии у Painter нет. */
function outline(painter: Painter, points: ReadonlyArray<{ x: number; y: number }>): void {
  for (let i = 0; i < points.length; i += 1) {
    const from = points[i] as { x: number; y: number };
    const to = points[(i + 1) % points.length] as { x: number; y: number };
    painter.polygon(
      [from, to, { x: to.x, y: to.y + 1 }, { x: from.x, y: from.y + 1 }],
      GRID.line,
      GRID.lineAlpha,
    );
  }
}
