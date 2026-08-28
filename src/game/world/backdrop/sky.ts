import type { Painter } from '@ui/widgets/Painter';
import { mix } from '../ambience';
import type { Ambience } from '../ambience';
import type { Backdrop } from './kit';

/** Рядов в растяжке неба: полоса всего полсотни пикселей. */
const SKY_BANDS = 10;

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

