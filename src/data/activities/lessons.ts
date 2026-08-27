import type { ActivityInput } from '../schema';

/**
 * Вокальная студия (раздел 8, локация 2): выбор стата и три уровня
 * педагога — дороже значит быстрее. Записи собираются из таблицы, а не
 * пишутся руками: двадцать одна почти одинаковая запись разъедется
 * при первой же правке баланса.
 */
const LEVELS = [
  { id: 'junior', priceMul: 0.45, gainMul: 0.6, load: 5, energy: -16 },
  { id: 'mid', priceMul: 1, gainMul: 1, load: 6, energy: -20 },
  { id: 'master', priceMul: 2.4, gainMul: 1.85, load: 6, energy: -24 },
] as const;

type TaughtSkill = {
  readonly skill: string;
  readonly price: number;
  readonly gain: number;
  readonly side?: Readonly<Record<string, number>>;
  readonly requires?: ActivityInput['requires'];
};

const TAUGHT: readonly TaughtSkill[] = [
  { skill: 'breathSupport', price: 1800, gain: 2.2, side: { stamina: 0.3 } },
  { skill: 'range', price: 1900, gain: 2.0, side: { registers: 0.4 } },
  { skill: 'registers', price: 2000, gain: 2.0, side: { range: 0.3 } },
  { skill: 'timbre', price: 1800, gain: 2.0, side: { registers: 0.6 } },
  { skill: 'diction', price: 1500, gain: 2.4 },
  { skill: 'pitch', price: 1700, gain: 2.0, side: { diction: 0.5 } },
  {
    skill: 'extreme',
    price: 2600,
    gain: 1.8,
    // Экстрим заблокирован до жанра и опоры 45 (раздел 5.1).
    requires: { genres: ['metal'], minSkill: { breathSupport: 45 } },
  },
];

const TEXTS: Record<string, string> = {};
export const LESSON_TEXTS: Readonly<Record<string, string>> = TEXTS;

const LEVEL_NAMES: Record<string, string> = {
  junior: 'начинающий педагог',
  mid: 'педагог',
  master: 'мастер',
};

const SKILL_NAMES: Record<string, string> = {
  breathSupport: 'опора',
  range: 'диапазон',
  registers: 'регистры',
  timbre: 'тембр',
  diction: 'артикуляция',
  pitch: 'интонация',
  extreme: 'экстрим-техники',
};

export const LESSONS: readonly ActivityInput[] = TAUGHT.flatMap((subject) =>
  LEVELS.map((level): ActivityInput => {
    const id = `lesson_${subject.skill}_${level.id}`;
    const nameKey = `activity.${id}`;
    TEXTS[nameKey] = `Урок (${LEVEL_NAMES[level.id]}): ${SKILL_NAMES[subject.skill]}`;

    const skillGain: Record<string, number> = {
      [subject.skill]: round(subject.gain * level.gainMul),
    };
    for (const [key, value] of Object.entries(subject.side ?? {})) {
      skillGain[key] = round(value * level.gainMul);
    }

    return {
      id,
      nameKey,
      tags: ['training', 'vocal'],
      requires: { slots: ['morning', 'day'], ...subject.requires },
      baseLoad: level.load,
      energy: level.energy,
      money: -Math.round(subject.price * level.priceMul),
      skillGain,
      mood: 1,
      relationGain: { teacher: level.id === 'master' ? 3 : 2 },
    };
  }),
);

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
