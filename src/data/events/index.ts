import type { GameEventDef } from '@core/types';
import { EVENT_TEXTS } from './define';
import { RANDOM_EVENTS } from './random';
import { STORY_EVENTS } from './story';

export { STORY_EVENTS, RANDOM_EVENTS, EVENT_TEXTS };

export const ALL_EVENTS: readonly GameEventDef[] = [...STORY_EVENTS, ...RANDOM_EVENTS];

const BY_ID = new Map(ALL_EVENTS.map((event) => [event.id, event]));

export function getEvent(id: string): GameEventDef {
  const event = BY_ID.get(id);
  if (!event) throw new Error(`Неизвестное событие: "${id}"`);
  return event;
}

export function hasEvent(id: string): boolean {
  return BY_ID.has(id);
}
