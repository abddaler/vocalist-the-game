import { Rng } from '../rng';
import { createInitialState } from '../state';
import type { GameState, GenreId } from '../types';

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? Partial<T[K]> : T[K] };

/** Состояние для тестов: тот же конструктор, что в игре, плюс правки поверх. */
export function makeState(
  patch: DeepPartial<GameState> = {},
  genre: GenreId = 'pop',
): GameState {
  const base = createInitialState('test-seed', genre);
  return {
    ...base,
    ...patch,
    skills: { ...base.skills, ...patch.skills },
    resources: { ...base.resources, ...patch.resources },
    vocal: { ...base.vocal, ...patch.vocal },
    economy: { ...base.economy, ...patch.economy },
    career: { ...base.career, ...patch.career },
    npcs: { ...base.npcs, ...patch.npcs },
    wardrobe: { ...base.wardrobe, ...patch.wardrobe },
    events: { ...base.events, ...patch.events },
    stats: { ...base.stats, ...patch.stats },
    flags: { ...base.flags, ...patch.flags },
  } as GameState;
}

export function makeRng(seed = 'test-rng'): Rng {
  return new Rng(seed);
}

/**
 * ГПСЧ, у которого кубик всегда выпадает: проверяем гарантированную травму.
 * Нулевую вероятность он всё-таки уважает — иначе «шанс 0» тоже срабатывал бы
 * и тесты ловили не то событие, которое проверяют.
 */
export function alwaysRng(): Rng {
  const rng = new Rng(1);
  rng.chance = (probability: number) => probability > 0;
  return rng;
}

/** ГПСЧ, у которого кубик не выпадает никогда. */
export function neverRng(): Rng {
  const rng = new Rng(1);
  rng.chance = () => false;
  return rng;
}
