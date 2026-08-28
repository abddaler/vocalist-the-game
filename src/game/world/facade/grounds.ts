import { fill, glow, hash, overlaps } from './kit';
import type { Facade, Part } from './kit';
import { mix, scale } from '../ambience';

/**
 * Первый этаж — то, что видно с тротуара и по чему узнают заведение.
 * Маркиза с лампами и канат у входа означают клуб, роль-ставня — склад,
 * прилавок под навесом — рынок. Вывеска только называет; узнаёт глаз.
 */
const AWNING_COLORS = [0xd9534f, 0x4a8fd9, 0x3f9f6a, 0xd9a23f, 0xa85fc9];

/** Полоса первого этажа в координатах фасада. */
const band = (f: Facade): { y: number; h: number } => ({
  y: f.rect.h - f.groundH,
  h: f.groundH,
});

/** Витрина: тёмное стекло днём, тёплое вечером. */
function shopWindow(f: Facade, dx: number, dy: number, w: number, h: number): void {
  const inside = f.ambience.lampsOn ? 0xffdf9f : mix(scale(f.wall, 0.5), f.ambience.skyLow, 0.45);
  const rect = { x: f.rect.x + dx, y: f.rect.y + dy, w, h };
  if (f.reserved.some((area) => overlaps(area, rect))) return;
  fill(f, dx - 1, dy - 1, w + 2, h + 2, scale(f.wall, 0.6));
  fill(f, dx, dy, w, h, inside);
  fill(f, dx, dy + h - 3, w, 3, scale(inside, 0.75));
  if (f.ambience.lampsOn) fill(f, dx - 3, dy + h, w + 6, 5, inside, 0.2);
}

/** Ряд витрин во всю ширину: магазин, спортзал, аптека. */
export const display: Part = (f) => {
  const { y, h } = band(f);
  fill(f, 0, y, f.rect.w, h, scale(f.wall, 0.92));
  const count = Math.max(2, Math.round(f.rect.w / 30));
  const w = (f.rect.w - 8) / count - 4;
  for (let i = 0; i < count; i += 1) {
    shopWindow(f, 6 + i * (w + 4), y + 4, w, h - 10);
  }
  fill(f, 0, y + h - 3, f.rect.w, 3, scale(f.wall, 0.6));
};

/** Полосатая маркиза над витриной: ресторан, бар, кафе. */
export const awning: Part = (f) => {
  const { y, h } = band(f);
  display(f);
  const color = AWNING_COLORS[Math.floor(hash(f.seed, 31) * AWNING_COLORS.length) % AWNING_COLORS.length]!;
  const lit = scale(color, f.ambience.light);
  fill(f, 1, y - 5, f.rect.w - 2, 5, lit);
  // Полосы: ровное полотно читается доской.
  for (let x = 1; x < f.rect.w - 2; x += 8) fill(f, x, y - 5, 4, 5, scale(lit, 1.25));
  const teeth = Math.max(3, Math.floor(f.rect.w / 12));
  for (let i = 0; i < teeth; i += 1) {
    fill(f, 1 + (i * (f.rect.w - 2)) / teeth, y, Math.ceil((f.rect.w - 2) / teeth / 2), 2, scale(lit, 0.85));
  }
  void h;
};

/** Козырёк с лампами и канат: так выглядит вход в клуб. */
export const marquee: Part = (f) => {
  const { y, h } = band(f);
  fill(f, 0, y, f.rect.w, h, scale(f.wall, 0.8));

  const canopy = glow(f, 0xff5fc8);
  const cx = f.door ? f.door.x - f.rect.x + f.door.w / 2 : f.rect.w / 2;
  const w = Math.min(f.rect.w - 8, 56);
  fill(f, cx - w / 2, y + 2, w, 6, scale(f.wall, 1.3));
  fill(f, cx - w / 2, y + 8, w, 2, scale(f.wall, 0.6));
  for (let i = 0; i < Math.floor(w / 6); i += 1) {
    fill(f, cx - w / 2 + 3 + i * 6, y + 3, 2, 2, canopy);
    if (f.ambience.lampsOn) fill(f, cx - w / 2 + 1 + i * 6, y + 1, 6, 6, canopy, 0.22);
  }

  // Стойки с канатом по сторонам от двери.
  const post = scale(0xd8c060, f.ambience.light);
  for (const side of [-1, 1]) {
    const px = cx + side * (w / 2 + 4);
    fill(f, px - 1, y + h - 12, 2, 12, post);
    fill(f, px - 2, y + h - 14, 4, 2, scale(post, 1.2));
  }
  fill(f, cx - w / 2 - 4, y + h - 11, w + 8, 1, scale(0x9a2f4a, f.ambience.light));
  if (f.ambience.lampsOn) fill(f, cx - w / 2, y + h - 6, w, 6, canopy, 0.14);
};

/** Крыльцо со ступенями и фонарём: жилой дом. */
export const stoop: Part = (f) => {
  const { y, h } = band(f);
  fill(f, 0, y, f.rect.w, h, scale(f.wall, 0.95));
  const cx = f.door ? f.door.x - f.rect.x + f.door.w / 2 : f.rect.w / 2;
  fill(f, cx - 14, y + h - 4, 28, 4, scale(f.wall, 1.2));
  fill(f, cx - 11, y + h - 7, 22, 3, scale(f.wall, 1.3));
  fill(f, cx - 16, y + 2, 32, 3, scale(f.wall, 1.35));
  const lamp = glow(f, 0xffd9a0);
  for (const side of [-1, 1]) {
    fill(f, cx + side * 15, y + 5, 3, 4, lamp);
    if (f.ambience.lampsOn) fill(f, cx + side * 15 - 4, y + 2, 11, 12, lamp, 0.18);
  }
  shopWindow(f, 4, y + 4, 14, h - 12);
  shopWindow(f, f.rect.w - 18, y + 4, 14, h - 12);
};

/** Роль-ставня: склад, гараж, студия записи. */
export const shutter: Part = (f) => {
  const { y, h } = band(f);
  fill(f, 0, y, f.rect.w, h, scale(f.wall, 0.85));
  const cx = f.door ? f.door.x - f.rect.x + f.door.w / 2 : f.rect.w / 2;
  const w = Math.min(f.rect.w - 10, 46);
  fill(f, cx - w / 2, y + 3, w, h - 6, scale(f.wall, 0.6));
  for (let i = y + 5; i < y + h - 5; i += 3) {
    fill(f, cx - w / 2 + 2, i, w - 4, 1, scale(f.wall, 0.95));
  }
  fill(f, cx - w / 2 - 2, y + 2, w + 4, 2, scale(f.wall, 1.2));
  const lamp = glow(f, 0xff5f5f);
  fill(f, cx + w / 2 + 4, y + 5, 4, 3, lamp);
  if (f.ambience.lampsOn) fill(f, cx + w / 2 + 1, y + 2, 10, 9, lamp, 0.2);
};

/** Табличка у двери: студия, кабинет, контора. */
export const plaque: Part = (f) => {
  const { y, h } = band(f);
  fill(f, 0, y, f.rect.w, h, scale(f.wall, 0.95));
  const cx = f.door ? f.door.x - f.rect.x + f.door.w / 2 : f.rect.w / 2;
  fill(f, cx - 16, y + 2, 32, 2, scale(f.wall, 1.3));
  fill(f, cx + 14, y + 6, 8, 10, scale(f.wall, 1.25));
  fill(f, cx + 15, y + 8, 6, 1, scale(f.wall, 0.6));
  fill(f, cx + 15, y + 11, 6, 1, scale(f.wall, 0.6));
  shopWindow(f, 5, y + 4, 16, h - 12);
  shopWindow(f, f.rect.w - 21, y + 4, 16, h - 12);
};

/** Вращающаяся дверь и колонны: контора. */
export const revolving: Part = (f) => {
  const { y, h } = band(f);
  fill(f, 0, y, f.rect.w, h, scale(f.wall, 1.1));
  const cx = f.rect.w / 2;
  const glass = f.ambience.lampsOn ? 0xffe0a0 : mix(scale(f.wall, 0.5), f.ambience.skyMid, 0.5);
  fill(f, cx - 12, y + 4, 24, h - 8, glass);
  fill(f, cx - 1, y + 4, 2, h - 8, scale(f.wall, 0.7));
  fill(f, cx - 12, y + 4, 2, h - 8, scale(f.wall, 0.7));
  fill(f, cx + 10, y + 4, 2, h - 8, scale(f.wall, 0.7));
  for (const side of [-1, 1]) {
    fill(f, cx + side * 22 - 3, y + 2, 6, h - 2, scale(f.wall, 1.3));
    fill(f, cx + side * 22 - 4, y + 2, 8, 2, scale(f.wall, 1.45));
  }
};

/** Козырёк на столбах: отель. */
export const canopy: Part = (f) => {
  display(f);
  const { y } = band(f);
  const cx = f.door ? f.door.x - f.rect.x + f.door.w / 2 : f.rect.w / 2;
  const color = scale(0x9a3f4a, f.ambience.light);
  fill(f, cx - 22, y - 6, 44, 4, color);
  fill(f, cx - 22, y - 2, 44, 1, scale(color, 0.7));
  for (const side of [-1, 1]) {
    fill(f, cx + side * 20, y - 2, 2, f.groundH - 2, scale(0xd8c060, f.ambience.light));
  }
};

/** Хромированная лента и неон: закусочная. */
export const chrome: Part = (f) => {
  display(f);
  const { y } = band(f);
  const steel = scale(0xc8ccd4, f.ambience.light);
  fill(f, 0, y - 4, f.rect.w, 4, steel);
  fill(f, 0, y - 4, f.rect.w, 1, scale(steel, 1.2));
  const tube = glow(f, 0x5fd8ff);
  fill(f, 2, y - 2, f.rect.w - 4, 1, tube);
  if (f.ambience.lampsOn) fill(f, 0, y - 5, f.rect.w, 6, tube, 0.16);
};

/** Колонны и афиши: театр. */
export const columns: Part = (f) => {
  const { y, h } = band(f);
  fill(f, 0, y, f.rect.w, h, scale(f.wall, 1.05));
  const count = Math.max(2, Math.round(f.rect.w / 22));
  for (let i = 0; i <= count; i += 1) {
    const x = Math.round((i * (f.rect.w - 6)) / count) + 2;
    fill(f, x, y + 2, 4, h - 4, scale(f.wall, 1.3));
    fill(f, x - 1, y + 2, 6, 2, scale(f.wall, 1.45));
    fill(f, x - 1, y + h - 3, 6, 3, scale(f.wall, 1.15));
  }
  const poster = glow(f, 0xe8c45f);
  fill(f, 6, y + 5, 8, h - 12, poster);
  fill(f, f.rect.w - 14, y + 5, 8, h - 12, poster);
};

/** Аркада: вилла и всё южное. */
export const arches: Part = (f) => {
  const { y, h } = band(f);
  fill(f, 0, y, f.rect.w, h, scale(f.wall, 1.05));
  const count = Math.max(2, Math.round(f.rect.w / 26));
  const w = (f.rect.w - 8) / count;
  for (let i = 0; i < count; i += 1) {
    const x = 4 + i * w;
    fill(f, x + 2, y + 6, w - 6, h - 8, scale(f.wall, 0.62));
    fill(f, x + 3, y + 4, w - 8, 2, scale(f.wall, 0.62));
    fill(f, x + 5, y + 3, w - 12, 1, scale(f.wall, 0.62));
  }
  fill(f, 0, y + h - 3, f.rect.w, 3, scale(f.wall, 1.25));
};

/** Прилавок под навесом: рынок и пляжная лавка. */
export const stall: Part = (f) => {
  const { y, h } = band(f);
  fill(f, 0, y, f.rect.w, h, scale(f.wall, 0.7));
  const cloth = scale(0xe8e0d0, f.ambience.light);
  fill(f, -2, y - 6, f.rect.w + 4, 5, cloth);
  for (let x = -2; x < f.rect.w + 2; x += 8) fill(f, x, y - 6, 4, 5, scale(0xd85f5f, f.ambience.light));
  fill(f, 2, y + h - 8, f.rect.w - 4, 3, scale(0xb08a58, f.ambience.light));
  for (let i = 0; i < Math.floor(f.rect.w / 14); i += 1) {
    const x = 6 + i * 14;
    fill(f, x, y + h - 12, 5, 4, scale([0xe8705f, 0x8fc95f, 0xe8c45f][i % 3]!, f.ambience.light));
  }
  fill(f, 2, y + h - 5, f.rect.w - 4, 5, scale(f.wall, 0.55));
};

export const GROUNDS = {
  display,
  awning,
  marquee,
  stoop,
  shutter,
  plaque,
  revolving,
  canopy,
  chrome,
  columns,
  arches,
  stall,
};
export type GroundFloorKind = keyof typeof GROUNDS;
