import Phaser from 'phaser';
import type { GameButton, InputController, MoveAxis, TapPoint } from './InputController';
import { NO_MOVE } from './InputController';

const BUTTON_KEYS: Record<GameButton, string[]> = {
  confirm: ['ENTER', 'SPACE'],
  cancel: ['ESC'],
  interact: ['E'],
  menu: ['TAB'],
};

/** Реализация ввода на клавиатуре. Мышь/тач живут в PointerInput. */
export class KeyboardInput implements InputController {
  readonly move: MoveAxis = { x: 0, y: 0 };

  private readonly keys = new Map<string, Phaser.Input.Keyboard.Key>();
  private readonly buttons = new Map<GameButton, Phaser.Input.Keyboard.Key[]>();

  constructor(private readonly keyboard: Phaser.Input.Keyboard.KeyboardPlugin) {
    for (const code of ['W', 'A', 'S', 'D', 'UP', 'DOWN', 'LEFT', 'RIGHT']) {
      this.keys.set(code, keyboard.addKey(code, false));
    }
    for (const [button, codes] of Object.entries(BUTTON_KEYS) as [GameButton, string[]][]) {
      this.buttons.set(
        button,
        codes.map((code) => keyboard.addKey(code, false)),
      );
    }
  }

  update(): void {
    const left = this.pressed('A') || this.pressed('LEFT');
    const right = this.pressed('D') || this.pressed('RIGHT');
    const up = this.pressed('W') || this.pressed('UP');
    const down = this.pressed('S') || this.pressed('DOWN');
    this.move.x = Number(right) - Number(left);
    this.move.y = Number(down) - Number(up);
  }

  isDown(button: GameButton): boolean {
    return (this.buttons.get(button) ?? []).some((key) => key.isDown);
  }

  justPressed(button: GameButton): boolean {
    return (this.buttons.get(button) ?? []).some((key) =>
      Phaser.Input.Keyboard.JustDown(key),
    );
  }

  /** С клавиатуры тапов не бывает. */
  consumeTap(): TapPoint | null {
    return null;
  }

  destroy(): void {
    for (const key of this.keys.values()) this.keyboard.removeKey(key, true);
    for (const group of this.buttons.values()) {
      for (const key of group) this.keyboard.removeKey(key, true);
    }
    this.keys.clear();
    this.buttons.clear();
    Object.assign(this.move, NO_MOVE);
  }

  private pressed(code: string): boolean {
    return this.keys.get(code)?.isDown ?? false;
  }
}
