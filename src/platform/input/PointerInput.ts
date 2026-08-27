import Phaser from 'phaser';
import type { GameButton, InputController, MoveAxis, TapPoint } from './InputController';

/** Порог, ниже которого тап считается кликом, а не свайпом (внутренние пиксели). */
const TAP_SLOP = 6;

/**
 * Мышь и тач. Phaser отдаёт координаты указателя уже во внутреннем
 * разрешении (Scale.FIT), поэтому реальный размер экрана здесь не всплывает.
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
    if (moved <= TAP_SLOP) this.pendingTap = { x: pointer.x, y: pointer.y };
  };

  constructor(private readonly input: Phaser.Input.InputPlugin) {
    input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown);
    input.on(Phaser.Input.Events.POINTER_UP, this.onUp);
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
    this.pendingTap = null;
    this.downAt = null;
  }
}
