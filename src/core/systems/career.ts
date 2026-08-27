import { BALANCE } from '@data/balance';
import type { Rng } from '../rng';
import { pushLog } from '../state/log';
import { clamp, round2 } from '../util/num';
import { tierIndex } from '../types';
import type { GameState, VenueDef } from '../types';
import { evaluatePerformance, interceptChance } from './performance';
import { applyLoad } from './vocal';

/**
 * Выступление целиком: перехват конкурентом, оценка, награды, износ,
 * повышение по карьерной лестнице. Время двигает вызывающая сторона.
 */
export function performAtVenue(
  draft: GameState,
  venue: VenueDef,
  songs: number,
  rng: Rng,
): void {
  if (venue.interceptable && rng.chance(interceptChance(draft))) {
    draft.resources.mood = clamp(draft.resources.mood - 8, 0, BALANCE.mood.max);
    pushLog(draft, 'performance.intercepted', { venue: venue.id });
    return;
  }

  const result = evaluatePerformance(draft, venue, songs, rng);
  const r = draft.resources;

  const outcome = applyLoad(draft, result.load, rng);
  r.vocalHealth = outcome.vocalHealth;
  draft.vocal.loadToday = round2(draft.vocal.loadToday + outcome.load);

  r.energy = clamp(r.energy - result.energy, 0, BALANCE.energy.max);
  r.money = round2(r.money + result.money);
  r.fame = round2(Math.max(0, r.fame + result.fame));
  r.fans = Math.max(0, r.fans + result.fans);
  r.mood = clamp(r.mood + result.mood, 0, BALANCE.mood.max);
  r.reputation = clamp(
    r.reputation + result.reputation,
    BALANCE.reputation.min,
    BALANCE.reputation.max,
  );

  draft.career.performances += 1;
  draft.flags.performedThisMonth = 1;
  draft.stats.outcomes[result.outcome] = (draft.stats.outcomes[result.outcome] ?? 0) + 1;

  pushLog(draft, 'performance.done', {
    venue: venue.id,
    songs,
    outcome: result.outcome,
    score: Math.round(result.score),
    money: result.money,
    fame: result.fame,
    fans: result.fans,
  });

  if (outcome.injuryDays > 0) {
    draft.vocal.injuryDaysLeft = outcome.injuryDays;
    draft.vocal.injuryCount += 1;
    pushLog(draft, 'injury.start', { days: outcome.injuryDays, id: venue.id });
  }

  promote(draft, venue);
  hireManagerIfEarned(draft);
}

/** Успешная игра на площадке выше текущей ступени поднимает карьеру (9.5). */
function promote(draft: GameState, venue: VenueDef): void {
  if (tierIndex(venue.tier) <= tierIndex(draft.career.tier)) return;
  draft.career.tier = venue.tier;
  pushLog(draft, 'career.up', { tier: venue.tier });
}

/** Менеджер освобождает слоты, забирая долю выручки (9.3). */
function hireManagerIfEarned(draft: GameState): void {
  if (draft.career.manager || draft.resources.fame < BALANCE.career.managerFame) return;
  draft.career.manager = true;
  pushLog(draft, 'manager.hired', { cut: BALANCE.career.managerCut });
}

/** Слава конкурента растёт сама по себе — каждый день, что игрок стоит. */
export function growRival(draft: GameState): void {
  draft.career.rivalFame = round2(draft.career.rivalFame + BALANCE.rival.growthPerDay);
}

/** Записанные синглы приносят фанатов пассивно, раз в месяц. */
export function monthlySingleFans(draft: GameState): void {
  if (draft.career.singles <= 0) return;
  const gained = draft.career.singles * BALANCE.singles.fansPerMonth;
  draft.resources.fans += gained;
  pushLog(draft, 'single.fans', { singles: draft.career.singles, fans: gained });
}
