import type { GameState } from '@core/types';
import { tierIndex } from '@core/types';
import { imageLevel } from '@core/systems/outfit';

/** Срез одной партии для сводного отчёта (раздел 10). */
export interface RunSample {
  readonly reachedClub: boolean;
  readonly tier: number;
  readonly money: number;
  readonly fame: number;
  readonly fans: number;
  readonly vocalHealth: number;
  readonly injuries: number;
  readonly performances: number;
  readonly image: number;
  readonly bestSkill: number;
  readonly breathSupport: number;
  readonly activityCounts: Readonly<Record<string, number>>;
  readonly outcomes: Readonly<Record<string, number>>;
  readonly failed: boolean;
}

export function sample(state: GameState): RunSample {
  return {
    // Клуб засчитывается по факту отыгранного концерта на главной сцене.
    reachedClub: (state.stats.activityCounts.club_stage ?? 0) > 0,
    tier: tierIndex(state.career.tier),
    money: state.resources.money,
    fame: state.resources.fame,
    fans: state.resources.fans,
    vocalHealth: state.resources.vocalHealth,
    injuries: state.vocal.injuryCount,
    performances: state.career.performances,
    image: imageLevel(state),
    bestSkill: Math.max(...Object.values(state.skills)),
    breathSupport: state.skills.breathSupport,
    activityCounts: state.stats.activityCounts,
    outcomes: state.stats.outcomes,
    failed: (state.flags.debtCritical ?? 0) > 0,
  };
}

export function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2
    : (sorted[middle] as number);
}

export function mean(values: readonly number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}

export function share(values: readonly boolean[]): number {
  return values.length === 0 ? 0 : values.filter(Boolean).length / values.length;
}

/** Доля слотов, съеденная самым частым действием. */
export function dominance(samples: readonly RunSample[]): { id: string; share: number } {
  const totals = new Map<string, number>();
  let all = 0;
  for (const run of samples) {
    for (const [id, count] of Object.entries(run.activityCounts)) {
      totals.set(id, (totals.get(id) ?? 0) + count);
      all += count;
    }
  }
  let top = { id: '—', share: 0 };
  for (const [id, count] of totals) {
    const value = all === 0 ? 0 : count / all;
    if (value > top.share) top = { id, share: value };
  }
  return top;
}
