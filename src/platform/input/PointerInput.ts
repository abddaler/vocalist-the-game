import Phaser from 'phaser';
import type { GameButton, InputController, MoveAxis, TapPoint } from './InputController';

/**
 * Порог, ниже которого касание считается тапом, а не свайпом.
 * Задан в ЭКРАННЫХ пикселях: палец гуляет на глаз одинаково независимо
 * от зума, а вот во внутренних координатах тот же дрейф на телефоне
 * (зум меньше единицы) раздувается втрое — и тапы переставали доходить.
 */
const TAP_SLOP_SCREEN = 12;

/**
 * Мышь и тач. Phaser отдаёт координаты указателя уже во внутреннем
 * разрешении, поэтому реальный размер экрана здесь не всплывает —
 * кроме одного места: зум нужен, чтобы перевести порог тапа.
 */
export class PointerInput implements InputController {
  readonly move: MoveAxis = { x: 0, y: 0 };

  private pendingTap: TapPoint | null = null;
  private downAt: TapPoint | null = null;

  private readonly onDown = (pointer: Phaser.Input.Pointer): void => {
    this.downAt = { x: pointer.x, y: pointer.y };
  };

  private readonly onUp = (pointer: Phaser.Input.Pointer): void => {
    const start = this.downAt;
    this.downAt = null;
    if (!start) return;
    const moved = Math.hypot(pointer.x - start.x, pointer.y - start.y);
    if (moved <= this.slop()) this.pendingTap = { x: pointer.x, y: pointer.y };
  };

  private readonly onCancel = (): void => {
    this.downAt = null;
  };

  constructor(private readonly input: Phaser.Input.InputPlugin) {
    input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown);
    input.on(Phaser.Input.Events.POINTER_UP, this.onUp);
    input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onCancel);
    input.on(Phaser.Input.Events.GAME_OUT, this.onCancel);
  }

  /** Порог тапа во внутренних пикселях при текущем зуме. */
  private slop(): number {
    const zoom = this.input.scene.scale.zoom || 1;
    return TAP_SLOP_SCREEN / zoom;
  }

  update(): void {
    // Направление ходьбы от указателя появится на вехе 5 (клик-ту-мув).
  }

  /** С указателя логических кнопок нет — их роль играют экранные зоны тапа. */
  isDown(_button: GameButton): boolean {
    return false;
  }

  justPressed(_button: GameButton): boolean {
    return false;
  }

  consumeTap(): TapPoint | null {
    const tap = this.pendingTap;
    this.pendingTap = null;
    return tap;
  }

  destroy(): void {
    this.input.off(Phaser.Input.Events.POINTER_DOWN, this.onDown);
    this.input.off(Phaser.Input.Events.POINTER_UP, this.onUp);
    this.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onCancel);
    this.input.off(Phaser.Input.Events.GAME_OUT, this.onCancel);
    this.pendingTap = null;
    this.downAt = null;
  }
}
