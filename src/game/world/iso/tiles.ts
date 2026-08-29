import type { TileKind } from '@core/types';
import type { Painter } from '@ui/widgets/Painter';
import { mix, scale } from '../ambience';
import type { Ambience } from '../ambience';
import { TILE } from './project';
import { tile } from './shapes';
import type { ScreenPoint } from './project';

/**
 * Покрытия плиток. Каждое рисуется прямо в ромбе: сначала тон, потом
 * рисунок — доски, швы плит, крупа песка. Тон слегка гуляет от плитки к
 * плитке, иначе большая площадь выглядит залитой краской.
 */
export interface TilePaint {
  readonly painter: Painter;
  readonly ambience: Ambience;
  /** Северный угол ромба в пикселях текстуры. */
  readonly at: ScreenPoint;
  /** Координаты плитки: по ним считается разброс тона. */
  readonly tx: number;
  readonly ty: number;
}

/** Повторяемый разброс: плитка сама себе зерно. */
const jitter = (tx: number, ty: number, spread: number): number => {
  const n = (tx * 73856093) ^ (ty * 19349663);
  return 1 + ((((n >>> 8) % 100) / 100) * 2 - 1) * spread;
};

/**
 * Линия вдоль изометрической оси: пол-пикселя вниз на пиксель вбок.
 * Рисуется одним многоугольником, а не по пикселю: покрытий на карте
 * восемьсот плиток, и попиксельная линия стоила десятков тысяч заливок
 * на каждое запекание.
 */
const line = (
  ctx: TilePaint,
  fromDx: number,
  fromDy: number,
  length: number,
  down: boolean,
  color: number,
  alpha = 1,
): void => {
  const x0 = ctx.at.x + fromDx;
  const y0 = ctx.at.y + fromDy;
  const x1 = x0 + (down ? length : -length);
  const y1 = y0 + length / 2;
  ctx.painter.polygon(
    [
      { x: x0, y: y0 },
      { x: x1, y: y1 },
      { x: x1, y: y1 + 1 },
      { x: x0, y: y0 + 1 },
    ],
    color,
    alpha,
  );
};

type Paint = (ctx: TilePaint) => void;

/** Мостовая: тёмный асфальт с крупой и редкими трещинами. */
const road: Paint = (ctx) => {
  const base = scale(ctx.ambience.asphalt, jitter(ctx.tx, ctx.ty, 0.05));
  tile(ctx.painter, ctx.at, base);
  const n = (ctx.tx * 31 + ctx.ty * 17) % 7;
  if (n < 3) {
    line(ctx, -8 + n * 3, 6 + n, 10, true, scale(base, 0.86), 0.6);
  }
  if (n === 5) line(ctx, 6, 5, 8, false, scale(base, 1.14), 0.5);
};

/** Осевая разметка: та же мостовая с пунктиром вдоль улицы. */
const roadLine: Paint = (ctx) => {
  road(ctx);
  if (ctx.tx % 2 !== 0) return;
  const paint = mix(ctx.ambience.kerb, 0xfff0c0, 0.4);
  line(ctx, -10, 3, 20, true, paint, 0.85);
  line(ctx, -10, 4, 20, true, scale(paint, 0.7), 0.5);
};

/** Тротуар: плита со швом по кромке ромба. */
const pavement: Paint = (ctx) => {
  const base = scale(
    mix(ctx.ambience.pavement, 0xffe8c8, 0.14),
    jitter(ctx.tx, ctx.ty, 0.045),
  );
  tile(ctx.painter, ctx.at, base);
  seam(ctx, scale(base, 0.86));
  if ((ctx.tx * 13 + ctx.ty * 7) % 9 === 0) {
    line(ctx, -6, 8, 12, true, scale(base, 1.1), 0.4);
  }
};

/** Площадь: те же плиты, но шов только через одну — камень крупнее. */
const plaza: Paint = (ctx) => {
  const base = scale(
    mix(ctx.ambience.pavement, 0xffd8a0, 0.24),
    jitter(ctx.tx, ctx.ty, 0.035),
  );
  tile(ctx.painter, ctx.at, base);
  if ((ctx.tx + ctx.ty) % 2 === 0) seam(ctx, scale(base, 0.88));
};

/** Настил: доски вдоль улицы, шов и гвозди. */
const deck: Paint = (ctx) => {
  const wood = scale(0xc08a52, ctx.ambience.light);
  const base = scale(wood, jitter(ctx.tx, ctx.ty, 0.07));
  tile(ctx.painter, ctx.at, base);
  // Доски идут по оси x: три линии поперёк ромба.
  for (const [dx, dy, len] of [[-14, 8, 14], [-8, 5, 22], [0, 2, 16]] as const) {
    line(ctx, dx, dy, len, true, scale(base, 0.72), 0.85);
    line(ctx, dx, dy + 1, len, true, scale(base, 1.12), 0.35);
  }
  if ((ctx.tx * 7 + ctx.ty * 5) % 6 === 0) {
    ctx.painter.fill({ x: ctx.at.x - 3, y: ctx.at.y + 7, w: 1, h: 1 }, scale(base, 0.55));
  }
};

/** Песок: тёплая крупа и лёгкие наносы. */
const sand: Paint = (ctx) => {
  const base = scale(
    mix(0xf0dda8, ctx.ambience.pavement, 0.12),
    ctx.ambience.light * jitter(ctx.tx, ctx.ty, 0.04),
  );
  tile(ctx.painter, ctx.at, base);
  const n = (ctx.tx * 41 + ctx.ty * 23) % 11;
  for (let i = 0; i < 4; i += 1) {
    const k = (n + i * 3) % 13;
    ctx.painter.fill(
      { x: ctx.at.x - 10 + ((k * 3) % 20), y: ctx.at.y + 2 + ((k * 5) % 12), w: 1, h: 1 },
      scale(base, i % 2 === 0 ? 1.1 : 0.88),
      0.8,
    );
  }
  if (n < 4) line(ctx, -10, 8 + n, 16, true, scale(base, 0.94), 0.5);
};

/** Вода: полосы волны и блик. Пена у берега — забота кромки. */
const water: Paint = (ctx) => {
  const shallow = scale(mix(0x5fd3dc, ctx.ambience.skyLow, 0.2), ctx.ambience.light);
  const deep = scale(mix(0x0e5c98, ctx.ambience.skyLow, 0.18), ctx.ambience.light);
  tile(ctx.painter, ctx.at, mix(shallow, deep, Math.min(1, (ctx.ty % 9) / 9)));
  const n = (ctx.tx * 29 + ctx.ty * 19) % 5;
  if (n < 3) line(ctx, -10 + n * 4, 7 + n, 12, true, 0xffffff, 0.22);
};

/** Газон: трава с кустиками. */
const grass: Paint = (ctx) => {
  const base = scale(
    mix(0x58a54e, ctx.ambience.pavement, 0.2),
    ctx.ambience.light * jitter(ctx.tx, ctx.ty, 0.07),
  );
  tile(ctx.painter, ctx.at, base);
  for (let i = 0; i < 3; i += 1) {
    const k = (ctx.tx * 13 + ctx.ty * 7 + i * 5) % 17;
    ctx.painter.fill(
      { x: ctx.at.x - 8 + ((k * 3) % 16), y: ctx.at.y + 3 + ((k * 3) % 10), w: 1, h: 2 },
      scale(base, i % 2 === 0 ? 1.3 : 0.72),
      0.8,
    );
  }
};

/** Ковровая дорожка. */
const carpet: Paint = (ctx) => {
  const base = scale(0xa8324f, ctx.ambience.light * jitter(ctx.tx, ctx.ty, 0.04));
  tile(ctx.painter, ctx.at, base);
  seam(ctx, scale(base, 1.3));
};

/** Ступени: две проступи поперёк ромба. */
const steps: Paint = (ctx) => {
  const base = scale(mix(ctx.ambience.pavement, 0xffffff, 0.14), ctx.ambience.light);
  tile(ctx.painter, ctx.at, base);
  for (const dy of [4, 9, 14]) {
    line(ctx, -TILE.halfW + dy, dy / 2 + 1, TILE.halfW * 2 - dy * 2, true, scale(base, 0.62), 0.9);
    line(ctx, -TILE.halfW + dy, dy / 2 + 2, TILE.halfW * 2 - dy * 2, true, scale(base, 1.25), 0.5);
  }
};

/** Дощатый пол помещения: доски вдоль оси x, тёплые и тёмные. */
const wood: Paint = (ctx) => {
  const base = scale(0x8a5f38, ctx.ambience.light * jitter(ctx.tx, ctx.ty, 0.09));
  tile(ctx.painter, ctx.at, base);
  // Швы сдвигаются от ряда к ряду: одинаковый рисунок в каждой плитке
  // складывается в рябь и выдаёт сетку.
  const phase = ((ctx.tx * 2 + ctx.ty * 5) % 3) - 1;
  for (const [dx, dy, len] of [[-13, 8, 12], [-6, 4, 20]] as const) {
    line(ctx, dx + phase * 2, dy + phase, len, true, scale(base, 0.76), 0.7);
    line(ctx, dx + phase * 2, dy + phase + 1, len, true, scale(base, 1.14), 0.25);
  }
};

/** Полированный камень: шов по кромке и блик наискось. */
const marble: Paint = (ctx) => {
  const base = scale(0xd8d0c4, ctx.ambience.light * jitter(ctx.tx, ctx.ty, 0.025));
  tile(ctx.painter, ctx.at, (ctx.tx + ctx.ty) % 2 === 0 ? base : scale(base, 0.92));
  seam(ctx, scale(base, 0.8));
  // Прожилки камня: короткие светлые росчерки поперёк плиты.
  const n = (ctx.tx * 17 + ctx.ty * 11) % 6;
  if (n < 2) line(ctx, -8 + n * 3, 6 + n, 12, true, 0xffffff, 0.16);
  if (n === 4) line(ctx, 5, 5, 9, false, scale(base, 0.86), 0.4);
};

/** Танцпол: тёмная плита, по которой ходят пятна света. */
const dance: Paint = (ctx) => {
  const base = scale(0x1b2145, ctx.ambience.light);
  tile(ctx.painter, ctx.at, scale(base, jitter(ctx.tx, ctx.ty, 0.06)));
  seam(ctx, scale(base, 1.6));
  // Пятно прожектора: редкое, но яркое — по нему клуб и узнаётся.
  // Пятно прожектора: мягкое, с растушёванным краем — залитая целиком
  // плитка читается наклейкой, а не светом.
  const n = (ctx.tx * 37 + ctx.ty * 11) % 9;
  if (n === 0 || n === 4) {
    const glow = [0x4f7fff, 0xff5fb8, 0x5fffc9][(ctx.tx + ctx.ty) % 3]!;
    const rows = TILE.halfH * 2;
    for (let r = 0; r < rows; r += 1) {
      const full = 2 + 4 * Math.min(r, rows - 1 - r);
      for (const [inset, alpha] of [[0, 0.12], [8, 0.16], [16, 0.2]] as const) {
        const w = full - inset;
        if (w > 0) {
          ctx.painter.fill({ x: ctx.at.x - w / 2, y: ctx.at.y + r, w, h: 1 }, glow, alpha);
        }
      }
    }
  }
};

/** Сцена: тёмный настил с металлической кромкой. */
const stage: Paint = (ctx) => {
  const base = scale(0x3a2f2a, ctx.ambience.light * jitter(ctx.tx, ctx.ty, 0.05));
  tile(ctx.painter, ctx.at, base);
  line(ctx, -12, 7, 24, true, scale(base, 1.3), 0.5);
};

/** Ковёр в комнате: кайма и узор. */
const rug: Paint = (ctx) => {
  const base = scale(0x8f3f5a, ctx.ambience.light * jitter(ctx.tx, ctx.ty, 0.03));
  tile(ctx.painter, ctx.at, base);
  // Узор ковра: ромб в ромбе и точки по углам — иначе это заливка.
  const inner = scale(base, (ctx.tx + ctx.ty) % 2 === 0 ? 1.16 : 0.88);
  for (let r = 4; r < 12; r += 1) {
    const w = 2 + 4 * Math.min(r, 15 - r) - 12;
    if (w > 0) ctx.painter.fill({ x: ctx.at.x - w / 2, y: ctx.at.y + r, w, h: 1 }, inner);
  }
  ctx.painter.fill({ x: ctx.at.x - 1, y: ctx.at.y + 7, w: 2, h: 2 }, scale(base, 1.5));
  seam(ctx, scale(base, 1.35));
};

const SEAM_ALPHA = 0.55;

/** Шов по дальним рёбрам ромба: он и делает плитку плиткой. */
function seam(ctx: TilePaint, color: number): void {
  line(ctx, 0, 0, TILE.halfW, true, color, SEAM_ALPHA);
  line(ctx, 0, 0, TILE.halfW, false, color, SEAM_ALPHA);
}

export const TILES: Readonly<Record<TileKind, Paint>> = {
  road,
  roadLine,
  pavement,
  plaza,
  deck,
  sand,
  water,
  grass,
  carpet,
  steps,
  wood,
  marble,
  dance,
  stage,
  rug,
  // Дыра в карте: рисовать нечего, ходить некуда.
  void: () => undefined,
};
