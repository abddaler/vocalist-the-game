import { crowdIn } from '@data/world';
import type { CrowdMember } from '@data/world';
import { Rng } from '@core/rng';
import type { WorldPoint } from '@core/types';
import { facingFrom } from './actorSprite';
import type { Facing } from './actorSprite';

/**
 * Живность локации: ходит по своему маршруту и стоит на точках.
 * На симуляцию не влияет ничем — это оформление, поэтому и живёт
 * в game/, а не в core/.
 */
export interface CrowdActor {
  readonly member: CrowdMember;
  position: WorldPoint;
  /** Индекс точки маршрута, к которой идём. */
  next: number;
  /** Сколько ещё стоять на месте, мс. */
  wait: number;
  facing: Facing;
  walked: number;
  moving: boolean;
  /** Пузырь над головой или его отсутствие. */
  mood: Mood | null;
  /** Сколько ещё до следующего пузыря, мс. */
  moodIn: number;
  /**
   * Свой ГПСЧ на человека. Один общий сбил бы всю толпу в такт, как
   * только у кого-то сместилась пауза, а Math.random в проекте запрещён.
   */
  readonly rng: Rng;
}

/** Пузырь: какой значок и сколько он уже висит. */
export interface Mood {
  readonly icon: string;
  age: number;
}

/**
 * Пузыри над головами. Идут двумя наборами: у идущего мысли о дороге,
 * у стоящего — о том месте, где он стоит. Разделение бесплатное, а толпа
 * от него перестаёт выглядеть набором одинаковых реакций.
 */
const WALKING = ['note', 'idea', 'question', 'money'] as const;
const STANDING = ['laugh', 'heart', 'drink', 'star', 'sleep', 'annoyed'] as const;

const BUBBLE = {
  /** Сколько пузырь держится, мс. */
  life: 2400,
  /** Границы паузы между пузырями, мс. */
  gapMin: 3400,
  gapMax: 12000,
} as const;

export function spawnCrowd(locationId: string): CrowdActor[] {
  return crowdIn(locationId).map((member, index) => ({
    member,
    position: { ...(member.path[0] as WorldPoint) },
    next: member.path.length > 1 ? 1 : 0,
    // Разводим паузы, иначе вся локация шагает в ногу.
    wait: (index * 370) % 1500,
    facing: 'down',
    walked: 0,
    moving: false,
    mood: null,
    // Первый пузырь не сразу: иначе вся улица вспыхивает пузырями
    // в момент входа.
    moodIn: BUBBLE.gapMin + ((index * 1730) % BUBBLE.gapMax),
    rng: new Rng(`${locationId}:crowd:${index}`),
  }));
}

export function updateCrowd(actors: readonly CrowdActor[], deltaMs: number): void {
  for (const actor of actors) {
    advance(actor, deltaMs);
    think(actor, deltaMs);
  }
}

/** Отсчёт пузыря: висит своё время, потом пауза до следующего. */
function think(actor: CrowdActor, deltaMs: number): void {
  if (actor.mood) {
    actor.mood.age += deltaMs;
    if (actor.mood.age >= BUBBLE.life) {
      actor.mood = null;
      actor.moodIn = actor.rng.range(BUBBLE.gapMin, BUBBLE.gapMax);
    }
    return;
  }

  actor.moodIn -= deltaMs;
  if (actor.moodIn > 0) return;
  const icons = actor.moving ? WALKING : STANDING;
  actor.mood = { icon: actor.rng.pick(icons), age: 0 };
}

function advance(actor: CrowdActor, deltaMs: number): void {
  const { path, speed, dwell } = actor.member;

  if (path.length < 2 || speed <= 0) {
    actor.moving = false;
    return;
  }

  if (actor.wait > 0) {
    actor.wait -= deltaMs;
    actor.moving = false;
    return;
  }

  const target = path[actor.next] as WorldPoint;
  const dx = target.x - actor.position.x;
  const dy = target.y - actor.position.y;
  const distance = Math.hypot(dx, dy);
  const stride = (speed * deltaMs) / 1000;

  if (distance <= stride) {
    actor.position = { ...target };
    actor.next = (actor.next + 1) % path.length;
    actor.wait = dwell;
    actor.moving = false;
    return;
  }

  const before = actor.position;
  const moved = { x: before.x + (dx / distance) * stride, y: before.y + (dy / distance) * stride };
  actor.facing = facingFrom(before, moved, actor.facing);
  actor.position = moved;
  actor.walked += stride;
  actor.moving = true;
}
