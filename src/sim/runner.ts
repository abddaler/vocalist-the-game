import {
  buyOutfit,
  createInitialState,
  doActivity,
  perform,
  reduce,
  resolveEventChoice,
} from '@core/state';
import { getEvent } from '@data/events';
import type { Action } from '@core/state';
import type { GameState, GenreId } from '@core/types';
import { safestChoice } from './strategies';
import type { Strategy } from './strategies';

/** Применяет действие, либо возвращает null, если редьюсер его отклонил. */
function tryDispatch(state: GameState, action: Action): GameState | null {
  const next = reduce(state, action);
  return next.stats.blockedAttempts === state.stats.blockedAttempts ? next : null;
}

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

  // Страховка от зацикливания: слоты плюс запас на события и покупки.
  const maxSteps = 60 * 4 * 3 + 128;

  for (let step = 0; step < maxSteps && !state.over; step += 1) {
    const before = state;
    state = advance(state, strategy);
    if (state === before) {
      throw new Error(
        `Стратегия "${strategy.id}" зашла в тупик на дне ${before.day}, слот ${before.slotIndex}`,
      );
    }
    onSlot?.(before, state);
  }

  return state;
}

function advance(state: GameState, strategy: Strategy): GameState {
  // Подвешенное событие стопорит всё: сначала ответ, потом действия.
  if (state.events.pending) {
    const event = getEvent(state.events.pending);
    const choice = strategy.pickChoice?.(state, event) ?? safestChoice(state, event);
    return reduce(state, resolveEventChoice(choice));
  }

  // Покупка одежды слотов не тратит, поэтому идёт до выбора действия.
  const purchase = strategy.pickPurchase?.(state);
  if (purchase) {
    const bought = tryDispatch(state, buyOutfit(purchase));
    if (bought) return bought;
  }

  const gig = strategy.pickGig?.(state);
  if (gig) {
    const played = tryDispatch(state, perform(gig.venueId, gig.songs));
    if (played) return played;
  }

  for (const id of [...strategy.pick(state), ...SAFETY_NET]) {
    const done = tryDispatch(state, doActivity(id));
    if (done) return done;
  }

  return state;
}

/**
 * Хвост, который пробуется после предпочтений стратегии. Отдых, молчание
 * и сон ничего не стоят и не требуют сил, поэтому сутки сдвигаются всегда,
 * даже если стратегия попросила невозможного.
 */
const SAFETY_NET = ['home_rest', 'vocal_rest', 'sleep'] as const;
