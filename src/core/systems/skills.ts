import { BALANCE } from '@data/balance';
import { clamp, round2 } from '../util/num';
import type { GameState, SkillGains, SkillKey, VocalSkills } from '../types';

const { skills: S, energy: E, mood: M } = BALANCE;

/**
 * Затухание у потолка: у новичка стат прёт, у мастера ползёт.
 * При current = 0 множитель 1, при current = max — 0.
 */
export function diminishingFactor(current: number): number {
  const ratio = clamp(current, 0, S.max) / S.max;
  return clamp(1 - Math.pow(ratio, S.diminishingExponent), 0, 1);
}

/**
 * Опора — множитель к эффективности всех остальных вокальных статов (5.1).
 * Сама опора этим множителем не режется, иначе новичок не сдвинется с места.
 */
export function supportFactor(breathSupport: number, target: SkillKey): number {
  if (target === 'breathSupport') return 1;
  return S.supportFloor + S.supportSpan * (clamp(breathSupport, 0, S.max) / S.max);
}

export function moodFactor(mood: number): number {
  return S.moodFloor + S.moodSpan * (clamp(mood, 0, M.max) / M.max);
}

export function energyFactor(energy: number): number {
  return energy < E.lowThreshold ? E.lowEfficiency : 1;
}

/** Итоговая прибавка к одному стату с учётом всех множителей. */
export function skillGainFor(state: GameState, key: SkillKey, base: number): number {
  if (base <= 0) return 0;
  const gain =
    base *
    diminishingFactor(state.skills[key]) *
    supportFactor(state.skills.breathSupport, key) *
    moodFactor(state.resources.mood) *
    energyFactor(state.resources.energy);
  return round2(gain);
}

/** Возвращает новую таблицу статов и то, что реально приросло. */
export function applySkillGains(
  state: GameState,
  gains: SkillGains,
): { skills: VocalSkills; applied: SkillGains } {
  const skills = { ...state.skills };
  const applied: SkillGains = {};

  for (const [rawKey, base] of Object.entries(gains)) {
    const key = rawKey as SkillKey;
    const gain = skillGainFor(state, key, base ?? 0);
    if (gain <= 0) continue;
    const before = skills[key];
    skills[key] = round2(clamp(before + gain, 0, S.max));
    const delta = round2(skills[key] - before);
    if (delta > 0) applied[key] = delta;
  }

  return { skills, applied };
}

/** Экстрим закрыт, пока не набрана опора (5.1). Жанр проверяется отдельно. */
export function isExtremeUnlocked(state: GameState): boolean {
  return state.skills.breathSupport >= BALANCE.vocal.extremeUnlockSupport;
}
