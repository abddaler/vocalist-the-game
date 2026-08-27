import { BALANCE } from '@data/balance';
import { round2 } from '../util/num';
import type { GameState } from '../types';

const MONEY = BALANCE.money;

export function canAfford(state: GameState, cost: number): boolean {
  return state.resources.money + cost >= MONEY.debtLimit;
}

/** Долг перевалил за лимит — приходит коллектор (5.2). */
export function isDebtCritical(money: number): boolean {
  return money < MONEY.debtLimit;
}

/** Конец недели: зарплата с подработки минус еда (раздел 4). */
export function weeklySettlement(state: GameState): {
  money: number;
  wagesPaid: number;
  foodCost: number;
} {
  const wagesPaid = round2(state.economy.pendingWages);
  const foodCost = MONEY.weeklyFood;
  return {
    money: round2(state.resources.money + wagesPaid - foodCost),
    wagesPaid,
    foodCost,
  };
}

/** Конец месяца: аренда и счета (раздел 4). */
export function monthlySettlement(state: GameState): {
  money: number;
  rent: number;
  bills: number;
} {
  const rent = MONEY.monthlyRent;
  const bills = MONEY.monthlyBills;
  return { money: round2(state.resources.money - rent - bills), rent, bills };
}
