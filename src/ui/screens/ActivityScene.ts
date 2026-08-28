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

export interface ActivityView {
  readonly nameKey: string;
  readonly mote: Mote;
  /** Доля выполнения, 0..1. */
  readonly progress: number;
  /** Миллисекунды с начала: по ним живут значки. */
  readonly elapsed: number;
  readonly actorTexture: string;
}

export function renderActivity(
  painter: Painter,
  state: GameState,
  view: ActivityView,
): void {
  void state;
  painter.fill({ x: 0, y: CONTENT.y, w: SCREEN.width, h: CONTENT.height }, COLORS.bg, 0.72);

  const card = { x: 100, y: CONTENT.y + 40, w: SCREEN.width - 200, h: 112 };
  painter.plate(card, COLORS.panel, COLORS.accent, true);

  painter.label({ x: card.x + 8, y: card.y + 8, w: card.w - 16, h: 12 }, t(view.nameKey), {
    align: 'center',
    color: COLORS.text,
  });

  // Персонаж покачивается: неподвижная фигурка выглядит паузой, а не делом.
  const bob = Math.round(Math.sin(view.elapsed / 130) * 2);
  const feetX = Math.round(card.x + card.w / 2);
  const feetY = card.y + 78 + bob;
  painter.fill({ x: feetX - 14, y: feetY - 1, w: 28, h: 3 }, 0x000000, 0.3);
  painter.sprite(feetX, feetY, view.actorTexture, false, 2);

  drawMotes(painter, view, feetX, feetY);

  const track = { x: card.x + 14, y: card.y + card.h - 16, w: card.w - 28, h: 8 };
  painter.bar(track, view.progress, 1, MOTE_COLOR[view.mote]);
}

/** Значки поднимаются и тают: три штуки, разведённые по фазе. */
function drawMotes(painter: Painter, view: ActivityView, x: number, y: number): void {
  const color = MOTE_COLOR[view.mote];

  const lanes = [-26, 24, -14, 32];
  for (let i = 0; i < lanes.length; i += 1) {
    const phase = ((view.elapsed + i * 260) % 1040) / 1040;
    const mx = Math.round(x + lanes[i]! + Math.sin(phase * 6.2 + i) * 5);
    const my = Math.round(y - 40 - phase * 34);
    const alpha = 1 - phase;
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
