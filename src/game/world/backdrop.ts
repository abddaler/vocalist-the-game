import type { DistrictId } from '@core/types';
import type { Rect } from '@ui/widgets/Hotspots';
import type { Painter } from '@ui/widgets/Painter';
import { mix, scale } from './ambience';
import type { Ambience } from './ambience';

/** Ряды в растяжке неба. Больше не нужно: полоса всего 38 пикселей. */
const SKY_BANDS = 10;

/**
 * Небо, дальний план и мостовая. Дальний план едет медленнее домов —
 * от этого улица получает глубину, которой у плоских прямоугольников
 * не было.
 */
export interface Backdrop {
  /** Полоса неба в экранных координатах. */
  readonly sky: Rect;
  /** Полоса мостовой между рядами домов. */
  readonly road: Rect;
  /** Сдвиг камеры: нужен дальнему плану. */
  readonly cameraX: number;
  readonly worldWidth: number;
}

export function drawSky(painter: Painter, area: Backdrop, ambience: Ambience): void {
  const { sky } = area;
  const step = sky.h / SKY_BANDS;

  for (let i = 0; i < SKY_BANDS; i += 1) {
    const t = i / (SKY_BANDS - 1);
    // Две растяжки подряд: верх неба к середине, середина к горизонту.
    const color =
      t < 0.5
        ? mix(ambience.skyHigh, ambience.skyMid, t * 2)
        : mix(ambience.skyMid, ambience.skyLow, (t - 0.5) * 2);
    painter.fill(
      { x: sky.x, y: Math.round(sky.y + i * step), w: sky.w, h: Math.ceil(step) + 1 },
      color,
    );
  }

  if (ambience.disc !== null) {
    // Светило висит на месте: оно бесконечно далеко и параллаксу не подчиняется.
    const cx = Math.round(sky.x + sky.w * 0.74);
    const cy = sky.y + ambience.discY;
    painter.fill({ x: cx - 6, y: cy - 4, w: 12, h: 8 }, ambience.disc, 0.35);
    painter.fill({ x: cx - 4, y: cy - 3, w: 8, h: 6 }, ambience.disc);
    painter.fill({ x: cx - 3, y: cy - 4, w: 6, h: 8 }, ambience.disc);
  }
}

/**
 * Силуэт за домами, в два плана. Дальний идёт медленнее и растворён в
 * небе, ближний темнее и быстрее — этой разницы хватает, чтобы за
 * крышами читалось расстояние, а не наклейка.
 */
export function drawFarSide(
  painter: Painter,
  area: Backdrop,
  ambience: Ambience,
  district: DistrictId,
): void {
  const { sky } = area;
  const base = sky.y + sky.h;

  const plan = (parallax: number, haze: number, offset: number, depth: number): Silhouette => {
    const color = scale(mix(ambience.far, ambience.skyLow, haze), depth);
    const shift = -area.cameraX * parallax + offset;
    return {
      bar: (x, w, h) => {
        const left = Math.round(sky.x + x + shift);
        if (left > sky.x + sky.w || left + w < sky.x) return;
        painter.fill({ x: left, y: base - h, w, h }, color);
      },
      mound: (x, w, h) => {
        // Склон ступеньками: диагональ на этом разрешении всё равно
        // разложится в лесенку, так пусть она будет ровной.
        const steps = 4;
        for (let i = 0; i < steps; i += 1) {
          const inset = Math.round((w / 2) * (i / steps) * 0.7);
          const left = Math.round(sky.x + x + inset + shift);
          const width = w - inset * 2;
          if (width <= 0 || left > sky.x + sky.w || left + width < sky.x) continue;
          const top = base - Math.round((h * (i + 1)) / steps);
          painter.fill({ x: left, y: top, w: width, h: base - top }, color);
        }
      },
    };
  };

  SKYLINE[district](plan(0.2, 0.6, 0, 1), plan(0.42, 0.1, 30, 0.72));
}

interface Silhouette {
  readonly bar: (x: number, w: number, h: number) => void;
  readonly mound: (x: number, w: number, h: number) => void;
}

/**
 * Что стоит за крышами каждого района. Дальний план — общий контур,
 * ближний — то, что можно узнать: гряда холмов, башни, вывески, краны.
 */
const SKYLINE: Readonly<Record<DistrictId, (far: Silhouette, near: Silhouette) => void>> = {
  hills: (far, near) => {
    for (let i = 0; i < 14; i += 1) far.mound(i * 96 - 60, 130, 22 + ((i * 7) % 4) * 5);
    for (let i = 0; i < 12; i += 1) {
      const x = i * 118 - 40;
      near.mound(x, 96, 14 + ((i * 5) % 3) * 6);
      // Редкие домики на склоне: холмы обжитые, а не заповедник.
      if (i % 2 === 0) near.bar(x + 44, 7, 20 + ((i * 3) % 3) * 3);
    }
  },
  downtown: (far, near) => {
    for (let i = 0; i < 20; i += 1) far.bar(i * 42 - 30, 30, 12 + ((i * 13) % 6) * 4);
    for (let i = 0; i < 16; i += 1) {
      const x = i * 54 - 20;
      const h = 16 + ((i * 11) % 7) * 4;
      near.bar(x, 24, h);
      if (i % 3 === 0) near.bar(x + 9, 6, h + 10);
    }
  },
  boulevard: (far, near) => {
    for (let i = 0; i < 16; i += 1) far.bar(i * 56 - 20, 44, 12 + ((i * 5) % 4) * 4);
    for (let i = 0; i < 12; i += 1) {
      const x = i * 72 - 30;
      near.bar(x, 46, 14 + ((i * 7) % 3) * 5);
      // Мачта с вывеской над крышей — примета бульвара.
      if (i % 3 === 1) {
        near.bar(x + 20, 3, 30);
        near.bar(x + 12, 18, 8);
      }
    }
  },
  pier: (far, near) => {
    for (let i = 0; i < 12; i += 1) far.bar(i * 70 - 20, 58, 10 + ((i * 3) % 3) * 4);
    for (let i = 0; i < 9; i += 1) {
      const x = i * 96 - 20;
      near.bar(x, 66, 12);
      // Портовый кран: мачта, длинная стрела и трос с крюком.
      near.bar(x + 30, 4, 34);
      near.bar(x + 8, 44, 3);
      near.bar(x + 12, 3, 26);
    }
  },
};

/**
 * Мостовая: тротуары по краям, проезжая часть посередине и разметка.
 * Три полосы вместо одной заливки — это разница между «дорога» и
 * «серый прямоугольник».
 */
export function drawGround(painter: Painter, area: Backdrop, ambience: Ambience): void {
  const { road } = area;
  const walkH = Math.round(road.h * 0.3);
  const asphaltY = road.y + walkH;
  const asphaltH = road.h - walkH * 2;

  painter.fill(road, ambience.pavement);
  painter.fill({ x: road.x, y: asphaltY, w: road.w, h: asphaltH }, ambience.asphalt);
  // Бордюр — светлая нитка на границе: без неё тротуар не отделяется.
  painter.fill({ x: road.x, y: asphaltY - 1, w: road.w, h: 1 }, ambience.kerb);
  painter.fill({ x: road.x, y: asphaltY + asphaltH, w: road.w, h: 1 }, ambience.kerb);

  const middle = Math.round(asphaltY + asphaltH / 2);
  const dash = 10;
  const gap = 14;
  const start = Math.floor(area.cameraX / (dash + gap)) * (dash + gap) - area.cameraX;
  for (let x = start; x < road.w; x += dash + gap) {
    painter.fill(
      { x: road.x + Math.round(x), y: middle, w: dash, h: 1 },
      scale(ambience.kerb, 0.9),
      0.7,
    );
  }
}

/**
 * Общий тон поверх готовой улицы. Кладётся последним, поверх домов,
 * людей и мелочи: это свет, а не фон, и он должен коснуться всего.
 */
export function drawWash(painter: Painter, area: Rect, ambience: Ambience): void {
  if (ambience.washAlpha <= 0) return;
  painter.fill(area, ambience.wash, ambience.washAlpha);
}

/** Тень под предметом: овал ей не по карману, полоска работает не хуже. */
export function drawShadow(
  painter: Painter,
  x: number,
  y: number,
  width: number,
  ambience: Ambience,
): void {
  if (ambience.shadow <= 0) return;
  painter.fill(
    { x: Math.round(x - width / 2), y: Math.round(y) - 1, w: width, h: 2 },
    0x000000,
    ambience.shadow,
  );
}
