import { OUTFITS } from '@data/outfits';
import { buyOutfit, equipOutfit } from '@core/state';
import { imageLevel, owns } from '@core/systems/outfit';
import type { OutfitItemDef } from '@core/types';
import { t } from '../i18n';
import { CONTENT, LAYOUT } from '../theme';
import { renderList } from '../widgets/List';
import type { ListRow } from '../widgets/List';
import type { RenderContext } from './types';

/** Магазин одежды и гардероб (9.2): купить и надеть — в одном списке. */
export function renderShop(ctx: RenderContext): void {
  const { painter, hotspots, state, ui } = ctx;

  const backRect = { x: LAYOUT.padding, y: CONTENT.y + 1, w: 52, h: LAYOUT.minTap };
  const back = {
    rect: backRect,
    label: 'ui.back',
    enabled: true,
    onActivate: () => ctx.go({ screen: ui.venueId ? 'gig' : 'location', page: 0 }),
  };
  hotspots.add(back);
  painter.button(backRect, t('ui.back'), { enabled: true, focused: hotspots.isFocused(back) });
  painter.label({ x: 64, y: CONTENT.y + 1, w: CONTENT.width - 128, h: LAYOUT.minTap },
    t('ui.image', { image: imageLevel(state) }), { align: 'center' });

  const rows: ListRow[] = OUTFITS.map((item) => itemRow(ctx, item));
  renderList(painter, hotspots, rows, ui.page, (page) => ctx.go({ page }), {
    x: 0,
    y: CONTENT.y + 20,
    w: CONTENT.width,
    h: CONTENT.height - 20,
  });
}

function itemRow(ctx: RenderContext, item: OutfitItemDef): ListRow {
  const { state } = ctx;
  const bought = owns(state, item.id);
  const worn = state.wardrobe.equipped[item.slot] === item.id;
  const fit = item.genreFit[state.genre] ?? 0;
  const fitMark = fit > 0 ? ' ✦' : fit < 0 ? ' ✕' : '';

  return {
    key: item.id,
    title: `${t(item.nameKey)}${fitMark}`,
    note: worn
      ? t('ui.worn')
      : bought
        ? `${t('ui.wear')} · +${item.stage}`
        : `${t('ui.price', { price: item.price })} · +${item.stage}`,
    enabled: !worn && !state.over,
    accent: worn || fit > 0,
    onActivate: () =>
      ctx.dispatch(bought ? equipOutfit(item.id) : buyOutfit(item.id)),
  };
}
