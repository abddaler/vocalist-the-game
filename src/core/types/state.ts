import type { RngState } from '../rng';
import type { GenreId } from './genre';
import type { LogEntry } from './log';
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

export interface RunStats {
  slotsUsed: number;
  activityCounts: Record<string, number>;
  missedNights: number;
  blockedAttempts: number;
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
  stats: RunStats;

  /** Произвольные отметки: сюжетные вехи, разовые события. */
  flags: Record<string, number>;
  log: LogEntry[];
  /** Прогон окончен: вышли за 60 дней или проиграли. */
  over: boolean;
}
