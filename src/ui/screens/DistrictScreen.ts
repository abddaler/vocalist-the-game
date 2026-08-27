import { LOCATIONS } from '@data/locations';
import { SLOTS } from '@core/types';
import type { LocationDef } from '@core/types';
import { t } from '../i18n';
import { CONTENT, COLORS, LAYOUT } from '../theme';
import type { RenderContext } from './types';

const COLS = 3;
const ROWS = 4;

/**
 * Список локаций района. На вехе 5 его заменит настоящий экран района
 * с ходьбой; форма выбора при этом останется той же — вход через дверь.
 */
export function renderDistrict(ctx: RenderContext): void {
  const { painter, hotspots, state } = ctx;
  const slot = SLOTS[state.slotIndex] ?? 'morning';

  const cellW = Math.floor((CONTENT.width - LAYOUT.padding * (COLS + 1)) / COLS);
  const cellH = Math.floor((CONTENT.height - LAYOUT.padding * (ROWS + 1)) / ROWS);

  LOCATIONS.forEach((location, index) => {
    const col = index % COLS;
    const row = Math.floor(index / COLS);
    if (row >= ROWS) return;

    const rect = {
      x: LAYOUT.padding + col * (cellW + LAYOUT.padding),
      y: CONTENT.y + LAYOUT.padding + row * (cellH + LAYOUT.padding),
      w: cellW,
      h: cellH,
    };

    const open = location.openSlots.includes(slot);
    const hotspot = {
      rect,
      label: location.id,
      enabled: open && !state.over,
      onActivate: () => ctx.go({ screen: 'location', locationId: location.id, page: 0 }),
    };
    hotspots.add(hotspot);

    painter.panel(
      rect,
      hotspots.isFocused(hotspot) ? COLORS.panelAlt : COLORS.panel,
      hotspots.isFocused(hotspot) ? COLORS.borderFocus : COLORS.border,
    );
    painter.label({ x: rect.x + 3, y: rect.y + 4, w: rect.w - 6, h: 12 }, t(location.nameKey), {
      align: 'center',
      color: open ? COLORS.text : COLORS.textMuted,
    });
    painter.label(
      { x: rect.x + 3, y: rect.y + 18, w: rect.w - 6, h: 20 },
      open ? summary(location) : t('ui.closedNow'),
      { align: 'center', color: COLORS.textDim, wrapWidth: rect.w - 6 },
    );
  });
}

/** Короткая подсказка, что внутри: сколько дел и есть ли сцена. */
function summary(location: LocationDef): string {
  const parts: string[] = [];
  if (location.activities.length > 0) parts.push(`дел: ${location.activities.length}`);
  if (location.venues.length > 0) parts.push(`сцена: ${location.venues.length}`);
  return parts.join(' · ');
}
