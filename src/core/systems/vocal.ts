import { BALANCE } from '@data/balance';
import type { Rng } from '../rng';
import { clamp, round2 } from '../util/num';
import type { GameState, GenreDef } from '../types';

const V = BALANCE.vocal;

export type HealthTier = 'normal' | 'fatigue' | 'hoarse' | 'critical';

/** Пороги раздела 6: >70 норма, 40-70 усталость, 20-40 осиплость, <20 край. */
export function healthTier(vocalHealth: number): HealthTier {
  if (vocalHealth > V.tiers.normal) return 'normal';
  if (vocalHealth >= V.tiers.fatigue) return 'fatigue';
  if (vocalHealth >= V.tiers.hoarse) return 'hoarse';
  return 'critical';
}

/** Множитель к оценке выступления от состояния связок (9.1). */
export function healthScoreModifier(vocalHealth: number): number {
  return V.tierScore[healthTier(vocalHealth)];
}

/** Шанс травмы за одно вокальное действие в текущем состоянии. */
export function injuryChance(vocalHealth: number): number {
  return V.tierInjuryChance[healthTier(vocalHealth)];
}

/**
 * Формула износа, раздел 6.
 * Чем ниже опора, тем сильнее износ: при опоре 100 множитель 0.8, при 0 — 1.8.
 * Именно здесь игра учит, что качать опору выгоднее, чем брать концерты.
 */
export function computeLoad(params: {
  baseLoad: number;
  breathSupport: number;
  genreMultiplier: number;
  warmedUp: boolean;
}): number {
  const { baseLoad, breathSupport, genreMultiplier, warmedUp } = params;
  if (baseLoad <= 0) return 0;
  const supportMultiplier = V.loadAtZeroSupport - clamp(breathSupport, 0, 100) / 100;
  const warmup = warmedUp ? 1 - V.warmupBonus : 1;
  return round2(baseLoad * supportMultiplier * genreMultiplier * warmup);
}

export function isInjured(state: GameState): boolean {
  return state.vocal.injuryDaysLeft > 0;
}

export function isWarmedUp(state: GameState): boolean {
  return state.vocal.warmedUpOnDay === state.day;
}

/** Экстрим закрыт с осиплости и ниже (раздел 6). */
export function isExtremeBlockedByHealth(state: GameState): boolean {
  const tier = healthTier(state.resources.vocalHealth);
  return tier === 'hoarse' || tier === 'critical';
}

export function loadForActivity(
  state: GameState,
  baseLoad: number,
  genre: GenreDef,
): number {
  return computeLoad({
    baseLoad,
    breathSupport: state.skills.breathSupport,
    genreMultiplier: genre.vocalLoadMultiplier,
    warmedUp: isWarmedUp(state),
  });
}

export interface LoadOutcome {
  vocalHealth: number;
  load: number;
  injuryDays: number;
}

/**
 * Списывает нагрузку и бросает кубик травмы.
 * Бросок делается по состоянию ПОСЛЕ износа: это ловит и «пел осипшим»,
 * и «убил здоровые связки одним зверским концертом».
 */
export function applyLoad(state: GameState, load: number, rng: Rng): LoadOutcome {
  const vocalHealth = round2(clamp(state.resources.vocalHealth - load, 0, V.max));
  const chance = injuryChance(vocalHealth);
  const injuryDays =
    chance > 0 && rng.chance(chance) ? rng.int(V.injuryDays.min, V.injuryDays.max) : 0;
  return { vocalHealth, load, injuryDays };
}

/** Восстановление связок с потолком в 100. */
export function recover(vocalHealth: number, amount: number): number {
  return round2(clamp(vocalHealth + amount, 0, V.max));
}

/** Фониатр сокращает оставшийся срок травмы вдвое (раздел 6). */
export function healInjury(daysLeft: number): number {
  return Math.ceil(daysLeft / V.injuryHealDivisor);
}
