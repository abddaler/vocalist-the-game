import Phaser from 'phaser';
import { Store, createInitialState } from '@core/state';
import type { Action } from '@core/state';
import { CompositeInput, KeyboardInput, PointerInput } from '@platform/input';
import type { InputController } from '@platform/input';
import { t } from '@ui/i18n';
import { COLORS, SCREEN } from '@ui/theme';
import { Hotspots } from '@ui/widgets/Hotspots';
import { Painter } from '@ui/widgets/Painter';
import { renderCharacter } from '@ui/screens/CharacterScreen';
import { renderDistrict } from '@ui/screens/DistrictScreen';
import { renderEventDialog } from '@ui/screens/EventDialog';
import { renderGig } from '@ui/screens/GigScreen';
import { renderHud } from '@ui/screens/Hud';
import { renderJournal } from '@ui/screens/JournalScreen';
import { renderLocation } from '@ui/screens/LocationScreen';
import { renderNav } from '@ui/screens/Nav';
import { renderShop } from '@ui/screens/ShopScreen';
import { initialUiState } from '@ui/screens/types';
import type { RenderContext, UiState } from '@ui/screens/types';

/**
 * Игровая сцена вехи 4: интерфейс поверх ядра, мира пока нет.
 *
 * Интерфейс собран на примитивах Phaser, а не на DOM-элементах.
 * DOM не участвует в целочисленном зуме — ему пришлось бы отдельно
 * знать реальный размер окна, что запрещено ограничением 2.3, а его
 * субпиксельное сглаживание дерётся с pixelArt.
 */
export class GameScene extends Phaser.Scene {
  private store!: Store;
  private input$!: InputController;
  private painter!: Painter;
  private hotspots!: Hotspots;
  private ui: UiState = initialUiState();
  private dirty = true;
  private axis = { x: 0, y: 0 };

  constructor() {
    super('game');
  }

  create(): void {
    this.store = new Store(createInitialState(`run-${Date.now()}`, 'pop'));

    const sources: InputController[] = [new PointerInput(this.input)];
    if (this.input.keyboard) sources.push(new KeyboardInput(this.input.keyboard));
    this.input$ = new CompositeInput(sources);

    const layer = this.add.container(0, 0);
    this.painter = new Painter(this, layer);
    this.hotspots = new Hotspots();

    this.store.subscribe(() => {
      this.dirty = true;
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input$.destroy();
      this.painter.destroy();
    });
  }

  override update(): void {
    this.input$.update();
    this.handleFocusKeys();
    if (this.hotspots.handle(this.input$)) this.dirty = true;
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
    const back: Partial<UiState> =
      this.ui.screen === 'gig' || this.ui.screen === 'shop'
        ? { screen: 'location', venueId: null, page: 0 }
        : { screen: 'district', locationId: null, page: 0 };
    this.go(back);
  }

  private go = (patch: Partial<UiState>): void => {
    this.ui = { ...this.ui, ...patch };
    this.dirty = true;
  };

  private dispatch = (action: Action): void => {
    this.store.dispatch(action);
  };

  private render(): void {
    this.dirty = false;
    this.painter.clear();
    this.hotspots.clear();

    const state = this.store.getState();
    this.painter.fill({ x: 0, y: 0, w: SCREEN.width, h: SCREEN.height }, COLORS.bg);

    const ctx: RenderContext = {
      painter: this.painter,
      hotspots: this.hotspots,
      state,
      ui: this.ui,
      dispatch: this.dispatch,
      go: this.go,
    };

    renderHud(this.painter, state);

    // Пока событие ждёт ответа, редьюсер блокирует всё остальное — значит
    // и рисовать под ним нечего. Заодно снимает вопрос порядка слоёв:
    // все Text ложатся поверх общей Graphics, и затемнение фона под ними
    // было бы не видно.
    if (state.events.pending) {
      renderEventDialog(ctx);
      return;
    }

    this.renderScreen(ctx);
    renderNav(this.painter, this.hotspots, this.ui, this.go);

    if (state.over) {
      this.painter.label({ x: 0, y: SCREEN.height / 2 - 6, w: SCREEN.width, h: 12 },
        t('ui.runOver'), { align: 'center', size: 'normal', color: COLORS.accent });
    }
  }

  private renderScreen(ctx: RenderContext): void {
    switch (this.ui.screen) {
      case 'district':
        return renderDistrict(ctx);
      case 'location':
        return renderLocation(ctx);
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
