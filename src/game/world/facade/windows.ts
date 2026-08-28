import { hash, overlaps } from './kit';
import type { Facade, Part } from './kit';
import { mix, scale } from '../ambience';

/**
 * Окна верхних этажей. Их рисунок — половина того, чем дом отличается от
 * дома: у конторы сплошное остекление, у виллы арки, у склада узкие щели
 * под крышей, у клуба окон нет вовсе.
 */
const LIT = [0xffe0a0, 0xffc478, 0xf0e08a, 0xa8d8f0];

/** Стекло: горит вечером, днём отражает небо. */
function glass(f: Facade, roll: number): number {
  const lit = f.ambience.lampsOn && roll > 0.42;
  return lit
    ? LIT[Math.floor(roll * 977) % LIT.length]!
    : mix(scale(f.color, f.ambience.light * 0.45), f.ambience.skyMid, 0.4);
}

/** Ряды и колонки окон по площади стены. */
function lattice(f: Facade, draw: (x: number, y: number, w: number, h: number, roll: number) => void): void {
  const top = f.rect.y + 8;
  const bottom = f.rect.y + f.rect.h - f.groundH - 4;
  const bays = Math.max(2, Math.round(f.rect.w / 34));
  const bayW = f.rect.w / bays;
  const rows = Math.max(1, Math.floor((bottom - top) / 15));

  for (let row = 0; row < rows; row += 1) {
    for (let bay = 0; bay < bays; bay += 1) {
      const w = Math.min(12, Math.round(bayW) - 8);
      if (w < 5) continue;
      const x = Math.round(f.rect.x + bay * bayW + (bayW - w) / 2);
      const y = top + row * 15;
      if (f.reserved.some((area) => overlaps(area, { x: x - 2, y: y - 2, w: w + 4, h: 13 }))) continue;
      draw(x, y, w, 9, hash(`${f.seed}:${row}:${bay}`, 7));
    }
  }
}

/** Обычное окно: рама, переплёт и отсвет на стене, когда горит. */
function pane(f: Facade, x: number, y: number, w: number, h: number, roll: number): void {
  const color = glass(f, roll);
  f.painter.fill({ x: x - 2, y: y - 2, w: w + 4, h: h + 4 }, scale(f.wall, 0.72));
  f.painter.fill({ x: x - 2, y: y - 2, w: w + 4, h: 1 }, scale(f.wall, 1.2));
  f.painter.fill({ x, y, w, h }, color);
  f.painter.fill({ x, y: y + 4, w, h: 1 }, scale(color, 0.72));
  f.painter.fill({ x: x + Math.floor(w / 2), y, w: 1, h }, scale(color, 0.75));
  if (f.ambience.lampsOn && roll > 0.42) {
    f.painter.fill({ x: x - 3, y: y + h, w: w + 6, h: 4 }, color, 0.22);
  }
}

export const grid: Part = (f) => lattice(f, (x, y, w, h, roll) => pane(f, x, y, w, h, roll));

/** С балконом через этаж: жилой дом узнают по решёткам. */
export const balcony: Part = (f) => {
  let row = 0;
  lattice(f, (x, y, w, h, roll) => {
    pane(f, x, y, w, h, roll);
    if (row % 2 === 1) {
      f.painter.fill({ x: x - 4, y: y + h + 2, w: w + 8, h: 1 }, scale(f.wall, 1.35));
      for (let i = 0; i <= w + 6; i += 3) {
        f.painter.fill({ x: x - 3 + i, y: y + h + 2, w: 1, h: 4 }, scale(f.wall, 1.15));
      }
    }
    row = (x + w > f.rect.x + f.rect.w - 24 ? row + 1 : row);
  });
};

/** Тёплые окна: у ресторана свет горит и днём. */
export const warm: Part = (f) =>
  lattice(f, (x, y, w, h, roll) => {
    f.painter.fill({ x: x - 2, y: y - 2, w: w + 4, h: h + 4 }, scale(f.wall, 0.72));
    f.painter.fill({ x, y, w, h }, f.ambience.lampsOn ? 0xffd9a0 : mix(0xffe8c0, f.ambience.skyMid, 0.3));
    f.painter.fill({ x, y: y + 4, w, h: 1 }, 0x8a6a44);
    void roll;
  });

/** Арочные окна: верхний край скруглён на пиксель. */
export const arched: Part = (f) =>
  lattice(f, (x, y, w, h, roll) => {
    const color = glass(f, roll);
    f.painter.fill({ x: x - 2, y: y - 1, w: w + 4, h: h + 3 }, scale(f.wall, 0.7));
    f.painter.fill({ x: x - 1, y: y - 3, w: w + 2, h: 3 }, scale(f.wall, 0.7));
    f.painter.fill({ x, y, w, h }, color);
    f.painter.fill({ x: x + 1, y: y - 2, w: w - 2, h: 2 }, color);
    f.painter.fill({ x: x + Math.floor(w / 2), y: y - 2, w: 1, h: h + 2 }, scale(color, 0.75));
  });

/** Ленточное остекление: спортзал и закусочная — одна длинная витрина. */
export const strip: Part = (f) => {
  const y = f.rect.y + 10;
  const h = Math.max(8, f.rect.h - f.groundH - 20);
  const rect = { x: f.rect.x + 5, y, w: f.rect.w - 10, h };
  const color = glass(f, 0.9);
  f.painter.fill({ x: rect.x - 1, y: rect.y - 1, w: rect.w + 2, h: rect.h + 2 }, scale(f.wall, 0.7));
  f.painter.fill(rect, color);
  for (let x = rect.x + 10; x < rect.x + rect.w; x += 11) {
    f.painter.fill({ x, y: rect.y, w: 1, h: rect.h }, scale(f.wall, 0.8));
  }
  f.painter.fill({ x: rect.x, y: rect.y + Math.round(rect.h / 2), w: rect.w, h: 1 }, scale(color, 0.7));
};

/** Стеклянная стена конторы: сетка без простенков. */
export const curtain: Part = (f) => {
  const rect = { x: f.rect.x + 3, y: f.rect.y + 7, w: f.rect.w - 6, h: f.rect.h - f.groundH - 12 };
  f.painter.fill(rect, glass(f, 0.8));
  for (let x = rect.x; x < rect.x + rect.w; x += 9) {
    f.painter.fill({ x, y: rect.y, w: 1, h: rect.h }, scale(f.wall, 0.85));
  }
  for (let y = rect.y; y < rect.y + rect.h; y += 8) {
    const roll = hash(`${f.seed}:${y}`, 11);
    f.painter.fill({ x: rect.x, y, w: rect.w, h: 1 }, scale(f.wall, 0.7));
    if (f.ambience.lampsOn && roll > 0.55) {
      f.painter.fill({ x: rect.x + 1, y: y + 1, w: rect.w - 2, h: 6 }, 0xffe0a0, 0.5);
    }
  }
};

/** Щели под крышей: склад, рынок, сарай. */
export const high: Part = (f) => {
  const y = f.rect.y + 9;
  const count = Math.max(2, Math.floor(f.rect.w / 26));
  for (let i = 0; i < count; i += 1) {
    const x = Math.round(f.rect.x + 8 + (i * (f.rect.w - 16)) / count);
    f.painter.fill({ x: x - 1, y: y - 1, w: 16, h: 8 }, scale(f.wall, 0.7));
    f.painter.fill({ x, y, w: 14, h: 6 }, glass(f, hash(`${f.seed}:h${i}`, 5)));
    f.painter.fill({ x: x + 6, y, w: 1, h: 6 }, scale(f.wall, 0.75));
  }
};

/** Жалюзи: бар не показывает, что внутри. */
export const blinds: Part = (f) =>
  lattice(f, (x, y, w, h) => {
    f.painter.fill({ x: x - 2, y: y - 2, w: w + 4, h: h + 4 }, scale(f.wall, 0.7));
    for (let i = 0; i < h; i += 2) {
      f.painter.fill({ x, y: y + i, w, h: 1 }, scale(f.wall, i % 4 === 0 ? 0.5 : 0.9));
    }
  });

/** Глухая стена: у клуба и студии записи окон нет. */
export const blank: Part = (f) => {
  const top = f.rect.y + 6;
  const bottom = f.rect.y + f.rect.h - f.groundH - 4;
  for (let y = top; y < bottom; y += 6) {
    f.painter.fill({ x: f.rect.x + 2, y, w: f.rect.w - 4, h: 1 }, scale(f.wall, 0.9), 0.5);
  }
};

export const WINDOWS = { grid, balcony, warm, arched, strip, curtain, high, blinds, blank };
export type WindowKind = keyof typeof WINDOWS;
