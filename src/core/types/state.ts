import type { RngState } from '../rng';
import type { CareerTier } from './career';
import type { GenreId } from './genre';
import type { LogEntry } from './log';
import type { NpcId, NpcState } from './npc';
import type { Wardrobe } from './outfit';
import type { VocalSkills } from './skills';

export interface Resources {
  /** Может уходить в минус: долг сверх лимита запускает коллектора (5.2). */
  money: number;
  /** 0..100, тратится действиями, восстанавливается сном и едой. */
  energy: number;
  /** 0..100. Центральный ресурс игры, раздел 6. */
  vocalHealth: number;
  fame: number;
  fans: number;
  /** 0..100. Низкое настроение бьёт по всей эффективности. */
  mood: number;
  /** -100..100. */
  reputation: number;
}

export interface VocalCondition {
  /** День, в который делали распевку. null = сегодня не распевались. */
  warmedUpOnDay: number | null;
  /** Дней травмы осталось. 0 = здоров. */
  injuryDaysLeft: number;
  /** Сколько всего травм за прогон — для отчётов симулятора. */
  injuryCount: number;
  /** Накопленная нагрузка за сутки, для хроники и баланса. */
  loadToday: number;
  /** Слоты бодрствования, проведённые в молчании сегодня. */
  silentSlotsToday: number;
  /** Спал ли игрок этой ночью. Проверяется на границе суток. */
  sleptTonight: boolean;
}

export interface Economy {
  /** Заработок с подработки, ждущий выплаты в конце недели. */
  pendingWages: number;
  weeksPaid: number;
  monthsPaid: number;
}

export interface Career {
  tier: CareerTier;
  /** Сколько выступлений отыграно за прогон. */
  performances: number;
  /** Записанные синглы приносят фанатов пассивно (раздел 8, локация 6). */
  singles: number;
  /** Слава конкурента: чем сильнее оторвался, тем чаще перехватывает концерты. */
  rivalFame: number;
  /** Нанят ли менеджер (9.3). */
  manager: boolean;
}

export interface WardrobeState {
  owned: string[];
  equipped: Wardrobe;
}

export interface EventsState {
  /** id -> сколько раз выпадало. */
  seen: Record<string, number>;
  /** Событие, ждущее выбора игрока. Пока висит — другие действия закрыты. */
  pending: string | null;
  /** Слотов с последнего события: не сыпем их подряд. */
  slotsSinceEvent: number;
}

export interface RunStats {
  slotsUsed: number;
  activityCounts: Record<string, number>;
  missedNights: number;
  blockedAttempts: number;
  /** Итоги выступлений по исходам — для отчётов симулятора (раздел 10). */
  outcomes: Record<string, number>;
}

export interface GameState {
  /** Версия формата сохранения. */
  readonly version: number;
  readonly seed: string;
  rng: RngState;

  /** 1..60 в срезе. */
  day: number;
  /** Индекс слота внутри суток, 0..3. */
  slotIndex: number;

  genre: GenreId;
  /** Жанр можно сменить один раз за прохождение (раздел 7). */
  genreSwitches: number;

  skills: VocalSkills;
  resources: Resources;
  vocal: VocalCondition;
  economy: Economy;
  career: Career;
  npcs: Record<NpcId, NpcState>;
  wardrobe: WardrobeState;
  events: EventsState;
  stats: RunStats;

  /** Произвольные отметки: сюжетные вехи, разовые события. */
  flags: Record<string, number>;
  log: LogEntry[];
  /** Прогон окончен: вышли за 60 дней или проиграли. */
  over: boolean;
}
