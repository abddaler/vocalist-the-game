import type { Rect } from '@ui/widgets/Hotspots';
import type { Painter } from '@ui/widgets/Painter';

/** Устойчивый хеш строки: свет в окнах должен быть одинаков между кадрами. */
function hash(text: string, salt: number): number {
  let value = 0x811c9dc5 ^ salt;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 0x01000193);
  }
  return (value >>> 0) / 0x100000000;
}

export function shade(color: number, factor: number): number {
  const r = Math.min(255, Math.round(((color >> 16) & 0xff) * factor));
  const g = Math.min(255, Math.round(((color >> 8) & 0xff) * factor));
  const b = Math.min(255, Math.round((color & 0xff) * factor));
  return (r << 16) | (g << 8) | b;
}

const WINDOW_LIT = [0xf0c874, 0xe8a75c, 0xd9d06a];

const overlapsRect = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/**
 * Фасад ночного дома: цоколь, ряды окон, часть которых горит, и полоса
 * вывески под крышей. Свет в окнах детерминирован по адресу дома —
 * иначе он мерцал бы на каждой перерисовке.
 */
export function facade(
  painter: Painter,
  rect: Rect,
  color: number,
  nameKey: string,
  reserved: readonly Rect[],
): void {
  // Полоса вывески и тёмный цоколь задают дому верх и низ.
  painter.fill({ x: rect.x, y: rect.y, w: rect.w, h: 3 }, shade(color, 1.55));
  painter.fill({ x: rect.x, y: rect.y + rect.h - 5, w: rect.w, h: 5 }, shade(color, 0.55));

  const cols = Math.max(2, Math.floor((rect.w - 10) / 18));
  const rows = Math.max(1, Math.floor((rect.h - 26) / 16));
  const stepX = (rect.w - 10) / cols;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = Math.round(rect.x + 5 + col * stepX + stepX / 2 - 5);
      const y = rect.y + 10 + row * 16;
      // Окно не рисуем там, где вывеска или дверной проём.
      const box = { x, y, w: 10, h: 8 };
      if (reserved.some((area) => overlapsRect(area, box))) continue;

      const roll = hash(`${nameKey}:${row}:${col}`, 7);
      const lit = roll > 0.45;
      painter.fill(
        box,
        lit ? (WINDOW_LIT[Math.floor(roll * WINDOW_LIT.length) % WINDOW_LIT.length] as number) : shade(color, 0.4),
      );
      if (lit) {
        // Свет из окна ложится на стену: без этого окна выглядят наклейками.
        painter.fill({ x: x - 1, y: y + 8, w: 12, h: 2 }, shade(color, 1.35), 0.5);
      }
    }
  }
}
