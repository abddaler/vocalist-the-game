import { SLOTS } from '@core/types';
import type { DistrictId, GameState, RoomDef, WorldPoint } from '@core/types';
import {
  HOME_DISTRICT,
  districtOfLocation,
  getDistrict,
  getRoom,
  hasRoom,
} from '@data/world';
import type { InputController } from '@platform/input';
import { spawnCrowd, updateCrowd } from './Crowd';
import type { CrowdActor } from './Crowd';
import { facingFrom } from './actorSprite';
import type { Facing } from './actorSprite';
import { districtLayer, doorOf, groundOf, roomLayer, solidsOf } from './layers';
import type { Layer } from './layers';
import { ACTOR, WALK_SPEED, centerOf, step, stepToward } from './movement';
import { groundBelow, stairRoute } from './terrain';
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
  /** В каком районе игрок стоит. Это оформление, поэтому не в GameState. */
  districtId: DistrictId = HOME_DISTRICT;
  position: WorldPoint = { ...getDistrict(HOME_DISTRICT).spawn };
  facing: Facing = 'down';
  walked = 0;
  moving = false;
  crowd: CrowdActor[] = spawnCrowd(HOME_DISTRICT);

  /**
   * Путь до цели по точкам. Одной точки мало: улица — коридор между
   * двумя рядами домов, и попытка идти к двери напрямую упирается в угол
   * соседнего дома, после чего ходьба глохнет в метре от цели.
   */
  private route: WorldPoint[] = [];
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
    this.districtId = HOME_DISTRICT;
    this.position = { ...getDistrict(HOME_DISTRICT).spawn };
    this.facing = 'down';
    this.route = [];
    this.pendingTarget = null;
    this.crowd = spawnCrowd(HOME_DISTRICT);
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
    const state = this.deps.getState();
    const slot = SLOTS[state.slotIndex] ?? 'morning';
    const room = this.room;
    return room ? roomLayer(room, slot) : districtLayer(state, this.districtId);
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
    const ground = groundOf(layer);
    const distance = (WALK_SPEED * delta) / 1000;
    const before = this.position;

    const { x, y } = input.move;
    if (x !== 0 || y !== 0) {
      // Клавиши отменяют цель, поставленную тапом.
      this.route = [];
      this.pendingTarget = null;
      const length = Math.hypot(x, y) || 1;
      this.position = step(
        before,
        (x / length) * distance,
        (y / length) * distance,
        solids,
        layer.bounds,
        ground,
      );
    } else if (this.route.length > 0) {
      const result = stepToward(before, this.route[0]!, distance, solids, layer.bounds, ground);
      this.position = result.position;
      if (result.arrived) {
        this.route.shift();
        if (this.route.length === 0) {
          const target = this.pendingTarget;
          this.pendingTarget = null;
          // Дошли — открываем. Если упёрлись и всё равно далеко, просто стоим.
          if (target && withinReach(this.position, target.rect)) this.enter(target);
        }
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
    const layer = this.layer();
    const goal = screenToWorld(tap, this.position, layer);
    this.route = [...stairRoute(layer.terrain, this.position, goal), goal];
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
    // Сначала спуск или подъём по ближайшей лестнице, если цель на другом
    // ярусе; потом вдоль улицы до нужной колонки и только потом поперёк к
    // самой цели — иначе путь упирается в угол соседнего дома.
    const layer = this.layer();
    const center = centerOf(target.rect);
    const legs = stairRoute(layer.terrain, this.position, center);
    const from = legs.at(-1) ?? this.position;
    this.route = [...legs, { x: center.x, y: from.y }, center];
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
        this.route = [];
        this.facing = 'up';
        this.crowd = spawnCrowd(target.id);
        this.deps.enterRoom(target.id);
      });
      return;
    }

    if (target.kind === 'exit') {
      const district = districtOfLocation(target.id) ?? getDistrict(this.districtId);
      const door = doorOf(district, target.id);
      const at = door ? centerOf(door) : district.spawn;
      // Вышедший встаёт на первую плиту под дверью, а не на глазок ниже:
      // под дверью может быть обрыв, и тогда он окажется в воздухе.
      const below = door ? door.y + door.h + ACTOR.h : district.spawn.y;
      const feet = groundBelow(district.terrain, at.x, below, district.height);
      this.transition(() => {
        this.districtId = district.id;
        this.position = { x: at.x, y: feet ?? district.spawn.y };
        this.route = [];
        this.facing = 'down';
        this.crowd = spawnCrowd(district.id);
        this.deps.leaveRoom();
      });
      return;
    }

    if (target.kind === 'gate') {
      this.travelTo(target.id as DistrictId);
      return;
    }

    this.deps.openPoint(target.id);
  }

  /**
   * Смена района. Через створ игрок выходит с той стороны, с которой
   * пришёл; с карты — на площадь района, потому что «откуда» там нет.
   */
  travelTo(to: DistrictId, throughGate = true): void {
    if (to === this.districtId) return;
    const from = this.districtId;
    const next = getDistrict(to);

    this.transition(() => {
      this.districtId = to;
      this.position = throughGate ? arrival(next, from) : { ...next.spawn };
      this.route = [];
      this.pendingTarget = null;
      this.facing = 'down';
      this.crowd = spawnCrowd(to);
      this.deps.leaveRoom();
    });
  }

  private transition(action: () => void): void {
    this.fade = { alpha: 0, phase: 'out', action };
  }
}

/**
 * Где игрок оказывается, придя из соседнего района: у створа, ведущего
 * назад, но на шаг в сторону улицы — иначе он тут же уйдёт обратно.
 */
function arrival(district: ReturnType<typeof getDistrict>, from: DistrictId): WorldPoint {
  const back = district.gates.find((gate) => gate.to === from);
  if (!back) return { ...district.spawn };
  const center = centerOf(back.rect);
  const inward = center.x < district.width / 2 ? 22 : -22;
  const x = center.x + inward;
  const feet = groundBelow(district.terrain, x, center.y, district.height);
  return { x, y: feet ?? district.spawn.y };
}
