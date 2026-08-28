import { crowdIn } from '@data/world';
import type { CrowdMember } from '@data/world';
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
}

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
  }));
}

export function updateCrowd(actors: readonly CrowdActor[], deltaMs: number): void {
  for (const actor of actors) advance(actor, deltaMs);
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
