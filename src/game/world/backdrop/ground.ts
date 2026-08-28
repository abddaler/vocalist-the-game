import type { Rect } from '@ui/widgets/Hotspots';
import type { Painter } from '@ui/widgets/Painter';
import { mix, scale } from '../ambience';
import type { Ambience } from '../ambience';
import type { Backdrop } from './kit';

/**
 * Земля: тротуар, бордюр и полоса мостовой у нижнего края. Границы
 * приходят из разметки улицы, а не из долей экрана: иначе бордюр
 * разъезжается с домами, как только меняется масштаб.
 */
export function drawGround(painter: Painter, area: Backdrop, ambience: Ambience): void {
  const { road } = area;
  const kerb = Math.round(area.kerbY);

  painter.fill(road, ambience.pavement);
  if (area.ground === 'boardwalk') {
    drawBoardwalk(painter, area, ambience, kerb);
    return;
  }
  if (area.ground === 'plaza') drawPlaza(painter, area, ambience, kerb);
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

/**
 * Настил набережной: доски поперёк, стыки и песок под ним. Асфальтовая
 * разметка тут была бы враньём.
 */
function drawBoardwalk(painter: Painter, area: Backdrop, ambience: Ambience, kerb: number): void {
  const { road } = area;
  const deck = mix(ambience.pavement, 0xb07f3f, 0.75);
  painter.fill({ x: road.x, y: road.y, w: road.w, h: kerb - road.y }, deck);

  // Доски поперёк хода: настил узнают по ним, а не по цвету.
  const plank = Math.round(5 * area.unit);
  for (let y = road.y; y < kerb; y += plank) {
    painter.fill({ x: road.x, y, w: road.w, h: 1 }, scale(deck, 0.62));
    painter.fill({ x: road.x, y: y + 1, w: road.w, h: 1 }, scale(deck, 1.14));
  }
  // Стыки секций: редкие вертикальные швы.
  const seam = Math.round(46 * area.unit);
  const start = -Math.round(area.cameraX) % seam;
  for (let x = start; x < road.w + seam; x += seam) {
    painter.fill({ x: road.x + x, y: road.y, w: 2, h: kerb - road.y }, scale(deck, 0.72));
  }

  // Кромка настила и песок под ней.
  painter.fill({ x: road.x, y: kerb - 3, w: road.w, h: 3 }, scale(deck, 0.55));
  const sand = mix(0xf0dfa8, ambience.pavement, 0.14);
  painter.fill({ x: road.x, y: kerb, w: road.w, h: road.y + road.h - kerb }, sand);
  painter.fill({ x: road.x, y: kerb, w: road.w, h: 2 }, scale(sand, 0.86));
  const depth = Math.max(1, road.y + road.h - kerb - 3);
  for (let i = 0; i < 140; i += 1) {
    const x = ((i * 53 - Math.round(area.cameraX)) % road.w + road.w) % road.w;
    painter.fill(
      { x: road.x + x, y: kerb + 3 + ((i * 7) % depth), w: 2, h: 1 },
      scale(sand, i % 3 === 0 ? 1.08 : 0.9),
    );
  }
  // Пена у нижнего края: за песком угадывается вода.
  painter.fill({ x: road.x, y: road.y + road.h - 3, w: road.w, h: 3 }, mix(sand, 0xffffff, 0.5), 0.5);
}

/** Площадь: плитка ромбом и ступени у края. Даунтаун — не просто дорога. */
function drawPlaza(painter: Painter, area: Backdrop, ambience: Ambience, kerb: number): void {
  const { road } = area;
  const stone = scale(ambience.pavement, 1.06);
  painter.fill({ x: road.x, y: road.y, w: road.w, h: kerb - road.y }, stone);

  // Крупные плиты со швом вразбежку. Мелкая сетка на такой площади
  // читалась кирпичной кладкой, поставленной под ноги.
  const slab = Math.round(22 * area.unit);
  const rowH = Math.round(11 * area.unit);
  const joint = scale(stone, 0.93);
  let row = 0;
  for (let y = road.y; y < kerb; y += rowH) {
    painter.fill({ x: road.x, y, w: road.w, h: 1 }, joint);
    const shift = row % 2 === 0 ? 0 : slab / 2;
    const start = ((-Math.round(area.cameraX) + shift) % slab + slab) % slab;
    for (let x = start; x < road.w + slab; x += slab) {
      painter.fill({ x: road.x + x, y, w: 1, h: rowH }, joint);
    }
    row += 1;
  }

  // Две ступени вдоль края: площадь приподнята над мостовой.
  painter.fill({ x: road.x, y: kerb - 6, w: road.w, h: 3 }, scale(stone, 1.14));
  painter.fill({ x: road.x, y: kerb - 3, w: road.w, h: 1 }, scale(stone, 0.8));
  painter.fill({ x: road.x, y: kerb - 2, w: road.w, h: 2 }, scale(stone, 1.08));
}

/** Полоса вдоль тротуара: газон, песок или дорожка. */
export function drawStrip(
  painter: Painter,
  area: Backdrop,
  ambience: Ambience,
  strip: { y: number; h: number; kind: 'grass' | 'sand' | 'carpet' },
): void {
  const rect = { x: 0, y: strip.y, w: area.road.w, h: strip.h };
  if (strip.kind === 'grass') {
    const grass = mix(0x4f8f4a, ambience.pavement, 0.2);
    painter.fill(rect, grass);
    painter.fill({ ...rect, h: 1 }, scale(grass, 1.25));
    painter.fill({ ...rect, y: rect.y + rect.h - 1, h: 1 }, scale(grass, 0.7));
    for (let i = 0; i < 90; i += 1) {
      const x = (i * 37 - Math.round(area.cameraX)) % rect.w;
      painter.fill(
        { x: (x + rect.w) % rect.w, y: rect.y + 1 + ((i * 3) % Math.max(1, rect.h - 2)), w: 1, h: 1 },
        scale(grass, i % 2 === 0 ? 1.3 : 0.75),
      );
    }
    return;
  }
  if (strip.kind === 'carpet') {
    const carpet = scale(0x9a2f4a, ambience.light);
    painter.fill(rect, carpet);
    painter.fill({ ...rect, h: 1 }, scale(carpet, 1.4));
    painter.fill({ ...rect, y: rect.y + rect.h - 1, h: 1 }, scale(carpet, 0.6));
    return;
  }
  const sand = mix(0xe8d8a8, ambience.pavement, 0.3);
  painter.fill(rect, sand);
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
