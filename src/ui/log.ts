import { hasActivity, getActivity } from '@data/activities';
import { hasEvent, getEvent } from '@data/events';
import { hasVenue, getVenue } from '@data/venues';
import type { LogEntry } from '@core/types';
import { t } from './i18n';

/**
 * Рендер хроники (раздел 9.6). Ядро хранит коды, текст живёт здесь.
 * Модуль чистый: его использует и headless-прогон, и будущий экран журнала.
 */
export function formatLogEntry(entry: LogEntry): string {
  const params = { ...entry.params } as Record<string, string | number>;

  if (typeof params.id === 'string') {
    const id = params.id;
    params.activity = hasActivity(id)
      ? t(getActivity(id).nameKey)
      : hasVenue(id)
        ? t(getVenue(id).nameKey)
        : id;
    if (hasEvent(id)) params.title = t(getEvent(id).titleKey);
  }
  if (typeof params.venue === 'string' && hasVenue(params.venue)) {
    params.venue = t(getVenue(params.venue).nameKey);
  }
  if (typeof params.outcome === 'string') params.outcome = t(`outcome.${params.outcome}`);
  if (typeof params.tier === 'string') params.tier = t(`tier.${params.tier}`);
  if (typeof params.item === 'string') params.item = t(`outfit.${toCamel(params.item)}`);
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

/** cap_plain -> capPlain: ключи словаря пишутся в camelCase. */
function toCamel(id: string): string {
  return id.replace(/_(\w)/g, (_, letter: string) => letter.toUpperCase());
}
