import type { ActivityDef } from '@core/types';
import { parseActivities } from '../schema';
import { BASIC_ACTIVITIES } from './basic';
import { LESSONS, LESSON_TEXTS } from './lessons';

export { LESSON_TEXTS };

/** Весь набор действий среза. Валидация — при загрузке модуля. */
export const ACTIVITIES: readonly ActivityDef[] = parseActivities([
  ...BASIC_ACTIVITIES,
  ...LESSONS,
]);

const BY_ID = new Map(ACTIVITIES.map((activity) => [activity.id, activity]));

export function getActivity(id: string): ActivityDef {
  const activity = BY_ID.get(id);
  if (!activity) throw new Error(`Неизвестное действие: "${id}"`);
  return activity;
}

export function hasActivity(id: string): boolean {
  return BY_ID.has(id);
}

export function activitiesWithTag(tag: ActivityDef['tags'][number]): ActivityDef[] {
  return ACTIVITIES.filter((activity) => activity.tags.includes(tag));
}
