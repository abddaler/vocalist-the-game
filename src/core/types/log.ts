import type { Slot } from './time';

/**
 * Хроника прогона. Хранится кодами, а не готовым текстом: рендер и перевод —
 * дело ui/ (раздел 9.6), ядро о словаре не знает.
 */
export type LogCode =
  | 'activity.done'
  | 'activity.blocked'
  | 'skill.up'
  | 'health.tier'
  | 'injury.start'
  | 'injury.healed'
  | 'injury.over'
  | 'sleep.missed'
  | 'silence.fullDay'
  | 'week.payday'
  | 'month.bills'
  | 'debt.critical'
  | 'fans.left'
  | 'genre.switched'
  | 'performance.done'
  | 'performance.intercepted'
  | 'career.up'
  | 'manager.hired'
  | 'single.recorded'
  | 'single.fans'
  | 'outfit.bought'
  | 'outfit.equipped'
  | 'event.fired'
  | 'event.resolved'
  | 'run.over';

export type LogParams = Readonly<Record<string, string | number>>;

export interface LogEntry {
  readonly day: number;
  readonly slot: Slot;
  readonly code: LogCode;
  readonly params: LogParams;
}
