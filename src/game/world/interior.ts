import type { Rect } from '@ui/widgets/Hotspots';
import type { Painter } from '@ui/widgets/Painter';
import { ambienceOf, mix, scale } from './ambience';
import type { Ambience } from './ambience';
import type { Slot } from '@core/types';

/**
 * Комната: задняя стена, пол и окно. Раньше это был один прямоугольник
 * цвета локации, и любая комната читалась как площадка для мебели, а не
 * как помещение.
 *
 * Окно здесь не украшение: в нём то же небо, что на улице, и комната
 * тоже проживает сутки. Без него время суток заканчивалось на пороге.
 */
const WALL_SHARE = 0.42;

/**
 * Свет в комнате. На улице ночь гасит всё, в комнате — включают лампу,
 * поэтому яркость держится, а тон уходит в тёплый.
 */
export function interiorLight(slot: Slot): Ambience {
  const outside = ambienceOf(slot, 'hills');
  const evening = slot === 'evening' || slot === 'night';
  return {
    ...outside,
    light: evening ? 0.95 : 1.1,
    lampsOn: evening,
    shadow: 0.22,
    wash: evening ? 0xffb469 : 0xfff0d8,
    washAlpha: evening ? 0.14 : 0.05,
  };
}

export function drawRoom(
  painter: Painter,
  rect: Rect,
  floorColor: number,
  ambience: Ambience,
  slot: Slot,
): void {
  const wallH = Math.round(rect.h * WALL_SHARE);
  const wall = scale(floorColor, 1.55);
  const floor = scale(floorColor, 0.92);

  painter.fill({ x: rect.x, y: rect.y, w: rect.w, h: wallH }, wall);
  painter.fill({ x: rect.x, y: rect.y + wallH, w: rect.w, h: rect.h - wallH }, floor);

  // Обои в полоску: ровная стена не даёт глазу масштаба комнаты.
  for (let x = rect.x + 8; x < rect.x + rect.w; x += 16) {
    painter.fill({ x, y: rect.y + 2, w: 1, h: wallH - 4 }, scale(wall, 1.12), 0.6);
  }

  // Плинтус и половицы.
  painter.fill({ x: rect.x, y: rect.y + wallH - 3, w: rect.w, h: 3 }, scale(wall, 0.66));
  for (let y = rect.y + wallH + 9; y < rect.y + rect.h; y += 12) {
    painter.fill({ x: rect.x, y, w: rect.w, h: 1 }, scale(floor, 0.84));
  }

  drawWindow(painter, { x: rect.x + Math.round(rect.w * 0.66), y: rect.y + 10, w: 46, h: 30 }, ambience, slot);
  if (ambience.lampsOn) drawLamp(painter, rect);

  painter.stroke(rect, scale(wall, 0.5));
}

/** Окно с тем же небом, что снаружи: комната живёт по тем же часам. */
function drawWindow(painter: Painter, frame: Rect, ambience: Ambience, slot: Slot): void {
  const outside = ambienceOf(slot, 'hills');
  painter.fill({ x: frame.x - 2, y: frame.y - 2, w: frame.w + 4, h: frame.h + 4 }, 0x2a2620);

  const bands = 4;
  const step = frame.h / bands;
  for (let i = 0; i < bands; i += 1) {
    const t = i / (bands - 1);
    painter.fill(
      { x: frame.x, y: Math.round(frame.y + i * step), w: frame.w, h: Math.ceil(step) + 1 },
      t < 0.5 ? mix(outside.skyHigh, outside.skyMid, t * 2) : mix(outside.skyMid, outside.skyLow, (t - 0.5) * 2),
    );
  }
  // Дальние крыши в окне: без них это просто цветной квадрат.
  painter.fill(
    { x: frame.x, y: frame.y + frame.h - 8, w: frame.w, h: 8 },
    mix(outside.far, outside.skyLow, 0.3),
  );
  painter.fill({ x: frame.x + Math.round(frame.w / 2) - 1, y: frame.y, w: 2, h: frame.h }, 0x2a2620);
  painter.fill({ x: frame.x, y: frame.y + Math.round(frame.h / 2) - 1, w: frame.w, h: 2 }, 0x2a2620);

  if (ambience.lampsOn) {
    painter.fill(frame, 0x0a0c18, 0.25);
  } else {
    // Свет из окна ложится на пол — самое дешёвое, что делает комнату объёмной.
    painter.fill(
      { x: frame.x - 10, y: frame.y + frame.h + 4, w: frame.w + 20, h: 26 },
      outside.skyLow,
      0.1,
    );
  }
}

/** Лампа под потолком: вечером комната должна светиться изнутри. */
function drawLamp(painter: Painter, rect: Rect): void {
  const x = rect.x + Math.round(rect.w * 0.3);
  const y = rect.y + 4;
  painter.fill({ x, y, w: 1, h: 8 }, 0x2a2620);
  painter.fill({ x: x - 5, y: y + 8, w: 11, h: 4 }, 0x3a3228);
  painter.fill({ x: x - 4, y: y + 11, w: 9, h: 2 }, 0xffe4a8);
  // Конус света ступенями: прямоугольник читается как мутное стекло,
  // а не как свет от лампы.
  for (let i = 0; i < 6; i += 1) {
    const half = 5 + i * 4;
    painter.fill(
      { x: x - half, y: y + 13 + i * 7, w: half * 2, h: 8 },
      0xffe0a0,
      0.07,
    );
  }
}
