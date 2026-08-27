import { BALANCE } from '@data/balance';
import type { Rng } from '../rng';
import { pushLog } from '../state/log';
import { clamp, round2 } from '../util/num';
import { SLOTS_PER_DAY } from '../types';
import type { GameState } from '../types';
import { growRival, monthlySingleFans } from './career';
import { monthlyFanDecay } from './fans';
import { isDebtCritical, monthlySettlement, weeklySettlement } from './money';
import { recover } from './vocal';

const { time: T, energy: E, vocal: V } = BALANCE;

/**
 * Время идёт только от действий игрока (раздел 4). Ходьба по локации
 * слотов не тратит — иначе перемещение превращается в наказание.
 */
export function advanceTime(draft: GameState, slots: number, rng: Rng): void {
  for (let i = 0; i < slots; i += 1) {
    draft.slotIndex += 1;
    draft.stats.slotsUsed += 1;
    if (draft.slotIndex >= SLOTS_PER_DAY) {
      endOfDay(draft, rng);
      draft.slotIndex = 0;
    }
  }
}

/** Всё, что случается на границе суток, недели и месяца. */
function endOfDay(draft: GameState, _rng: Rng): void {
  settleSleep(draft);
  settleSilence(draft);
  tickInjury(draft);
  growRival(draft);

  if (draft.day % T.daysPerWeek === 0) settleWeek(draft);
  if (draft.day % T.daysPerMonth === 0) settleMonth(draft);

  resetDaily(draft);

  draft.day += 1;
  if (draft.day > T.sliceDays) {
    draft.over = true;
    pushLog(draft, 'run.over', { day: T.sliceDays });
  }
}

/** Ночь без сна — штраф (раздел 4). */
function settleSleep(draft: GameState): void {
  if (draft.vocal.sleptTonight) return;
  const penalty = E.noSleepPenalty;
  draft.resources.energy = clamp(draft.resources.energy + penalty.energy, 0, E.max);
  draft.resources.mood = clamp(draft.resources.mood + penalty.mood, 0, BALANCE.mood.max);
  draft.resources.vocalHealth = recover(draft.resources.vocalHealth, penalty.vocalHealth);
  draft.stats.missedNights += 1;
  pushLog(draft, 'sleep.missed', {
    energy: penalty.energy,
    mood: penalty.mood,
    vocalHealth: penalty.vocalHealth,
  });
}

/** Бонус за сутки, целиком проведённые в молчании (раздел 6). */
function settleSilence(draft: GameState): void {
  if (draft.vocal.silentSlotsToday < V.wakingSlots) return;
  const bonus = V.recovery.fullSilenceDayBonus;
  draft.resources.vocalHealth = recover(draft.resources.vocalHealth, bonus);
  pushLog(draft, 'silence.fullDay', { vocalHealth: bonus });
}

function tickInjury(draft: GameState): void {
  if (draft.vocal.injuryDaysLeft <= 0) return;
  draft.vocal.injuryDaysLeft -= 1;
  if (draft.vocal.injuryDaysLeft === 0) pushLog(draft, 'injury.over', {});
}

function settleWeek(draft: GameState): void {
  const { money, wagesPaid, foodCost } = weeklySettlement(draft);
  draft.resources.money = money;
  draft.economy.pendingWages = 0;
  draft.economy.weeksPaid += 1;
  pushLog(draft, 'week.payday', { wages: wagesPaid, food: foodCost, money });
  flagDebt(draft);
}

function settleMonth(draft: GameState): void {
  const { money, rent, bills } = monthlySettlement(draft);
  draft.resources.money = money;
  draft.economy.monthsPaid += 1;
  pushLog(draft, 'month.bills', { rent, bills, money });

  monthlySingleFans(draft);

  const { fans, left } = monthlyFanDecay(draft);
  if (left > 0) {
    draft.resources.fans = fans;
    pushLog(draft, 'fans.left', { left, fans });
  }
  draft.flags.performedThisMonth = 0;
  flagDebt(draft);
}

function flagDebt(draft: GameState): void {
  const critical = isDebtCritical(draft.resources.money);
  const wasCritical = (draft.flags.debtCritical ?? 0) > 0;
  draft.flags.debtCritical = critical ? 1 : 0;
  if (critical && !wasCritical) {
    pushLog(draft, 'debt.critical', { money: round2(draft.resources.money) });
  }
}

function resetDaily(draft: GameState): void {
  draft.vocal.loadToday = 0;
  draft.vocal.silentSlotsToday = 0;
  draft.vocal.sleptTonight = false;
}
