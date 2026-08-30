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
import { facingCamera, facingFrom } from './actorSprite';
import type { Facing } from './actorSprite';
import { blockedIn, districtScene, doorOf, roomScene } from './iso/scene';
import type { IsoScene } from './iso/scene';
import { WALK_TILES, centerOf, step, stepToward, withinReach } from './iso/walk';
import { findPath, freeSpotNear } from './iso/route';
import type { WorldTarget } from './targets';
import { screenToWorld } from './iso/view';

/** Сколько миллисекунд длится половина затемнения при смене локации. */
const FADE_MS = 190;

/**
 * Через сколько стоящий поворачивается к зрителю, мс. Не сразу: разворот
 * в тот же миг, как отпустили клавишу, читается сбоем, а не человеком,
 * который остановился и огляделся.
 */
const TURN_MS = 900;

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
  facing: Facing = 'se';
  walked = 0;
  moving = false;
  /** Сколько человек стоит на месте, мс: по этому он разворачивается. */
  private still = 0;
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
    this.facing = 'se';
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

  scene(): IsoScene {
    const state = this.deps.getState();
    const slot = SLOTS[state.slotIndex] ?? 'morning';
    const room = this.room;
    return room ? roomScene(room, slot) : districtScene(state, this.districtId);
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
    const scene = this.scene();
    const blocked = blockedIn(scene);
    const distance = (WALK_TILES * delta) / 1000;
    const before = this.position;

    const { x, y } = input.move;
    if (x !== 0 || y !== 0) {
      // Клавиши отменяют цель, поставленную тапом. Экранные оси
      // переводятся в оси сетки: «вправо» на экране — это вдоль улицы.
      this.route = [];
      this.pendingTarget = null;
      const length = Math.hypot(x, y) || 1;
      const ax = (x / length + y / length) / 2;
      const ay = (y / length - x / length) / 2;
      this.position = step(scene.map, before, ax * distance * 1.4, ay * distance * 1.4, blocked);
    } else if (this.route.length > 0) {
      const result = stepToward(scene.map, before, this.route[0]!, distance, blocked);
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
      this.still = 0;
      this.facing = facingFrom(before, this.position, this.facing);
      this.walked += Math.hypot(this.position.x - before.x, this.position.y - before.y);
      return;
    }

    // Постоял — повернулся к зрителю. Пришедший «сверху» иначе стоит
    // затылком до самого следующего шага.
    this.still += delta;
    if (this.still >= TURN_MS) this.facing = facingCamera(this.facing);
  }

  /** Тап по пустому месту — приказ идти туда. */
  walkTo(tap: WorldPoint): void {
    const scene = this.scene();
    const goal = screenToWorld(tap, this.position, scene);
    this.route = findPath(scene, this.position, freeSpotNear(scene, goal, this.position));
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
    // Идём не в саму цель, а на свободную плитку рядом с ней: дверь и
    // стойка стоят в стене, внутрь них ходить некуда. Путь ищется по
    // сетке — иначе дорогу перекрывает первый же лоток.
    const scene = this.scene();
    const goal = freeSpotNear(scene, centerOf(target.rect), this.position);
    this.route = findPath(scene, this.position, goal);
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
        // Вошедший смотрит вглубь комнаты, а не в дверь, из которой вышел.
        this.facing = 'ne';
        this.crowd = spawnCrowd(target.id);
        this.deps.enterRoom(target.id);
      });
      return;
    }

    if (target.kind === 'exit') {
      const district = districtOfLocation(target.id) ?? getDistrict(this.districtId);
      const door = doorOf(district, target.id);
      const at = door ? centerOf(door) : district.spawn;
      // Вышедший встаёт на свободную плитку перед дверью, а не в стену.
      this.transition(() => {
        this.districtId = district.id;
        this.position = freeSpotNear(districtScene(this.deps.getState(), district.id), at, {
          x: at.x,
          y: at.y + 2,
        });
        this.route = [];
        // Вышедший отворачивается от фасада, к камере.
        this.facing = 'se';
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
      this.facing = 'se';
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
  // На шаг внутрь квартала, иначе пришедший тут же уйдёт обратно.
  const inward = center.x < 4 ? 2 : -2;
  return { x: center.x + inward, y: center.y };
}
