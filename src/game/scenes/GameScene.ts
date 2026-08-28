import Phaser from 'phaser';
import { Store, createInitialState } from '@core/state';
import type { Action } from '@core/state';
import type { GameState, GenreId, WorldPoint } from '@core/types';
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
import { WorldController, renderWorld } from '../world';

/**
 * Игровая сцена: состояние, ввод и отрисовка. Ходьба, живность и переходы
 * вынесены в WorldController — они к симуляции отношения не имеют.
 *
 * Интерфейс собран на примитивах Phaser, а не на DOM-элементах: DOM не
 * участвует в зуме и потребовал бы знания о реальном размере окна, что
 * запрещено ограничением 2.3, а его сглаживание дерётся с pixelArt.
 */
export class GameScene extends Phaser.Scene {
  private store!: Store;
  private input$!: InputController;
  /** Мир и интерфейс — разные слои: внутри одного порядок не разделить. */
  private worldPainter!: Painter;
  private painter!: Painter;
  private hotspots!: Hotspots;
  private world!: WorldController;

  private ui: UiState = initialUiState();
  private dirty = true;
  private axis = { x: 0, y: 0 };
  private start: { state?: GameState; seed?: string; genre?: GenreId } = {};

  constructor() {
    super('game');
  }

  init(data: { state?: GameState; seed?: string; genre?: GenreId }): void {
    this.start = data ?? {};
    this.ui = initialUiState();
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

    buildActorTextures(this);
    this.world = new WorldController({
      getState: () => this.store.getState(),
      getLocationId: () => this.ui.locationId,
      enterRoom: (locationId) =>
        this.go({ screen: 'room', locationId, pointId: null, page: 0 }),
      leaveRoom: () => this.go({ screen: 'world', locationId: null, pointId: null, page: 0 }),
      openPoint: (pointId) => this.go({ screen: 'point', pointId, page: 0 }),
      markDirty: this.markDirty,
    });
    this.world.reset();

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

    // Пишем сразу: иначе «Продолжить» не появится, пока игрок не сделает
    // первое действие, и начатый прогон потеряется от закрытой вкладки.
    void saveGame(this.registry.get('save') as SaveAdapter, this.store.getState());

    // Смена зума меняет разрешение, в котором рендерится текст.
    this.scale.on(Phaser.Scale.Events.RESIZE, this.markDirty);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.markDirty);
      this.input$.destroy();
      this.worldPainter.destroy();
      this.painter.destroy();
    });
  }

  override update(_time: number, delta: number): void {
    this.input$.update();

    const inWorld = this.ui.screen === 'world' || this.ui.screen === 'room';
    if (inWorld) {
      this.world.tick(delta, this.input$, !this.store.getState().events.pending);
      if (this.world.fading) {
        this.render();
        return;
      }
    } else {
      this.handleFocusKeys();
    }

    const onMiss = inWorld ? (tap: WorldPoint) => this.world.walkTo(tap) : undefined;
    if (this.hotspots.handle(this.input$, onMiss)) this.dirty = true;
    if (this.input$.justPressed('cancel')) this.goBack();
    if (this.dirty) this.render();
  }

  /** Стрелки двигают фокус — то же, что делается тапом (ограничение 2.2). */
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

    if (this.world.fadeAlpha > 0) {
      this.renderScreen(ctx);
      renderHud(this.painter, state);
      this.painter.fill(
        { x: 0, y: 0, w: SCREEN.width, h: SCREEN.height },
        0x000000,
        this.world.fadeAlpha,
      );
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
            position: this.world.position,
            facing: this.world.facing,
            walked: this.world.walked,
            moving: this.world.moving,
            crowd: this.world.crowd,
            onActivate: (target) => this.world.activate(target),
            onWalk: (point) => this.world.walkTo(point),
          },
          this.world.layer(),
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
