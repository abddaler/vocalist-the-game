/**
 * Единый слой ввода (раздел 2, ограничение 1).
 * Клавиатура, мышь и тач — три реализации одного интерфейса.
 * Ни одна игровая система не читает клавиатуру напрямую.
 */

/** Направление движения, каждая ось в диапазоне -1..1. */
export interface MoveAxis {
  x: number;
  y: number;
}

/** Логические кнопки. Каждая обязана иметь эквивалент тапом (ограничение 2). */
export type GameButton = 'confirm' | 'cancel' | 'interact' | 'menu';

/** Тап/клик во ВНУТРЕННИХ координатах (480x270). */
export interface TapPoint {
  x: number;
  y: number;
}

export interface InputController {
  /** Направление ходьбы в этом кадре. */
  readonly move: Readonly<MoveAxis>;
  isDown(button: GameButton): boolean;
  /** Нажатие именно в этом кадре (фронт сигнала). */
  justPressed(button: GameButton): boolean;
  /** Забирает тап этого кадра (и гасит его), либо null. */
  consumeTap(): TapPoint | null;
  /** Вызывается раз в кадр до игровой логики. */
  update(): void;
  destroy(): void;
}

export const NO_MOVE: Readonly<MoveAxis> = Object.freeze({ x: 0, y: 0 });
