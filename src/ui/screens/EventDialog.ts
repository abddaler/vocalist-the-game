import { getEvent } from '@data/events';
import { resolveEventChoice } from '@core/state';
import { availableChoices } from '@core/systems/events';
import { t } from '../i18n';
import { COLORS, LAYOUT, SCREEN } from '../theme';
import type { RenderContext } from './types';

/**
 * Модальный диалог события (9.4). Пока он висит, игра стоит: редьюсер
 * блокирует все прочие действия, поэтому и в интерфейсе он перекрывает всё.
 */
export function renderEventDialog(ctx: RenderContext): void {
  const { painter, hotspots, state } = ctx;
  const id = state.events.pending;
  if (!id) return;

  const event = getEvent(id);
  const choices = availableChoices(state, event);

  painter.fill({ x: 0, y: LAYOUT.hudHeight, w: SCREEN.width, h: SCREEN.height - LAYOUT.hudHeight },
    COLORS.bg);

  const dialog = { x: 30, y: LAYOUT.hudHeight + 8, w: SCREEN.width - 60, h: SCREEN.height - LAYOUT.hudHeight - 16 };
  painter.panel(dialog, COLORS.panel, COLORS.accent);

  painter.label({ x: dialog.x + 10, y: dialog.y + 8, w: dialog.w - 20, h: 14 }, t(event.titleKey), {
    color: COLORS.accent,
  });

  painter.label(
    { x: dialog.x + 10, y: dialog.y + 26, w: dialog.w - 20, h: 70 },
    t(event.textKey),
    { wrapWidth: dialog.w - 20, color: COLORS.text },
  );

  const buttonH = 22;
  const bottom = dialog.y + dialog.h - LAYOUT.padding;
  choices.forEach((choice, index) => {
    const rect = {
      x: dialog.x + 10,
      y: bottom - (choices.length - index) * (buttonH + 4),
      w: dialog.w - 20,
      h: buttonH,
    };
    const hotspot = {
      rect,
      label: choice.textKey,
      enabled: true,
      onActivate: () => ctx.dispatch(resolveEventChoice(index)),
    };
    hotspots.add(hotspot);
    painter.button(rect, t(choice.textKey), {
      enabled: true,
      focused: hotspots.isFocused(hotspot),
    });
    if (choice.risk) {
      painter.label({ x: rect.x + rect.w - 46, y: rect.y + 1, w: 42, h: 10 },
        `риск ${Math.round(choice.risk.chance * 100)}%`,
        { align: 'right', color: COLORS.healthHoarse });
    }
  });
}
