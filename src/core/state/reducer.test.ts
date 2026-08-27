import { describe, expect, it } from 'vitest';
import { BALANCE } from '@data/balance';
import { ACTIVITIES } from '@data/activities';
import { doActivity, newGame, switchGenre } from './actions';
import { createInitialState } from './initialState';
import { reduce } from './reducer';
import { Store } from './store';
import type { GameState } from '../types';

const play = (state: GameState, ids: readonly string[]): GameState =>
  ids.reduce((acc, id) => reduce(acc, doActivity(id)), state);

/** Один игровой день по расписанию «утро-день-вечер-ночь». */
const A_DAY = ['lesson_breath', 'practice_free', 'restaurant_shift', 'sleep'] as const;

describe('детерминизм', () => {
  it('один сид и одни действия дают побайтово одинаковый прогон', () => {
    const script = [...A_DAY, ...A_DAY, ...A_DAY];
    const left = play(createInitialState('seed-42', 'rock'), script);
    const right = play(createInitialState('seed-42', 'rock'), script);
    expect(left).toEqual(right);
  });

  it('разные сиды расходятся', () => {
    const script = Array.from({ length: 14 }, (_, i) => A_DAY[i % A_DAY.length]!);
    const left = play(createInitialState('seed-a', 'metal'), script);
    const right = play(createInitialState('seed-b', 'metal'), script);
    expect(left.rng).not.toEqual(right.rng);
  });

  it('NEW_GAME полностью сбрасывает прогон', () => {
    const played = play(createInitialState('old', 'pop'), [...A_DAY]);
    const fresh = reduce(played, newGame('new', 'estrada'));
    expect(fresh).toEqual(createInitialState('new', 'estrada'));
  });
});

describe('неизменяемость', () => {
  it('редьюсер не трогает переданное состояние', () => {
    const before = createInitialState('immutable', 'pop');
    const snapshot = structuredClone(before);
    reduce(before, doActivity('lesson_breath'));
    expect(before).toEqual(snapshot);
  });
});

describe('заблокированные действия', () => {
  it('не тратят время и не крутят ГПСЧ', () => {
    const state = createInitialState('blocked', 'pop');
    const after = reduce(state, doActivity('sleep')); // сон доступен только ночью
    expect(after.slotIndex).toBe(state.slotIndex);
    expect(after.day).toBe(state.day);
    expect(after.rng).toEqual(state.rng);
    expect(after.stats.blockedAttempts).toBe(1);
    expect(after.log.at(-1)?.code).toBe('activity.blocked');
  });

  it('неизвестный id не роняет игру', () => {
    const state = createInitialState('unknown', 'pop');
    const after = reduce(state, doActivity('нет-такого-действия'));
    expect(after.stats.blockedAttempts).toBe(1);
    expect(after.day).toBe(state.day);
  });
});

describe('смена жанра', () => {
  it('разрешена один раз и стоит половины фанбазы', () => {
    const start = { ...createInitialState('genre', 'pop'), resources: { ...createInitialState('genre', 'pop').resources, fans: 400 } };
    const once = reduce(start, switchGenre('rock'));
    expect(once.genre).toBe('rock');
    expect(once.genreSwitches).toBe(1);
    expect(once.resources.fans).toBe(400 - Math.floor(400 * BALANCE.fans.genreSwitchLoss));

    const twice = reduce(once, switchGenre('metal'));
    expect(twice.genre).toBe('rock');
    expect(twice.stats.blockedAttempts).toBe(1);
  });

  it('смена на тот же жанр отклоняется', () => {
    const state = createInitialState('same', 'pop');
    expect(reduce(state, switchGenre('pop')).genreSwitches).toBe(0);
  });
});

describe('Store', () => {
  it('уведомляет подписчиков и отписывает', () => {
    const store = new Store(createInitialState('store', 'pop'));
    const seen: string[] = [];
    const unsubscribe = store.subscribe((_, action) => seen.push(action.type));

    store.dispatch(doActivity('lesson_breath'));
    unsubscribe();
    store.dispatch(doActivity('practice_free'));

    expect(seen).toEqual(['DO_ACTIVITY']);
    expect(store.getState().slotIndex).toBe(2);
  });
});

describe('прогон целиком', () => {
  /**
   * Жёсткий скрипт «урок каждое утро» упирается в деньги на четвёртый день,
   * действие блокируется, и время встаёт. Поэтому прогон берёт первое
   * доступное действие из списка предпочтений: молчание и сон не блокируются
   * никогда, так что сутки всегда сдвигаются.
   */
  const PREFERENCES = [
    'lesson_breath',
    'practice_free',
    'restaurant_shift',
    'vocal_rest',
    'sleep',
  ] as const;

  function runSlice(seed: string): GameState {
    let state = createInitialState(seed, 'pop');
    for (let guard = 0; guard < 60 * 4 + 10 && !state.over; guard += 1) {
      const before = state;
      for (const id of PREFERENCES) {
        const next = reduce(before, doActivity(id));
        if (next.stats.blockedAttempts === before.stats.blockedAttempts) {
          state = next;
          break;
        }
      }
      if (state === before) throw new Error('тупик: ни одно действие не прошло');
    }
    return state;
  }

  it('шестьдесят дней закрывают срез', () => {
    const end = runSlice('full-run');
    expect(end.day).toBeGreaterThan(BALANCE.time.sliceDays);
    expect(end.over).toBe(true);
  });

  it('прогон воспроизводится по сиду', () => {
    expect(runSlice('repeat')).toEqual(runSlice('repeat'));
  });

  it('за срез успевают пройти две выплаты аренды и восемь зарплат', () => {
    const end = runSlice('economy');
    expect(end.economy.monthsPaid).toBe(2);
    expect(end.economy.weeksPaid).toBe(Math.floor(BALANCE.time.sliceDays / 7));
  });

  it('в контенте нет записи, которую нельзя выполнить в принципе', () => {
    expect(ACTIVITIES.length).toBeGreaterThan(0);
    for (const activity of ACTIVITIES) {
      expect(activity.slots).toBeGreaterThanOrEqual(1);
    }
  });
});
