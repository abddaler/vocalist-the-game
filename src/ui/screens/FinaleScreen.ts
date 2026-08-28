import type { GameState } from '@core/types';
import { t } from '../i18n';
import { COLORS, SCREEN } from '../theme';
import type { RenderContext } from './types';

/** Клубный концерт засчитан, если игрок реально выходил на главную сцену. */
export function reachedClub(state: GameState): boolean {
  return (state.stats.activityCounts.club_stage ?? 0) > 0;
}

/** Финал среза (раздел 13): что вышло за шестьдесят дней. */
export function renderFinale(ctx: RenderContext, onRestart: () => void): void {
  const { painter, hotspots, state } = ctx;
  const club = reachedClub(state);

  painter.fill({ x: 0, y: 0, w: SCREEN.width, h: SCREEN.height }, COLORS.bg);
  painter.label({ x: 0, y: 22, w: SCREEN.width, h: 18 }, t('finale.title'), {
    align: 'center',
    scale: 2,
    color: COLORS.text,
  });
  painter.label({ x: 0, y: 44, w: SCREEN.width, h: 14 }, t(club ? 'finale.club' : 'finale.noClub'), {
    align: 'center',
    color: club ? COLORS.accent : COLORS.textDim,
  });

  const rows: readonly [string, string][] = [
    ['finale.days', String(state.day - 1)],
    ['finale.tier', t(`tier.${state.career.tier}`)],
    ['finale.money', `${format(Math.round(state.resources.money))} ₽`],
    ['finale.fame', String(Math.round(state.resources.fame))],
    ['finale.fans', String(state.resources.fans)],
    ['finale.performances', String(state.career.performances)],
    ['finale.injuries', String(state.vocal.injuryCount)],
    ['finale.support', String(Math.round(state.skills.breathSupport))],
  ];

  const panel = { x: 90, y: 66, w: SCREEN.width - 180, h: rows.length * 14 + 8 };
  painter.panel(panel);
  rows.forEach(([key, value], index) => {
    const y = panel.y + 4 + index * 14;
    painter.label({ x: panel.x + 8, y, w: panel.w - 16, h: 13 }, t(key), { color: COLORS.textDim });
    painter.label({ x: panel.x + 8, y, w: panel.w - 16, h: 13 }, value, {
      align: 'right',
      color: COLORS.text,
    });
  });

  const rect = { x: 140, y: panel.y + panel.h + 10, w: 200, h: 26 };
  const hotspot = { rect, label: 'finale.again', enabled: true, onActivate: onRestart };
  hotspots.add(hotspot);
  painter.button(rect, t('finale.again'), {
    enabled: true,
    focused: hotspots.isFocused(hotspot),
    accent: true,
  });
}

const format = (value: number): string => new Intl.NumberFormat('ru-RU').format(value);
