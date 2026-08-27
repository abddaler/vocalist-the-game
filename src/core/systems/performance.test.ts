import { describe, expect, it } from 'vitest';
import { BALANCE } from '@data/balance';
import { GENRES } from '@data/genres';
import { getVenue } from '@data/venues';
import { makeRng, makeState } from '../testing/fixtures';
import {
  baseScore,
  checkPerformance,
  evaluatePerformance,
  expectedScore,
  interceptChance,
  moodModifier,
  outcomeOf,
  songCapacity,
  staminaModifier,
  supportMultiplier,
} from './performance';

const underpass = getVenue('underpass');
const club = getVenue('club_stage');

describe('запас выносливости', () => {
  it('растёт ступенями от стата stamina', () => {
    expect(songCapacity(0)).toBe(BALANCE.performance.baseSongs);
    expect(songCapacity(100)).toBeGreaterThan(songCapacity(0));
  });

  it('штрафует только за песни сверх запаса', () => {
    const capacity = songCapacity(0);
    expect(staminaModifier(0, capacity)).toBe(1);
    expect(staminaModifier(0, capacity + 1)).toBeLessThan(1);
    expect(staminaModifier(0, capacity + 2)).toBeLessThan(staminaModifier(0, capacity + 1));
  });
});

describe('оценка выступления', () => {
  it('опора множит всю оценку: её нет в весах ни одного жанра (5.1)', () => {
    for (const genre of Object.values(GENRES)) {
      expect(genre.statWeights.breathSupport).toBeUndefined();
    }
    expect(supportMultiplier(0)).toBeCloseTo(BALANCE.performance.supportFloor);
    expect(supportMultiplier(100)).toBeCloseTo(
      BALANCE.performance.supportFloor + BALANCE.performance.supportSpan,
    );

    const weak = makeState({ skills: { breathSupport: 5, timbre: 40, pitch: 40 } });
    const strong = makeState({ skills: { breathSupport: 80, timbre: 40, pitch: 40 } });
    expect(baseScore(strong, GENRES.pop)).toBeGreaterThan(baseScore(weak, GENRES.pop));
  });

  it('жанр решает, какие статы слышно', () => {
    const wordy = makeState({ skills: { diction: 90, extreme: 0 } });
    expect(baseScore(wordy, GENRES.estrada)).toBeGreaterThan(baseScore(wordy, GENRES.metal));
  });

  it('настроение и здоровье режут результат', () => {
    expect(moodModifier(0)).toBeCloseTo(BALANCE.performance.moodFloor);
    expect(moodModifier(100)).toBeCloseTo(1);

    const fresh = makeState({ resources: { vocalHealth: 100, mood: 100 } });
    const spent = makeState({ resources: { vocalHealth: 25, mood: 20 } });
    expect(expectedScore(spent, 2)).toBeLessThan(expectedScore(fresh, 2));
  });

  it('исход определяется порогами площадки', () => {
    expect(outcomeOf(underpass.thresholds.ok - 0.1, underpass)).toBe('fail');
    expect(outcomeOf(underpass.thresholds.ok, underpass)).toBe('ok');
    expect(outcomeOf(underpass.thresholds.good, underpass)).toBe('good');
    expect(outcomeOf(underpass.thresholds.triumph, underpass)).toBe('triumph');
  });

  it('прогноз совпадает с оценкой с точностью до броска', () => {
    const state = makeState({ slotIndex: 2, skills: { breathSupport: 40, timbre: 30 } });
    const result = evaluatePerformance(state, underpass, 2, makeRng());
    const forecast = expectedScore(state, 2);
    expect(result.score).toBeGreaterThanOrEqual(forecast * BALANCE.performance.jitter.min - 0.01);
    expect(result.score).toBeLessThanOrEqual(forecast * BALANCE.performance.jitter.max + 0.01);
  });
});

describe('награды', () => {
  it('провал платит меньше триумфа', () => {
    const weak = makeState({ slotIndex: 2, skills: { breathSupport: 1, timbre: 1, pitch: 1 } });
    const strong = makeState({
      slotIndex: 2,
      skills: { breathSupport: 90, timbre: 90, pitch: 90, registers: 90, stage: 90, stamina: 90, diction: 90 },
    });
    const bad = evaluatePerformance(weak, underpass, 2, makeRng());
    const good = evaluatePerformance(strong, underpass, 2, makeRng());
    expect(bad.outcome).toBe('fail');
    expect(good.money).toBeGreaterThan(bad.money);
    expect(good.fame).toBeGreaterThan(bad.fame);
  });

  it('площадка перестаёт давать славу тому, кто её перерос', () => {
    const rookie = makeState({ slotIndex: 2, skills: { timbre: 40, pitch: 40 } });
    const known = makeState({
      slotIndex: 2,
      skills: { timbre: 40, pitch: 40 },
      resources: { fame: underpass.fameCeiling },
    });
    const a = evaluatePerformance(rookie, underpass, 2, makeRng());
    const b = evaluatePerformance(known, underpass, 2, makeRng());
    expect(b.fame).toBeLessThan(a.fame);
  });

  it('менеджер забирает свою долю', () => {
    const base = makeState({ slotIndex: 2, skills: { timbre: 40, pitch: 40 } });
    const managed = makeState({
      slotIndex: 2,
      skills: { timbre: 40, pitch: 40 },
      career: { manager: true },
    });
    const plain = evaluatePerformance(base, underpass, 2, makeRng());
    const withManager = evaluatePerformance(managed, underpass, 2, makeRng());
    expect(withManager.managerCut).toBeGreaterThan(0);
    expect(withManager.money).toBeLessThan(plain.money);
  });
});

describe('допуск на площадку', () => {
  it('клуб закрыт без славы и имиджа (раздел 8)', () => {
    const evening = makeState({ slotIndex: 2 });
    expect(checkPerformance(evening, club, 4)).toBe('lowFame');
    expect(checkPerformance(makeState({ slotIndex: 2, resources: { fame: 200 } }), club, 4)).toBe(
      'lowImage',
    );
  });

  it('сет-лист должен укладываться в рамки площадки', () => {
    const evening = makeState({ slotIndex: 2 });
    expect(checkPerformance(evening, underpass, underpass.setlist.min - 1)).toBe('badSetlist');
    expect(checkPerformance(evening, underpass, underpass.setlist.max + 1)).toBe('badSetlist');
    expect(checkPerformance(evening, underpass, underpass.setlist.min)).toBeNull();
  });

  it('с травмой не поют нигде', () => {
    const injured = makeState({ slotIndex: 2, vocal: { injuryDaysLeft: 3 } });
    expect(checkPerformance(injured, underpass, 2)).toBe('injured');
  });
});

describe('конкурент', () => {
  it('перехватывает тем чаще, чем сильнее оторвался (9.3)', () => {
    const behind = makeState({ resources: { fame: 200 }, career: { rivalFame: 50 } });
    const level = makeState({ resources: { fame: 100 }, career: { rivalFame: 100 } });
    const ahead = makeState({ resources: { fame: 10 }, career: { rivalFame: 400 } });

    expect(interceptChance(behind)).toBe(0);
    expect(interceptChance(level)).toBe(0);
    expect(interceptChance(ahead)).toBeGreaterThan(0);
    expect(interceptChance(ahead)).toBeLessThanOrEqual(BALANCE.rival.maxInterceptChance);
  });
});
