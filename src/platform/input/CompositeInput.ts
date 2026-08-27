import type { GameButton, InputController, MoveAxis, TapPoint } from './InputController';

/** Складывает несколько источников ввода в один. Игра видит только этот объект. */
export class CompositeInput implements InputController {
  readonly move: MoveAxis = { x: 0, y: 0 };

  constructor(private readonly sources: InputController[]) {}

  update(): void {
    let x = 0;
    let y = 0;
    for (const source of this.sources) {
      source.update();
      x += source.move.x;
      y += source.move.y;
    }
    this.move.x = Math.max(-1, Math.min(1, x));
    this.move.y = Math.max(-1, Math.min(1, y));
  }

  isDown(button: GameButton): boolean {
    return this.sources.some((source) => source.isDown(button));
  }

  justPressed(button: GameButton): boolean {
    return this.sources.some((source) => source.justPressed(button));
  }

  consumeTap(): TapPoint | null {
    for (const source of this.sources) {
      const tap = source.consumeTap();
      if (tap) return tap;
    }
    return null;
  }

  destroy(): void {
    for (const source of this.sources) source.destroy();
  }
}
