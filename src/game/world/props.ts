import type { PropKind } from '@core/types';
import type { Rect } from '@ui/widgets/Hotspots';
import type { Painter } from '@ui/widgets/Painter';
import { shade } from './facade';

/**
 * Мебель и оборудование. Рисуется параметрически по прямоугольнику точки,
 * а не готовым спрайтом: точки разного размера, и одна картинка на всех
 * либо растянулась бы, либо не заполнила место.
 *
 * Цвет предмета задан в данных, остальные тона выводятся из него — так
 * комната остаётся в своей гамме, а предметы всё равно читаются.
 */
const WOOD = 0x6b4f34;
const METAL = 0x8a94a8;
const GLASS = 0x9fc6d8;
const WARM = 0xf0c874;

export function drawProp(
  painter: Painter,
  kind: PropKind,
  rect: Rect,
  color: number,
  active: boolean,
): void {
  const light = shade(color, 1.35);
  const dark = shade(color, 0.6);

  switch (kind) {
    case 'bed':
      return bed(painter, rect, color, light, dark);
    case 'mirror':
      return mirror(painter, rect, light, dark, active);
    case 'kitchen':
      return kitchen(painter, rect, color, light, dark);
    case 'sofa':
      return sofa(painter, rect, color, light, dark);
    case 'piano':
      return piano(painter, rect, dark);
    case 'mic':
      return mic(painter, rect, active);
    case 'drums':
      return drums(painter, rect, color, light);
    case 'stage':
      return stage(painter, rect, color, light, dark, active);
    case 'bar':
      return bar(painter, rect, color, light, dark);
    case 'booth':
      return booth(painter, rect, dark, active);
    case 'console':
      return consoleDesk(painter, rect, dark, active);
    case 'rack':
      return rack(painter, rect, color, light);
    case 'curtain':
      return curtain(painter, rect, color, light, dark);
    case 'chair':
      return chair(painter, rect, color, light, dark);
    case 'treadmill':
      return treadmill(painter, rect, dark);
    case 'stairs':
      return stairs(painter, rect, dark);
    case 'board':
      return board(painter, rect, dark);
  }
}

const box = (painter: Painter, rect: Rect, fill: number, top?: number): void => {
  painter.fill(rect, fill);
  if (top !== undefined) painter.fill({ ...rect, h: 2 }, top);
};

function bed(painter: Painter, r: Rect, color: number, light: number, dark: number): void {
  box(painter, r, color, light);
  // Подушка у изголовья и откинутое одеяло — иначе это просто ящик.
  painter.fill({ x: r.x + 2, y: r.y + 3, w: 12, h: r.h - 8 }, 0xe4e0d6);
  painter.fill({ x: r.x + 16, y: r.y + 2, w: r.w - 18, h: r.h - 4 }, dark);
  painter.fill({ x: r.x + 16, y: r.y + 2, w: r.w - 18, h: 3 }, light);
}

function mirror(painter: Painter, r: Rect, light: number, dark: number, active: boolean): void {
  box(painter, r, dark);
  painter.fill({ x: r.x + 2, y: r.y + 2, w: r.w - 4, h: r.h - 6 }, active ? GLASS : light);
  painter.fill({ x: r.x + 3, y: r.y + 3, w: 3, h: r.h - 12 }, 0xffffff, 0.5);
  painter.fill({ x: r.x + r.w / 2 - 4, y: r.y + r.h - 4, w: 8, h: 4 }, dark);
}

function kitchen(painter: Painter, r: Rect, color: number, light: number, dark: number): void {
  box(painter, r, color, light);
  for (let i = 0; i < 3; i += 1) {
    painter.fill({ x: r.x + 3 + i * ((r.w - 6) / 3), y: r.y + 8, w: (r.w - 10) / 3, h: r.h - 12 }, dark);
  }
  painter.fill({ x: r.x + r.w - 12, y: r.y - 6, w: 8, h: 8 }, METAL);
}

function sofa(painter: Painter, r: Rect, color: number, light: number, dark: number): void {
  painter.fill({ x: r.x, y: r.y, w: r.w, h: r.h - 6 }, dark);
  painter.fill({ x: r.x + 4, y: r.y + 5, w: r.w - 8, h: r.h - 10 }, color);
  painter.fill({ x: r.x + 6, y: r.y + 6, w: (r.w - 16) / 2, h: r.h - 14 }, light);
  painter.fill({ x: r.x + r.w / 2 + 2, y: r.y + 6, w: (r.w - 16) / 2, h: r.h - 14 }, light);
  painter.fill({ x: r.x + 2, y: r.y + r.h - 6, w: 4, h: 6 }, WOOD);
  painter.fill({ x: r.x + r.w - 6, y: r.y + r.h - 6, w: 4, h: 6 }, WOOD);
}

function piano(painter: Painter, r: Rect, dark: number): void {
  painter.fill({ x: r.x, y: r.y + 4, w: r.w, h: r.h - 4 }, 0x241f27);
  painter.fill({ x: r.x + 1, y: r.y + 4, w: r.w - 2, h: 2 }, dark);
  // Клавиатура: белые с чёрными — по ней инструмент и опознают.
  const keys = { x: r.x + 2, y: r.y + r.h - 9, w: r.w - 4, h: 7 };
  painter.fill(keys, 0xe8e4dc);
  const count = Math.max(3, Math.floor(keys.w / 5));
  for (let i = 1; i < count; i += 1) {
    painter.fill({ x: keys.x + Math.round((i * keys.w) / count), y: keys.y, w: 1, h: keys.h }, 0x8a8880);
    if (i % 3 !== 0) {
      painter.fill(
        { x: keys.x + Math.round((i * keys.w) / count) - 1, y: keys.y, w: 2, h: 4 },
        0x1c1a20,
      );
    }
  }
}

function mic(painter: Painter, r: Rect, active: boolean): void {
  const cx = r.x + Math.round(r.w / 2);
  painter.fill({ x: cx - 5, y: r.y + r.h - 3, w: 10, h: 3 }, 0x2b2f3a);
  painter.fill({ x: cx - 1, y: r.y + 5, w: 2, h: r.h - 8 }, METAL);
  painter.fill({ x: cx - 3, y: r.y, w: 6, h: 6 }, active ? WARM : 0xd0d6e0);
  painter.fill({ x: cx - 2, y: r.y + 1, w: 4, h: 2 }, 0x3a3f4d);
}

function drums(painter: Painter, r: Rect, color: number, light: number): void {
  painter.fill({ x: r.x + 6, y: r.y + r.h - 20, w: 20, h: 20 }, color);
  painter.fill({ x: r.x + 9, y: r.y + r.h - 17, w: 14, h: 14 }, light);
  painter.fill({ x: r.x + 28, y: r.y + r.h - 14, w: 12, h: 12 }, color);
  painter.fill({ x: r.x + 42, y: r.y + r.h - 12, w: 10, h: 10 }, color);
  // Тарелка на стойке.
  painter.fill({ x: r.x + 34, y: r.y + 2, w: 18, h: 2 }, WARM);
  painter.fill({ x: r.x + 42, y: r.y + 4, w: 1, h: r.h - 14 }, METAL);
}

function stage(painter: Painter, r: Rect, color: number, light: number, dark: number, active: boolean): void {
  painter.fill({ x: r.x, y: r.y, w: r.w, h: r.h - 8 }, dark);
  painter.fill({ x: r.x, y: r.y + r.h - 8, w: r.w, h: 8 }, color);
  painter.fill({ x: r.x, y: r.y + r.h - 8, w: r.w, h: 2 }, light);
  // Два прожектора: конус света и делает сцену сценой.
  for (const x of [r.x + 8, r.x + r.w - 12]) {
    painter.fill({ x, y: r.y + 1, w: 4, h: 3 }, METAL);
    painter.fill({ x: x - 2, y: r.y + 4, w: 8, h: r.h - 12 }, active ? WARM : light, 0.28);
  }
  mic(painter, { x: r.x + r.w / 2 - 6, y: r.y + r.h - 22, w: 12, h: 16 }, active);
}

function bar(painter: Painter, r: Rect, color: number, light: number, dark: number): void {
  painter.fill({ x: r.x, y: r.y + 4, w: r.w, h: r.h - 4 }, color);
  painter.fill({ x: r.x, y: r.y + 4, w: r.w, h: 3 }, light);
  for (let i = 0; i < Math.floor(r.w / 8); i += 1) {
    const x = r.x + 4 + i * 8;
    painter.fill({ x, y: r.y, w: 3, h: 5 }, i % 2 === 0 ? WARM : GLASS);
  }
  painter.fill({ x: r.x + 2, y: r.y + r.h - 3, w: r.w - 4, h: 3 }, dark);
}

function booth(painter: Painter, r: Rect, dark: number, active: boolean): void {
  painter.fill(r, dark);
  painter.fill({ x: r.x + 3, y: r.y + 3, w: r.w - 6, h: r.h - 10 }, GLASS, 0.35);
  painter.stroke({ x: r.x + 3, y: r.y + 3, w: r.w - 6, h: r.h - 10 }, GLASS);
  mic(painter, { x: r.x + r.w / 2 - 6, y: r.y + 6, w: 12, h: r.h - 14 }, active);
}

function consoleDesk(painter: Painter, r: Rect, dark: number, active: boolean): void {
  painter.fill(r, dark);
  painter.fill({ x: r.x + 3, y: r.y + 2, w: r.w - 6, h: 8 }, active ? 0x2a4a5a : 0x1e2a32);
  // Ряд фейдеров.
  for (let i = 0; i < Math.floor((r.w - 8) / 6); i += 1) {
    const x = r.x + 5 + i * 6;
    painter.fill({ x, y: r.y + 12, w: 2, h: r.h - 16 }, 0x3a4050);
    painter.fill({ x: x - 1, y: r.y + 13 + ((i * 5) % (r.h - 20)), w: 4, h: 2 }, WARM);
  }
}

function rack(painter: Painter, r: Rect, color: number, light: number): void {
  painter.fill({ x: r.x, y: r.y + 3, w: r.w, h: 2 }, METAL);
  painter.fill({ x: r.x + 2, y: r.y, w: 2, h: 4 }, METAL);
  painter.fill({ x: r.x + r.w - 4, y: r.y, w: 2, h: 4 }, METAL);
  for (let i = 0; i < Math.floor(r.w / 9); i += 1) {
    const x = r.x + 3 + i * 9;
    painter.fill({ x, y: r.y + 5, w: 7, h: r.h - 8 }, i % 2 === 0 ? color : light);
  }
}

function curtain(painter: Painter, r: Rect, color: number, light: number, dark: number): void {
  painter.fill({ x: r.x, y: r.y, w: r.w, h: 3 }, METAL);
  for (let i = 0; i < Math.floor(r.w / 5); i += 1) {
    painter.fill({ x: r.x + i * 5, y: r.y + 3, w: 4, h: r.h - 3 }, i % 2 === 0 ? color : dark);
  }
  painter.fill({ x: r.x, y: r.y + 3, w: 2, h: r.h - 3 }, light);
}

function chair(painter: Painter, r: Rect, color: number, light: number, dark: number): void {
  painter.fill({ x: r.x + 4, y: r.y + 6, w: r.w - 8, h: r.h - 10 }, color);
  painter.fill({ x: r.x + 4, y: r.y + 6, w: r.w - 8, h: 3 }, light);
  painter.fill({ x: r.x + 2, y: r.y + r.h - 4, w: r.w - 4, h: 4 }, dark);
  // Лампа осмотра на кронштейне.
  painter.fill({ x: r.x + r.w - 8, y: r.y, w: 2, h: 8 }, METAL);
  painter.fill({ x: r.x + r.w - 12, y: r.y - 2, w: 10, h: 4 }, WARM);
}

function treadmill(painter: Painter, r: Rect, dark: number): void {
  painter.fill({ x: r.x, y: r.y + r.h - 8, w: r.w, h: 8 }, dark);
  painter.fill({ x: r.x + 3, y: r.y + r.h - 6, w: r.w - 6, h: 4 }, 0x1c1a20);
  painter.fill({ x: r.x + 4, y: r.y + 2, w: 2, h: r.h - 10 }, METAL);
  painter.fill({ x: r.x + 4, y: r.y, w: 16, h: 3 }, METAL);
  painter.fill({ x: r.x + 8, y: r.y + 4, w: 10, h: 6 }, 0x2a3038);
}

function stairs(painter: Painter, r: Rect, dark: number): void {
  const steps = 4;
  for (let i = 0; i < steps; i += 1) {
    const h = Math.round(r.h / steps);
    painter.fill(
      { x: r.x + i * 2, y: r.y + i * h, w: r.w - i * 4, h },
      shade(dark, 1 - i * 0.16),
    );
  }
}

function board(painter: Painter, r: Rect, dark: number): void {
  painter.fill({ x: r.x + r.w / 2 - 1, y: r.y + r.h - 8, w: 2, h: 8 }, WOOD);
  painter.fill({ x: r.x, y: r.y, w: r.w, h: r.h - 7 }, dark);
  for (let i = 0; i < 3; i += 1) {
    painter.fill({ x: r.x + 2 + (i % 2) * 12, y: r.y + 2 + i * 5, w: 9, h: 4 }, 0xd8d2c4);
  }
}
