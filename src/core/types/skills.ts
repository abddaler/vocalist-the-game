/** Вокальные навыки, раздел 5.1. Все в диапазоне 0..100. */
export const SKILL_KEYS = [
  'breathSupport',
  'range',
  'registers',
  'timbre',
  'diction',
  'pitch',
  'stamina',
  'extreme',
  'stage',
] as const;

export type SkillKey = (typeof SKILL_KEYS)[number];

export type VocalSkills = Record<SkillKey, number>;

export type SkillGains = Partial<Record<SkillKey, number>>;
