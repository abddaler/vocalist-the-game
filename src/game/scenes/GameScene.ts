import Phaser from 'phaser';
import { Store, createInitialState } from '@core/state';
import type { Action } from '@core/state';
import type { GameState, GenreId, RoomDef, WorldPoint } from '@core/types';
import { DISTRICT, getRoom, hasRoom } from '@data/world';
import { CompositeInput, KeyboardInput, PointerInput } from '@platform/input';
import type { InputController } from '@platform/input';
import { saveGame } from '@platform/saveGame';
import type { SaveAdapter } from '@platform/SaveAdapter';
import { COLORS, SCREEN } from '@ui/theme';
import { Hotspots } from '@ui/widgets/Hotspots';
import { Painter } from '@ui/widgets/Painter';
import { renderCharacter } from '@ui/screens/CharacterScreen';
import { renderEventDialog } from '@ui/screens/EventDialog';
import { renderFinale } from '@ui/screens/FinaleScreen';
import { renderGig } from '@ui/screens/GigScreen';
import { renderHud } from '@ui/screens/Hud';
import { renderJournal } from '@ui/screens/JournalScreen';
import { renderNav } from '@ui/screens/Nav';
import { renderPoint } from '@ui/screens/PointScreen';
import { renderShop } from '@ui/screens/ShopScreen';
import { initialUiState } from '@ui/screens/types';
import type { RenderContext, UiState } from '@ui/screens/types';
import { buildActorTextures } from '../art';
import { spawnCrowd, updateCrowd } from '../world/Crowd';
import type { CrowdActor } from '../world/Crowd';
import { facingFrom } from '../world/actorSprite';
import type { Facing } from '../world/actorSprite';
import { WALK_SPEED, centerOf, step, stepToward } from '../world/movement';
import {
  districtLayer,
  renderWorld,
  roomLayer,
  screenToWorld,
  solidsOf,
  withinReach,
} from '../world/WorldView';
import type { WorldTarget } from '../world/WorldView';

/**
 * Игровая сцена: мир сверху, экраны интерфейса поверх него.
 *
 * Интерфейс собран на примитивах Phaser, а не на DOM-элементах: DOM не
 * участвует в зуме и потребовал бы знания о реальном размере окна, что
 * запрещено ограничением 2.3, а его сглаживание дерётся с pixelArt.
 */
export class GameScene extends Phaser.Scene {
  private store!: Store;
  private input$!: InputController;
  private painter!: Painter;
  /** Мир рисуется отдельным слоем: его обрезает маска игрового поля. */
  private worldPainter!: Painter;
  private hotspots!: Hotspots;

  private ui: UiState = initialUiState();
  private position: WorldPoint = { ...DISTRICT.spawn };
  private walkTarget: WorldPoint | null = null;
  /** Цель, к которой идём по тапу: дойдя, срабатываем сами. */
  private pendingTarget: WorldTarget | null = null;

  /**
   * Затемнение на входе и выходе. Мгновенная подмена картинки читается
   * как сбой; полсекунды темноты — как дверь.
   */
  private fade: { alpha: number; phase: 'idle' | 'out' | 'in'; action: (() => void) | null } = {
    alpha: 0,
    phase: 'idle',
    action: null,
  };

  private facing: Facing = 'down';
  private walked = 0;
  private moving = false;
  private crowd: CrowdActor[] = [];
  private dirty = true;
  private axis = { x: 0, y: 0 };

  private start: { state?: GameState; seed?: string; genre?: GenreId } = {};

  constructor() {
    super('game');
  }

  init(data: { state?: GameState; seed?: string; genre?: GenreId }): void {
    this.start = data ?? {};
    this.ui = initialUiState();
    this.position = { ...DISTRICT.spawn };
    this.walkTarget = null;
    this.pendingTarget = null;
    this.dirty = true;
  }

  create(): void {
    this.store = new Store(
      this.start.state ??
        createInitialState(this.start.seed ?? `run-${Date.now()}`, this.start.genre ?? 'pop'),
    );

    const sources: InputController[] = [new PointerInput(this.input)];
    if (this.input.keyboard) sources.push(new KeyboardInput(this.input.keyboard));
    this.input$ = new CompositeInput(sources);

    // Два слоя: мир снизу, интерфейс сверху. Внутри одного контейнера
    // порядок не разделить — все Text ложатся поверх общей Graphics.
    buildActorTextures(this);
    this.crowd = spawnCrowd('district');

    const worldLayer = this.add.container(0, 0);
    const uiLayer = this.add.container(0, 0);
    this.worldPainter = new Painter(this, worldLayer);
    this.painter = new Painter(this, uiLayer);
    this.hotspots = new Hotspots();

    this.store.subscribe((state) => {
      this.dirty = true;
      // Автосохранение после каждого действия: прогон на шестьдесят дней
      // нельзя терять из-за закрытой вкладки.
      void saveGame(this.registry.get('save') as SaveAdapter, state);
    });

    // Смена зума меняет разрешение, в котором рендерится текст,
    // поэтому поворот телефона требует полной перерисовки.
    this.scale.on(Phaser.Scale.Events.RESIZE, this.markDirty);
    this.game.events.on(Phaser.Core.Events.RESUME, this.markDirty);

    // Пишем сразу: иначе «Продолжить» не появится, пока игрок не сделает
    // первое действие, и начатый прогон потеряется от закрытой вкладки.
    void saveGame(this.registry.get('save') as SaveAdapter, this.store.getState());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.markDirty);
      this.game.events.off(Phaser.Core.Events.RESUME, this.markDirty);
      this.input$.destroy();
      this.worldPainter.destroy();
      this.painter.destroy();
    });
  }

  override update(_time: number, delta: number): void {
    this.input$.update();

    if (this.fade.phase !== 'idle') {
      this.tickFade(delta);
      updateCrowd(this.crowd, delta);
      this.render();
      return;
    }

    const inWorld = this.ui.screen === 'world' || this.ui.screen === 'room';
    if (inWorld) {
      // Жизнь локации идёт и пока игрок читает событие: замирающая
      // комната мгновенно выдаёт декорацию.
      updateCrowd(this.crowd, delta);
      this.dirty = true;
    }
    if (inWorld && !this.store.getState().events.pending) this.walk(delta);
    else this.handleFocusKeys();

    const onMiss = inWorld ? (tap: WorldPoint) => this.setWalkTarget(tap) : undefined;
    if (this.hotspots.handle(this.input$, onMiss)) this.dirty = true;
    if (this.input$.justPressed('cancel')) this.goBack();
    if (this.dirty) this.render();
  }

  // — мир —

  private get room(): RoomDef | null {
    const id = this.ui.locationId;
    return id && hasRoom(id) ? getRoom(id) : null;
  }

  private layer() {
    const room = this.room;
    return room ? roomLayer(room) : districtLayer(this.store.getState());
  }

  /**
   * Ходьба не тратит слоты (раздел 4) — она только меняет положение
   * персонажа, поэтому живёт целиком в сцене и симуляции не касается.
   */
  private walk(delta: number): void {
    const layer = this.layer();
    const solids = solidsOf(layer);
    const distance = (WALK_SPEED * delta) / 1000;
    const before = this.position;

    const { x, y } = this.input$.move;
    if (x !== 0 || y !== 0) {
      // Клавиши отменяют цель, поставленную тапом.
      this.walkTarget = null;
      const length = Math.hypot(x, y) || 1;
      this.position = step(before, (x / length) * distance, (y / length) * distance, solids, layer.bounds);
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
      this.dirty = true;
    }
  }

  private setWalkTarget(tap: WorldPoint): void {
    this.walkTarget = screenToWorld(tap, this.position, this.layer());
    this.pendingTarget = null;
  }

  /**
   * Тап по двери с другого конца улицы — это приказ дойти, а не телепорт:
   * иначе экран района снова превращается в меню.
   */
  private activate(target: WorldTarget): void {
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
        this.go({ screen: 'room', locationId: target.id, pointId: null, page: 0 });
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
        this.go({ screen: 'world', locationId: null, pointId: null, page: 0 });
      });
      return;
    }

    this.go({ screen: 'point', pointId: target.id, page: 0 });
  }

  // — интерфейс —

  private handleFocusKeys(): void {
    const { x, y } = this.input$.move;
    const stepY = y !== 0 && this.axis.y === 0 ? Math.sign(y) : 0;
    const stepX = x !== 0 && this.axis.x === 0 ? Math.sign(x) : 0;
    this.axis = { x, y };

    const delta = stepY || stepX;
    if (delta !== 0) {
      this.hotspots.moveFocus(delta);
      this.dirty = true;
    }
  }

  private goBack(): void {
    switch (this.ui.screen) {
      case 'gig':
      case 'shop':
        return this.go({ screen: 'point', venueId: null, page: 0 });
      case 'point':
        return this.go({ screen: this.ui.locationId ? 'room' : 'world', pointId: null, page: 0 });
      case 'character':
      case 'journal':
        return this.go({ screen: this.ui.locationId ? 'room' : 'world', page: 0 });
      default:
        return;
    }
  }

  private tickFade(delta: number): void {
    const speed = delta / 190;

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

  /** Смена локации всегда идёт через темноту. */
  private transition(action: () => void): void {
    this.fade = { alpha: 0, phase: 'out', action };
  }

  private markDirty = (): void => {
    this.dirty = true;
  };

  private go = (patch: Partial<UiState>): void => {
    this.ui = { ...this.ui, ...patch };
    this.dirty = true;
  };

  private dispatch = (action: Action): void => {
    this.store.dispatch(action);
  };

  private render(): void {
    this.dirty = false;
    this.worldPainter.clear();
    this.painter.clear();
    this.hotspots.clear();

    const state = this.store.getState();
    // Фон — в нижнем слое: из верхнего он закрасил бы весь мир.
    this.worldPainter.fill({ x: 0, y: 0, w: SCREEN.width, h: SCREEN.height }, COLORS.bg);

    const ctx: RenderContext = {
      painter: this.painter,
      hotspots: this.hotspots,
      state,
      ui: this.ui,
      dispatch: this.dispatch,
      go: this.go,
    };

    if (state.over) {
      renderFinale(ctx, () => this.scene.start('menu'));
      return;
    }

    if (this.fade.alpha > 0) {
      this.renderScreen(ctx);
      renderHud(this.painter, state);
      this.painter.fill({ x: 0, y: 0, w: SCREEN.width, h: SCREEN.height }, 0x000000, this.fade.alpha);
      return;
    }

    renderHud(this.painter, state);

    // Пока событие ждёт ответа, редьюсер блокирует всё остальное — значит
    // и рисовать под ним нечего.
    if (state.events.pending) {
      renderEventDialog(ctx);
      return;
    }

    this.renderScreen(ctx);
    renderNav(this.painter, this.hotspots, this.ui, this.go);

  }

  private renderScreen(ctx: RenderContext): void {
    switch (this.ui.screen) {
      case 'world':
      case 'room':
        return renderWorld(
          {
            painter: this.worldPainter,
            hotspots: this.hotspots,
            state: ctx.state,
            position: this.position,
            facing: this.facing,
            walked: this.walked,
            moving: this.moving,
            crowd: this.crowd,
            onActivate: (target) => this.activate(target),
            onWalk: (point) => (this.walkTarget = point),
          },
          this.layer(),
        );
      case 'point':
        return renderPoint(ctx);
      case 'gig':
        return renderGig(ctx);
      case 'shop':
        return renderShop(ctx);
      case 'character':
        return renderCharacter(ctx);
      case 'journal':
        return renderJournal(ctx);
    }
  }
}
