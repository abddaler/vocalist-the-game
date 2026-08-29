import type { BuildingKind, WorldRect } from '@core/types';
import { t } from '@ui/i18n';
import { COLORS } from '@ui/theme';
import type { Painter } from '@ui/widgets/Painter';
import { mix, scale } from '../ambience';
import type { Ambience } from '../ambience';
import { toScreen } from './project';
import type { ScreenPoint } from './project';
import { face, tile } from './shapes';
import { signWidth } from './sign';
import type { IsoBlock } from './scene';

/**
 * Дома как объёмы. Видно две грани: длинную лицевую и короткую боковую,
 * плюс крышу. На лицевой — окна, витрина и дверь; над ней — вывеска
 * щитом, потому что надпись на скошенной грани не прочесть.
 *
 * Ряд окон, витрина и козырёк подбираются по роду занятий дома: клуб,
 * склад и вилла должны отличаться силуэтом, а не только цветом.
 */
export interface BlockStyle {
  /** Сколько рядов окон и какой они формы. */
  readonly windows: 'grid' | 'strip' | 'arched' | 'blinds' | 'none';
  /** Что на уровне земли: витрина, ворота, аркада, ставня. */
  readonly ground: 'display' | 'gate' | 'arcade' | 'shutter' | 'plain';
  /** Крыша: парапет, черепица, надстройка. */
  readonly roof: 'parapet' | 'tile' | 'shed' | 'flat';
  /** Козырёк над входом. */
  readonly awning: boolean;
}

const STYLE: Readonly<Record<BuildingKind, BlockStyle>> = {
  apartment: { windows: 'grid', ground: 'arcade', roof: 'parapet', awning: false },
  club: { windows: 'blinds', ground: 'display', roof: 'flat', awning: true },
  restaurant: { windows: 'arched', ground: 'display', roof: 'tile', awning: true },
  shop: { windows: 'strip', ground: 'display', roof: 'parapet', awning: true },
  studio: { windows: 'strip', ground: 'plain', roof: 'flat', awning: false },
  record: { windows: 'blinds', ground: 'display', roof: 'shed', awning: false },
  gym: { windows: 'strip', ground: 'display', roof: 'flat', awning: false },
  clinic: { windows: 'grid', ground: 'plain', roof: 'parapet', awning: true },
  office: { windows: 'grid', ground: 'plain', roof: 'parapet', awning: false },
  hotel: { windows: 'arched', ground: 'arcade', roof: 'tile', awning: true },
  diner: { windows: 'strip', ground: 'display', roof: 'shed', awning: true },
  cinema: { windows: 'none', ground: 'display', roof: 'flat', awning: true },
  theatre: { windows: 'arched', ground: 'arcade', roof: 'tile', awning: true },
  villa: { windows: 'arched', ground: 'arcade', roof: 'tile', awning: false },
  warehouse: { windows: 'strip', ground: 'shutter', roof: 'shed', awning: false },
  market: { windows: 'none', ground: 'gate', roof: 'shed', awning: true },
  bar: { windows: 'blinds', ground: 'display', roof: 'flat', awning: true },
  shack: { windows: 'none', ground: 'display', roof: 'shed', awning: true },
};

export interface BlockPaint {
  readonly painter: Painter;
  readonly ambience: Ambience;
  /** Сдвиг начала карты внутри текстуры. */
  readonly origin: ScreenPoint;
}

/** Точка сетки в пикселях текстуры. */
const at = (ctx: BlockPaint, x: number, y: number, lift = 0): ScreenPoint => {
  const p = toScreen({ x, y });
  return { x: ctx.origin.x + p.x, y: ctx.origin.y + p.y - lift };
};

export function drawBlock(ctx: BlockPaint, block: IsoBlock): void {
  if (block.wall) return drawWall(ctx, block);
  const { painter, ambience } = ctx;
  const style = STYLE[block.kind];
  const r = block.rect;
  const lift = block.tall;
  const wall = scale(block.color, ambience.light);

  const west = at(ctx, r.x, r.y + r.h, lift);
  const south = at(ctx, r.x + r.w, r.y + r.h, lift);
  const east = at(ctx, r.x + r.w, r.y, lift);
  const north = at(ctx, r.x, r.y, lift);

  // Лицевая грань светлее боковой: свет падает слева сверху.
  const front = scale(wall, 1.0);
  const side = scale(wall, 0.72);
  face(painter, west, south, lift, front);
  face(painter, east, south, lift, side);

  // Крыша ромбами: по ней видно, что дом — объём, а не декорация.
  for (let iy = 0; iy < r.h; iy += 1) {
    for (let ix = 0; ix < r.w; ix += 1) {
      tile(painter, at(ctx, r.x + ix, r.y + iy, lift), roofColor(style, wall, ambience));
    }
  }

  drawRoofEdge(ctx, style, { west, south, east, north }, wall);
  drawFront(ctx, block, style, west, south, lift, front);
  drawSideWindows(ctx, style, east, south, lift, side);
}

/**
 * Вывески кладутся отдельным проходом, после всех домов: щит шире своего
 * фасада, и сосед, нарисованный следом, срезал ему полнадписи.
 */
export function drawBlockSign(ctx: BlockPaint, block: IsoBlock): void {
  if (!block.nameKey || block.wall) return;
  const r = block.rect;
  const lift = block.tall;
  const west = at(ctx, r.x, r.y + r.h, lift);
  const south = at(ctx, r.x + r.w, r.y + r.h, lift);
  drawSign(ctx, block, west, south, lift);
}

interface Corners {
  readonly west: ScreenPoint;
  readonly south: ScreenPoint;
  readonly east: ScreenPoint;
  readonly north: ScreenPoint;
}

function roofColor(style: BlockStyle, wall: number, ambience: Ambience): number {
  if (style.roof === 'tile') return scale(mix(wall, 0xc4552f, 0.62), 1.05);
  if (style.roof === 'shed') return scale(mix(wall, 0x8a8f98, 0.55), 0.95);
  return scale(mix(wall, ambience.skyLow, 0.22), 1.12);
}

/** Кромка крыши: парапет, свес черепицы или конёк. */
function drawRoofEdge(ctx: BlockPaint, style: BlockStyle, c: Corners, wall: number): void {
  const { painter } = ctx;
  const lip = style.roof === 'tile' ? 4 : 3;
  const edgeColor = style.roof === 'tile' ? scale(mix(wall, 0xc4552f, 0.7), 0.8) : scale(wall, 1.25);
  face(painter, c.west, c.south, lip, edgeColor);
  face(painter, c.east, c.south, lip, scale(edgeColor, 0.78));
  if (style.roof === 'parapet') {
    face(painter, { x: c.west.x, y: c.west.y - 3 }, { x: c.south.x, y: c.south.y - 3 }, 3, scale(wall, 1.35));
    face(painter, { x: c.east.x, y: c.east.y - 3 }, { x: c.south.x, y: c.south.y - 3 }, 3, scale(wall, 1.05));
  }
}

/** Точка на лицевой грани: u — доля вдоль неё, dy — вниз от кромки крыши. */
const along = (west: ScreenPoint, south: ScreenPoint, u: number, dy: number): ScreenPoint => ({
  x: Math.round(west.x + (south.x - west.x) * u),
  y: Math.round(west.y + (south.y - west.y) * u) + dy,
});

function drawFront(
  ctx: BlockPaint,
  block: IsoBlock,
  style: BlockStyle,
  west: ScreenPoint,
  south: ScreenPoint,
  lift: number,
  wall: number,
): void {
  const { painter, ambience } = ctx;
  const span = block.rect.w;
  const glass = ambience.lampsOn
    ? mix(0xffd98f, wall, 0.25)
    : mix(scale(0x9fd0e8, ambience.light), ambience.skyLow, 0.3);

  // Ряды окон сверху вниз, пока не дошли до уровня земли.
  const rows = Math.max(0, Math.floor((lift - 30) / 16));
  if (style.windows !== 'none') {
    for (let row = 0; row < rows; row += 1) {
      const dy = 10 + row * 16;
      for (let i = 0; i < span; i += 1) {
        const pad = style.windows === 'strip' ? 0.12 : 0.28;
        const from = along(west, south, (i + pad) / span, dy);
        const to = along(west, south, (i + 1 - pad) / span, dy);
        const h = style.windows === 'strip' ? 6 : 9;
        face(painter, from, to, h, glass);
        face(painter, from, to, 1, scale(glass, 1.4));
        if (style.windows === 'arched') {
          const mid = along(west, south, (i + 0.5) / span, dy - 2);
          painter.fill({ x: mid.x - 3, y: mid.y, w: 6, h: 2 }, glass);
        }
        if (style.windows === 'blinds') {
          for (let k = 2; k < h; k += 3) {
            face(painter, { x: from.x, y: from.y + k }, { x: to.x, y: to.y + k }, 1, scale(glass, 0.6));
          }
        }
        // Рама: без неё окно читается пятном краски.
        face(painter, { x: from.x, y: from.y + h }, { x: to.x, y: to.y + h }, 1, scale(wall, 0.6));
      }
    }
  }

  drawGroundFloor(ctx, block, style, west, south, lift, wall, glass);
}

function drawGroundFloor(
  ctx: BlockPaint,
  block: IsoBlock,
  style: BlockStyle,
  west: ScreenPoint,
  south: ScreenPoint,
  lift: number,
  wall: number,
  glass: number,
): void {
  const { painter, ambience } = ctx;
  const span = block.rect.w;
  const base = lift - 26;
  if (base < 4) return;

  if (style.ground === 'arcade') {
    for (let i = 0; i < span; i += 1) {
      const from = along(west, south, (i + 0.2) / span, base);
      const to = along(west, south, (i + 0.8) / span, base);
      face(painter, from, to, 22, scale(wall, 0.55));
      face(painter, from, to, 3, scale(wall, 0.75));
    }
  } else if (style.ground === 'shutter') {
    const from = along(west, south, 0.06, base);
    const to = along(west, south, 0.94, base);
    face(painter, from, to, 24, scale(wall, 0.62));
    for (let k = 2; k < 24; k += 3) {
      face(painter, { x: from.x, y: from.y + k }, { x: to.x, y: to.y + k }, 1, scale(wall, 0.85));
    }
  } else if (style.ground === 'gate') {
    const from = along(west, south, 0.2, base);
    const to = along(west, south, 0.8, base);
    face(painter, from, to, 24, scale(wall, 0.5));
    face(painter, from, to, 2, scale(wall, 1.1));
  } else if (style.ground === 'display') {
    for (let i = 0; i < span; i += 1) {
      const from = along(west, south, (i + 0.1) / span, base + 2);
      const to = along(west, south, (i + 0.9) / span, base + 2);
      face(painter, from, to, 18, glass);
      face(painter, from, to, 1, scale(glass, 1.5));
      face(painter, { x: from.x, y: from.y + 18 }, { x: to.x, y: to.y + 18 }, 4, scale(wall, 0.7));
      if (ambience.lampsOn) {
        face(painter, from, to, 18, 0xffd98f, 0.18);
      }
    }
  }

  if (style.awning) {
    const from = along(west, south, 0.04, base - 4);
    const to = along(west, south, 0.96, base - 4);
    const stripe = mix(scale(block.color, ambience.light), 0xffffff, 0.35);
    face(painter, from, to, 5, stripe);
    face(painter, { x: from.x, y: from.y + 5 }, { x: to.x, y: to.y + 5 }, 2, scale(stripe, 0.6));
  }
}

/** Боковая грань: пара окон, чтобы она не была глухой заливкой. */
function drawSideWindows(
  ctx: BlockPaint,
  style: BlockStyle,
  east: ScreenPoint,
  south: ScreenPoint,
  lift: number,
  wall: number,
): void {
  if (style.windows === 'none') return;
  const rows = Math.max(0, Math.floor((lift - 30) / 16));
  for (let row = 0; row < rows; row += 1) {
    const dy = 10 + row * 16;
    const from = along(east, south, 0.3, dy);
    const to = along(east, south, 0.7, dy);
    face(ctx.painter, from, to, 8, scale(wall, 0.82));
  }
}

/**
 * Вывеска щитом на фасаде: надпись на скошенной грани не читается, а по
 * вывеске дом и узнают. Щит висит на самой стене, а не над крышей —
 * иначе у высокого дома он уезжает под панель ресурсов.
 */
function drawSign(
  ctx: BlockPaint,
  block: IsoBlock,
  west: ScreenPoint,
  south: ScreenPoint,
  lift: number,
): void {
  const { painter, ambience } = ctx;
  const text = t(block.nameKey ?? '');
  const width = signWidth(block.nameKey ?? '', block.rect.w);
  const top = Math.min(14, Math.max(6, lift - 40));
  const mid = along(west, south, 0.5, top);
  const board = { x: Math.round(mid.x - width / 2), y: mid.y, w: Math.round(width), h: 15 };

  painter.fill({ x: board.x - 1, y: board.y - 1, w: board.w + 2, h: board.h + 2 }, 0x14121f);
  painter.fill(board, mix(scale(block.color, ambience.light), 0x1a1626, 0.55));
  painter.fill({ x: board.x, y: board.y, w: board.w, h: 1 }, scale(block.color, 1.5));
  painter.fill({ x: board.x, y: board.y + board.h - 1, w: board.w, h: 1 }, 0x0e0c16);
  if (ambience.lampsOn) {
    painter.fill({ x: board.x - 2, y: board.y - 2, w: board.w + 4, h: board.h + 4 }, COLORS.money, 0.16);
  }
  painter.label(board, text, {
    align: 'center',
    color: ambience.lampsOn ? COLORS.money : COLORS.text,
  });
}

/**
 * Стена комнаты: та же коробка, но без окон и вывесок — зато с панелью
 * по низу и карнизом. Дом снаружи и стена изнутри — разные вещи, и
 * рисовать их одним фасадом значит вешать витрину в гостиной.
 */
function drawWall(ctx: BlockPaint, block: IsoBlock): void {
  const { painter, ambience } = ctx;
  const r = block.rect;
  const lift = block.tall;
  const base = scale(mix(block.color, 0xe8dcc8, 0.6), ambience.light);

  const west = at(ctx, r.x, r.y + r.h, lift);
  const south = at(ctx, r.x + r.w, r.y + r.h, lift);
  const east = at(ctx, r.x + r.w, r.y, lift);

  face(painter, west, south, lift, base);
  face(painter, east, south, lift, scale(base, 0.78));

  // Обои в полоску, панель по низу и карниз по верху.
  const stripes = Math.max(2, r.w * 2);
  for (let i = 1; i < stripes; i += 1) {
    const p = along(west, south, i / stripes, 6);
    painter.fill({ x: p.x, y: p.y, w: 1, h: lift - 20 }, scale(base, 1.1), 0.5);
    const q = along(east, south, i / stripes, 6);
    painter.fill({ x: q.x, y: q.y, w: 1, h: lift - 20 }, scale(base, 0.9), 0.5);
  }
  for (const [a, b, tone] of [[west, south, 1], [east, south, 0.8]] as const) {
    face(painter, { x: a.x, y: a.y + lift - 14 }, { x: b.x, y: b.y + lift - 14 }, 14, scale(base, 0.86 * tone + 0.06));
    face(painter, { x: a.x, y: a.y + lift - 14 }, { x: b.x, y: b.y + lift - 14 }, 1, scale(base, 1.2));
    face(painter, a, b, 3, scale(base, 1.24));
  }

  if (block.doorRect) drawWallDoor(ctx, block, block.doorRect);
}

/**
 * Дверь в стене комнаты. Створка посреди пола читалась ширмой: выход
 * должен быть там же, где он был бы в настоящей комнате — в стене.
 */
function drawWallDoor(ctx: BlockPaint, block: IsoBlock, door: WorldRect): void {
  const { painter, ambience } = ctx;
  const lift = block.tall;
  const frame = scale(0x6b5a48, ambience.light);
  const leaf = scale(0x7a5f42, ambience.light);

  // Дверь врезана в ту стену, вдоль которой она стоит: у левой стены
  // проём идёт по её плоскости, у задней — по своей.
  const alongY = block.rect.w <= block.rect.h;
  const from = alongY
    ? at(ctx, block.rect.x + block.rect.w, door.y, lift)
    : at(ctx, door.x, block.rect.y + block.rect.h, lift);
  const to = alongY
    ? at(ctx, block.rect.x + block.rect.w, door.y + 1, lift)
    : at(ctx, door.x + 1, block.rect.y + block.rect.h, lift);

  const height = 34;
  const top = lift - height;
  const drop = (p: ScreenPoint, k = 0): ScreenPoint => ({ x: p.x, y: p.y + top + k });
  const inset = (p: ScreenPoint, k: number, dy = 0): ScreenPoint => ({
    x: p.x + (to.x - from.x) * k,
    y: p.y + (to.y - from.y) * k + top + dy,
  });

  // Наличник, откос вглубь стены и створка: без откоса дверь читается
  // доской, приставленной к стене, а не проёмом в ней.
  face(painter, drop(from), drop(to), height, scale(frame, 0.5));
  face(painter, inset(from, 0.1), inset(to, -0.1), height - 2, mix(frame, 0x0d0b14, 0.55));
  face(painter, inset(from, 0.16, 2), inset(to, -0.16, 2), height - 5, leaf);
  face(painter, inset(from, 0.16, 2), inset(to, -0.16, 2), 2, scale(leaf, 1.35));
  face(painter, drop(from), drop(to), 2, scale(frame, 1.3));
  // Ручка лежит в плоскости створки, как и всё остальное на ней.
  const grip = inset(from, 0.66, height - 18);
  face(painter, grip, inset(from, 0.78, height - 18), 3, scale(0xd8c078, ambience.light));
}
