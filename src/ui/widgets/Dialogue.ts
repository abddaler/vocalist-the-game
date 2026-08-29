import { PORTRAIT_SIZE, PORTRAIT_TEXTURE, portraitFrame } from '../../game/art/portrait';
import { COLORS } from '../theme';
import type { Painter } from './Painter';
import type { Rect } from './Hotspots';

/**
 * Шапка разговора и облако реплики. Событие без собеседника — это
 * карточка с текстом; событие с портретом, именем и полосой отношений —
 * разговор с человеком, которого игрок знает. Разница в четыре десятка
 * строк, а ощущение от игры разное.
 *
 * Обе части выделены сюда, потому что диалог нужен не только событию:
 * тот же блок пойдёт в разговор на точке и в исход концерта.
 */
export interface Speaker {
  /** Индекс внешности: портрет и фигура на улице — один и тот же человек. */
  readonly look: number;
  readonly name: string;
  readonly role: string;
  /** Отношение 0..100. */
  readonly relation: number;
  /** Игрок ещё не знаком: полоса отношений тогда не показывается. */
  readonly met: boolean;
}

const HEADER = {
  /** Рамка вокруг портрета. */
  frame: 2,
  gap: 6,
  nameH: 12,
  roleH: 10,
  barH: 5,
  barW: 84,
} as const;

/** Высота шапки: портрет плюс его рамка. */
export const SPEAKER_HEIGHT = PORTRAIT_SIZE + HEADER.frame * 2;

/**
 * Портрет, имя, роль и отношение. Возвращает низ шапки, чтобы вызывающий
 * не пересчитывал ту же высоту у себя.
 */
export function drawSpeaker(painter: Painter, at: Rect, speaker: Speaker): number {
  const box = { x: at.x, y: at.y, w: SPEAKER_HEIGHT, h: SPEAKER_HEIGHT };
  painter.plate(box, COLORS.panelDeep, COLORS.border);
  painter.stamp(box.x + HEADER.frame, box.y + HEADER.frame, PORTRAIT_TEXTURE, portraitFrame(speaker.look));

  const textX = box.x + box.w + HEADER.gap;
  const textW = at.x + at.w - textX;
  painter.label({ x: textX, y: at.y, w: textW, h: HEADER.nameH }, speaker.name, {
    color: COLORS.accent,
  });
  painter.label({ x: textX, y: at.y + HEADER.nameH, w: textW, h: HEADER.roleH }, speaker.role, {
    color: COLORS.textMuted,
  });

  // Полоса отношений — единственное место, где игрок видит, во что
  // сложились его прошлые ответы этому человеку.
  if (speaker.met) {
    painter.bar(
      { x: textX, y: at.y + HEADER.nameH + HEADER.roleH + 3, w: Math.min(HEADER.barW, textW), h: HEADER.barH },
      speaker.relation,
      100,
      COLORS.mood,
    );
  }

  return at.y + SPEAKER_HEIGHT;
}

const SPEECH = {
  pad: 5,
  fill: 0xf2eff5,
  border: 0x14161c,
  text: 0x241c38,
} as const;

/**
 * Реплика в светлом облаке. Тёмная панель с белым текстом — это
 * описание от игры; светлое облако с тёмным текстом читается как чужие
 * слова, и разговор отделяется от справки без единой подписи.
 */
export function drawSpeech(painter: Painter, at: Rect, text: string): void {
  painter.plate(at, SPEECH.fill, SPEECH.border);
  painter.label(
    { x: at.x + SPEECH.pad, y: at.y + SPEECH.pad, w: at.w - SPEECH.pad * 2, h: at.h - SPEECH.pad * 2 },
    text,
    { wrapWidth: at.w - SPEECH.pad * 2, color: SPEECH.text },
  );
}
