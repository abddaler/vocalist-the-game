import { describe, expect, it } from 'vitest';
import { BALANCE } from '@data/balance';
import { getActivity } from '@data/activities';
import { cloneState } from '../state';
import { alwaysRng, makeRng, makeState } from '../testing/fixtures';
import type { GameState } from '../types';
import { checkActivity, performActivity } from './activity';
import type { BlockReason } from './activity';
import { Rng } from '../rng';

const perform = (state: GameState, id: string, rng: Rng = makeRng()): GameState => {
  const draft = cloneState(state);
  performActivity(draft, getActivity(id), rng);
  return draft;
};

const blockOf = (state: GameState, id: string): BlockReason | null =>
  checkActivity(state, getActivity(id));

describe('допуск к действию', () => {
  it('пускает урок утром и не пускает ночью', () => {
    expect(blockOf(makeState({ slotIndex: 0 }), 'lesson_breath')).toBeNull();
    expect(blockOf(makeState({ slotIndex: 3 }), 'lesson_breath')).toBe('wrongSlot');
  });

  it('не даёт петь с травмой, но лечиться разрешает', () => {
    const injured = makeState({ slotIndex: 0, vocal: { injuryDaysLeft: 4 } });
    expect(blockOf(injured, 'lesson_breath')).toBe('injured');
    expect(blockOf(injured, 'practice_free')).toBe('injured');
    expect(blockOf(injured, 'doctor_visit')).toBeNull();
    expect(blockOf(injured, 'vocal_rest')).toBeNull();
  });

  it('требование энергии выводится из самой цены действия', () => {
    const tired = makeState({ slotIndex: 2, resources: { energy: 10 } });
    expect(blockOf(tired, 'restaurant_shift')).toBe('noEnergy');
    expect(blockOf(makeState({ slotIndex: 2, resources: { energy: 40 } }), 'restaurant_shift'))
      .toBeNull();
  });

  it('требование денег выводится из цены и упирается в лимит долга', () => {
    const broke = makeState({ slotIndex: 0, resources: { money: BALANCE.money.debtLimit } });
    expect(blockOf(broke, 'lesson_breath')).toBe('noMoney');
    expect(blockOf(makeState({ slotIndex: 0, resources: { money: 0 } }), 'lesson_breath'))
      .toBeNull();
  });

  it('закрытый прогон не пускает никуда', () => {
    expect(blockOf(makeState({ over: true }), 'sleep')).toBe('runOver');
  });
});

describe('применение действия', () => {
  it('смена в ресторане копит зарплату, а не выдаёт её сразу', () => {
    const before = makeState({ slotIndex: 2 });
    const after = perform(before, 'restaurant_shift');
    expect(after.resources.money).toBe(before.resources.money);
    expect(after.economy.pendingWages).toBe(getActivity('restaurant_shift').wages);
  });

  it('урок списывает деньги и энергию и двигает время на слот', () => {
    const before = makeState({ slotIndex: 0 });
    const after = perform(before, 'lesson_breath');
    expect(after.resources.money).toBe(before.resources.money - 1800);
    expect(after.resources.energy).toBe(before.resources.energy - 20);
    expect(after.slotIndex).toBe(1);
    expect(after.skills.breathSupport).toBeGreaterThan(before.skills.breathSupport);
  });

  it('вокальное действие изнашивает связки, невокальное — нет', () => {
    const before = makeState({ slotIndex: 0 });
    expect(perform(before, 'lesson_breath').resources.vocalHealth).toBeLessThan(
      before.resources.vocalHealth,
    );
    expect(perform(before, 'gym').resources.vocalHealth).toBe(before.resources.vocalHealth);
  });

  it('распевка снижает износ следующего действия в тот же день', () => {
    const cold = makeState({ slotIndex: 0 });
    const warm = perform(cold, 'warmup');
    const afterCold = perform({ ...cold, slotIndex: 2 }, 'restaurant_shift');
    const afterWarm = perform({ ...warm, slotIndex: 2 }, 'restaurant_shift');

    const coldLoss = cold.resources.vocalHealth - afterCold.resources.vocalHealth;
    const warmLoss = warm.resources.vocalHealth - afterWarm.resources.vocalHealth;
    expect(warmLoss).toBeLessThan(coldLoss);
  });

  it('сон возвращает энергию и снимает штраф за ночь', () => {
    const tired = makeState({ slotIndex: 3, resources: { energy: 10 } });
    const after = perform(tired, 'sleep');
    // Сон — последний слот суток, поэтому счётчики уже сброшены, а день сменился.
    expect(after.day).toBe(tired.day + 1);
    expect(after.stats.missedNights).toBe(0);
    expect(after.resources.energy).toBe(10 + BALANCE.energy.sleepRestore);
  });

  it('молчание копит слоты тишины', () => {
    const after = perform(makeState({ slotIndex: 0 }), 'vocal_rest');
    expect(after.vocal.silentSlotsToday).toBe(1);
  });

  it('фониатр лечит связки и сокращает срок травмы вдвое', () => {
    const injured = makeState({ slotIndex: 0, resources: { vocalHealth: 20 }, vocal: { injuryDaysLeft: 10 } });
    const after = perform(injured, 'doctor_visit');
    expect(after.resources.vocalHealth).toBe(60);
    expect(after.vocal.injuryDaysLeft).toBe(5);
  });

  it('травма от пения записывается в состояние и в счётчик', () => {
    const fragile = makeState({ slotIndex: 2, resources: { vocalHealth: 25 } });
    const after = perform(fragile, 'restaurant_shift', alwaysRng());
    expect(after.vocal.injuryDaysLeft).toBeGreaterThan(0);
    expect(after.vocal.injuryCount).toBe(1);
    expect(after.log.some((entry) => entry.code === 'injury.start')).toBe(true);
  });

  it('считает выполненные действия для отчётов симулятора', () => {
    const after = perform(makeState({ slotIndex: 0 }), 'gym');
    expect(after.stats.activityCounts.gym).toBe(1);
  });
});
