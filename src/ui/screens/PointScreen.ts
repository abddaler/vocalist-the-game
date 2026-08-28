import { getActivity } from '@data/activities';
import { findStreetPoint, getRoom, hasRoom } from '@data/world';
import { getVenue } from '@data/venues';
import { checkActivity } from '@core/systems/activity';
import { checkPerformance } from '@core/systems/performance';
import { imageLevel } from '@core/systems/outfit';
import { doActivity } from '@core/state';
import type { ActivityDef, RoomPointDef, VenueDef } from '@core/types';
import { t } from '../i18n';
import { CONTENT, LAYOUT } from '../theme';
import { renderList } from '../widgets/List';
import type { ListRow } from '../widgets/List';
import type { RenderContext, ScreenId } from './types';

/** Дела одной точки взаимодействия: у кровати спят, у зеркала распеваются. */
export function renderPoint(ctx: RenderContext): void {
  const { painter, hotspots, ui } = ctx;
  const point = findPoint(ui.locationId, ui.pointId);
  const back: ScreenId = ui.locationId ? 'room' : 'world';

  const header = { x: 0, y: CONTENT.y, w: CONTENT.width, h: 18 };
  painter.label({ x: LAYOUT.padding + 60, y: header.y, w: header.w - 130, h: header.h },
    point ? t(point.nameKey) : '', { align: 'center' });

  const backRect = { x: LAYOUT.padding, y: CONTENT.y + 1, w: 52, h: LAYOUT.minTap };
  const backSpot = {
    rect: backRect,
    label: 'ui.back',
    enabled: true,
    onActivate: () => ctx.go({ screen: back, pointId: null, page: 0 }),
  };
  hotspots.add(backSpot);
  painter.button(backRect, t('ui.back'), { enabled: true, focused: hotspots.isFocused(backSpot) });

  const rows: ListRow[] = point
    ? [
        ...point.venues.map((id) => venueRow(ctx, getVenue(id))),
        ...(point.opensShop ? [wardrobeRow(ctx)] : []),
        ...point.activities.map((id) => activityRow(ctx, getActivity(id))),
      ]
    : [];

  renderList(painter, hotspots, rows, ui.page, (page) => ctx.go({ page }), {
    x: 0,
    y: CONTENT.y + 20,
    w: CONTENT.width,
    h: CONTENT.height - 20,
  });
}

/** Вход в гардероб. Слотов не тратит: примерка — не действие дня. */
/** Точка ищется в комнате локации, а для улицы — среди точек района. */
function findPoint(locationId: string | null, pointId: string | null): RoomPointDef | undefined {
  if (!pointId) return undefined;
  if (!locationId || !hasRoom(locationId)) return findStreetPoint(pointId);
  return getRoom(locationId).points.find((point) => point.id === pointId);
}

function wardrobeRow(ctx: RenderContext): ListRow {
  return {
    key: 'wardrobe',
    title: `▣ ${t('ui.outfit')}`,
    note: t('ui.image', { image: imageLevel(ctx.state) }),
    enabled: !ctx.state.over,
    accent: true,
    onActivate: () => ctx.go({ screen: 'shop', venueId: null, page: 0 }),
  };
}

function venueRow(ctx: RenderContext, venue: VenueDef): ListRow {
  const { state } = ctx;
  const songs = venue.setlist.min;
  const blocked = checkPerformance(state, venue, songs);
  const locked = blocked === 'lowFame' || blocked === 'lowImage';

  return {
    key: venue.id,
    title: `♪ ${t(venue.nameKey)}`,
    note: locked
      ? t('ui.venueLocked', { fame: venue.requires.fame ?? 0, image: venue.requires.image ?? 0 })
      : blocked
        ? t(`reason.${blocked}`)
        : t('ui.cost', { slots: venue.timeCost }),
    enabled: !blocked,
    accent: true,
    onActivate: () => ctx.go({ screen: 'gig', venueId: venue.id, songs }),
  };
}

function activityRow(ctx: RenderContext, activity: ActivityDef): ListRow {
  const { state } = ctx;
  const blocked = checkActivity(state, activity);

  return {
    key: activity.id,
    title: t(activity.nameKey),
    note: blocked ? t(`reason.${blocked}`) : costOf(activity),
    enabled: !blocked,
    onActivate: () => ctx.perform(activity.id, doActivity(activity.id)),
  };
}

/** Короткая сводка цены: слоты, деньги, силы, износ. */
function costOf(activity: ActivityDef): string {
  const parts = [t('ui.cost', { slots: activity.slots })];
  if (activity.money < 0) parts.push(`${Math.abs(activity.money)} ₽`);
  if (activity.wages > 0) parts.push(`+${activity.wages} ₽`);
  if (activity.energy < 0) parts.push(`${activity.energy} сил`);
  if (activity.baseLoad > 0) parts.push(`износ ${activity.baseLoad}`);
  return parts.join(' · ');
}
