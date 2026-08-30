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
  /** На сколько пикселей приподнят корпус в этой фазе шага. */
  readonly lift: number;
}

const MOVE_EPSILON = 0.05;

/**
 * Длина одной фазы шага в плитках. Раньше здесь стояли семь — число из
 * тех времён, когда мир мерился пикселями. В плитках это значило смену
 * кадра раз в две с половиной секунды: человек ехал по улице, изредка
 * переставляя ноги.
 */
const STEP_TILES = 0.55;

/** Порядок фаз: контакт, пронос, контакт другой ногой, пронос. */
const PHASES = 4;

export function facingFrom(from: WorldPoint, to: WorldPoint, previous: Facing): Facing {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) < MOVE_EPSILON && Math.abs(dy) < MOVE_EPSILON) return previous;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

/**
 * Кадр шага по пройденному пути, а не по времени: тогда медленный
 * прохожий и переставляет ноги медленнее, а не семенит на месте.
 *
 * На проносе корпус приподнят на пиксель. Без этого подскока ноги
 * двигаются, а человек едет: походка держится не на ногах, а на том, что
 * при переносе веса он выше, чем в момент касания.
 */
export function lookFor(facing: Facing, walked: number, moving: boolean): ActorLook {
  const phase = moving ? Math.floor(walked / STEP_TILES) % PHASES : 0;
  const passing = phase % 2 === 1;
  const lift = passing ? 1 : 0;

  if (facing === 'up' || facing === 'down') {
    const step = passing ? 'A' : 'B';
    const pose = `${facing === 'up' ? 'up' : 'down'}${moving ? step : 'A'}` as ActorPose;
    return { pose, flipX: false, lift: moving ? lift : 0 };
  }

  // В профиль контакты различимы: в первом впереди ближняя нога, в
  // третьем — дальняя. Из-за этого профиль и читается ходьбой, а не
  // ножницами.
  const side = !moving ? 'sideA' : (['sideB', 'sideA', 'sideC', 'sideA'] as const)[phase]!;
  return { pose: side as ActorPose, flipX: facing === 'left', lift: moving ? lift : 0 };
}

/**
 * Такт разговора: два кадра за это время, мс. Реплика идёт медленнее
 * шага — человек, машущий рукой в темпе ходьбы, выглядит не говорящим,
 * а отгоняющим осу.
 */
const TALK_MS = 520;

/**
 * Кадр разговора, пока над головой висит пузырь. Даётся только тем, у
 * кого позы дела вообще собраны, — прохожему они не строятся, и он
 * молча стоит, как стоял.
 */
export function talkLook(age: number): ActorLook {
  const second = age % TALK_MS >= TALK_MS / 2;
  return { pose: (second ? 'talkB' : 'talkA') as ActorPose, flipX: false, lift: second ? 0 : 1 };
}
