import { BALANCE } from '@data/balance';
import { isInjured } from '@core/systems/vocal';
import { SLOTS } from '@core/types';
import type { GameState } from '@core/types';
import { t } from '../i18n';
import { COLORS, LAYOUT, SCREEN, healthColor } from '../theme';
import type { Painter } from '../widgets/Painter';

/**
 * Верхняя панель (9.6). Разложена в два ряда табличек: сверху деньги,
 * место и время, снизу три ресурса.
 *
 * Раньше это был ряд подписей на общей плашке, и глазу не за что было
 * зацепиться: всё одного веса и одного цвета. Таблички разводят
 * «сколько у меня» и «что со мной» — а по цвету рамки видно, что важно
 * прямо сейчас.
 */
export function renderHud(painter: Painter, state: GameState, placeKey?: string): void {
  const bar = { x: 0, y: 0, w: SCREEN.width, h: LAYOUT.hudHeight };
  painter.fill(bar, COLORS.panelDeep);
  painter.fill({ x: 0, y: LAYOUT.hudHeight - 1, w: SCREEN.width, h: 1 }, COLORS.border);

  const money = Math.round(state.resources.money);
  const wallet = { x: 3, y: 2, w: 96, h: 13 };
  painter.plate(wallet, COLORS.panel, money < 0 ? COLORS.danger : COLORS.money);
  painter.label({ x: wallet.x + 4, y: wallet.y, w: wallet.w - 8, h: wallet.h }, `${format(money)} ₽`, {
    color: money < 0 ? COLORS.danger : COLORS.money,
  });

  if (placeKey) {
    const place = { x: 116, y: 2, w: SCREEN.width - 232, h: 13 };
    painter.plate(place, COLORS.panelAlt, COLORS.borderFocus);
    painter.label(place, t(placeKey), { align: 'center', color: COLORS.text });
  }

  const slot = SLOTS[state.slotIndex] ?? 'morning';
  const clock = { x: SCREEN.width - 99, y: 2, w: 96, h: 13 };
  painter.plate(clock, COLORS.panel, COLORS.accent);
  painter.label({ x: clock.x + 4, y: clock.y, w: clock.w - 8, h: clock.h },
    `${t('ui.day', { day: state.day })} · ${t(`slot.${slot}`)}`,
    { align: 'right', color: COLORS.accent },
  );

  meter(painter, 3, 108, 'связки', state.resources.vocalHealth, healthColor(state.resources.vocalHealth));
  meter(painter, 117, 92, 'энергия', state.resources.energy, COLORS.energy);
  meter(painter, 215, 92, 'настрой', state.resources.mood, COLORS.mood);

  const fame = { x: SCREEN.width - 162, y: 17, w: 159, h: 14 };
  painter.label({ x: fame.x, y: fame.y, w: fame.w, h: fame.h },
    `слава ${Math.round(state.resources.fame)} · фанаты ${state.resources.fans}`,
    { align: 'right', color: COLORS.textDim },
  );

  if (isInjured(state)) {
    const warning = { x: 0, y: LAYOUT.hudHeight, w: SCREEN.width, h: 12 };
    painter.fill(warning, COLORS.danger);
    painter.label(warning, t('ui.injury', { days: state.vocal.injuryDaysLeft }), {
      align: 'center',
      color: COLORS.bg,
    });
  }
}

/** Подпись, полоска и число в одну строку: ресурс читается одним взглядом. */
function meter(
  painter: Painter,
  x: number,
  width: number,
  caption: string,
  value: number,
  color: number,
): void {
  const captionW = 46;
  painter.label({ x, y: 17, w: captionW, h: 14 }, caption, { color: COLORS.textMuted });
  painter.bar({ x: x + captionW, y: 20, w: width - captionW - 22, h: 8 }, value, BALANCE.vocal.max, color);
  painter.label({ x: x + width - 21, y: 17, w: 20, h: 14 }, String(Math.round(value)), {
    align: 'right',
    color,
  });
}

/**
 * Разделитель разрядов. Форматтер создаётся один раз: собранный заново
 * на каждый кадр, он стоил больше, чем весь остальной интерфейс.
 */
const MONEY = new Intl.NumberFormat('ru-RU');

const format = (value: number): string => MONEY.format(value);
