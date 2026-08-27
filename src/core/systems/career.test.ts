import { describe, expect, it } from 'vitest';
import { BALANCE } from '@data/balance';
import { getVenue } from '@data/venues';
import { cloneState } from '../state';
import { alwaysRng, makeRng, makeState } from '../testing/fixtures';
import type { GameState } from '../types';
import { growRival, monthlySingleFans, performAtVenue } from './career';

const underpass = getVenue('underpass');
const corporate = getVenue('corporate');

const play = (state: GameState, songs = 2, rng = makeRng()): GameState => {
  const draft = cloneState(state);
  performAtVenue(draft, underpass, songs, rng);
  return draft;
};

/**
 * Готовый к выступлению вокалист. Конкурента по умолчанию держим позади:
 * иначе «кубик всегда выпадает» уводит площадку и до пения не доходит.
 */
const ready = (patch = {}) =>
  makeState({
    slotIndex: 2,
    skills: { breathSupport: 50, timbre: 40, pitch: 40, stamina: 40 },
    career: { rivalFame: 0 },
    ...patch,
  });

describe('выступление целиком', () => {
  it('платит, изнашивает связки и тратит силы', () => {
    const before = ready();
    const after = play(before);
    expect(after.resources.money).toBeGreaterThan(before.resources.money);
    expect(after.resources.vocalHealth).toBeLessThan(before.resources.vocalHealth);
    expect(after.resources.energy).toBeLessThan(before.resources.energy);
    expect(after.career.performances).toBe(1);
    expect(after.log.some((entry) => entry.code === 'performance.done')).toBe(true);
  });

  it('отмечает месяц активным, чтобы фанаты не разбегались', () => {
    expect(play(ready()).flags.performedThisMonth).toBe(1);
  });

  it('пишет исход в счётчики для симулятора', () => {
    const after = play(ready());
    expect(Object.values(after.stats.outcomes).reduce((a, b) => a + b, 0)).toBe(1);
  });

  it('игра на своей же ступени карьеру не двигает', () => {
    const after = play(ready());
    expect(after.career.tier).toBe('underpass');
    expect(after.log.some((entry) => entry.code === 'career.up')).toBe(false);
  });

  it('игра на площадке выше поднимает ступень (9.5)', () => {
    const draft = cloneState(ready({ resources: { fame: 200 } }));
    performAtVenue(draft, corporate, corporate.setlist.min, makeRng());
    expect(draft.career.tier).toBe(corporate.tier);
    expect(draft.log.some((entry) => entry.code === 'career.up')).toBe(true);
  });

  it('на изношенных связках может закончиться травмой', () => {
    const fragile = ready({ resources: { vocalHealth: 24 } });
    const after = play(fragile, 2, alwaysRng());
    expect(after.vocal.injuryDaysLeft).toBeGreaterThan(0);
    expect(after.vocal.injuryCount).toBe(1);
  });
});

describe('конкурент перехватывает площадку (9.3)', () => {
  it('выступление не состоится, а настроение падает', () => {
    const behind = ready({ resources: { fame: 0 }, career: { rivalFame: 999 } });
    const draft = cloneState(behind);
    performAtVenue(draft, corporate, corporate.setlist.min, alwaysRng());

    expect(draft.career.performances).toBe(0);
    expect(draft.resources.mood).toBeLessThan(behind.resources.mood);
    expect(draft.log.at(-1)?.code).toBe('performance.intercepted');
  });

  it('переход перехватить нельзя: его никто не бронирует', () => {
    const behind = ready({ resources: { fame: 0 }, career: { rivalFame: 999 } });
    expect(underpass.interceptable).toBe(false);
    expect(play(behind, 2, alwaysRng()).career.performances).toBe(1);
  });
});

describe('менеджер', () => {
  it('нанимается сам, когда слава дорастает до порога (9.3)', () => {
    const famous = ready({ resources: { fame: BALANCE.career.managerFame } });
    expect(play(famous).career.manager).toBe(true);
  });

  it('не нанимается раньше времени', () => {
    expect(play(ready({ resources: { fame: 10 } })).career.manager).toBe(false);
  });
});

describe('фон карьеры', () => {
  it('слава конкурента растёт сама', () => {
    const draft = cloneState(makeState());
    const before = draft.career.rivalFame;
    growRival(draft);
    expect(draft.career.rivalFame).toBeCloseTo(before + BALANCE.rival.growthPerDay);
  });

  it('синглы приводят фанатов раз в месяц', () => {
    const draft = cloneState(makeState({ career: { singles: 3 } }));
    monthlySingleFans(draft);
    expect(draft.resources.fans).toBe(3 * BALANCE.singles.fansPerMonth);
  });

  it('без синглов ничего не происходит', () => {
    const draft = cloneState(makeState());
    monthlySingleFans(draft);
    expect(draft.resources.fans).toBe(0);
    expect(draft.log).toHaveLength(0);
  });
});
