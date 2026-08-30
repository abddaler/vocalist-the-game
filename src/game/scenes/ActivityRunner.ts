import { getActivity } from '@data/activities';
import type { Action } from '@core/state';
import { ACTIVITY_MS, CYCLE, moteOf } from '@ui/screens/ActivityScene';
import type { ActivityView } from '@ui/screens/ActivityScene';
import { PLAYER_LOOK, actorTexture } from '../art';
import type { Mote } from '@ui/screens/ActivityScene';

/**
 * Идущее дело. Действие уходит в редьюсер только в конце сцены: иначе
 * результат появился бы под анимацией, и она превратилась бы в
 * бессмысленную задержку поверх уже случившегося.
 *
 * Живёт отдельно от сцены, потому что это её собственное маленькое
 * состояние со своим временем, а не часть ввода или отрисовки.
 */
export class ActivityRunner {
  private current: { nameKey: string; mote: Mote; elapsed: number; action: Action } | null = null;

  get busy(): boolean {
    return this.current !== null;
  }

  reset(): void {
    this.current = null;
  }

  start(activityId: string, action: Action): void {
    this.current = {
      nameKey: getActivity(activityId).nameKey,
      mote: moteOf(activityId),
      elapsed: 0,
      action,
    };
  }

  /** Возвращает действие, когда сцена доиграла: сцене остаётся его отправить. */
  tick(deltaMs: number): Action | null {
    const current = this.current;
    if (!current) return null;

    current.elapsed += deltaMs;
    if (current.elapsed < ACTIVITY_MS) return null;

    this.current = null;
    return current.action;
  }

  view(): ActivityView | null {
    const current = this.current;
    if (!current) return null;

    return {
      nameKey: current.nameKey,
      mote: current.mote,
      progress: Math.min(1, current.elapsed / ACTIVITY_MS),
      elapsed: current.elapsed,
      // Кадр берётся из цикла своего дела: у пения их шесть, у сна два,
      // и такт у каждого свой. Один общий цикл на всё и был тем самым
      // топтанием на месте.
      actorTexture: actorTexture(PLAYER_LOOK, frameOf(current.mote, current.elapsed)),
    };
  }
}

/** Кадр цикла по такту дела. */
function frameOf(mote: Mote, elapsed: number): string {
  const { frames, ms } = CYCLE[mote];
  const step = Math.floor((elapsed / ms) * frames.length) % frames.length;
  return frames[step] as string;
}
