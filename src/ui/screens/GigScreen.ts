import { getVenue } from '@data/venues';
import { getGenre } from '@data/genres';
import { perform } from '@core/state';
import { checkPerformance, expectedScore, songCapacity } from '@core/systems/performance';
import { imageLevel } from '@core/systems/outfit';
import { isWarmedUp, loadForActivity } from '@core/systems/vocal';
import type { VenueDef } from '@core/types';
import { t } from '../i18n';
import { COLORS, CONTENT, LAYOUT } from '../theme';
import type { RenderContext } from './types';

/**
 * Экран подготовки к выступлению (9.1): сет-лист, наряд, распевка.
 * Прогноз оценки показан рядом с порогами площадки, чтобы решение
 * «взять ещё песню» было осознанным, а не наугад.
 */
export function renderGig(ctx: RenderContext): void {
  const venue = getVenue(ctx.ui.venueId ?? 'underpass');
  const songs = clampSongs(ctx.ui.songs, venue);

  header(ctx, venue);
  setlist(ctx, venue, songs);
  forecast(ctx, venue, songs);
  preparation(ctx, venue, songs);
  performButton(ctx, venue, songs);
}

const clampSongs = (songs: number, venue: VenueDef): number =>
  Math.min(venue.setlist.max, Math.max(venue.setlist.min, songs || venue.setlist.min));

function header(ctx: RenderContext, venue: VenueDef): void {
  const { painter, hotspots } = ctx;
  const backRect = { x: LAYOUT.padding, y: CONTENT.y + 1, w: 52, h: LAYOUT.minTap };
  const back = {
    rect: backRect,
    label: 'ui.back',
    enabled: true,
    onActivate: () => ctx.go({ screen: 'location', venueId: null }),
  };
  hotspots.add(back);
  painter.button(backRect, t('ui.back'), { enabled: true, focused: hotspots.isFocused(back) });
  painter.label({ x: 64, y: CONTENT.y + 1, w: CONTENT.width - 128, h: LAYOUT.minTap },
    t(venue.nameKey), { align: 'center' });
}

function setlist(ctx: RenderContext, venue: VenueDef, songs: number): void {
  const { painter, hotspots, state } = ctx;
  const y = CONTENT.y + 24;
  painter.panel({ x: LAYOUT.padding, y, w: CONTENT.width - LAYOUT.padding * 2, h: 30 });

  const step = (x: number, key: string, next: number, enabled: boolean): void => {
    const rect = { x, y: y + 7, w: LAYOUT.minTap, h: LAYOUT.minTap };
    const hotspot = { rect, label: key, enabled, onActivate: () => ctx.go({ songs: next }) };
    hotspots.add(hotspot);
    painter.button(rect, t(key), { enabled, focused: hotspots.isFocused(hotspot) });
  };

  step(LAYOUT.padding + 6, 'ui.songsMinus', songs - 1, songs > venue.setlist.min);
  step(CONTENT.width - LAYOUT.padding - 22, 'ui.songsPlus', songs + 1, songs < venue.setlist.max);

  painter.label({ x: 40, y: y + 4, w: CONTENT.width - 80, h: 12 }, t('ui.setlist', { songs }), {
    align: 'center',
  });

  const capacity = songCapacity(state.skills.stamina);
  painter.label(
    { x: 40, y: y + 16, w: CONTENT.width - 80, h: 10 },
    songs > capacity
      ? `выносливости хватает на ${capacity} — качество упадёт`
      : `выносливости хватает на ${capacity}`,
    { align: 'center', color: songs > capacity ? COLORS.healthHoarse : COLORS.textDim },
  );
}

function forecast(ctx: RenderContext, venue: VenueDef, songs: number): void {
  const { painter, state } = ctx;
  const y = CONTENT.y + 58;
  const width = CONTENT.width - LAYOUT.padding * 2;
  painter.panel({ x: LAYOUT.padding, y, w: width, h: 38 });

  const score = expectedScore(state, songs);
  const scale = Math.max(venue.thresholds.triumph * 1.15, score);

  painter.label({ x: LAYOUT.padding + 5, y: y + 3, w: width - 10, h: 10 }, t('ui.forecast'), {
    color: COLORS.textDim,
  });
  painter.label({ x: LAYOUT.padding + 5, y: y + 3, w: width - 10, h: 10 },
    String(Math.round(score)), { align: 'right', color: COLORS.accent });

  const bar = { x: LAYOUT.padding + 5, y: y + 16, w: width - 10, h: 8 };
  painter.bar(bar, score, scale, colorForScore(score, venue));
  for (const threshold of [venue.thresholds.ok, venue.thresholds.good, venue.thresholds.triumph]) {
    const x = bar.x + Math.round((threshold / scale) * bar.w);
    painter.fill({ x, y: bar.y - 2, w: 1, h: bar.h + 4 }, COLORS.text);
  }

  painter.label({ x: bar.x, y: y + 27, w: bar.w, h: 10 }, t('ui.thresholds', venue.thresholds), {
    color: COLORS.textMuted,
  });
}

function colorForScore(score: number, venue: VenueDef): number {
  if (score >= venue.thresholds.triumph) return COLORS.healthGood;
  if (score >= venue.thresholds.good) return COLORS.accent;
  if (score >= venue.thresholds.ok) return COLORS.healthTired;
  return COLORS.danger;
}

function preparation(ctx: RenderContext, venue: VenueDef, songs: number): void {
  const { painter, hotspots, state } = ctx;
  const y = CONTENT.y + 100;
  const width = CONTENT.width - LAYOUT.padding * 2;
  painter.panel({ x: LAYOUT.padding, y, w: width, h: 34 });

  const warm = isWarmedUp(state);
  painter.label({ x: LAYOUT.padding + 5, y: y + 3, w: width - 10, h: 10 },
    warm ? t('ui.warmedUp') : t('ui.notWarmedUp'),
    { color: warm ? COLORS.healthGood : COLORS.healthHoarse });

  const load = loadForActivity(state, venue.loadPerSong * songs, getGenre(state.genre));
  painter.label({ x: LAYOUT.padding + 5, y: y + 15, w: width - 10, h: 10 },
    `износ ${Math.round(load)} · силы ${venue.energyPerSong * songs}`,
    { color: COLORS.textDim });

  const shopRect = { x: CONTENT.width - LAYOUT.padding - 84, y: y + 12, w: 78, h: LAYOUT.minTap };
  const shop = {
    rect: shopRect,
    label: 'ui.outfit',
    enabled: true,
    onActivate: () => ctx.go({ screen: 'shop', page: 0 }),
  };
  hotspots.add(shop);
  painter.button(shopRect, `${t('ui.outfit')} · ${imageLevel(state)}`, {
    enabled: true,
    focused: hotspots.isFocused(shop),
  });
}

function performButton(ctx: RenderContext, venue: VenueDef, songs: number): void {
  const { painter, hotspots, state } = ctx;
  const blocked = checkPerformance(state, venue, songs);
  const rect = { x: LAYOUT.padding, y: CONTENT.y + 138, w: CONTENT.width - LAYOUT.padding * 2, h: 24 };
  const hotspot = {
    rect,
    label: 'ui.perform',
    enabled: !blocked,
    onActivate: () => {
      ctx.dispatch(perform(venue.id, songs));
      ctx.go({ screen: 'location', venueId: null });
    },
  };
  hotspots.add(hotspot);
  painter.button(rect, blocked ? t(`reason.${blocked}`) : t('ui.perform'), {
    enabled: !blocked,
    focused: hotspots.isFocused(hotspot),
    accent: true,
  });
}
