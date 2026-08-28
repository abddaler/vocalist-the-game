import { BALANCE } from '@data/balance';
import { isInjured } from '@core/systems/vocal';
import { SLOTS } from '@core/types';
import type { GameState } from '@core/types';
import { t } from '../i18n';
import { COLORS, LAYOUT, SCREEN, healthColor } from '../theme';
import type { Painter } from '../widgets/Painter';

/**
 * Верхняя панель (9.6): дата, слот дня, деньги, энергия, связки, настроение.
 * Здоровье связок выделено цветом и шире прочих — это центральный ресурс.
 */
export function renderHud(painter: Painter, state: GameState): void {
  const bar = { x: 0, y: 0, w: SCREEN.width, h: LAYOUT.hudHeight };
  painter.panel(bar, COLORS.panelAlt);

  const slot = SLOTS[state.slotIndex] ?? 'morning';
  painter.label({ x: 6, y: 1, w: 90, h: 15 }, t('ui.day', { day: state.day }), {
    color: COLORS.text,
  });
  painter.label({ x: 6, y: 16, w: 90, h: 15 }, t(`slot.${slot}`), { color: COLORS.textDim });

  meter(painter, 96, 'связки', state.resources.vocalHealth, healthColor(state.resources.vocalHealth), 100);
  meter(painter, 204, 'энергия', state.resources.energy, COLORS.energy, 74);
  meter(painter, 286, 'настрой', state.resources.mood, COLORS.mood, 74);

  const money = Math.round(state.resources.money);
  painter.label({ x: SCREEN.width - 136, y: 2, w: 130, h: 14 }, `${format(money)} ₽`, {
    align: 'right',
    color: money < 0 ? COLORS.danger : COLORS.money,
  });
  painter.label(
    { x: SCREEN.width - 136, y: 17, w: 130, h: 14 },
    `слава ${Math.round(state.resources.fame)} · фанаты ${state.resources.fans}`,
    { align: 'right', color: COLORS.textDim },
  );

  if (isInjured(state)) {
    const warning = { x: 0, y: LAYOUT.hudHeight - 1, w: SCREEN.width, h: 12 };
    painter.fill(warning, COLORS.danger);
    painter.label(warning, t('ui.injury', { days: state.vocal.injuryDaysLeft }), {
      align: 'center',
      color: COLORS.bg,
    });
  }
}

function meter(
  painter: Painter,
  x: number,
  caption: string,
  value: number,
  color: number,
  width: number,
): void {
  painter.label({ x, y: 2, w: width, h: 13 }, caption, { color: COLORS.textDim });
  painter.bar({ x, y: 17, w: width - 26, h: 9 }, value, BALANCE.vocal.max, color);
  painter.label({ x: x + width - 24, y: 15, w: 24, h: 13 }, String(Math.round(value)), {
    align: 'right',
    color,
  });
}

const format = (value: number): string => new Intl.NumberFormat('ru-RU').format(value);
