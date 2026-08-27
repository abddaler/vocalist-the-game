import { BALANCE } from '@data/balance';
import { getGenre } from '@data/genres';
import type { Rng } from '../rng';
import { clamp, round2 } from '../util/num';
import { SLOTS } from '../types';
import type {
  GameState,
  GenreDef,
  PerformanceOutcome,
  SkillKey,
  VenueDef,
} from '../types';
import { imageLevel, outfitModifier } from './outfit';
import { healthScoreModifier, isInjured, loadForActivity } from './vocal';

const P = BALANCE.performance;

export type PerformanceBlock =
  | 'runOver'
  | 'injured'
  | 'wrongSlot'
  | 'noEnergy'
  | 'lowFame'
  | 'lowImage'
  | 'badSetlist';

/** Сколько песен подряд игрок тянет без падения качества (стат stamina). */
export function songCapacity(stamina: number): number {
  return P.baseSongs + Math.floor(clamp(stamina, 0, 100) / P.staminaPerSong);
}

/**
 * Опора как множитель ко всей оценке (5.1). Ни в одном жанре её нет
 * в весах — она работает не сама по себе, а через остальные статы.
 */
export function supportMultiplier(breathSupport: number): number {
  return P.supportFloor + P.supportSpan * (clamp(breathSupport, 0, 100) / 100);
}

/** Базовая оценка вокала: статы, взвешенные по жанру (9.1). Шкала 0..100. */
export function baseScore(state: GameState, genre: GenreDef): number {
  let weighted = 0;
  for (const [key, weight] of Object.entries(genre.statWeights)) {
    weighted += state.skills[key as SkillKey] * (weight ?? 0);
  }
  return round2(weighted * supportMultiplier(state.skills.breathSupport));
}

export function moodModifier(mood: number): number {
  return P.moodFloor + P.moodSpan * (clamp(mood, 0, BALANCE.mood.max) / BALANCE.mood.max);
}

/** Штраф за сет-лист длиннее, чем позволяет выносливость. */
export function staminaModifier(stamina: number, songs: number): number {
  const over = Math.max(0, songs - songCapacity(stamina));
  return round2(Math.pow(P.overloadPenalty, over));
}

export function outcomeOf(score: number, venue: VenueDef): PerformanceOutcome {
  if (score >= venue.thresholds.triumph) return 'triumph';
  if (score >= venue.thresholds.good) return 'good';
  if (score >= venue.thresholds.ok) return 'ok';
  return 'fail';
}

/**
 * Оценка без броска кубика: то, на что игрок может рассчитывать.
 * Нужна и экрану подготовки к выступлению (9.1), и стратегиям симулятора,
 * чтобы не ломиться на площадку, которую заведомо не тянут.
 */
export function expectedScore(state: GameState, songs: number): number {
  const genre = getGenre(state.genre);
  return round2(
    baseScore(state, genre) *
      healthScoreModifier(state.resources.vocalHealth) *
      moodModifier(state.resources.mood) *
      outfitModifier(state, genre.id) *
      staminaModifier(state.skills.stamina, songs),
  );
}

export function checkPerformance(
  state: GameState,
  venue: VenueDef,
  songs: number,
): PerformanceBlock | null {
  if (state.over) return 'runOver';
  if (isInjured(state)) return 'injured';
  if (!venue.slots.includes(SLOTS[state.slotIndex] as never)) return 'wrongSlot';
  if (songs < venue.setlist.min || songs > venue.setlist.max) return 'badSetlist';
  if (state.resources.fame < (venue.requires.fame ?? 0)) return 'lowFame';
  if (imageLevel(state) < (venue.requires.image ?? 0)) return 'lowImage';
  if (state.resources.energy < venue.energyPerSong * songs) return 'noEnergy';
  return null;
}

export interface PerformanceResult {
  readonly score: number;
  readonly outcome: PerformanceOutcome;
  readonly load: number;
  readonly energy: number;
  readonly money: number;
  readonly managerCut: number;
  readonly fame: number;
  readonly fans: number;
  readonly mood: number;
  readonly reputation: number;
}

/**
 * Оценка выступления по формуле 9.1:
 * Σ(stat * вес жанра) * здоровье * настроение * наряд * выносливость * rng.
 */
export function evaluatePerformance(
  state: GameState,
  venue: VenueDef,
  songs: number,
  rng: Rng,
): PerformanceResult {
  const genre = getGenre(state.genre);

  const score = round2(
    baseScore(state, genre) *
      healthScoreModifier(state.resources.vocalHealth) *
      moodModifier(state.resources.mood) *
      outfitModifier(state, genre.id) *
      staminaModifier(state.skills.stamina, songs) *
      rng.range(P.jitter.min, P.jitter.max),
  );

  const outcome = outcomeOf(score, venue);

  const grossMoney = round2(
    (venue.payout.base + venue.payout.perSong * songs) *
      P.payoutByOutcome[outcome] *
      genre.moneyMultiplier,
  );
  const managerCut = state.career.manager ? round2(grossMoney * BALANCE.career.managerCut) : 0;

  // Отдача площадки по славе гаснет по мере того, как игрок её перерастает.
  const reach = clamp(1 - state.resources.fame / venue.fameCeiling, P.fameFloor, 1);
  const fame = round2(
    (venue.fame.base + venue.fame.perSong * songs) *
      P.fameByOutcome[outcome] *
      genre.fameMultiplier *
      reach,
  );

  return {
    score,
    outcome,
    load: loadForActivity(state, venue.loadPerSong * songs, genre),
    energy: venue.energyPerSong * songs,
    money: round2(grossMoney - managerCut),
    managerCut,
    fame,
    fans: Math.round(fame * venue.fansPerFame),
    mood: P.moodByOutcome[outcome],
    reputation: P.reputationByOutcome[outcome],
  };
}

/**
 * Шанс, что конкурент перехватит выступление (9.3): чем сильнее он
 * оторвался по славе, тем чаще уводит площадку из-под носа.
 */
export function interceptChance(state: GameState): number {
  const gap = state.career.rivalFame - state.resources.fame;
  if (gap <= 0) return 0;
  return clamp(gap / BALANCE.rival.interceptSpread, 0, BALANCE.rival.maxInterceptChance);
}
