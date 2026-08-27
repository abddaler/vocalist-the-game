import { doActivity, createInitialState, reduce } from '@core/state';
import type { GameState, GenreId } from '@core/types';
import type { Strategy } from './strategies';

/**
 * Один прогон среза выбранной стратегией. Никакой графики и никакого
 * ввода: чистая симуляция, воспроизводимая по сиду.
 */
export function playSlice(params: {
  seed: string;
  genre: GenreId;
  strategy: Strategy;
  onSlot?: (before: GameState, after: GameState) => void;
}): GameState {
  const { seed, genre, strategy, onSlot } = params;
  let state = createInitialState(seed, genre);

  // Страховка от бесконечного цикла, если стратегия перестанет продвигать время.
  const maxSteps = 60 * 4 + 32;

  for (let step = 0; step < maxSteps && !state.over; step += 1) {
    const before = state;
    for (const id of strategy.pick(before)) {
      const next = reduce(before, doActivity(id));
      if (next.stats.blockedAttempts === before.stats.blockedAttempts) {
        state = next;
        break;
      }
    }
    if (state === before) {
      throw new Error(
        `Стратегия "${strategy.id}" зашла в тупик на дне ${before.day}, слот ${before.slotIndex}`,
      );
    }
    onSlot?.(before, state);
  }

  return state;
}
