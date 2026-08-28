import type { SurfaceKind, TerrainDef, WorldRect } from '@core/types';
import type { Rect } from '@ui/widgets/Hotspots';
import type { Painter } from '@ui/widgets/Painter';
import { mix, scale } from '../ambience';
import type { Ambience } from '../ambience';

/**
 * Земля района плитами. Рисуется в координатах района — камеры здесь нет,
 * потому что всё это запекается в текстуру один раз на время суток.
 *
 * Порядок жёсткий: покрытия, тень от домов, обрывы и только потом
 * лестницы. Лестница обязана лечь поверх стенки, которую разрывает,
 * иначе она читается приклеенной к обрыву картинкой.
 *
 * Каждое покрытие кладётся с растяжкой по глубине: дальний край темнее,
 * ближний светлее. Ровная заливка полосы на таком крупном плане и есть
 * то, из-за чего земля выглядела бумагой.
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
  drawFacadeShade(painter, terrain);
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

/**
 * Растяжка по глубине: полоса заливается рядами от дальнего цвета к
 * ближнему. Ряд в один экранный пиксель — граница между ними не видна.
 */
function gradient(painter: Painter, r: Rect, far: number, near: number): void {
  const rows = Math.max(1, r.h);
  for (let i = 0; i < rows; i += 1) {
    painter.fill({ x: r.x, y: r.y + i, w: r.w, h: 1 }, mix(far, near, i / Math.max(1, rows - 1)));
  }
}

/** Мостовая: асфальт с растяжкой, разводами и осевой разметкой. */
const road: Paint = (painter, terrain, plate) => {
  const r = box(terrain, plate.rect);
  const { unit, ambience } = terrain;
  const far = scale(ambience.asphalt, 0.86);
  const near = scale(ambience.asphalt, 1.08);
  gradient(painter, r, far, near);

  // Разводы от колёс и заплаток: ровный асфальт бывает только на бумаге.
  for (let i = 0; i < Math.round(r.w / 12); i += 1) {
    const x = r.x + noise(i * 7 + 1, r.w);
    const y = r.y + noise(i * 13 + 5, Math.max(1, r.h));
    const w = 10 + noise(i, 30);
    painter.fill({ x, y, w, h: Math.max(1, Math.round(unit / 2)) }, i % 2 ? near : far, 0.55);
  }

  // Лоток вдоль обоих краёв: асфальт всегда ниже своих кромок.
  painter.fill({ x: r.x, y: r.y, w: r.w, h: Math.max(1, Math.round(unit)) }, scale(far, 0.72));
  painter.fill(
    { x: r.x, y: r.y + r.h - Math.max(1, Math.round(unit)), w: r.w, h: Math.max(1, Math.round(unit)) },
    scale(far, 0.8),
  );

  const dash = Math.round(9 * unit);
  const gap = Math.round(12 * unit);
  const y = r.y + Math.round(r.h / 2);
  const line = mix(ambience.kerb, 0xfff0c0, 0.35);
  for (let x = r.x + gap; x < r.x + r.w - dash; x += dash + gap) {
    painter.fill({ x, y, w: dash, h: Math.max(1, Math.round(unit / 2)) }, line, 0.8);
  }
};

/** Тротуар: плиты со швами и бордюр по нижней кромке. */
const pavement: Paint = (painter, terrain, plate) => {
  slabs(painter, terrain, plate, mix(terrain.ambience.pavement, 0xffe8c8, 0.12), 13, 9);
  kerbEdge(painter, terrain, plate);
};

/** Площадь: плиты крупнее и теплее — это уже не тротуар. */
const plaza: Paint = (painter, terrain, plate) => {
  slabs(painter, terrain, plate, mix(terrain.ambience.pavement, 0xffd8a0, 0.22), 22, 11);
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
  gradient(painter, r, scale(color, 0.9), scale(color, 1.06));

  const stepX = Math.round(slabW * unit);
  const stepY = Math.round(slabH * unit);
  const joint = scale(color, 0.86);
  let row = 0;
  for (let y = r.y; y < r.y + r.h; y += stepY) {
    painter.fill({ x: r.x, y, w: r.w, h: 1 }, joint, 0.7);
    const shift = row % 2 === 0 ? 0 : Math.round(stepX / 2);
    for (let x = r.x + shift; x < r.x + r.w; x += stepX) {
      painter.fill({ x, y, w: 1, h: Math.min(stepY, r.y + r.h - y) }, joint, 0.55);
    }
    row += 1;
  }
  // Пятна и подтёки: одинаковые плиты по всей улице читаются кафелем.
  for (let i = 0; i < Math.round(r.w / 22); i += 1) {
    const x = r.x + noise(i * 11 + 3, r.w);
    const y = r.y + noise(i * 17 + 9, Math.max(1, r.h));
    const w = 8 + noise(i, 20);
    painter.fill({ x, y, w, h: Math.max(1, Math.round(unit))}, joint, 0.3);
    painter.fill({ x: x + 3, y: y + 1, w: Math.round(w / 2), h: 1 }, scale(color, 1.12), 0.35);
  }
}

/** Бордюр по нижней кромке мощёного: светлая грань и тень под ней. */
function kerbEdge(painter: Painter, terrain: Terrain, plate: TerrainDef): void {
  if ((plate.riser ?? 0) > 0) return;
  const r = box(terrain, plate.rect);
  const { unit, ambience } = terrain;
  const h = Math.max(1, Math.round(unit));
  painter.fill({ x: r.x, y: r.y + r.h - h * 2, w: r.w, h }, scale(ambience.kerb, 1.08));
  painter.fill({ x: r.x, y: r.y + r.h - h, w: r.w, h }, scale(ambience.kerb, 0.5));
}

/** Настил: выгоревшие доски поперёк хода, гвозди и щели. */
const boardwalk: Paint = (painter, terrain, plate) => {
  const r = box(terrain, plate.rect);
  const { unit, ambience } = terrain;
  // Дерево берётся своим цветом, а не от тротуара: настил обязан быть
  // тёплым и на рассвете, и в полдень, иначе он сливается с плиткой.
  const deck = scale(0xc08a52, ambience.light);
  gradient(painter, r, scale(deck, 0.88), scale(deck, 1.06));

  // Доска — не полоска краски: у каждой свой тон, шов между ними тонкий.
  const plank = Math.max(3, Math.round(6 * unit));
  let index = 0;
  for (let y = r.y; y < r.y + r.h; y += plank) {
    const h = Math.min(plank, r.y + r.h - y);
    const tint = 1 + ((noise(index * 3 + 1, 9) - 4) / 100);
    painter.fill({ x: r.x, y, w: r.w, h }, scale(deck, tint), 0.5);
    // Щель между досками: тёмная линия и блик по кромке следующей доски.
    painter.fill({ x: r.x, y, w: r.w, h: 1 }, scale(deck, 0.5));
    painter.fill({ x: r.x, y: y + 1, w: r.w, h: 1 }, scale(deck, 1.18), 0.55);

    // Гвозди по секциям: по ним настил и узнаётся вблизи.
    for (let x = r.x + Math.round(20 * unit); x < r.x + r.w; x += Math.round(46 * unit)) {
      painter.fill({ x, y: y + 2, w: 1, h: 1 }, scale(deck, 0.6), 0.7);
      painter.fill({ x: x + Math.round(4 * unit), y: y + 2, w: 1, h: 1 }, scale(deck, 0.6), 0.7);
    }
    index += 1;
  }

  // Выгоревшие и потемневшие пятна поперёк досок.
  for (let i = 0; i < Math.round(r.w / 34); i += 1) {
    const x = r.x + noise(i * 5 + 2, r.w);
    const y = r.y + Math.round(noise(i * 3 + 1, Math.max(1, r.h)) / plank) * plank + 2;
    painter.fill(
      { x, y, w: 16 + noise(i, 34), h: Math.max(1, plank - 3) },
      scale(deck, i % 2 ? 1.12 : 0.9),
      0.4,
    );
  }

  // Торцевая доска у песка и наметённый на неё песок: настил кончается
  // кромкой, а не линией между двумя заливками.
  const edge = Math.max(1, Math.round(unit));
  painter.fill({ x: r.x, y: r.y + r.h - edge * 2, w: r.w, h: edge * 2 }, scale(deck, 0.62));
  painter.fill({ x: r.x, y: r.y + r.h - edge * 2, w: r.w, h: edge }, scale(deck, 0.9));
  for (let i = 0; i < Math.round(r.w / 6); i += 1) {
    const x = r.x + noise(i * 17 + 5, r.w);
    const w = 3 + noise(i, 9);
    painter.fill({ x, y: r.y + r.h - edge * 3, w, h: edge * 3 }, 0xf0dfae, 0.4);
  }
};

/** Песок: тёплая крупа, наносы и следы. */
const sand: Paint = (painter, terrain, plate) => {
  const r = box(terrain, plate.rect);
  const { unit, ambience } = terrain;
  // Песок тоже подчиняется свету: не пригашенный, ночью он светился
  // ярче неба и обращал пляж в подсвеченную сцену.
  const far = scale(mix(0xe7d3a2, ambience.pavement, 0.2), ambience.light);
  const near = scale(mix(0xfaeec2, ambience.pavement, 0.08), ambience.light);
  gradient(painter, r, far, near);

  // Наносы: длинные мягкие дуги вдоль берега.
  for (let i = 0; i < Math.round(r.h / (4 * unit)); i += 1) {
    const y = r.y + Math.round(4 * unit) * i + 2;
    for (let x = r.x; x < r.x + r.w; x += Math.round(6 * unit)) {
      const lift = Math.round(Math.sin((x + i * 40) / (22 * unit)) * unit);
      painter.fill({ x, y: y + lift, w: Math.round(6 * unit), h: 1 }, scale(near, 0.92), 0.4);
    }
  }
  const grains = Math.round((r.w * r.h) / 200);
  for (let i = 0; i < grains; i += 1) {
    const x = r.x + noise(i * 3 + 1, r.w);
    const y = r.y + noise(i * 7 + 4, r.h);
    painter.fill({ x, y, w: 1, h: 1 }, scale(near, i % 3 === 0 ? 1.1 : 0.84), 0.7);
  }
  // Следы босых ног: цепочка вмятин наискось.
  for (let i = 0; i < Math.round(r.w / 90); i += 1) {
    const x0 = r.x + noise(i * 23 + 7, r.w);
    for (let k = 0; k < 6; k += 1) {
      const x = x0 + k * Math.round(5 * unit);
      const y = r.y + Math.round(r.h * 0.3) + k * Math.round(2 * unit) + (k % 2) * 2;
      if (x > r.x + r.w) break;
      painter.fill({ x, y, w: Math.max(1, Math.round(unit)), h: Math.max(1, Math.round(unit)) }, far, 0.5);
    }
  }
  // Ракушки и камушки.
  for (let i = 0; i < Math.round(r.w / 60); i += 1) {
    const x = r.x + noise(i * 31 + 11, r.w);
    const y = r.y + noise(i * 13 + 3, r.h);
    painter.fill({ x, y, w: Math.round(unit), h: 1 }, 0xffffff, 0.55);
  }
};

/** Вода: прибой у берега, глубина к нижнему краю, блики на волне. */
const water: Paint = (painter, terrain, plate) => {
  const r = box(terrain, plate.rect);
  const { unit, ambience } = terrain;
  const shallow = scale(mix(0x5fd3dc, ambience.skyLow, 0.22), ambience.light);
  const deep = scale(mix(0x0e5c98, ambience.skyLow, 0.2), ambience.light);
  gradient(painter, r, shallow, deep);

  // Мокрый песок над урезом: без него вода приклеена к пляжу встык.
  const wet = Math.max(1, Math.round(2 * unit));
  painter.fill({ x: r.x, y: r.y - wet, w: r.w, h: wet }, deep, 0.2);

  const foam = Math.max(1, Math.round(unit));
  const wave = Math.round(1.5 * unit);
  const stride = Math.max(2, Math.round(3 * unit));
  // Кромка пены гуляет, а не идёт по линейке; за ней вторая, отступившая.
  for (let x = r.x; x < r.x + r.w; x += stride) {
    const w = Math.min(stride, r.x + r.w - x);
    const lift = Math.round(Math.sin(x / (9 * unit)) * wave);
    painter.fill({ x, y: r.y + lift, w, h: foam * 2 }, 0xffffff, 0.62);
    painter.fill({ x, y: r.y + lift + foam * 2, w, h: foam }, 0xffffff, 0.28);
    const second = Math.round(Math.sin(x / (13 * unit) + 2) * wave) + Math.round(5 * unit);
    painter.fill({ x, y: r.y + second, w, h: foam }, 0xffffff, 0.22);
  }

  // Барашки на волне и дорожка света от солнца.
  for (let i = 0; i < Math.round(r.w / 8); i += 1) {
    const x = r.x + noise(i * 9 + 2, r.w);
    const y = r.y + Math.max(wave + foam * 3, noise(i * 5 + 3, r.h));
    painter.fill({ x, y, w: 4 + noise(i, 16), h: 1 }, 0xffffff, 0.28);
  }
  if (!ambience.lampsOn) {
    const sun = r.x + Math.round(r.w * 0.72);
    for (let i = 0; i < 10; i += 1) {
      const w = 6 + i * 6;
      painter.fill(
        { x: sun - Math.round(w / 2), y: r.y + wave + i * Math.max(2, Math.round(r.h / 11)), w, h: 1 },
        0xffffff,
        0.26,
      );
    }
  }
};

/** Газон: трава с кустиками, цветами и тёмной кромкой. */
const grass: Paint = (painter, terrain, plate) => {
  const r = box(terrain, plate.rect);
  const { unit, ambience } = terrain;
  const tone = scale(mix(0x58a54e, ambience.pavement, 0.22), ambience.light);
  gradient(painter, r, scale(tone, 0.86), scale(tone, 1.1));
  painter.fill({ x: r.x, y: r.y, w: r.w, h: Math.max(1, Math.round(unit)) }, scale(tone, 1.3), 0.6);
  painter.fill({ x: r.x, y: r.y + r.h - 1, w: r.w, h: 1 }, scale(tone, 0.62));

  const tufts = Math.round((r.w * r.h) / 300);
  for (let i = 0; i < tufts; i += 1) {
    const x = r.x + noise(i * 3 + 2, r.w);
    const y = r.y + noise(i * 11 + 6, r.h);
    painter.fill({ x, y, w: 1, h: Math.max(1, Math.round(unit)) }, scale(tone, i % 2 ? 1.3 : 0.74), 0.8);
  }
  for (let i = 0; i < Math.round(r.w / 70); i += 1) {
    const x = r.x + noise(i * 29 + 5, r.w);
    const y = r.y + noise(i * 17 + 2, r.h);
    const flower = scale(i % 2 ? 0xffe066 : 0xff8fb8, ambience.light);
    painter.fill({ x, y, w: Math.round(unit), h: Math.round(unit) }, flower, 0.85);
  }
};

/** Ковровая дорожка у входа в клуб. */
const carpet: Paint = (painter, terrain, plate) => {
  const r = box(terrain, plate.rect);
  const tone = scale(0xa8324f, terrain.ambience.light);
  gradient(painter, r, scale(tone, 0.86), scale(tone, 1.08));
  painter.fill({ x: r.x, y: r.y, w: r.w, h: 1 }, scale(tone, 1.5));
  painter.fill({ x: r.x, y: r.y + r.h - 1, w: r.w, h: 1 }, scale(tone, 0.55));
  // Кант по краям: дорожка должна выглядеть постеленной, а не покрашенной.
  painter.fill({ x: r.x, y: r.y, w: 2, h: r.h }, scale(tone, 0.6));
  painter.fill({ x: r.x + r.w - 2, y: r.y, w: 2, h: r.h }, scale(tone, 0.6));
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

/**
 * Тень домов на землю у их подножия. Земля, начинающаяся вплотную к
 * стене без единого затемнения, — главная примета плоской картинки.
 */
function drawFacadeShade(painter: Painter, terrain: Terrain): void {
  const { unit, ambience } = terrain;
  if (ambience.shadow <= 0) return;
  const top = Math.min(...terrain.plates.map((plate) => plate.rect.y));
  const width = Math.max(...terrain.plates.map((plate) => plate.rect.x + plate.rect.w));
  const depth = Math.round(5 * unit);
  for (let i = 0; i < depth; i += 1) {
    painter.fill(
      { x: 0, y: Math.round(top * unit) + i, w: Math.round(width * unit), h: 1 },
      0x000000,
      ambience.shadow * 0.7 * (1 - i / depth),
    );
  }
}

/** Подпорная стенка под кромкой поднятой плиты. */
function drawRiser(painter: Painter, terrain: Terrain, plate: TerrainDef): void {
  const { unit, ambience } = terrain;
  const riser = plate.riser ?? 0;
  const r = box(terrain, {
    x: plate.rect.x,
    y: plate.rect.y + plate.rect.h,
    w: plate.rect.w,
    h: riser,
  });
  // Бетон стенки — свой цвет: взятый от тротуара, он сливался с ним в
  // одну светлую полосу, и обрыв переставал читаться обрывом.
  const face = scale(0xa89c88, ambience.light);
  // Стенка освещена сверху: снизу она уходит в тень нижней площадки.
  gradient(painter, r, scale(face, 1.12), scale(face, 0.58));

  const cap = Math.max(1, Math.round(unit));
  painter.fill({ x: r.x, y: r.y, w: r.w, h: cap }, scale(ambience.kerb, 1.12));
  painter.fill({ x: r.x, y: r.y + cap, w: r.w, h: cap }, scale(face, 1.2));
  painter.fill({ x: r.x, y: r.y + r.h - cap, w: r.w, h: cap }, scale(face, 0.5));

  // Швы панелей и потёки: без них стенка читается крашеной доской.
  const seam = Math.round(24 * unit);
  for (let x = r.x + seam; x < r.x + r.w; x += seam) {
    painter.fill({ x, y: r.y + cap, w: 1, h: r.h - cap * 2 }, scale(face, 0.72), 0.9);
    painter.fill({ x: x + 1, y: r.y + cap, w: 1, h: r.h - cap * 2 }, scale(face, 1.1), 0.4);
  }
  for (let i = 0; i < Math.round(r.w / 40); i += 1) {
    const x = r.x + noise(i * 19 + 3, r.w);
    painter.fill({ x, y: r.y + cap * 2, w: Math.round(unit), h: r.h - cap * 3 }, scale(face, 0.8), 0.35);
  }
  // Тень стенки на нижнюю площадку.
  for (let i = 0; i < Math.round(3 * unit); i += 1) {
    painter.fill({ x: r.x, y: r.y + r.h + i, w: r.w, h: 1 }, 0x000000, 0.26 * (1 - i / (3 * unit)));
  }
}

/** Лестница: ступени поперёк, щёки по бокам. */
function drawSteps(painter: Painter, terrain: Terrain, plate: TerrainDef): void {
  const { unit, ambience } = terrain;
  const r = box(terrain, plate.rect);
  const stone = mix(ambience.pavement, 0xffffff, 0.16);

  const tread = Math.max(2, Math.round(2 * unit));
  let index = 0;
  for (let y = r.y; y < r.y + r.h; y += tread) {
    const h = Math.min(tread, r.y + r.h - y);
    // Каждая ступень ниже предыдущей и потому темнее: так видно спуск.
    painter.fill({ x: r.x, y, w: r.w, h }, scale(stone, 1.06 - index * 0.06));
    painter.fill({ x: r.x, y, w: r.w, h: 1 }, scale(stone, 1.35));
    painter.fill({ x: r.x, y: y + h - 1, w: r.w, h: 1 }, scale(stone, 0.55));
    index += 1;
  }
  const cheek = Math.max(1, Math.round(unit));
  painter.fill({ x: r.x, y: r.y, w: cheek, h: r.h }, scale(stone, 0.62));
  painter.fill({ x: r.x + r.w - cheek, y: r.y, w: cheek, h: r.h }, scale(stone, 0.62));
}
