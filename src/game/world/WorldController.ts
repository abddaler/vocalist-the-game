import type { GameState, RoomDef, WorldPoint } from '@core/types';
import { DISTRICT, getRoom, hasRoom } from '@data/world';
import type { InputController } from '@platform/input';
import { spawnCrowd, updateCrowd } from './Crowd';
import type { CrowdActor } from './Crowd';
import { facingFrom } from './actorSprite';
import type { Facing } from './actorSprite';
import { districtLayer, roomLayer, solidsOf } from './layers';
import type { Layer } from './layers';
import { WALK_SPEED, centerOf, step, stepToward } from './movement';
import { withinReach } from './targets';
import type { WorldTarget } from './targets';
import { screenToWorld } from './WorldView';

/** Сколько миллисекунд длится половина затемнения при смене локации. */
const FADE_MS = 190;

export interface WorldDeps {
  readonly getState: () => GameState;
  readonly getLocationId: () => string | null;
  /** Сменить экран и локацию интерфейса. */
  readonly enterRoom: (locationId: string) => void;
  readonly leaveRoom: () => void;
  readonly openPoint: (pointId: string) => void;
  readonly markDirty: () => void;
}

/**
 * Ходьба, живность и переходы между локациями. Отделено от сцены, потому
 * что к симуляции всё это отношения не имеет: время на ходьбу не тратится
 * (раздел 4), а прохожие — чистое оформление.
 */
export class WorldController {
  position: WorldPoint = { ...DISTRICT.spawn };
  facing: Facing = 'down';
  walked = 0;
  moving = false;
  crowd: CrowdActor[] = spawnCrowd('district');

  private walkTarget: WorldPoint | null = null;
  /** Цель, к которой идём по тапу: дойдя, срабатываем сами. */
  private pendingTarget: WorldTarget | null = null;

  /**
   * Затемнение на входе и выходе. Мгновенная подмена картинки читается
   * как сбой, полсекунды темноты — как дверь.
   */
  private fade: { alpha: number; phase: 'idle' | 'out' | 'in'; action: (() => void) | null } = {
    alpha: 0,
    phase: 'idle',
    action: null,
  };

  constructor(private readonly deps: WorldDeps) {}

  reset(): void {
    this.position = { ...DISTRICT.spawn };
    this.facing = 'down';
    this.walkTarget = null;
    this.pendingTarget = null;
    this.crowd = spawnCrowd('district');
    this.fade = { alpha: 0, phase: 'idle', action: null };
  }

  get fadeAlpha(): number {
    return this.fade.alpha;
  }

  get fading(): boolean {
    return this.fade.phase !== 'idle';
  }

  private get room(): RoomDef | null {
    const id = this.deps.getLocationId();
    return id && hasRoom(id) ? getRoom(id) : null;
  }

  layer(): Layer {
    const room = this.room;
    return room ? roomLayer(room) : districtLayer(this.deps.getState());
  }

  /** Живность идёт и во время затемнения: замирающая комната выдаёт декорацию. */
  tick(delta: number, input: InputController, canWalk: boolean): void {
    updateCrowd(this.crowd, delta);
    this.deps.markDirty();

    if (this.fade.phase !== 'idle') {
      this.tickFade(delta);
      return;
    }
    if (canWalk) this.walk(delta, input);
  }

  private tickFade(delta: number): void {
    const speed = delta / FADE_MS;

    if (this.fade.phase === 'out') {
      this.fade.alpha = Math.min(1, this.fade.alpha + speed);
      if (this.fade.alpha >= 1) {
        this.fade.action?.();
        this.fade.action = null;
        this.fade.phase = 'in';
      }
      return;
    }

    this.fade.alpha = Math.max(0, this.fade.alpha - speed);
    if (this.fade.alpha <= 0) this.fade.phase = 'idle';
  }

  private walk(delta: number, input: InputController): void {
    const layer = this.layer();
    const solids = solidsOf(layer);
    const distance = (WALK_SPEED * delta) / 1000;
    const before = this.position;

    const { x, y } = input.move;
    if (x !== 0 || y !== 0) {
      // Клавиши отменяют цель, поставленную тапом.
      this.walkTarget = null;
      this.pendingTarget = null;
      const length = Math.hypot(x, y) || 1;
      this.position = step(
        before,
        (x / length) * distance,
        (y / length) * distance,
        solids,
        layer.bounds,
      );
    } else if (this.walkTarget) {
      const result = stepToward(before, this.walkTarget, distance, solids, layer.bounds);
      this.position = result.position;
      if (result.arrived) {
        this.walkTarget = null;
        const target = this.pendingTarget;
        this.pendingTarget = null;
        // Дошли — открываем. Если упёрлись и всё равно далеко, просто стоим.
        if (target && withinReach(this.position, target.rect)) this.enter(target);
      }
    }

    this.moving = this.position !== before;
    if (this.moving) {
      this.facing = facingFrom(before, this.position, this.facing);
      this.walked += Math.hypot(this.position.x - before.x, this.position.y - before.y);
    }
  }

  /** Тап по пустому месту — приказ идти туда. */
  walkTo(tap: WorldPoint): void {
    this.walkTarget = screenToWorld(tap, this.position, this.layer());
    this.pendingTarget = null;
  }

  /**
   * Тап по двери с другого конца улицы — это приказ дойти, а не телепорт:
   * иначе экран района снова превращается в меню.
   */
  activate(target: WorldTarget): void {
    if (withinReach(this.position, target.rect)) {
      this.enter(target);
      return;
    }
    this.walkTarget = centerOf(target.rect);
    this.pendingTarget = target;
  }

  private enter(target: WorldTarget): void {
    // Часы работы запирают дверь по-настоящему, а не только красят её.
    if (target.locked) return;

    if (target.kind === 'door') {
      const room = hasRoom(target.id) ? getRoom(target.id) : null;
      if (!room) return;
      this.transition(() => {
        this.position = { ...room.spawn };
        this.walkTarget = null;
        this.facing = 'up';
        this.crowd = spawnCrowd(target.id);
        this.deps.enterRoom(target.id);
      });
      return;
    }

    if (target.kind === 'exit') {
      const building = DISTRICT.buildings.find((b) => b.locationId === target.id);
      const door = building ? centerOf(building.door) : DISTRICT.spawn;
      this.transition(() => {
        this.position = { x: door.x, y: Math.min(DISTRICT.height, door.y + 30) };
        this.walkTarget = null;
        this.facing = 'down';
        this.crowd = spawnCrowd('district');
        this.deps.leaveRoom();
      });
      return;
    }

    this.deps.openPoint(target.id);
  }

  private transition(action: () => void): void {
    this.fade = { alpha: 0, phase: 'out', action };
  }
}
