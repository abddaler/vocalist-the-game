import { describe, expect, it } from 'vitest';
import { BALANCE } from '@data/balance';
import { makeState } from '../testing/fixtures';
import { canAfford, isDebtCritical, monthlySettlement, weeklySettlement } from './money';

const M = BALANCE.money;

describe('деньги', () => {
  it('покупку пропускает, пока долг не проваливается за лимит', () => {
    const state = makeState({ resources: { money: 0 } });
    expect(canAfford(state, M.debtLimit)).toBe(true);
    expect(canAfford(state, M.debtLimit - 1)).toBe(false);
  });

  it('лимит долга ловится ровно на границе', () => {
    expect(isDebtCritical(M.debtLimit)).toBe(false);
    expect(isDebtCritical(M.debtLimit - 0.01)).toBe(true);
  });
});

describe('конец недели', () => {
  it('выплачивает накопленную зарплату и списывает еду', () => {
    const state = makeState({ resources: { money: 1000 }, economy: { pendingWages: 5400 } });
    const result = weeklySettlement(state);
    expect(result.wagesPaid).toBe(5400);
    expect(result.foodCost).toBe(M.weeklyFood);
    expect(result.money).toBe(1000 + 5400 - M.weeklyFood);
  });

  it('без подработки неделя уводит в минус на стоимость еды', () => {
    const state = makeState({ resources: { money: 0 }, economy: { pendingWages: 0 } });
    expect(weeklySettlement(state).money).toBe(-M.weeklyFood);
  });
});

describe('конец месяца', () => {
  it('списывает аренду и счета', () => {
    const state = makeState({ resources: { money: 30000 } });
    const result = monthlySettlement(state);
    expect(result.money).toBe(30000 - M.monthlyRent - M.monthlyBills);
  });
});
