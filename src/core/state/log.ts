import { BALANCE } from '@data/balance';
import { SLOTS } from '../types';
import type { GameState, LogCode, LogParams, Slot } from '../types';

export function slotOf(slotIndex: number): Slot {
  return SLOTS[slotIndex % SLOTS.length] as Slot;
}

/** Пишет запись в хронику черновика, подрезая её до предела из balance. */
export function pushLog(
  draft: GameState,
  code: LogCode,
  params: LogParams = {},
): void {
  draft.log.push({ day: draft.day, slot: slotOf(draft.slotIndex), code, params });
  const overflow = draft.log.length - BALANCE.log.maxEntries;
  if (overflow > 0) draft.log.splice(0, overflow);
}
