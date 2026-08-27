import { hasActivity, getActivity } from '@data/activities';
import type { LogEntry } from '@core/types';
import { t } from './i18n';

/**
 * Рендер хроники (раздел 9.6). Ядро хранит коды, текст живёт здесь.
 * Модуль чистый: его использует и headless-прогон, и будущий экран журнала.
 */
export function formatLogEntry(entry: LogEntry): string {
  const params = { ...entry.params } as Record<string, string | number>;

  if (typeof params.id === 'string') {
    params.activity = hasActivity(params.id) ? t(getActivity(params.id).nameKey) : params.id;
  }
  if (typeof params.reason === 'string') {
    params.reason = t(`reason.${params.reason}`);
  }
  if (typeof params.from === 'string') params.from = t(`genre.${params.from}`);
  if (typeof params.to === 'string') params.to = t(`genre.${params.to}`);

  if (entry.code === 'skill.up') {
    params.gains = Object.entries(entry.params)
      .map(([key, value]) => `${t(`skill.${key}`)} +${value}`)
      .join(', ');
  }

  return t(`log.${entry.code}`, params);
}
