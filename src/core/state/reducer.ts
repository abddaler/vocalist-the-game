import { BALANCE } from '@data/balance';
import { getActivity, hasActivity } from '@data/activities';
import { getOutfitItem, hasOutfitItem } from '@data/outfits';
import { getVenue, hasVenue } from '@data/venues';
import { Rng } from '../rng';
import { checkActivity, performActivity } from '../systems/activity';
import { performAtVenue } from '../systems/career';
import { rollEvent, resolveEvent } from '../systems/events';
import { owns } from '../systems/outfit';
import { checkPerformance } from '../systems/performance';
import { advanceTime } from '../systems/time';
import type { GameState } from '../types';
import type { Action } from './actions';
import { cloneState } from './clone';
import { createInitialState } from './initialState';
import { pushLog } from './log';

/**
 * Единственная точка изменения состояния (раздел 3).
 * Клонирует состояние, отдаёт черновик системам, возвращает новый объект.
 * Вся случайность идёт через ГПСЧ, состояние которого лежит в самом
 * состоянии: одинаковый сид плюс одинаковые действия = одинаковый прогон.
 */
export function reduce(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      return createInitialState(action.seed, action.genre);
    case 'DO_ACTIVITY':
      return reduceActivity(state, action.activityId);
    case 'PERFORM':
      return reducePerform(state, action.venueId, action.songs);
    case 'RESOLVE_EVENT':
      return reduceResolveEvent(state, action.choiceIndex);
    case 'BUY_OUTFIT':
      return reduceBuyOutfit(state, action.itemId);
    case 'EQUIP_OUTFIT':
      return reduceEquipOutfit(state, action.itemId);
    case 'SWITCH_GENRE':
      return reduceGenreSwitch(state, action.genre);
  }
}

/** Отказ: пишем причину в хронику, время и ГПСЧ не трогаем. */
function reject(state: GameState, id: string, reason: string): GameState {
  const draft = cloneState(state);
  draft.stats.blockedAttempts += 1;
  pushLog(draft, 'activity.blocked', { id, reason });
  return draft;
}

function reduceActivity(state: GameState, activityId: string): GameState {
  if (!hasActivity(activityId)) return reject(state, activityId, 'unknown');

  const def = getActivity(activityId);
  const blocked = checkActivity(state, def);
  if (blocked) return reject(state, activityId, blocked);

  const draft = cloneState(state);
  const rng = Rng.fromState(draft.rng);
  performActivity(draft, def, rng);
  rollEvent(draft, rng);
  draft.rng = rng.getState();
  return draft;
}

function reducePerform(state: GameState, venueId: string, songs: number): GameState {
  if (!hasVenue(venueId)) return reject(state, venueId, 'unknown');
  if (state.events.pending) return reject(state, venueId, 'eventPending');

  const venue = getVenue(venueId);
  const blocked = checkPerformance(state, venue, songs);
  if (blocked) return reject(state, venueId, blocked);

  const draft = cloneState(state);
  const rng = Rng.fromState(draft.rng);
  performAtVenue(draft, venue, songs, rng);
  draft.stats.activityCounts[venueId] = (draft.stats.activityCounts[venueId] ?? 0) + 1;
  advanceTime(draft, venue.timeCost, rng);
  rollEvent(draft, rng);
  draft.rng = rng.getState();
  return draft;
}

function reduceResolveEvent(state: GameState, choiceIndex: number): GameState {
  if (!state.events.pending) return reject(state, 'event', 'unknown');

  const draft = cloneState(state);
  const rng = Rng.fromState(draft.rng);
  const applied = resolveEvent(draft, choiceIndex, rng);
  draft.rng = rng.getState();
  if (!applied) return reject(state, state.events.pending, 'unknown');
  return draft;
}

function reduceBuyOutfit(state: GameState, itemId: string): GameState {
  if (!hasOutfitItem(itemId)) return reject(state, itemId, 'unknown');
  if (state.events.pending) return reject(state, itemId, 'eventPending');
  if (owns(state, itemId)) return reject(state, itemId, 'alreadyOwned');

  const item = getOutfitItem(itemId);
  if (state.resources.money - item.price < BALANCE.money.debtLimit) {
    return reject(state, itemId, 'noMoney');
  }

  const draft = cloneState(state);
  draft.resources.money -= item.price;
  draft.wardrobe.owned.push(itemId);
  draft.wardrobe.equipped = { ...draft.wardrobe.equipped, [item.slot]: itemId };
  pushLog(draft, 'outfit.bought', { item: item.id });
  return draft;
}

function reduceEquipOutfit(state: GameState, itemId: string): GameState {
  if (!hasOutfitItem(itemId)) return reject(state, itemId, 'unknown');
  if (!owns(state, itemId)) return reject(state, itemId, 'notOwned');

  const item = getOutfitItem(itemId);
  const draft = cloneState(state);
  draft.wardrobe.equipped = { ...draft.wardrobe.equipped, [item.slot]: itemId };
  pushLog(draft, 'outfit.equipped', { item: item.id });
  return draft;
}

function reduceGenreSwitch(state: GameState, genre: GameState['genre']): GameState {
  if (state.over || state.genreSwitches >= 1 || state.genre === genre) {
    return reject(state, 'switch_genre', 'wrongGenre');
  }

  const draft = cloneState(state);
  const lost = Math.floor(draft.resources.fans * BALANCE.fans.genreSwitchLoss);
  const from = draft.genre;
  draft.genre = genre;
  draft.genreSwitches += 1;
  draft.resources.fans -= lost;
  pushLog(draft, 'genre.switched', { from, to: genre, fansLost: lost });
  return draft;
}
