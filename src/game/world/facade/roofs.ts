import { fill, glow, hash } from './kit';
import type { Facade, Part } from './kit';
import { scale } from '../ambience';

/**
 * Крыша. Ровная линия крыш читается как забор, поэтому у каждого рода
 * дома над карнизом что-то своё: баки на жилом, черепица на вилле, пила
 * на складе, флаги над отелем, неоновый венец над клубом.
 */
const METAL = 0x9aa0ac;

/** Точки вдоль крыши, по которым расставляется мелочь. */
function along(f: Facade, step: number, draw: (x: number, roll: number) => void): void {
  const count = Math.max(1, Math.floor(f.rect.w / step));
  for (let i = 0; i < count; i += 1) {
    draw(Math.round(f.rect.x + 8 + (i * (f.rect.w - 16)) / count), hash(`${f.seed}:roof:${i}`, 19));
  }
}

export const tanks: Part = (f) => {
  const metal = scale(METAL, f.ambience.light);
  along(f, 34, (x, roll) => {
    if (roll < 0.34) {
      f.painter.fill({ x, y: f.rect.y - 9, w: 1, h: 9 }, metal);
      f.painter.fill({ x: x - 2, y: f.rect.y - 9, w: 5, h: 1 }, metal);
      f.painter.fill({ x: x - 1, y: f.rect.y - 6, w: 3, h: 1 }, metal);
    } else if (roll < 0.68) {
      f.painter.fill({ x, y: f.rect.y - 6, w: 9, h: 6 }, metal);
      f.painter.fill({ x: x + 1, y: f.rect.y - 5, w: 7, h: 1 }, scale(metal, 0.7));
      f.painter.fill({ x: x + 1, y: f.rect.y - 3, w: 7, h: 1 }, scale(metal, 0.7));
    } else {
      f.painter.fill({ x, y: f.rect.y - 7, w: 11, h: 7 }, scale(f.wall, 1.15));
      f.painter.fill({ x, y: f.rect.y - 7, w: 11, h: 1 }, scale(f.wall, 1.45));
    }
  });
};

export const ac: Part = (f) =>
  along(f, 40, (x, roll) => {
    const metal = scale(METAL, f.ambience.light);
    if (roll < 0.5) {
      f.painter.fill({ x, y: f.rect.y - 6, w: 10, h: 6 }, metal);
      f.painter.fill({ x: x + 1, y: f.rect.y - 5, w: 8, h: 1 }, scale(metal, 0.7));
      f.painter.fill({ x: x + 1, y: f.rect.y - 3, w: 8, h: 1 }, scale(metal, 0.7));
    } else {
      f.painter.fill({ x, y: f.rect.y - 4, w: 1, h: 4 }, metal);
      f.painter.fill({ x: x - 2, y: f.rect.y - 4, w: 5, h: 1 }, metal);
    }
  });

/** Неоновый венец: клуб, кинотеатр, закусочная. */
export const neon: Part = (f) => {
  const tube = glow(f, 0xff5fc8);
  fill(f, 0, -3, f.rect.w, 3, scale(f.wall, 1.2));
  fill(f, 2, -2, f.rect.w - 4, 1, tube);
  if (f.ambience.lampsOn) fill(f, -2, -6, f.rect.w + 4, 8, tube, 0.16);
  along(f, 26, (x) => {
    f.painter.fill({ x, y: f.rect.y - 7, w: 2, h: 4 }, tube);
    if (f.ambience.lampsOn) f.painter.fill({ x: x - 2, y: f.rect.y - 9, w: 6, h: 8 }, tube, 0.2);
  });
};

export const chimney: Part = (f) =>
  along(f, 46, (x, roll) => {
    if (roll < 0.5) return;
    f.painter.fill({ x, y: f.rect.y - 10, w: 7, h: 10 }, scale(f.wall, 0.85));
    f.painter.fill({ x: x - 1, y: f.rect.y - 12, w: 9, h: 2 }, scale(f.wall, 1.1));
  });

export const dish: Part = (f) => {
  const metal = scale(METAL, f.ambience.light);
  const x = Math.round(f.rect.x + f.rect.w * 0.7);
  f.painter.fill({ x, y: f.rect.y - 5, w: 1, h: 5 }, metal);
  f.painter.fill({ x: x - 5, y: f.rect.y - 11, w: 11, h: 2 }, metal);
  f.painter.fill({ x: x - 4, y: f.rect.y - 13, w: 9, h: 2 }, scale(metal, 1.2));
  f.painter.fill({ x: x - 1, y: f.rect.y - 10, w: 2, h: 5 }, scale(metal, 0.7));
  ac(f);
};

export const antenna: Part = (f) => {
  const metal = scale(METAL, f.ambience.light);
  along(f, 30, (x, roll) => {
    const h = 8 + Math.round(roll * 10);
    f.painter.fill({ x, y: f.rect.y - h, w: 1, h }, metal);
    f.painter.fill({ x: x - 2, y: f.rect.y - h, w: 5, h: 1 }, metal);
    if (f.ambience.lampsOn) f.painter.fill({ x, y: f.rect.y - h - 2, w: 1, h: 2 }, 0xff5f5f);
  });
};

export const flags: Part = (f) => {
  const pole = scale(METAL, f.ambience.light);
  const colors = [0xe85f5f, 0xe8c45f, 0x5fb8e8];
  along(f, 30, (x, roll) => {
    f.painter.fill({ x, y: f.rect.y - 14, w: 1, h: 14 }, pole);
    const color = colors[Math.floor(roll * colors.length) % colors.length]!;
    f.painter.fill({ x: x + 1, y: f.rect.y - 14, w: 7, h: 5 }, scale(color, f.ambience.light));
  });
};

/** Черепица: вилла и всё средиземноморское. */
export const tiles: Part = (f) => {
  const tile = scale(0xc4694a, f.ambience.light);
  fill(f, -3, -6, f.rect.w + 6, 6, tile);
  fill(f, -3, -6, f.rect.w + 6, 1, scale(tile, 1.3));
  fill(f, -3, -1, f.rect.w + 6, 1, scale(tile, 0.65));
  for (let x = 0; x < f.rect.w + 6; x += 5) fill(f, x - 3, -5, 1, 4, scale(tile, 0.8));
};

/** Пила: только у складов и ангаров. */
export const saw: Part = (f) => {
  const metal = scale(METAL, f.ambience.light);
  const step = 14;
  for (let x = 0; x < f.rect.w; x += step) {
    for (let i = 0; i < 6; i += 1) {
      fill(f, x + i * 2, -i - 1, step - i * 2, 1, scale(metal, 1 - i * 0.05));
    }
  }
};

/** Тростник: пляжные хижины. */
export const thatch: Part = (f) => {
  const straw = scale(0xc9a35f, f.ambience.light);
  fill(f, -4, -8, f.rect.w + 8, 8, straw);
  fill(f, -4, -8, f.rect.w + 8, 1, scale(straw, 1.3));
  for (let x = 0; x < f.rect.w + 8; x += 3) {
    fill(f, x - 4, -7, 1, 6 + ((x / 3) % 2), scale(straw, 0.78));
  }
};

export const ROOFS = { tanks, ac, neon, chimney, dish, antenna, flags, tiles, saw, thatch };
export type RoofKind = keyof typeof ROOFS;
