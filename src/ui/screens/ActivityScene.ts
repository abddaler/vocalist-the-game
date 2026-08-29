import type { GameState } from '@core/types';
import { t } from '../i18n';
import { COLORS, CONTENT, SCREEN } from '../theme';
import type { Painter } from '../widgets/Painter';

/**
 * Сцена занятия: пока идёт дело, экран не подменяется мгновенно новым
 * состоянием, а показывает, чем игрок занят.
 *
 * Секунда с небольшим — это не задержка ради задержки: раньше урок,
 * смена в ресторане и сон отличались только строчкой в журнале, и
 * тратить на них слот было решением вслепую. Теперь у каждого дела есть
 * свой вид, и день ощущается прожитым, а не пролистанным.
 */
export const ACTIVITY_MS = 1250;

/** Что вылетает из персонажа во время дела. */
export type Mote = 'note' | 'sleep' | 'sweat' | 'heart' | 'coin' | 'care' | 'spark';

/**
 * Значок по делу. Подбирается по идентификатору, а не задаётся в data:
 * это оформление, и правится оно здесь же, где рисуется.
 */
export function moteOf(activityId: string): Mote {
  if (activityId.startsWith('lesson_')) return 'note';
  switch (activityId) {
    case 'sleep':
    case 'home_rest':
    case 'vocal_rest':
      return 'sleep';
    case 'gym':
      return 'sweat';
    case 'networking':
      return 'heart';
    case 'restaurant_shift':
      return 'coin';
    case 'doctor_visit':
    case 'checkup':
    case 'tea_regimen':
      return 'care';
    case 'shopping':
      return 'spark';
    default:
      return 'note';
  }
}

const MOTE_COLOR: Readonly<Record<Mote, number>> = {
  note: 0x6ee8ff,
  sleep: 0xa8b4ff,
  sweat: 0x7fe0a0,
  heart: 0xff77d9,
  coin: 0xffd34d,
  care: 0x8fffc8,
  spark: 0xffb0f0,
};

/**
 * Такт дела в миллисекундах: сон качается медленно, зал — часто. Один
 * общий темп на всё превращал и сон, и тренировку в одинаковое
 * покачивание, по которому не отличить одно от другого.
 */
export const TEMPO: Readonly<Record<Mote, number>> = {
  note: 300,
  sleep: 620,
  sweat: 150,
  heart: 340,
  coin: 240,
  care: 480,
  spark: 260,
};

/** Дела, на которых персонаж работает телом, а не отдыхает. */
export const BUSY: Readonly<Record<Mote, boolean>> = {
  note: true,
  sleep: false,
  sweat: true,
  heart: true,
  coin: true,
  care: false,
  spark: true,
};

export interface ActivityView {
  readonly nameKey: string;
  readonly mote: Mote;
  /** Доля выполнения, 0..1. */
  readonly progress: number;
  /** Миллисекунды с начала: по ним живут значки. */
  readonly elapsed: number;
  readonly actorTexture: string;
}

/** Сколько длится въезд карточки: она должна появиться, а не возникнуть. */
const INTRO_MS = 180;

/** Плавность въезда: быстро в начале, мягко в конце. */
const ease = (k: number): number => 1 - (1 - k) * (1 - k);

export function renderActivity(
  painter: Painter,
  state: GameState,
  view: ActivityView,
): void {
  void state;
  // Карточка выезжает, а не возникает: мгновенная подмена кадра читается
  // сбоем, а не началом дела.
  const intro = ease(Math.min(1, view.elapsed / INTRO_MS));
  painter.fill(
    { x: 0, y: CONTENT.y, w: SCREEN.width, h: CONTENT.height },
    COLORS.bg,
    0.72 * intro,
  );

  const full = { x: 100, y: CONTENT.y + 40, w: SCREEN.width - 200, h: 112 };
  const grow = Math.round((1 - intro) * 14);
  const card = { x: full.x, y: full.y + grow, w: full.w, h: full.h - grow * 2 };
  painter.plate(card, COLORS.panel, COLORS.accent, true);
  if (intro < 1) return;

  painter.label({ x: card.x + 8, y: card.y + 8, w: card.w - 16, h: 12 }, t(view.nameKey), {
    align: 'center',
    color: COLORS.text,
  });

  // Персонаж дышит и слегка переминается: неподвижная фигурка выглядит
  // паузой, а не делом. Тень при этом остаётся на месте и сужается —
  // так подъём читается подъёмом, а не сползанием всей картинки.
  const beat = view.elapsed / TEMPO[view.mote];
  const bob = Math.round(Math.sin(beat) * 2);
  const sway = Math.round(Math.sin(beat / 2) * 1);
  const feetX = Math.round(card.x + card.w / 2);
  const feetY = card.y + 88;
  const width = 24 - Math.abs(bob) * 2;
  painter.fill({ x: feetX - width / 2, y: feetY - 1, w: width, h: 3 }, 0x000000, 0.3);
  painter.sprite(feetX + sway, feetY + bob, view.actorTexture, false);

  drawMotes(painter, view, feetX, feetY - 44);

  const track = { x: card.x + 14, y: card.y + card.h - 16, w: card.w - 28, h: 8 };
  painter.bar(track, view.progress, 1, MOTE_COLOR[view.mote]);
}

/** Значки поднимаются и тают, разведённые по фазе и по своим дорожкам. */
function drawMotes(painter: Painter, view: ActivityView, x: number, y: number): void {
  const color = MOTE_COLOR[view.mote];
  const lanes = [-30, 26, -18, 34, -40, 16];
  // Значки летят в том же такте, что и сам человек: иначе движение в
  // карточке идёт вразнобой.
  const cycle = TEMPO[view.mote] * 4;

  for (let i = 0; i < lanes.length; i += 1) {
    const phase = ((view.elapsed + (i * cycle) / lanes.length) % cycle) / cycle;
    const mx = Math.round(x + lanes[i]! + Math.sin(phase * 6.2 + i) * 5);
    const my = Math.round(y - phase * 40);
    const alpha = Math.min(1, phase * 6) * (1 - phase);
    if (alpha <= 0.05) continue;
    mote(painter, view.mote, mx, my, color, alpha);
  }
}

/** Значок рисуется вдвое крупнее сетки: на семи пикселях его не разобрать. */
const MOTE_SCALE = 2;

function mote(painter: Painter, kind: Mote, x: number, y: number, color: number, alpha: number): void {
  const dot = (dx: number, dy: number, w: number, h: number): void =>
    painter.fill(
      {
        x: x + dx * MOTE_SCALE,
        y: y + dy * MOTE_SCALE,
        w: w * MOTE_SCALE,
        h: h * MOTE_SCALE,
      },
      color,
      alpha,
    );

  switch (kind) {
    case 'note':
      dot(2, 0, 2, 7);
      dot(0, 5, 4, 3);
      dot(3, 0, 4, 2);
      return;
    case 'sleep':
      dot(0, 0, 6, 2);
      dot(3, 2, 2, 2);
      dot(1, 4, 2, 2);
      dot(0, 6, 6, 2);
      return;
    case 'sweat':
      dot(2, 0, 2, 3);
      dot(1, 3, 4, 4);
      dot(2, 7, 2, 1);
      return;
    case 'heart':
      dot(0, 1, 2, 2);
      dot(4, 1, 2, 2);
      dot(0, 3, 6, 2);
      dot(1, 5, 4, 1);
      dot(2, 6, 2, 1);
      return;
    case 'coin':
      dot(1, 0, 4, 1);
      dot(0, 1, 6, 4);
      dot(1, 5, 4, 1);
      dot(2, 2, 2, 2);
      return;
    case 'care':
      dot(2, 0, 2, 6);
      dot(0, 2, 6, 2);
      return;
    case 'spark':
      dot(2, 0, 2, 7);
      dot(0, 3, 7, 2);
      dot(1, 1, 1, 1);
      dot(5, 5, 1, 1);
      return;
  }
}
