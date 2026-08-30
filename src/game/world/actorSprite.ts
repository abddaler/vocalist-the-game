import type { WorldPoint } from '@core/types';
import type { ActorPose } from '../art';

/**
 * Куда повёрнут человек. Стороны названы по экрану, а не по сетке: оси
 * плитки идут по диагоналям, и шаг «вправо по сетке» — это шаг вниз и
 * вправо по картинке.
 *
 * Отсюда и четыре стороны вместо анфаса, спины и профиля: в изометрии
 * нет направления, в котором человек виден строго спереди или строго
 * сбоку. Рисуются две, `se` и `ne`; `sw` и `nw` — их зеркала.
 *
 * Направление берётся из последнего заметного смещения: стоящий должен
 * сохранять поворот, а не сбрасываться лицом к игроку.
 */
export type Facing = 'se' | 'sw' | 'ne' | 'nw';

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

/** К камере идут те стороны, у которых экранный y растёт. */
const TOWARD: Readonly<Record<Facing, boolean>> = { se: true, sw: true, ne: false, nw: false };

/** Зеркалятся те, что идут влево по экрану. */
const MIRROR: Readonly<Record<Facing, boolean>> = { se: false, sw: true, ne: false, nw: true };

/**
 * Сторона по смещению — считается в проекции, а не в осях сетки.
 *
 * Сравнение осей сетки здесь не работает: клавиши двигают по осям
 * экрана, а это диагональ сетки, где обе оси меняются поровну. Ничья
 * доставалась одной и той же ветке, и с клавиатуры человек умел
 * поворачиваться только в две стороны из четырёх.
 *
 * В проекции всё прямо: экранный x равен (x − y), экранный y равен
 * (x + y). Вниз по экрану — к камере, влево — зеркало.
 */
export function facingFrom(from: WorldPoint, to: WorldPoint, previous: Facing): Facing {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) < MOVE_EPSILON && Math.abs(dy) < MOVE_EPSILON) return previous;

  const sx = dx - dy;
  const sy = dx + dy;
  // Ход строго поперёк экрана показывается лицом: спина при движении
  // вбок читается хуже, а выбор здесь всё равно произволен.
  const toward = sy >= 0;
  const left = Math.abs(sx) < MOVE_EPSILON ? MIRROR[previous] : sx < 0;
  return toward ? (left ? 'sw' : 'se') : left ? 'nw' : 'ne';
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
  const view = TOWARD[facing] ? 'se' : 'ne';

  // Контакты различимы: в одном впереди дальняя нога, в другом ближняя.
  // Из-за этого шаг и читается ходьбой, а не ножницами.
  const step = (['B', 'A', 'C', 'A'] as const)[phase] ?? 'A';
  const pose = `${view}${moving ? step : 'A'}` as ActorPose;
  return { pose, flipX: MIRROR[facing], lift: moving && passing ? 1 : 0 };
}

/**
 * Такт дыхания стоящего, мс. Неподвижная фигура читается паузой в игре,
 * а не человеком, который ждёт: подъём корпуса на пиксель раз в полсекунды
 * стоит одного числа и снимает это ощущение.
 */
const IDLE_MS = 560;

/** Дыхание: корпус стоящего поднимается на пиксель и опускается. */
export function idleBreath(look: ActorLook, clock: number): ActorLook {
  return { ...look, lift: clock % IDLE_MS < IDLE_MS / 2 ? 0 : 1 };
}

/**
 * Такт севшего голоса, мс. Медленнее дыхания: усталость не частит.
 */
const WORN_MS = 700;

/**
 * Кадр севшего голоса: сутулость и рука у горла. Игрок должен видеть
 * состояние связок на человеке — полоску в углу не замечают, пока не
 * станет поздно.
 */
export function wornLook(clock: number): ActorLook {
  const second = clock % WORN_MS >= WORN_MS / 2;
  return { pose: (second ? 'wornB' : 'wornA') as ActorPose, flipX: false, lift: second ? 1 : 0 };
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
