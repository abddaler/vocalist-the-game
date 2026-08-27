import { tierIndex } from '@core/types';
import type { GameState } from '@core/types';
import { t } from '../i18n';
import { formatLogEntry } from '../log';
import { COLORS, CONTENT, LAYOUT } from '../theme';
import type { RenderContext } from './types';

const LINES = 11;

/** Журнал (9.6): активная цель и история того, что уже случилось. */
export function renderJournal(ctx: RenderContext): void {
  const { painter, hotspots, state, ui } = ctx;

  const goalRect = { x: LAYOUT.padding, y: CONTENT.y + 4, w: CONTENT.width - LAYOUT.padding * 2, h: 26 };
  painter.panel(goalRect, COLORS.panelAlt, COLORS.accent);
  painter.label({ x: goalRect.x + 4, y: goalRect.y + 2, w: goalRect.w - 8, h: 10 }, t('ui.goal'), {
    color: COLORS.textDim,
  });
  painter.label({ x: goalRect.x + 4, y: goalRect.y + 13, w: goalRect.w - 8, h: 10 }, t(goalOf(state)), {
    color: COLORS.text,
  });

  const entries = state.log.slice().reverse();
  const totalPages = Math.max(1, Math.ceil(entries.length / LINES));
  const page = Math.min(Math.max(0, ui.page), totalPages - 1);
  const visible = entries.slice(page * LINES, (page + 1) * LINES);

  if (visible.length === 0) {
    painter.label({ x: 0, y: CONTENT.y + 60, w: CONTENT.width, h: 12 }, t('ui.emptyJournal'), {
      align: 'center',
      color: COLORS.textMuted,
    });
    return;
  }

  visible.forEach((entry, index) => {
    const y = CONTENT.y + 34 + index * 12;
    painter.label({ x: LAYOUT.padding, y, w: 58, h: 10 },
      `д${entry.day} ${t(`slot.${entry.slot}`)}`, { color: COLORS.textMuted });
    painter.label({ x: LAYOUT.padding + 62, y, w: CONTENT.width - 80, h: 10 },
      formatLogEntry(entry), { color: colorOf(entry.code) });
  });

  if (totalPages > 1) {
    const y = CONTENT.y + CONTENT.height - LAYOUT.minTap - 2;
    const arrow = (x: number, key: string, target: number, enabled: boolean): void => {
      const rect = { x, y, w: 26, h: LAYOUT.minTap };
      const hotspot = { rect, label: key, enabled, onActivate: () => ctx.go({ page: target }) };
      hotspots.add(hotspot);
      painter.button(rect, t(key), { enabled, focused: hotspots.isFocused(hotspot) });
    };
    arrow(LAYOUT.padding, 'ui.prev', page - 1, page > 0);
    arrow(CONTENT.width - LAYOUT.padding - 26, 'ui.next', page + 1, page < totalPages - 1);
    painter.label({ x: 0, y, w: CONTENT.width, h: LAYOUT.minTap },
      t('ui.page', { page: page + 1, total: totalPages }),
      { align: 'center', color: COLORS.textDim });
  }
}

/** Активная цель выводится из ступени карьеры — отдельного списка не держим. */
function goalOf(state: GameState): string {
  if ((state.flags.sliceComplete ?? 0) > 0) return 'goal.done';
  const tier = tierIndex(state.career.tier);
  if (tier >= tierIndex('bar')) return 'goal.club';
  if (tier >= tierIndex('restaurant')) return 'goal.bar';
  if (tier >= tierIndex('underpass') && state.career.performances > 0) return 'goal.restaurant';
  return 'goal.firstGig';
}

function colorOf(code: string): number {
  if (code.startsWith('injury') || code === 'debt.critical') return COLORS.danger;
  if (code === 'career.up' || code === 'performance.done') return COLORS.accent;
  if (code === 'event.fired') return COLORS.mood;
  return COLORS.textDim;
}
