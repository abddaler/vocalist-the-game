import { z } from 'zod';
import { CAREER_TIERS, GENRE_IDS, NPC_IDS, SKILL_KEYS } from '../types';
import type { GameState } from '../types';
import { SAVE_VERSION } from './initialState';

/**
 * Сериализация прогона (раздел 2, ограничение 6).
 *
 * Состояние — обычный JSON, включая состояние ГПСЧ: поэтому загруженная
 * игра продолжается ровно тем же потоком случайности, что и до выхода.
 *
 * Схема проверяет структуру, а не только версию: битый или чужой файл
 * должен честно отвергнуться, а не тихо загрузиться с NaN внутри.
 */
const numberRecord = z.record(z.string(), z.number());

const saveSchema = z.object({
  version: z.number().int(),
  savedAt: z.number().int(),
  state: z.object({
    version: z.number().int(),
    seed: z.string(),
    rng: z.object({ value: z.number() }),
    day: z.number().int().min(1),
    slotIndex: z.number().int().min(0).max(3),
    genre: z.enum(GENRE_IDS),
    genreSwitches: z.number().int().min(0),
    skills: z.record(z.enum(SKILL_KEYS), z.number()),
    resources: z.object({
      money: z.number(),
      energy: z.number(),
      vocalHealth: z.number(),
      fame: z.number(),
      fans: z.number(),
      mood: z.number(),
      reputation: z.number(),
    }),
    vocal: z.looseObject({ injuryDaysLeft: z.number() }),
    economy: z.looseObject({ pendingWages: z.number() }),
    career: z.looseObject({ tier: z.enum(CAREER_TIERS), performances: z.number() }),
    npcs: z.record(z.enum(NPC_IDS), z.looseObject({ relation: z.number(), met: z.boolean() })),
    wardrobe: z.object({
      owned: z.array(z.string()),
      equipped: z.record(z.string(), z.string()),
    }),
    events: z.object({
      seen: numberRecord,
      pending: z.string().nullable(),
      slotsSinceEvent: z.number(),
    }),
    stats: z.looseObject({ slotsUsed: z.number() }),
    flags: numberRecord,
    log: z.array(z.looseObject({ day: z.number(), code: z.string() })),
    over: z.boolean(),
  }),
});

export interface SaveFile {
  readonly version: number;
  readonly savedAt: number;
  readonly state: GameState;
}

export function serializeSave(state: GameState, now: number): string {
  return JSON.stringify({ version: SAVE_VERSION, savedAt: now, state } satisfies SaveFile);
}

/** Возвращает null для битого, чужого или устаревшего файла. */
export function parseSave(raw: string | null): SaveFile | null {
  if (!raw) return null;

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }

  const result = saveSchema.safeParse(json);
  if (!result.success) return null;
  if (result.data.version !== SAVE_VERSION) return null;

  return result.data as unknown as SaveFile;
}
