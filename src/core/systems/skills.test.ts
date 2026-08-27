import { describe, expect, it } from 'vitest';
import { BALANCE } from '@data/balance';
import { makeState } from '../testing/fixtures';
import {
  applySkillGains,
  diminishingFactor,
  energyFactor,
  isExtremeUnlocked,
  moodFactor,
  skillGainFor,
  supportFactor,
} from './skills';

describe('затухание роста', () => {
  it('у новичка полное, у потолка нулевое', () => {
    expect(diminishingFactor(0)).toBeCloseTo(1);
    expect(diminishingFactor(100)).toBeCloseTo(0);
  });

  it('монотонно убывает', () => {
    const values = [0, 20, 40, 60, 80, 100].map(diminishingFactor);
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]!).toBeLessThan(values[i - 1]!);
    }
  });
});

describe('множители эффективности', () => {
  it('опора разгоняет все прочие статы, но не саму себя', () => {
    expect(supportFactor(0, 'timbre')).toBeCloseTo(BALANCE.skills.supportFloor);
    expect(supportFactor(100, 'timbre')).toBeCloseTo(1);
    expect(supportFactor(0, 'breathSupport')).toBe(1);
  });

  it('настроение и энергия режут скорость роста', () => {
    expect(moodFactor(0)).toBeCloseTo(BALANCE.skills.moodFloor);
    expect(moodFactor(100)).toBeCloseTo(1);
    expect(energyFactor(50)).toBe(1);
    expect(energyFactor(5)).toBeCloseTo(BALANCE.energy.lowEfficiency);
  });
});

describe('начисление навыков', () => {
  it('на высокой опоре тембр растёт быстрее, чем на низкой', () => {
    const weak = makeState({ skills: { breathSupport: 5, timbre: 20 } });
    const strong = makeState({ skills: { breathSupport: 80, timbre: 20 } });
    expect(skillGainFor(strong, 'timbre', 2)).toBeGreaterThan(skillGainFor(weak, 'timbre', 2));
  });

  it('усталый и подавленный учится хуже', () => {
    const fresh = makeState({ resources: { energy: 90, mood: 90 } });
    const spent = makeState({ resources: { energy: 5, mood: 10 } });
    expect(skillGainFor(spent, 'pitch', 2)).toBeLessThan(skillGainFor(fresh, 'pitch', 2));
  });

  it('не пробивает потолок в 100', () => {
    const state = makeState({ skills: { timbre: 99.9 } });
    const { skills } = applySkillGains(state, { timbre: 50 });
    expect(skills.timbre).toBeLessThanOrEqual(BALANCE.skills.max);
  });

  it('возвращает только то, что реально приросло', () => {
    const state = makeState({ skills: { timbre: 100 } });
    const { applied } = applySkillGains(state, { timbre: 5, pitch: 2 });
    expect(applied.timbre).toBeUndefined();
    expect(applied.pitch).toBeGreaterThan(0);
  });

  it('не трогает исходное состояние', () => {
    const state = makeState({ skills: { pitch: 30 } });
    applySkillGains(state, { pitch: 10 });
    expect(state.skills.pitch).toBe(30);
  });
});

describe('экстрим-техники', () => {
  it('заперты, пока опора не дотянет до порога (5.1)', () => {
    const unlock = BALANCE.vocal.extremeUnlockSupport;
    expect(isExtremeUnlocked(makeState({ skills: { breathSupport: unlock - 1 } }))).toBe(false);
    expect(isExtremeUnlocked(makeState({ skills: { breathSupport: unlock } }))).toBe(true);
  });
});
