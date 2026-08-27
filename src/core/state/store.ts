import type { GameState } from '../types';
import type { Action } from './actions';
import { reduce } from './reducer';

export type Listener = (state: GameState, action: Action) => void;

/**
 * Тонкая обёртка над редьюсером для сцен и UI: никаких прямых мутаций
 * состояния из Phaser, только dispatch (раздел 3).
 */
export class Store {
  private state: GameState;
  private readonly listeners = new Set<Listener>();

  constructor(initial: GameState) {
    this.state = initial;
  }

  getState(): GameState {
    return this.state;
  }

  dispatch(action: Action): GameState {
    this.state = reduce(this.state, action);
    for (const listener of this.listeners) listener(this.state, action);
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }
}
