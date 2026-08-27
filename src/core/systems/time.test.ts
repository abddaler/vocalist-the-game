import { describe, expect, it } from 'vitest';
import { BALANCE } from '@data/balance';
import { cloneState } from '../state';
import { makeRng, makeState } from '../testing/fixtures';
import type { GameState, LogCode } from '../types';
import { advanceTime } from './time';

const run = (state: GameState, slots: number): GameState => {
  const draft = cloneState(state);
  advanceTime(draft, slots, makeRng());
  return draft;
};

const codes = (state: GameState): LogCode[] => state.log.map((entry) => entry.code);

describe('ход времени', () => {
  it('слот за слотом, четыре слота в сутках', () => {
    const state = makeState({ day: 1, slotIndex: 0, vocal: { sleptTonight: true } });
    expect(run(state, 1).slotIndex).toBe(1);
    expect(run(state, 3).slotIndex).toBe(3);
    const nextDay = run(state, 4);
    expect(nextDay.day).toBe(2);
    expect(nextDay.slotIndex).toBe(0);
  });

  it('двухслотовое действие может перекинуть через полночь', () => {
    const state = makeState({ day: 3, slotIndex: 3, vocal: { sleptTonight: true } });
    const result = run(state, 2);
    expect(result.day).toBe(4);
    expect(result.slotIndex).toBe(1);
  });

  it('считает потраченные слоты для отчётов симулятора', () => {
    expect(run(makeState({ vocal: { sleptTonight: true } }), 7).stats.slotsUsed).toBe(7);
  });
});

describe('граница суток', () => {
  it('бессонная ночь бьёт по энергии, настроению и связкам', () => {
    const state = makeState({
      slotIndex: 3,
      resources: { energy: 80, mood: 60, vocalHealth: 90 },
      vocal: { sleptTonight: false },
    });
    const next = run(state, 1);
    const penalty = BALANCE.energy.noSleepPenalty;
    expect(next.resources.energy).toBe(80 + penalty.energy);
    expect(next.resources.mood).toBe(60 + penalty.mood);
    expect(next.resources.vocalHealth).toBe(90 + penalty.vocalHealth);
    expect(next.stats.missedNights).toBe(1);
    expect(codes(next)).toContain('sleep.missed');
  });

  it('после сна штрафа нет', () => {
    const state = makeState({ slotIndex: 3, vocal: { sleptTonight: true } });
    const next = run(state, 1);
    expect(next.stats.missedNights).toBe(0);
    expect(codes(next)).not.toContain('sleep.missed');
  });

  it('целые сутки молчания дают бонус к связкам', () => {
    const silent = makeState({
      slotIndex: 3,
      resources: { vocalHealth: 50 },
      vocal: { sleptTonight: true, silentSlotsToday: BALANCE.vocal.wakingSlots },
    });
    expect(run(silent, 1).resources.vocalHealth).toBe(
      50 + BALANCE.vocal.recovery.fullSilenceDayBonus,
    );

    const partial = { ...silent, vocal: { ...silent.vocal, silentSlotsToday: 2 } };
    expect(run(partial, 1).resources.vocalHealth).toBe(50);
  });

  it('обнуляет суточные счётчики', () => {
    const state = makeState({
      slotIndex: 3,
      vocal: { sleptTonight: true, silentSlotsToday: 3, loadToday: 44 },
    });
    const next = run(state, 1);
    expect(next.vocal.loadToday).toBe(0);
    expect(next.vocal.silentSlotsToday).toBe(0);
    expect(next.vocal.sleptTonight).toBe(false);
  });

  it('тикает травму до выздоровления', () => {
    const state = makeState({ slotIndex: 3, vocal: { sleptTonight: true, injuryDaysLeft: 2 } });
    const afterOne = run(state, 1);
    expect(afterOne.vocal.injuryDaysLeft).toBe(1);
    expect(codes(afterOne)).not.toContain('injury.over');

    const afterTwo = run(state, 5);
    expect(afterTwo.vocal.injuryDaysLeft).toBe(0);
    expect(codes(afterTwo)).toContain('injury.over');
  });
});

describe('границы недели и месяца', () => {
  it('в конце седьмого дня платят зарплату и снимают за еду', () => {
    const state = makeState({
      day: 7,
      slotIndex: 3,
      resources: { money: 1000 },
      economy: { pendingWages: 7200 },
      vocal: { sleptTonight: true },
    });
    const next = run(state, 1);
    expect(next.resources.money).toBe(1000 + 7200 - BALANCE.money.weeklyFood);
    expect(next.economy.pendingWages).toBe(0);
    expect(next.economy.weeksPaid).toBe(1);
    expect(codes(next)).toContain('week.payday');
  });

  it('в конце тридцатого дня снимают аренду и счета', () => {
    const state = makeState({
      day: 30,
      slotIndex: 3,
      resources: { money: 40000 },
      vocal: { sleptTonight: true },
    });
    const next = run(state, 1);
    expect(next.resources.money).toBe(
      40000 - BALANCE.money.monthlyRent - BALANCE.money.monthlyBills,
    );
    expect(next.economy.monthsPaid).toBe(1);
    expect(codes(next)).toContain('month.bills');
  });

  it('фанаты уходят сильнее, если за месяц не было ни одного выступления', () => {
    const idle = makeState({
      day: 30,
      slotIndex: 3,
      resources: { fans: 1000, money: 99999 },
      vocal: { sleptTonight: true },
    });
    const active = makeState({
      day: 30,
      slotIndex: 3,
      resources: { fans: 1000, money: 99999 },
      vocal: { sleptTonight: true },
      flags: { performedThisMonth: 1 },
    });
    expect(run(idle, 1).resources.fans).toBeLessThan(run(active, 1).resources.fans);
    expect(run(active, 1).flags.performedThisMonth).toBe(0);
  });

  it('отмечает критический долг ровно один раз', () => {
    const state = makeState({
      day: 7,
      slotIndex: 3,
      resources: { money: BALANCE.money.debtLimit },
      vocal: { sleptTonight: true },
    });
    const next = run(state, 1);
    expect(next.flags.debtCritical).toBe(1);
    expect(codes(next).filter((code) => code === 'debt.critical')).toHaveLength(1);
  });
});

describe('конец среза', () => {
  it('после шестидесятого дня прогон закрывается', () => {
    const state = makeState({
      day: BALANCE.time.sliceDays,
      slotIndex: 3,
      vocal: { sleptTonight: true },
    });
    const next = run(state, 1);
    expect(next.over).toBe(true);
    expect(codes(next)).toContain('run.over');
  });

  it('до шестидесятого дня прогон открыт', () => {
    const state = makeState({
      day: BALANCE.time.sliceDays - 1,
      slotIndex: 3,
      vocal: { sleptTonight: true },
    });
    expect(run(state, 1).over).toBe(false);
  });
});
