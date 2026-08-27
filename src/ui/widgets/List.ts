import { t } from '../i18n';
import { COLORS, CONTENT, LAYOUT } from '../theme';
import type { Hotspots, Rect } from './Hotspots';
import type { Painter } from './Painter';

export interface ListRow {
  readonly key: string;
  readonly title: string;
  readonly note: string;
  readonly enabled: boolean;
  readonly accent?: boolean;
  readonly onActivate: () => void;
}

const ROWS_PER_PAGE = 7;

/**
 * Постраничный список строк. Страницы вместо прокрутки: пролистывание
 * пальцем на 480x270 требует инерции и порогов, а две кнопки со стрелками
 * работают одинаково и на тач, и с клавиатуры.
 */
export function renderList(
  painter: Painter,
  hotspots: Hotspots,
  rows: readonly ListRow[],
  page: number,
  onPage: (page: number) => void,
  area: Rect = { x: 0, y: CONTENT.y, w: CONTENT.width, h: CONTENT.height },
): void {
  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const current = Math.min(Math.max(0, page), totalPages - 1);
  const visible = rows.slice(current * ROWS_PER_PAGE, (current + 1) * ROWS_PER_PAGE);

  if (rows.length === 0) {
    painter.label({ x: area.x, y: area.y + 20, w: area.w, h: 12 }, t('ui.nothingHere'), {
      align: 'center',
      color: COLORS.textMuted,
    });
    return;
  }

  visible.forEach((row, index) => {
    const rect = {
      x: area.x + LAYOUT.padding,
      y: area.y + 2 + index * (LAYOUT.rowHeight + 2),
      w: area.w - LAYOUT.padding * 2,
      h: LAYOUT.rowHeight,
    };
    const hotspot = { rect, label: row.key, enabled: row.enabled, onActivate: row.onActivate };
    hotspots.add(hotspot);

    const focused = hotspots.isFocused(hotspot);
    painter.panel(
      rect,
      focused ? COLORS.panelAlt : COLORS.panel,
      !row.enabled ? COLORS.disabled : focused ? COLORS.borderFocus : COLORS.border,
    );
    painter.label({ x: rect.x + 5, y: rect.y, w: rect.w * 0.55, h: rect.h }, row.title, {
      color: !row.enabled ? COLORS.textMuted : row.accent ? COLORS.accent : COLORS.text,
    });
    painter.label(
      { x: rect.x + rect.w * 0.55, y: rect.y, w: rect.w * 0.45 - 5, h: rect.h },
      row.note,
      { align: 'right', color: COLORS.textDim },
    );
  });

  if (totalPages > 1) renderPager(painter, hotspots, area, current, totalPages, onPage);
}

function renderPager(
  painter: Painter,
  hotspots: Hotspots,
  area: Rect,
  current: number,
  totalPages: number,
  onPage: (page: number) => void,
): void {
  const y = area.y + area.h - LAYOUT.minTap - 2;
  const arrow = (x: number, key: string, target: number, enabled: boolean): void => {
    const rect = { x, y, w: 26, h: LAYOUT.minTap };
    const hotspot = { rect, label: key, enabled, onActivate: () => onPage(target) };
    hotspots.add(hotspot);
    painter.button(rect, t(key), { enabled, focused: hotspots.isFocused(hotspot) });
  };

  arrow(area.x + LAYOUT.padding, 'ui.prev', current - 1, current > 0);
  arrow(area.x + area.w - LAYOUT.padding - 26, 'ui.next', current + 1, current < totalPages - 1);
  painter.label(
    { x: area.x, y, w: area.w, h: LAYOUT.minTap },
    t('ui.page', { page: current + 1, total: totalPages }),
    { align: 'center', color: COLORS.textDim },
  );
}
