import Phaser from 'phaser';
import { devFlag } from '@platform/devtools';
import { GENRE_IDS, SLOTS } from '@core/types';
import type { GameState, GenreId } from '@core/types';
import { CompositeInput, KeyboardInput, PointerInput } from '@platform/input';
import type { InputController } from '@platform/input';
import { loadGame } from '@platform/saveGame';
import type { SaveAdapter } from '@platform/SaveAdapter';
import { t } from '@ui/i18n';
import { COLORS, SCREEN } from '@ui/theme';
import { Hotspots } from '@ui/widgets/Hotspots';
import { Painter } from '@ui/widgets/Painter';

/** Экран старта: продолжить прогон или начать новый с выбором жанра. */
export class MenuScene extends Phaser.Scene {
  private input$!: InputController;
  private painter!: Painter;
  private hotspots!: Hotspots;

  private saved: GameState | null = null;
  private choosingGenre = false;
  private dirty = true;
  private axis = 0;

  constructor() {
    super('menu');
  }

  create(): void {
    const sources: InputController[] = [new PointerInput(this.input)];
    if (this.input.keyboard) sources.push(new KeyboardInput(this.input.keyboard));
    this.input$ = new CompositeInput(sources);

    this.painter = new Painter(this, this.add.container(0, 0));
    this.hotspots = new Hotspots();

    void this.loadSaved();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input$.destroy();
      this.painter.destroy();
    });
  }

  private async loadSaved(): Promise<void> {
    const adapter = this.registry.get('save') as SaveAdapter;
    this.saved = await loadGame(adapter);
    this.dirty = true;
  }

  override update(): void {
    this.input$.update();

    const step = this.input$.move.y !== 0 && this.axis === 0 ? Math.sign(this.input$.move.y) : 0;
    this.axis = this.input$.move.y;
    if (step !== 0) {
      this.hotspots.moveFocus(step);
      this.dirty = true;
    }

    if (this.hotspots.handle(this.input$)) this.dirty = true;
    if (this.input$.justPressed('cancel') && this.choosingGenre) {
      this.choosingGenre = false;
      this.dirty = true;
    }
    if (this.dirty) this.render();
  }

  private render(): void {
    this.dirty = false;
    this.painter.clear();
    this.hotspots.clear();

    this.painter.fill({ x: 0, y: 0, w: SCREEN.width, h: SCREEN.height }, COLORS.bg);
    this.painter.label({ x: 0, y: 30, w: SCREEN.width, h: 20 }, t('app.title'), {
      align: 'center',
      scale: 2,
      color: COLORS.text,
    });
    this.painter.label({ x: 0, y: 52, w: SCREEN.width, h: 14 }, t('app.subtitle'), {
      align: 'center',
      color: COLORS.accent,
    });

    if (this.choosingGenre) this.renderGenres();
    else this.renderRoot();
  }

  private renderRoot(): void {
    const rows: { key: string; note: string; enabled: boolean; run: () => void }[] = [];

    if (this.saved) {
      const state = this.saved;
      rows.push({
        key: 'menu.continue',
        note: t('menu.savedAt', {
          day: state.day,
          slot: t(`slot.${SLOTS[state.slotIndex] ?? 'morning'}`),
        }),
        enabled: true,
        run: () => this.scene.start('game', { state }),
      });
    }

    rows.push({
      key: 'menu.newGame',
      note: '',
      enabled: true,
      run: () => {
        this.choosingGenre = true;
        this.dirty = true;
      },
    });

    rows.forEach((row, index) => {
      // Шаг с запасом: под кнопкой «Продолжить» стоит подпись с датой.
      const rect = { x: 140, y: 100 + index * 44, w: 200, h: 26 };
      const hotspot = { rect, label: row.key, enabled: row.enabled, onActivate: row.run };
      this.hotspots.add(hotspot);
      this.painter.button(rect, t(row.key), {
        enabled: row.enabled,
        focused: this.hotspots.isFocused(hotspot),
        accent: index === 0,
      });
      if (row.note) {
        this.painter.label({ x: 140, y: rect.y + 28, w: 200, h: 13 }, row.note, {
          align: 'center',
          color: COLORS.textMuted,
        });
      }
    });

    this.painter.label({ x: 0, y: SCREEN.height - 20, w: SCREEN.width, h: 12 }, t('menu.hint'), {
      align: 'center',
      color: COLORS.textMuted,
    });
  }

  private renderGenres(): void {
    this.painter.label({ x: 0, y: 74, w: SCREEN.width, h: 14 }, t('menu.chooseGenre'), {
      align: 'center',
      color: COLORS.textDim,
    });

    GENRE_IDS.forEach((genre, index) => {
      const rect = { x: 40, y: 92 + index * 34, w: SCREEN.width - 80, h: 30 };
      const hotspot = {
        rect,
        label: genre,
        enabled: true,
        onActivate: () => this.startNewGame(genre),
      };
      this.hotspots.add(hotspot);

      const focused = this.hotspots.isFocused(hotspot);
      this.painter.panel(
        rect,
        focused ? COLORS.panelAlt : COLORS.panel,
        focused ? COLORS.borderFocus : COLORS.border,
      );
      this.painter.label({ x: rect.x + 8, y: rect.y + 2, w: 120, h: 14 }, t(`genre.${genre}`), {
        color: COLORS.accent,
      });
      this.painter.label(
        { x: rect.x + 8, y: rect.y + 15, w: rect.w - 16, h: 12 },
        t(`genre.${genre}.desc`),
        { color: COLORS.textDim },
      );
    });

    const backRect = { x: 40, y: 92 + GENRE_IDS.length * 34 + 2, w: 80, h: 22 };
    const back = {
      rect: backRect,
      label: 'menu.back',
      enabled: true,
      onActivate: () => {
        this.choosingGenre = false;
        this.dirty = true;
      },
    };
    this.hotspots.add(back);
    this.painter.button(backRect, t('menu.back'), {
      enabled: true,
      focused: this.hotspots.isFocused(back),
    });
  }

  private startNewGame(genre: GenreId): void {
    // Со стоящим временем сид тоже стоит: съёмка для разбора обязана
    // повторяться от запуска к запуску, а сид от часов делает каждый
    // прогон новым.
    const seed = devFlag('still') ? 'capture' : `run-${Date.now()}`;
    this.scene.start('game', { seed, genre });
  }
}
