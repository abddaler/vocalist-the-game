import { getEvent } from '@data/events';
import { resolveEventChoice } from '@core/state';
import { availableChoices, speakerOf } from '@core/systems/events';
import { lookIndex } from '../../game/art';
import { t } from '../i18n';
import { COLORS, LAYOUT, SCREEN } from '../theme';
import { SPEAKER_HEIGHT, drawSpeaker, drawSpeech } from '../widgets/Dialogue';
import type { Speaker } from '../widgets/Dialogue';
import type { RenderContext } from './types';

/**
 * Модальный диалог события (9.4). Пока он висит, игра стоит: редьюсер
 * блокирует все прочие действия, поэтому и в интерфейсе он перекрывает всё.
 *
 * Если событие про конкретного человека, оно и показывается разговором:
 * портрет, имя, роль, отношение и реплика в облаке. Без собеседника
 * остаётся заголовок и текст — так выглядит происшествие, а не встреча.
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

  const inner = { x: dialog.x + 10, y: dialog.y + 8, w: dialog.w - 20 };
  const npc = speakerOf(event);
  const speaker: Speaker | null = npc
    ? {
        look: lookIndex(npc),
        name: t(`npc.${npc}`),
        role: t(`npc.${npc}.role`),
        relation: state.npcs[npc].relation,
        met: state.npcs[npc].met,
      }
    : null;

  let top: number;
  if (speaker) {
    top = drawSpeaker(painter, { ...inner, h: SPEAKER_HEIGHT }, speaker) + 6;
  } else {
    painter.label({ ...inner, h: 14 }, t(event.titleKey), { color: COLORS.accent });
    top = inner.y + 18;
  }

  const buttonH = 22;
  const bottom = dialog.y + dialog.h - LAYOUT.padding;
  const speech = { ...inner, y: top, h: bottom - choices.length * (buttonH + 4) - top - 4 };
  if (speaker) drawSpeech(painter, speech, t(event.textKey));
  else painter.label(speech, t(event.textKey), { wrapWidth: speech.w, color: COLORS.text });

  choices.forEach((choice, index) => {
    const rect = {
      x: inner.x,
      y: bottom - (choices.length - index) * (buttonH + 4),
      w: inner.w,
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
