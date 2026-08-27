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
    stats: { ...base.stats, ...patch.stats },
    flags: { ...base.flags, ...patch.flags },
  } as GameState;
}

export function makeRng(seed = 'test-rng'): Rng {
  return new Rng(seed);
}

/** ГПСЧ, у которого кубик всегда выпадает: проверяем гарантированную травму. */
export function alwaysRng(): Rng {
  const rng = new Rng(1);
  rng.chance = () => true;
  return rng;
}

/** ГПСЧ, у которого кубик не выпадает никогда. */
export function neverRng(): Rng {
  const rng = new Rng(1);
  rng.chance = () => false;
  return rng;
}
