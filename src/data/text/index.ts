import { LESSON_TEXTS } from '../activities';
import { EVENT_TEXTS } from '../events';
import { COMMON_RU } from './common';

/**
 * Полный словарь. Строки событий регистрируются самими событиями
 * (см. data/events/define.ts), чтобы проза и условия не разъезжались.
 */
export const RU: Readonly<Record<string, string>> = {
  ...COMMON_RU,
  ...LESSON_TEXTS,
  ...EVENT_TEXTS,
};

export type CommonKey = keyof typeof COMMON_RU;
export { COMMON_RU };
