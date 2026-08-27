import { z } from 'zod';
import { GENRE_IDS, SKILL_KEYS, SLOTS } from '@core/types';

/** Карта навык -> число. Ключи проверяем явно, чтобы опечатка падала при старте. */
const skillMap = z
  .record(z.string(), z.number())
  .refine(
    (map) => Object.keys(map).every((key) => (SKILL_KEYS as readonly string[]).includes(key)),
    { message: `ключ навыка должен быть одним из: ${SKILL_KEYS.join(', ')}` },
  );

const requirementSchema = z
  .object({
    slots: z.array(z.enum(SLOTS)).optional(),
    minEnergy: z.number().optional(),
    minMoney: z.number().optional(),
    minSkill: skillMap.optional(),
    notInjured: z.boolean().optional(),
    genres: z.array(z.enum(GENRE_IDS)).optional(),
  })
  .default({});

export const activitySchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  slots: z.number().int().min(1).max(2).default(1),
  tags: z
    .array(
      z.enum([
        'vocal',
        'warmup',
        'sleep',
        'silence',
        'work',
        'medical',
        'training',
        'rest',
      ]),
    )
    .default([]),
  requires: requirementSchema,

  baseLoad: z.number().min(0).default(0),
  energy: z.number().default(0),
  money: z.number().default(0),
  wages: z.number().min(0).default(0),
  mood: z.number().default(0),
  vocalHealth: z.number().default(0),
  skillGain: skillMap.default({}),
  fame: z.number().default(0),
  fans: z.number().default(0),
  reputation: z.number().default(0),
});

export type ActivityInput = z.input<typeof activitySchema>;

/**
 * Валидация контента при загрузке модуля. Падать лучше сразу и громко,
 * чем ловить NaN в балансе через сорок игровых дней.
 */
export function parseActivities(input: readonly ActivityInput[]) {
  const parsed = input.map((entry, index) => {
    const result = activitySchema.safeParse(entry);
    if (!result.success) {
      throw new Error(
        `data/activities: запись #${index} (${String(entry.id)}) не прошла валидацию:\n` +
          z.prettifyError(result.error),
      );
    }
    return result.data;
  });

  const ids = new Set<string>();
  for (const activity of parsed) {
    if (ids.has(activity.id)) throw new Error(`data/activities: дубль id "${activity.id}"`);
    ids.add(activity.id);
  }
  return parsed;
}
