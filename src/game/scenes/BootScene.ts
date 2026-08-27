import Phaser from 'phaser';
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from '@platform/config';
import { CompositeInput, KeyboardInput, PointerInput } from '@platform/input';
import type { InputController } from '@platform/input';
import { t } from '@ui/i18n';

/**
 * Заглушка вехи 1: сцена запускается, единый слой ввода подключён.
 * Наполнение придёт на вехах 4-5.
 */
export class BootScene extends Phaser.Scene {
  private input$!: InputController;

  constructor() {
    super('boot');
  }

  create(): void {
    const sources: InputController[] = [new PointerInput(this.input)];
    if (this.input.keyboard) sources.push(new KeyboardInput(this.input.keyboard));
    this.input$ = new CompositeInput(sources);

    const cx = INTERNAL_WIDTH / 2;

    this.add
      .text(cx, INTERNAL_HEIGHT / 2 - 24, t('app.title'), { fontSize: '16px', color: '#f2f2f2' })
      .setOrigin(0.5);
    this.add
      .text(cx, INTERNAL_HEIGHT / 2 - 6, t('app.subtitle'), { fontSize: '10px', color: '#8fbf7f' })
      .setOrigin(0.5);
    this.add
      .text(cx, INTERNAL_HEIGHT / 2 + 20, t('boot.hint'), { fontSize: '8px', color: '#7a7a7a' })
      .setOrigin(0.5);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input$.destroy());
  }

  override update(): void {
    this.input$.update();
    // Любой тап или нажатие начинают игру: экран старта и выбор жанра
    // приедут на вехе 6, пока просто пропускаем заставку.
    if (this.input$.consumeTap() || this.input$.justPressed('confirm')) {
      this.scene.start('game');
    }
  }
}
