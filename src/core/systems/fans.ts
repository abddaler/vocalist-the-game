import { BALANCE } from '@data/balance';
import type { GameState } from '../types';

/**
 * Пересчёт фанбазы в конце месяца (раздел 4): часть фанатов уходит,
 * и уходит сильнее, если игрок за месяц ни разу не выступал.
 * Считать активностью выступления начнём на вехе 3, когда они появятся;
 * пока за активность отвечает флаг performedThisMonth.
 */
export function monthlyFanDecay(state: GameState): { fans: number; left: number } {
  const wasActive = (state.flags.performedThisMonth ?? 0) > 0;
  const rate = wasActive
    ? BALANCE.fans.monthlyDecayActive
    : BALANCE.fans.monthlyDecayIdle;
  const left = Math.floor(state.resources.fans * rate);
  return { fans: Math.max(0, state.resources.fans - left), left };
}
