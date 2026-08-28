import { CITY } from '@data/world';
import { getLocation } from '@data/locations';
import type { DistrictDef, DistrictId } from '@core/types';
import { t } from '../i18n';
import { COLORS, CONTENT, SCREEN } from '../theme';
import type { RenderContext } from './types';

/**
 * Карта города. Пешком до дальнего района три экрана, и заставлять
 * проходить их каждый раз — налог на терпение, а не игра: карта
 * оставляет ходьбу тем, кто её хочет, и убирает у остальных.
 *
 * Взаимное расположение районов задано в data (поле map): это факт о
 * городе, а не о том, как его нарисовали.
 */
const BOARD = { x: 10, y: CONTENT.y + 16, w: SCREEN.width - 20, h: CONTENT.height - 46 };
const CAPTION = { x: 0, y: CONTENT.y + CONTENT.height - 26, w: SCREEN.width, h: 24 };

/** Собственная система координат карты: в ней записаны прямоугольники районов. */
const CITY_SIZE = { w: 200, h: 78 };

const LAND = 0x243a34;
const WATER = 0x16304a;
const ROAD = 0x6a58a0;

export interface MapParams {
  readonly current: DistrictId;
  readonly onTravel: (to: DistrictId) => void;
}

export function renderMap(ctx: RenderContext, params: MapParams): void {
  const { painter, hotspots } = ctx;

  painter.label({ x: 0, y: CONTENT.y + 2, w: SCREEN.width, h: 12 }, t('ui.city'), {
    align: 'center',
    color: COLORS.textDim,
  });

  drawLand(ctx);

  const place = (district: DistrictDef) => ({
    x: Math.round(BOARD.x + (district.map.x * BOARD.w) / CITY_SIZE.w),
    y: Math.round(BOARD.y + (district.map.y * BOARD.h) / CITY_SIZE.h),
    w: Math.round((district.map.w * BOARD.w) / CITY_SIZE.w),
    h: Math.round((district.map.h * BOARD.h) / CITY_SIZE.h),
  });

  // Дороги между соседями: связность города должна быть видна, а не
  // угадываться по тому, что районы стоят рядом.
  for (const district of CITY) {
    for (const gate of district.gates) {
      const target = CITY.find((candidate) => candidate.id === gate.to);
      if (!target || target.id < district.id) continue;
      road(ctx, center(place(district)), center(place(target)));
    }
  }

  let described: DistrictDef | undefined;

  for (const district of CITY) {
    const rect = place(district);
    const here = district.id === params.current;
    const hotspot = {
      rect,
      label: district.id,
      enabled: !here,
      onActivate: () => params.onTravel(district.id),
    };
    hotspots.add(hotspot);

    const focused = hotspots.isFocused(hotspot);
    if (focused || (here && !described)) described = district;

    painter.plate(
      rect,
      here ? COLORS.panelAlt : COLORS.panel,
      here ? COLORS.accent : focused ? COLORS.borderFocus : COLORS.border,
      here || focused,
    );

    painter.label({ x: rect.x + 4, y: rect.y + 4, w: rect.w - 8, h: 11 }, t(district.nameKey), {
      color: here ? COLORS.accent : COLORS.text,
    });
    // Точки под названием — сколько в районе своих дверей.
    for (let i = 0; i < district.buildings.length; i += 1) {
      painter.fill(
        { x: rect.x + 5 + i * 5, y: rect.y + 17, w: 3, h: 3 },
        here ? COLORS.accent : COLORS.textDim,
      );
    }
    if (here) drawPin(ctx, rect);
  }

  drawCaption(ctx, described, params.current);
}

/** Суша, океан и его берег. Без берега это просто сетка прямоугольников. */
function drawLand(ctx: RenderContext): void {
  const { painter } = ctx;
  painter.fill(BOARD, LAND);

  // Зелень пятнами: ровная заливка выглядит как незаполненное поле.
  for (let i = 0; i < 26; i += 1) {
    const x = BOARD.x + ((i * 79) % (BOARD.w - 10));
    const y = BOARD.y + ((i * 47) % (BOARD.h - 8));
    painter.fill({ x, y, w: 6 + (i % 3) * 3, h: 3 }, 0x2e4a3c, 0.7);
  }

  // Океан в левом нижнем углу, берег наискось вниз-вправо.
  const bands = 9;
  const top = Math.round(BOARD.y + BOARD.h * 0.42);
  const bandH = Math.ceil((BOARD.y + BOARD.h - top) / bands) + 1;
  const widest = Math.round(BOARD.w * 0.36);
  for (let i = 0; i < bands; i += 1) {
    const w = Math.round((widest * (i + 2)) / (bands + 1));
    painter.fill({ x: BOARD.x, y: top + i * (bandH - 1), w, h: bandH }, WATER);
  }

  // Барашки: две-три чёрточки, чтобы вода не была пятном краски.
  for (let i = 0; i < 7; i += 1) {
    const y = top + 6 + i * Math.round((BOARD.h * 0.55) / 7);
    const w = Math.round((widest * (i + 2)) / (bands + 1));
    if (w < 24) continue;
    painter.fill({ x: BOARD.x + 6 + ((i * 23) % Math.max(1, w - 22)), y, w: 10, h: 1 }, 0x2f6a96);
  }

  painter.stroke(BOARD, COLORS.border);
}

/** Метка «вы здесь»: флажок в углу района. */
function drawPin(ctx: RenderContext, rect: { x: number; y: number; w: number; h: number }): void {
  const x = rect.x + rect.w - 9;
  const y = rect.y + 4;
  ctx.painter.fill({ x, y, w: 1, h: 9 }, COLORS.accent);
  ctx.painter.fill({ x: x + 1, y, w: 5, h: 4 }, COLORS.accent);
}

/** Полоса под картой: что за район под пальцем и что в нём есть. */
function drawCaption(
  ctx: RenderContext,
  district: DistrictDef | undefined,
  current: DistrictId,
): void {
  ctx.painter.fill(CAPTION, COLORS.panelDeep);
  ctx.painter.fill({ x: 0, y: CAPTION.y, w: SCREEN.width, h: 1 }, COLORS.border);
  if (!district) return;

  const here = district.id === current;
  ctx.painter.label({ x: 8, y: CAPTION.y + 1, w: SCREEN.width - 16, h: 11 }, t(district.nameKey), {
    color: here ? COLORS.accent : COLORS.text,
  });

  const places = district.buildings
    .map((building) => t(getLocation(building.locationId).nameKey))
    .join(' · ');
  ctx.painter.label(
    { x: 8, y: CAPTION.y + 12, w: SCREEN.width - 16, h: 11 },
    places || t(`${district.nameKey}.note`),
    { color: COLORS.textDim },
  );

  ctx.painter.label(
    { x: 8, y: CAPTION.y + 1, w: SCREEN.width - 16, h: 11 },
    here ? t('ui.youAreHere') : t('ui.travel'),
    { align: 'right', color: COLORS.textMuted },
  );
}

const center = (rect: { x: number; y: number; w: number; h: number }) => ({
  x: rect.x + rect.w / 2,
  y: rect.y + rect.h / 2,
});

/** Дорога рисуется уступом: диагональ на этом разрешении рвётся в лесенку. */
function road(ctx: RenderContext, from: { x: number; y: number }, to: { x: number; y: number }): void {
  const midX = Math.round((from.x + to.x) / 2);
  const line = (x: number, y: number, w: number, h: number): void =>
    ctx.painter.fill({ x: Math.round(x), y: Math.round(y), w: Math.max(2, w), h: Math.max(2, h) }, ROAD);

  line(Math.min(from.x, midX), from.y - 1, Math.abs(midX - from.x), 2);
  line(midX - 1, Math.min(from.y, to.y), 2, Math.abs(to.y - from.y));
  line(Math.min(midX, to.x), to.y - 1, Math.abs(to.x - midX), 2);
}
