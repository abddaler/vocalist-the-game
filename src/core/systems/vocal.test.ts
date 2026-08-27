import { describe, expect, it } from 'vitest';
import { BALANCE } from '@data/balance';
import { GENRES } from '@data/genres';
import { alwaysRng, makeState, neverRng } from '../testing/fixtures';
import {
  applyLoad,
  computeLoad,
  healInjury,
  healthScoreModifier,
  healthTier,
  injuryChance,
  isExtremeBlockedByHealth,
  isWarmedUp,
  loadForActivity,
  recover,
} from './vocal';

describe('пороги здоровья связок', () => {
  it('разбивает шкалу ровно по разделу 6', () => {
    expect(healthTier(100)).toBe('normal');
    expect(healthTier(71)).toBe('normal');
    expect(healthTier(70)).toBe('fatigue');
    expect(healthTier(40)).toBe('fatigue');
    expect(healthTier(39)).toBe('hoarse');
    expect(healthTier(20)).toBe('hoarse');
    expect(healthTier(19)).toBe('critical');
    expect(healthTier(0)).toBe('critical');
  });

  it('штрафует оценку выступления по мере износа', () => {
    expect(healthScoreModifier(90)).toBe(1);
    expect(healthScoreModifier(50)).toBeCloseTo(0.9);
    expect(healthScoreModifier(30)).toBeCloseTo(0.7);
    expect(healthScoreModifier(10)).toBeCloseTo(0.5);
  });

  it('поднимает риск травмы только с осиплости', () => {
    expect(injuryChance(90)).toBe(0);
    expect(injuryChance(50)).toBe(0);
    expect(injuryChance(30)).toBeCloseTo(0.15);
    expect(injuryChance(10)).toBeCloseTo(0.45);
  });

  it('закрывает экстрим при осиплости и ниже', () => {
    expect(isExtremeBlockedByHealth(makeState({ resources: { vocalHealth: 80 } }))).toBe(false);
    expect(isExtremeBlockedByHealth(makeState({ resources: { vocalHealth: 45 } }))).toBe(false);
    expect(isExtremeBlockedByHealth(makeState({ resources: { vocalHealth: 30 } }))).toBe(true);
    expect(isExtremeBlockedByHealth(makeState({ resources: { vocalHealth: 5 } }))).toBe(true);
  });
});

describe('формула износа', () => {
  const base = { baseLoad: 10, genreMultiplier: 1, warmedUp: false };

  it('при нулевой опоре множитель 1.8, при полной — 0.8', () => {
    expect(computeLoad({ ...base, breathSupport: 0 })).toBeCloseTo(18);
    expect(computeLoad({ ...base, breathSupport: 100 })).toBeCloseTo(8);
  });

  it('опора снижает износ монотонно', () => {
    const loads = [0, 25, 50, 75, 100].map((breathSupport) =>
      computeLoad({ ...base, breathSupport }),
    );
    for (let i = 1; i < loads.length; i += 1) {
      expect(loads[i]!).toBeLessThan(loads[i - 1]!);
    }
  });

  it('распевка срезает ровно warmupBonus', () => {
    const cold = computeLoad({ ...base, breathSupport: 40 });
    const warm = computeLoad({ ...base, breathSupport: 40, warmedUp: true });
    expect(warm).toBeCloseTo(cold * (1 - BALANCE.vocal.warmupBonus));
  });

  it('жанр умножает износ: эстрада дешевле метала', () => {
    const estrada = computeLoad({ ...base, breathSupport: 40, genreMultiplier: GENRES.estrada.vocalLoadMultiplier });
    const metal = computeLoad({ ...base, breathSupport: 40, genreMultiplier: GENRES.metal.vocalLoadMultiplier });
    expect(metal).toBeCloseTo(estrada * 1.8);
  });

  it('не вокальное действие не изнашивает связки', () => {
    expect(computeLoad({ ...base, baseLoad: 0, breathSupport: 0 })).toBe(0);
  });

  it('главный урок игры: опора выгоднее, чем терпеть', () => {
    // Тот же концерт с опорой 10 и с опорой 70.
    const novice = computeLoad({ baseLoad: 18, breathSupport: 10, genreMultiplier: 1.1, warmedUp: false });
    const trained = computeLoad({ baseLoad: 18, breathSupport: 70, genreMultiplier: 1.1, warmedUp: true });
    expect(trained).toBeLessThan(novice / 2);
  });
});

describe('распевка и нагрузка через состояние', () => {
  it('распевка действует только в тот же день', () => {
    const state = makeState({ day: 5, vocal: { warmedUpOnDay: 5 } });
    expect(isWarmedUp(state)).toBe(true);
    expect(isWarmedUp({ ...state, day: 6 })).toBe(false);
  });

  it('loadForActivity собирает опору, жанр и распевку вместе', () => {
    const state = makeState({ day: 1, skills: { breathSupport: 50 }, vocal: { warmedUpOnDay: 1 } });
    const expected = computeLoad({
      baseLoad: 10,
      breathSupport: 50,
      genreMultiplier: GENRES.pop.vocalLoadMultiplier,
      warmedUp: true,
    });
    expect(loadForActivity(state, 10, GENRES.pop)).toBeCloseTo(expected);
  });
});

describe('травма', () => {
  it('на здоровых связках не случается даже при «выпавшем» кубике', () => {
    const state = makeState({ resources: { vocalHealth: 100 } });
    expect(applyLoad(state, 10, alwaysRng()).injuryDays).toBe(0);
  });

  it('на осипших связках случается, когда кубик выпал', () => {
    const state = makeState({ resources: { vocalHealth: 35 } });
    const outcome = applyLoad(state, 5, alwaysRng());
    expect(outcome.injuryDays).toBeGreaterThanOrEqual(BALANCE.vocal.injuryDays.min);
    expect(outcome.injuryDays).toBeLessThanOrEqual(BALANCE.vocal.injuryDays.max);
  });

  it('не случается, когда кубик не выпал', () => {
    const state = makeState({ resources: { vocalHealth: 15 } });
    expect(applyLoad(state, 5, neverRng()).injuryDays).toBe(0);
  });

  it('риск считается по состоянию ПОСЛЕ износа: один зверский концерт тоже калечит', () => {
    const state = makeState({ resources: { vocalHealth: 100 } });
    expect(applyLoad(state, 90, alwaysRng()).injuryDays).toBeGreaterThan(0);
  });

  it('фониатр сокращает оставшийся срок вдвое', () => {
    expect(healInjury(12)).toBe(6);
    expect(healInjury(5)).toBe(3);
    expect(healInjury(1)).toBe(1);
  });
});

describe('восстановление', () => {
  it('не заходит за 100 и не падает ниже 0', () => {
    expect(recover(96, 8)).toBe(100);
    expect(recover(3, -20)).toBe(0);
  });
});
