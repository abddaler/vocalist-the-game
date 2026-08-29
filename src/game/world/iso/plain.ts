import type { WorldPoint } from '@core/types';
import type { TileKind } from '@core/types';
import { COLORS } from '@ui/theme';
import type { Painter } from '@ui/widgets/Painter';
import { scale } from '../ambience';
import type { Ambience } from '../ambience';
import { cellAt } from './map';
import type { IsoMap } from './map';
import { TILE, toScreen } from './project';
import type { ScreenPoint } from './project';
import type { IsoBlock } from './scene';

/**
 * Мир заглушками: земля цветными ромбами, дома коробками, мелочь
 * подписанными столбиками, люди капсулами со стрелкой направления.
 *
 * Это проверка того, что рисование отделено от логики: если сцена
 * целиком заменяется одним флагом, то и настоящий арт когда-нибудь
 * подменит её, не трогая ни шага, ни коллизий, ни целей. Заодно это
 * измерительный прибор — на телефоне видно, стоит ли кадр рисования или
 * чего-то другого.
 *
 * Включается адресом `?debug=plain`.
 */
const TILE_COLOR: Readonly<Record<TileKind, number>> = {
  road: 0x3d4250,
  roadLine: 0x5a6070,
  pavement: 0x8a8f9c,
  plaza: 0x9a94a8,
  deck: 0xa8834e,
  sand: 0xd8c48a,
  water: 0x2f7fa8,
  grass: 0x4f9455,
  carpet: 0x8a4a5e,
  steps: 0xb0a06a,
  wood: 0x9a6d42,
  marble: 0xc8c4cc,
  dance: 0x6a4a9c,
  stage: 0x3a2a5c,
  rug: 0x7a4a4a,
  void: 0x000000,
};

const GRID_LINE = 0x1a1a22;
const GRID_ALPHA = 0.35;

/** Ромб плитки вокруг её северного угла. */
const diamond = (at: ScreenPoint): ScreenPoint[] => [
  { x: at.x, y: at.y },
  { x: at.x + TILE.halfW, y: at.y + TILE.halfH },
  { x: at.x, y: at.y + TILE.halfH * 2 },
  { x: at.x - TILE.halfW, y: at.y + TILE.halfH },
];

export function paintPlainGround(
  painter: Painter,
  map: IsoMap,
  ambience: Ambience,
  origin: ScreenPoint,
): void {
  for (let y = 0; y < map.depth; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      const cell = cellAt(map, x, y);
      if (cell === null) continue;
      const p = toScreen({ x, y, z: cell.level });
      const at = { x: origin.x + p.x, y: origin.y + p.y };
      const shape = diamond(at);
      painter.polygon(shape, scale(TILE_COLOR[cell.kind], ambience.light));
      // Тонкая сетка по ромбу: без неё соседние плитки одного вида
      // сливаются в пятно и по заглушке не видно шага.
      for (let i = 0; i < shape.length; i += 1) {
        const from = shape[i] as ScreenPoint;
        const to = shape[(i + 1) % shape.length] as ScreenPoint;
        painter.polygon(
          [from, to, { x: to.x, y: to.y + 1 }, { x: from.x, y: from.y + 1 }],
          GRID_LINE,
          GRID_ALPHA,
        );
      }
    }
  }
}

export function paintPlainBlock(
  painter: Painter,
  block: IsoBlock,
  ambience: Ambience,
  origin: ScreenPoint,
): void {
  const r = block.rect;
  const lift = block.tall;
  const at = (x: number, y: number, up = 0): ScreenPoint => {
    const p = toScreen({ x, y });
    return { x: origin.x + p.x, y: origin.y + p.y - up };
  };

  const west = at(r.x, r.y + r.h, lift);
  const south = at(r.x + r.w, r.y + r.h, lift);
  const east = at(r.x + r.w, r.y, lift);
  const north = at(r.x, r.y, lift);
  const body = scale(block.color, ambience.light);

  // Боковая грань темнее лицевой на пятую часть: один источник света
  // сверху-слева, как во всём мире.
  painter.polygon(
    [west, south, { x: south.x, y: south.y + lift }, { x: west.x, y: west.y + lift }],
    body,
  );
  painter.polygon(
    [east, south, { x: south.x, y: south.y + lift }, { x: east.x, y: east.y + lift }],
    scale(body, 0.8),
  );
  painter.polygon([north, east, south, west], scale(body, 1.12));
}

/**
 * Мелочь столбиком с подписью. Высота берётся из следа: у зонта она
 * есть, у люка нет, и на заглушке это единственное, чем они отличаются.
 */
export function paintPlainProp(
  painter: Painter,
  at: ScreenPoint,
  id: string,
  tall: number,
): void {
  const w = TILE.halfW;
  const top = at.y - tall;
  painter.fill({ x: at.x - w / 2, y: top, w, h: tall }, 0x6a5f8c);
  painter.fill({ x: at.x - w / 2, y: top, w: w / 2, h: tall }, 0x8478ad);
  painter.polygon(
    [
      { x: at.x, y: top - TILE.halfH },
      { x: at.x + w / 2, y: top },
      { x: at.x, y: top + TILE.halfH },
      { x: at.x - w / 2, y: top },
    ],
    0x9c8fd0,
  );
  painter.label({ x: at.x - 30, y: top - 10, w: 60, h: 8 }, id.split('|')[0] ?? id, {
    align: 'center',
    color: COLORS.textDim,
  });
}

/**
 * Человек капсулой со стрелкой. Стрелка обязательна: без неё на
 * заглушке не отличить, куда он идёт, а именно направление ломается
 * первым, когда трогают походку.
 *
 * Куда он смотрит, видно по имени позы: кадры и так названы по стороне,
 * а профиль различается зеркалом.
 */
export function paintPlainPerson(
  painter: Painter,
  at: ScreenPoint,
  color: number,
  pose: { pose: string; flipX: boolean },
  height: number,
): void {
  const w = 12;
  const top = at.y - height;
  painter.fill({ x: at.x - w / 2, y: top + 3, w, h: height - 6 }, color);
  painter.fill({ x: at.x - w / 2 + 1, y: top, w: w - 2, h: height }, color);

  const base = at.y - 6;
  const tip = pose.pose.startsWith('down')
    ? { x: at.x, y: base + 7 }
    : pose.pose.startsWith('up')
      ? { x: at.x, y: base - 7 }
      : { x: at.x + (pose.flipX ? -8 : 8), y: base };
  painter.polygon([tip, { x: at.x - 4, y: base }, { x: at.x + 4, y: base }], COLORS.borderFocus);
}

/** Точка сетки в пикселях сцены. Общая для всех заглушек. */
export function plainAt(origin: ScreenPoint, point: WorldPoint, z: number): ScreenPoint {
  const p = toScreen({ x: point.x, y: point.y, z });
  return { x: origin.x + p.x, y: origin.y + p.y };
}
