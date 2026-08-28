import type { WorldPoint } from '@core/types';
import type { ActorPose } from '../art';

/**
 * Какой кадр показать. Направление берётся из последнего заметного
 * смещения: стоящий персонаж должен сохранять поворот, а не сбрасываться
 * лицом к игроку.
 */
export type Facing = 'down' | 'up' | 'left' | 'right';

export interface ActorLook {
  readonly pose: ActorPose;
  readonly flipX: boolean;
}

const MOVE_EPSILON = 0.05;

export function facingFrom(from: WorldPoint, to: WorldPoint, previous: Facing): Facing {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) < MOVE_EPSILON && Math.abs(dy) < MOVE_EPSILON) return previous;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

/** Шаг анимации: чередует два кадра по пройденному пути, а не по времени. */
export function lookFor(facing: Facing, walked: number, moving: boolean): ActorLook {
  const step = moving && Math.floor(walked / 7) % 2 === 1 ? 'B' : 'A';

  switch (facing) {
    case 'up':
      return { pose: `up${step}` as ActorPose, flipX: false };
    case 'left':
      return { pose: `side${step}` as ActorPose, flipX: true };
    case 'right':
      return { pose: `side${step}` as ActorPose, flipX: false };
    default:
      return { pose: `down${step}` as ActorPose, flipX: false };
  }
}
