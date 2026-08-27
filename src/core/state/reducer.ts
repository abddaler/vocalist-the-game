import { BALANCE } from '@data/balance';
import { getActivity, hasActivity } from '@data/activities';
import { Rng } from '../rng';
import { checkActivity, performActivity } from '../systems/activity';
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

    case 'SWITCH_GENRE':
      return reduceGenreSwitch(state, action.genre);
  }
}

function reduceActivity(state: GameState, activityId: string): GameState {
  if (!hasActivity(activityId)) {
    const draft = cloneState(state);
    draft.stats.blockedAttempts += 1;
    pushLog(draft, 'activity.blocked', { id: activityId, reason: 'unknown' });
    return draft;
  }

  const def = getActivity(activityId);
  const blocked = checkActivity(state, def);
  if (blocked) {
    const draft = cloneState(state);
    draft.stats.blockedAttempts += 1;
    pushLog(draft, 'activity.blocked', { id: activityId, reason: blocked });
    return draft;
  }

  const draft = cloneState(state);
  const rng = Rng.fromState(draft.rng);
  performActivity(draft, def, rng);
  draft.rng = rng.getState();
  return draft;
}

function reduceGenreSwitch(state: GameState, genre: GameState['genre']): GameState {
  const draft = cloneState(state);

  if (draft.over || draft.genreSwitches >= 1 || draft.genre === genre) {
    draft.stats.blockedAttempts += 1;
    pushLog(draft, 'activity.blocked', { id: 'switch_genre', reason: 'wrongGenre' });
    return draft;
  }

  const lost = Math.floor(draft.resources.fans * BALANCE.fans.genreSwitchLoss);
  const from = draft.genre;
  draft.genre = genre;
  draft.genreSwitches += 1;
  draft.resources.fans -= lost;
  pushLog(draft, 'genre.switched', { from, to: genre, fansLost: lost });
  return draft;
}
