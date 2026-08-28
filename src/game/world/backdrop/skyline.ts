import type { DistrictId } from '@core/types';
import type { Painter } from '@ui/widgets/Painter';
import { mix, scale } from '../ambience';
import type { Ambience } from '../ambience';
import type { Backdrop } from './kit';

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

  if (district === 'pier') {
    drawOcean(painter, area, ambience);
    return;
  }
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
 * Океан за домами набережной: линия горизонта, полосы воды к берегу,
 * блик от солнца и пара парусов. Ради этого вида район и сделан — на
 * четвёртой одинаковой улице город кончается.
 */
function drawOcean(painter: Painter, area: Backdrop, ambience: Ambience): void {
  const { sky } = area;
  const horizon = sky.y + Math.round(sky.h * 0.52);
  const deep = mix(ambience.far, 0x1c4f7a, 0.75);
  const shallow = mix(deep, ambience.skyLow, 0.45);
  const bands = 7;
  const bandH = Math.ceil((sky.y + sky.h - horizon) / bands) + 1;

  for (let i = 0; i < bands; i += 1) {
    painter.fill(
      { x: sky.x, y: horizon + i * (bandH - 1), w: sky.w, h: bandH },
      mix(deep, shallow, i / (bands - 1)),
    );
  }
  painter.fill({ x: sky.x, y: horizon, w: sky.w, h: 1 }, mix(shallow, 0xffffff, 0.35));

  // Дорожка света под солнцем и барашки: без них вода — просто заливка.
  const sunX = Math.round(sky.x + sky.w * 0.74);
  for (let i = 0; i < bands; i += 1) {
    const y = horizon + 2 + i * (bandH - 1);
    const w = 6 + i * 4;
    painter.fill({ x: sunX - w / 2, y, w, h: 1 }, mix(shallow, 0xffffff, 0.6), 0.5);
  }
  const shift = -area.cameraX * 0.24;
  for (let i = 0; i < 26; i += 1) {
    const x = Math.round(sky.x + ((i * 97) % 1100) + shift);
    const y = horizon + 3 + ((i * 7) % (bands - 1)) * (bandH - 1);
    if (x < sky.x || x > sky.x + sky.w) continue;
    painter.fill({ x, y, w: 4 + (i % 3) * 2, h: 1 }, mix(shallow, 0xffffff, 0.55), 0.55);
  }

  // Пара парусов у горизонта.
  for (const [dx, dy] of [[0.24, 3], [0.58, 6]] as const) {
    const x = Math.round(sky.x + sky.w * dx + shift * 0.5);
    if (x < sky.x - 10 || x > sky.x + sky.w) continue;
    painter.fill({ x, y: horizon + dy, w: 5, h: 1 }, 0xf0f4f8);
    painter.fill({ x: x + 2, y: horizon + dy - 5, w: 1, h: 5 }, 0xf0f4f8);
    painter.fill({ x: x + 3, y: horizon + dy - 4, w: 3, h: 4 }, 0xe8eef4);
  }
}

