import type { SurfaceKind, TerrainDef, WorldRect } from '@core/types';
import type { Rect } from '@ui/widgets/Hotspots';
import type { Painter } from '@ui/widgets/Painter';
import { mix, scale } from '../ambience';
import type { Ambience } from '../ambience';

/**
 * Земля района плитами. Рисуется в координатах района — камеры здесь нет,
 * потому что всё это запекается в текстуру один раз на время суток.
 *
 * Порядок жёсткий: сначала покрытия, потом обрывы, и только потом
 * лестницы. Лестница обязана лечь поверх стенки, которую разрывает,
 * иначе она читается приклеенной к обрыву картинкой.
 */
export interface Terrain {
  readonly plates: readonly TerrainDef[];
  /** Во сколько раз мир крупнее экранного пикселя. */
  readonly unit: number;
  readonly ambience: Ambience;
}

export function drawTerrain(painter: Painter, terrain: Terrain): void {
  for (const plate of terrain.plates) {
    if (plate.surface === 'steps') continue;
    SURFACE[plate.surface](painter, terrain, plate);
  }
  for (const plate of terrain.plates) {
    if ((plate.riser ?? 0) > 0) drawRiser(painter, terrain, plate);
  }
  for (const plate of terrain.plates) {
    if (plate.surface === 'steps') drawSteps(painter, terrain, plate);
  }
}

type Paint = (painter: Painter, terrain: Terrain, plate: TerrainDef) => void;

/** Прямоугольник района в пикселях текстуры. */
const box = (terrain: Terrain, rect: WorldRect): Rect => ({
  x: Math.round(rect.x * terrain.unit),
  y: Math.round(rect.y * terrain.unit),
  w: Math.round(rect.w * terrain.unit),
  h: Math.round(rect.h * terrain.unit),
});

/** Повторяемый «шум» без генератора: позиция сама себе зерно. */
const noise = (i: number, m: number): number => (i * 1103515245 + 12345) % m;

const band = (painter: Painter, r: Rect, dy: number, h: number, color: number, alpha = 1): void =>
  painter.fill({ x: r.x, y: r.y + dy, w: r.w, h }, color, alpha);

/** Мостовая: тёмный асфальт в разводах и осевая разметка. */
const road: Paint = (painter, terrain, plate) => {
  const r = box(terrain, plate.rect);
  const { unit, ambience } = terrain;
  painter.fill(r, ambience.asphalt);

  // Разводы от колёс и заплаток: ровная заливка на таком крупном плане
  // выглядит бумагой, а не дорогой.
  for (let i = 0; i < Math.round(r.w / 14); i += 1) {
    const x = r.x + noise(i * 7 + 1, r.w);
    const y = r.y + noise(i * 13 + 5, Math.max(1, r.h));
    const w = 8 + noise(i, 22);
    painter.fill({ x, y, w, h: Math.max(1, Math.round(unit)) }, scale(ambience.asphalt, i % 2 ? 1.1 : 0.9), 0.5);
  }

  // Кромка у верхнего края: асфальт всегда ниже тротуара.
  band(painter, r, 0, Math.max(1, Math.round(unit)), scale(ambience.asphalt, 0.7));

  const dash = Math.round(9 * unit);
  const gap = Math.round(12 * unit);
  const y = r.y + Math.round(r.h / 2);
  for (let x = r.x + gap; x < r.x + r.w - dash; x += dash + gap) {
    painter.fill({ x, y, w: dash, h: Math.max(1, Math.round(unit)) }, scale(ambience.kerb, 0.95), 0.75);
  }
};

/** Тротуар: плиты со швами и бордюр по нижней кромке. */
const pavement: Paint = (painter, terrain, plate) => {
  slabs(painter, terrain, plate, terrain.ambience.pavement, 13, 9);
  kerbEdge(painter, terrain, plate);
};

/** Площадь: те же плиты, но крупнее и светлее — это уже не тротуар. */
const plaza: Paint = (painter, terrain, plate) => {
  slabs(painter, terrain, plate, scale(terrain.ambience.pavement, 1.07), 22, 11);
  kerbEdge(painter, terrain, plate);
};

function slabs(
  painter: Painter,
  terrain: Terrain,
  plate: TerrainDef,
  color: number,
  slabW: number,
  slabH: number,
): void {
  const r = box(terrain, plate.rect);
  const { unit } = terrain;
  painter.fill(r, color);

  const stepX = Math.round(slabW * unit);
  const stepY = Math.round(slabH * unit);
  const joint = scale(color, 0.9);
  let row = 0;
  for (let y = r.y; y < r.y + r.h; y += stepY) {
    painter.fill({ x: r.x, y, w: r.w, h: 1 }, joint);
    const shift = row % 2 === 0 ? 0 : Math.round(stepX / 2);
    for (let x = r.x + shift; x < r.x + r.w; x += stepX) {
      painter.fill({ x, y, w: 1, h: Math.min(stepY, r.y + r.h - y) }, joint);
    }
    row += 1;
  }
  // Пятна и подтёки: одинаковые плиты по всей улице читаются кафелем.
  for (let i = 0; i < Math.round(r.w / 26); i += 1) {
    const x = r.x + noise(i * 11 + 3, r.w);
    const y = r.y + noise(i * 17 + 9, Math.max(1, r.h));
    painter.fill({ x, y, w: 6 + noise(i, 12), h: Math.max(1, Math.round(unit)) }, joint, 0.5);
  }
  band(painter, r, 0, 1, scale(color, 1.12));
}

/** Бордюр по нижней кромке мощёного: светлая грань и тень под ней. */
function kerbEdge(painter: Painter, terrain: Terrain, plate: TerrainDef): void {
  if ((plate.riser ?? 0) > 0) return;
  const r = box(terrain, plate.rect);
  const { unit, ambience } = terrain;
  const h = Math.max(1, Math.round(unit));
  band(painter, r, r.h - h * 2, h, ambience.kerb);
  band(painter, r, r.h - h, h, scale(ambience.kerb, 0.55));
}

/** Настил: доски поперёк хода и редкие швы секций. */
const boardwalk: Paint = (painter, terrain, plate) => {
  const r = box(terrain, plate.rect);
  const { unit, ambience } = terrain;
  const deck = mix(ambience.pavement, 0xb07f3f, 0.78);
  painter.fill(r, deck);

  const plank = Math.max(2, Math.round(5 * unit));
  for (let y = r.y; y < r.y + r.h; y += plank) {
    painter.fill({ x: r.x, y, w: r.w, h: 1 }, scale(deck, 0.6));
    painter.fill({ x: r.x, y: y + 1, w: r.w, h: 1 }, scale(deck, 1.16));
  }
  const seam = Math.round(46 * unit);
  for (let x = r.x; x < r.x + r.w; x += seam) {
    painter.fill({ x, y: r.y, w: 2, h: r.h }, scale(deck, 0.72));
  }
  // Выцветшие доски: настил у моря не бывает ровного тона.
  for (let i = 0; i < Math.round(r.w / 30); i += 1) {
    const x = r.x + noise(i * 5 + 2, r.w);
    const y = r.y + Math.round(noise(i * 3 + 1, Math.max(1, r.h)) / plank) * plank + 2;
    painter.fill({ x, y, w: 14 + noise(i, 30), h: plank - 2 }, scale(deck, 1.08), 0.4);
  }
  band(painter, r, 0, Math.max(1, Math.round(unit)), scale(deck, 0.5));
};

/** Песок: тёплая крупа с редкими следами и ракушками. */
const sand: Paint = (painter, terrain, plate) => {
  const r = box(terrain, plate.rect);
  const { unit, ambience } = terrain;
  const tone = mix(0xf2e0ab, ambience.pavement, 0.16);
  painter.fill(r, tone);

  // Наносы: широкие мягкие полосы вдоль берега.
  for (let i = 0; i < Math.round(r.h / (3 * unit)); i += 1) {
    const y = r.y + i * Math.round(3 * unit) + 1;
    painter.fill({ x: r.x, y, w: r.w, h: 1 }, scale(tone, i % 2 ? 1.05 : 0.95), 0.45);
  }
  const grains = Math.round((r.w * r.h) / 260);
  for (let i = 0; i < grains; i += 1) {
    const x = r.x + noise(i * 3 + 1, r.w);
    const y = r.y + noise(i * 7 + 4, r.h);
    painter.fill({ x, y, w: Math.max(1, Math.round(unit / 2)), h: 1 }, scale(tone, i % 3 === 0 ? 1.12 : 0.86));
  }
};

/** Вода: у берега светлая, дальше глубже, поверху — пена прибоя. */
const water: Paint = (painter, terrain, plate) => {
  const r = box(terrain, plate.rect);
  const { unit, ambience } = terrain;
  const shallow = mix(0x49c3d8, ambience.skyLow, 0.28);
  const deep = mix(0x0f5f95, ambience.skyLow, 0.24);

  const bands = 7;
  for (let i = 0; i < bands; i += 1) {
    const y = r.y + Math.round((r.h * i) / bands);
    const h = Math.round(r.h / bands) + 1;
    painter.fill({ x: r.x, y, w: r.w, h }, mix(shallow, deep, i / (bands - 1)));
  }
  // Мокрый песок над урезом: без него вода приклеена к пляжу встык.
  const wet = Math.max(1, Math.round(2 * unit));
  painter.fill({ x: r.x, y: r.y - wet, w: r.w, h: wet }, deep, 0.22);

  // Прибой: кромка пены гуляет, а не идёт по линейке.
  const foam = Math.max(1, Math.round(unit));
  const wave = Math.round(1.5 * unit);
  const stride = Math.max(2, Math.round(4 * unit));
  for (let x = r.x; x < r.x + r.w; x += stride) {
    const lift = Math.round(Math.sin(x / (9 * unit)) * wave);
    const w = Math.min(stride, r.x + r.w - x);
    painter.fill({ x, y: r.y + lift, w, h: foam * 2 }, 0xffffff, 0.6);
    painter.fill({ x, y: r.y + lift + foam * 2, w, h: foam }, 0xffffff, 0.25);
  }

  // Барашки на волне и дорожка света.
  for (let i = 0; i < Math.round(r.w / 10); i += 1) {
    const x = r.x + noise(i * 9 + 2, r.w);
    const y = r.y + Math.max(wave + foam * 2, noise(i * 5 + 3, r.h));
    painter.fill({ x, y, w: 5 + noise(i, 14), h: 1 }, 0xffffff, 0.32);
  }
  if (!ambience.lampsOn) {
    const sun = r.x + Math.round(r.w * 0.72);
    for (let i = 0; i < 9; i += 1) {
      const w = 6 + i * 5;
      painter.fill(
        { x: sun - Math.round(w / 2), y: r.y + wave + i * Math.max(2, Math.round(r.h / 10)), w, h: 1 },
        0xffffff,
        0.3,
      );
    }
  }
};

/** Газон: трава с кустиками и тёмной кромкой. */
const grass: Paint = (painter, terrain, plate) => {
  const r = box(terrain, plate.rect);
  const { unit, ambience } = terrain;
  const tone = mix(0x4f9a49, ambience.pavement, 0.18);
  painter.fill(r, tone);
  band(painter, r, 0, Math.max(1, Math.round(unit)), scale(tone, 1.25));
  band(painter, r, r.h - 1, 1, scale(tone, 0.65));
  const tufts = Math.round((r.w * r.h) / 420);
  for (let i = 0; i < tufts; i += 1) {
    const x = r.x + noise(i * 3 + 2, r.w);
    const y = r.y + noise(i * 11 + 6, r.h);
    painter.fill({ x, y, w: 1, h: Math.max(1, Math.round(unit)) }, scale(tone, i % 2 ? 1.32 : 0.72));
  }
};

/** Ковровая дорожка у входа в клуб. */
const carpet: Paint = (painter, terrain, plate) => {
  const r = box(terrain, plate.rect);
  const tone = scale(0x9a2f4a, terrain.ambience.light);
  painter.fill(r, tone);
  band(painter, r, 0, 1, scale(tone, 1.45));
  band(painter, r, r.h - 1, 1, scale(tone, 0.6));
  painter.fill({ x: r.x, y: r.y + 2, w: r.w, h: 1 }, scale(tone, 1.2), 0.6);
};

const SURFACE: Readonly<Record<SurfaceKind, Paint>> = {
  road,
  pavement,
  plaza,
  boardwalk,
  sand,
  grass,
  carpet,
  water,
  // Лестница рисуется отдельным проходом, поверх стенки обрыва.
  steps: () => undefined,
};

/** Подпорная стенка под кромкой поднятой плиты. */
function drawRiser(painter: Painter, terrain: Terrain, plate: TerrainDef): void {
  const { unit, ambience } = terrain;
  const r = box(terrain, {
    x: plate.rect.x,
    y: plate.rect.y + plate.rect.h,
    w: plate.rect.w,
    h: plate.riser ?? 0,
  });
  const face = mix(ambience.pavement, ambience.skyLow, 0.32);
  painter.fill(r, face);
  band(painter, r, 0, Math.max(1, Math.round(unit)), scale(face, 1.35));
  band(painter, r, r.h - Math.max(1, Math.round(unit)), Math.max(1, Math.round(unit)), scale(face, 0.5));

  // Швы плит стенки: без них она читается крашеной доской.
  const seam = Math.round(24 * unit);
  for (let x = r.x + seam; x < r.x + r.w; x += seam) {
    painter.fill({ x, y: r.y + 1, w: 1, h: r.h - 2 }, scale(face, 0.78));
  }
  // Тень стенки на нижнюю площадку.
  painter.fill({ x: r.x, y: r.y + r.h, w: r.w, h: Math.max(1, Math.round(unit)) }, 0x000000, 0.22);
}

/** Лестница: ступени поперёк, щёки по бокам. */
function drawSteps(painter: Painter, terrain: Terrain, plate: TerrainDef): void {
  const { unit, ambience } = terrain;
  const r = box(terrain, plate.rect);
  const stone = scale(mix(ambience.pavement, 0xffffff, 0.12), 1);
  painter.fill(r, stone);

  const tread = Math.max(2, Math.round(2 * unit));
  for (let y = r.y; y < r.y + r.h; y += tread) {
    painter.fill({ x: r.x, y, w: r.w, h: 1 }, scale(stone, 1.3));
    painter.fill({ x: r.x, y: y + tread - 1, w: r.w, h: 1 }, scale(stone, 0.62));
  }
  const cheek = Math.max(1, Math.round(unit));
  painter.fill({ x: r.x, y: r.y, w: cheek, h: r.h }, scale(stone, 0.7));
  painter.fill({ x: r.x + r.w - cheek, y: r.y, w: cheek, h: r.h }, scale(stone, 0.7));
}
