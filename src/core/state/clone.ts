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
    career: { ...state.career },
    npcs: Object.fromEntries(
      Object.entries(state.npcs).map(([id, npc]) => [id, { ...npc }]),
    ) as GameState['npcs'],
    wardrobe: { owned: state.wardrobe.owned.slice(), equipped: { ...state.wardrobe.equipped } },
    events: { ...state.events, seen: { ...state.events.seen } },
    stats: {
      ...state.stats,
      activityCounts: { ...state.stats.activityCounts },
      outcomes: { ...state.stats.outcomes },
    },
    flags: { ...state.flags },
    log: state.log.slice(),
  };
}
