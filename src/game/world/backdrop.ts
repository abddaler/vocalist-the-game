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
  /** Всё, что ниже неба: тротуар и проезжая часть. */
  readonly road: Rect;
  /** Граница тротуара и мостовой, в экранных координатах. */
  readonly kerbY: number;
  /** Сдвиг камеры: нужен дальнему плану. */
  readonly cameraX: number;
  readonly worldWidth: number;
  /** Во сколько раз мир крупнее экранного пикселя. */
  readonly unit: number;
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

  drawClouds(painter, area, ambience);

  if (ambience.disc !== null) {
    // Светило висит на месте: оно бесконечно далеко и параллаксу не подчиняется.
    const cx = Math.round(sky.x + sky.w * 0.74);
    const cy = sky.y + ambience.discY;
    painter.fill({ x: cx - 6, y: cy - 4, w: 12, h: 8 }, ambience.disc, 0.35);
    painter.fill({ x: cx - 4, y: cy - 3, w: 8, h: 6 }, ambience.disc);
    painter.fill({ x: cx - 3, y: cy - 4, w: 6, h: 8 }, ambience.disc);
  }
}

/** Облака: несколько полос, ползущих медленнее всего остального. */
function drawClouds(painter: Painter, area: Backdrop, ambience: Ambience): void {
  const { sky } = area;
  const color = mix(0xffffff, ambience.skyMid, ambience.lampsOn ? 0.55 : 0.15);
  const shift = -area.cameraX * 0.12;

  for (let i = 0; i < 9; i += 1) {
    const x = Math.round(sky.x + ((i * 137) % 620) + shift);
    const y = sky.y + 3 + ((i * 7) % 3) * 6;
    const w = 26 + ((i * 11) % 4) * 10;
    if (x > sky.x + sky.w || x + w < sky.x) continue;
    painter.fill({ x, y, w, h: 4 }, color, 0.5);
    painter.fill({ x: x + 6, y: y - 3, w: Math.round(w * 0.6), h: 4 }, color, 0.42);
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

  SKYLINE[district](plan(0.18, 0.72, 0, 1), plan(0.4, 0.34, 30, 0.82));
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
    for (let i = 0; i < 14; i += 1) far.mound(i * 150 - 60, 190, 12 + ((i * 7) % 4) * 4);
    for (let i = 0; i < 12; i += 1) {
      const x = i * 170 - 40;
      near.mound(x, 140, 7 + ((i * 5) % 3) * 4);
      // Редкие домики на склоне: холмы обжитые, а не заповедник.
      if (i % 2 === 0) near.bar(x + 62, 6, 10 + ((i * 3) % 3) * 3);
    }
  },
  downtown: (far, near) => {
    for (let i = 0; i < 22; i += 1) far.bar(i * 50 - 30, 34, 10 + ((i * 13) % 6) * 3);
    for (let i = 0; i < 18; i += 1) {
      const x = i * 62 - 20;
      const h = 9 + ((i * 11) % 7) * 3;
      near.bar(x, 28, h);
      if (i % 3 === 0) near.bar(x + 11, 6, h + 7);
    }
  },
  boulevard: (far, near) => {
    for (let i = 0; i < 16; i += 1) far.bar(i * 70 - 20, 56, 8 + ((i * 5) % 4) * 3);
    for (let i = 0; i < 12; i += 1) {
      const x = i * 96 - 30;
      near.bar(x, 60, 8 + ((i * 7) % 3) * 3);
      // Мачта с вывеской над крышей — примета бульвара.
      if (i % 3 === 1) {
        near.bar(x + 26, 3, 20);
        near.bar(x + 18, 16, 6);
      }
    }
  },
  pier: (far, near) => {
    for (let i = 0; i < 12; i += 1) far.bar(i * 90 - 20, 74, 7 + ((i * 3) % 3) * 3);
    for (let i = 0; i < 9; i += 1) {
      const x = i * 124 - 20;
      near.bar(x, 84, 8);
      // Портовый кран: мачта, длинная стрела и трос с крюком.
      near.bar(x + 40, 4, 24);
      near.bar(x + 12, 56, 3);
      near.bar(x + 16, 3, 18);
    }
  },
};

/**
 * Земля: тротуар, бордюр и полоса мостовой у нижнего края. Границы
 * приходят из разметки улицы, а не из долей экрана: иначе бордюр
 * разъезжается с домами, как только меняется масштаб.
 */
export function drawGround(painter: Painter, area: Backdrop, ambience: Ambience): void {
  const { road } = area;
  const kerb = Math.round(area.kerbY);

  painter.fill(road, ambience.pavement);
  // Стыки плит: короткие насечки у бордюра. Полосы во всю высоту
  // читались бы как стена, а не как тротуар.
  const step = Math.round(13 * area.unit);
  const tick = Math.round(5 * area.unit);
  const start = -Math.round(area.cameraX) % step;
  const seam = scale(ambience.pavement, 0.88);
  for (let x = start; x < road.w + step; x += step) {
    painter.fill({ x: road.x + x, y: kerb - tick - 2, w: 1, h: tick }, seam);
    painter.fill({ x: road.x + x + Math.round(step / 2), y: road.y, w: 1, h: tick }, seam);
  }

  painter.fill({ x: road.x, y: kerb, w: road.w, h: road.y + road.h - kerb }, ambience.asphalt);
  painter.fill({ x: road.x, y: kerb - 2, w: road.w, h: 2 }, ambience.kerb);
  painter.fill({ x: road.x, y: kerb, w: road.w, h: 1 }, scale(ambience.kerb, 0.5));

  // Разметка у нижнего края кадра: по ней видно, что улица едет.
  const dash = Math.round(9 * area.unit);
  const gap = Math.round(13 * area.unit);
  const y = kerb + Math.round((road.y + road.h - kerb) * 0.6);
  const from = Math.floor(area.cameraX / (dash + gap)) * (dash + gap) - area.cameraX;
  for (let x = from; x < road.w; x += dash + gap) {
    painter.fill(
      { x: road.x + Math.round(x), y, w: dash, h: Math.max(1, Math.round(area.unit)) },
      scale(ambience.kerb, 0.95),
      0.8,
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
