import type { GameState } from '../types';

/**
 * Копия состояния для редьюсера.
 *
 * Договорённость проекта: dispatch клонирует состояние один раз, системы
 * правят копию как черновик, наружу отдаётся новый объект. Это дешевле и
 * читаемее, чем протаскивать неизменяемость через каждую функцию, а
 * снаружи ядро всё равно выглядит чистым.
 */
export function cloneState(state: GameState): GameState {
  return {
    ...state,
    rng: { ...state.rng },
    skills: { ...state.skills },
    resources: { ...state.resources },
    vocal: { ...state.vocal },
    economy: { ...state.economy },
    stats: { ...state.stats, activityCounts: { ...state.stats.activityCounts } },
    flags: { ...state.flags },
    log: state.log.slice(),
  };
}
