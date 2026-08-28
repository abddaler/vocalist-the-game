import { describe, expect, it } from 'vitest';
import { doActivity } from './actions';
import { createInitialState, SAVE_VERSION } from './initialState';
import { reduce } from './reducer';
import { parseSave, serializeSave } from './save';

const played = () => {
  let state = createInitialState('save-seed', 'rock');
  for (const id of ['warmup', 'practice_free']) {
    if (state.events.pending) break;
    state = reduce(state, doActivity(id));
  }
  return state;
};

describe('сохранение прогона', () => {
  it('переживает круг сериализации без потерь', () => {
    const state = played();
    const restored = parseSave(serializeSave(state, 1))?.state;
    expect(restored).toEqual(state);
  });

  it('сохраняет состояние ГПСЧ: продолженная игра идёт тем же потоком', () => {
    const state = played();
    const restored = parseSave(serializeSave(state, 1))!.state;
    expect(reduce(restored, doActivity('vocal_rest'))).toEqual(
      reduce(state, doActivity('vocal_rest')),
    );
  });

  it('отвергает мусор, а не падает', () => {
    expect(parseSave(null)).toBeNull();
    expect(parseSave('')).toBeNull();
    expect(parseSave('не json')).toBeNull();
    expect(parseSave('{"version":1}')).toBeNull();
    expect(parseSave('[]')).toBeNull();
  });

  it('отвергает файл чужой версии', () => {
    const raw = JSON.parse(serializeSave(createInitialState('v', 'pop'), 1));
    raw.version = SAVE_VERSION + 1;
    expect(parseSave(JSON.stringify(raw))).toBeNull();
  });

  it('отвергает файл с испорченными полями', () => {
    const raw = JSON.parse(serializeSave(createInitialState('v', 'pop'), 1));
    raw.state.resources.money = 'много';
    expect(parseSave(JSON.stringify(raw))).toBeNull();

    const other = JSON.parse(serializeSave(createInitialState('v', 'pop'), 1));
    other.state.genre = 'джаз';
    expect(parseSave(JSON.stringify(other))).toBeNull();

    const noSlot = JSON.parse(serializeSave(createInitialState('v', 'pop'), 1));
    noSlot.state.slotIndex = 9;
    expect(parseSave(JSON.stringify(noSlot))).toBeNull();
  });

  it('пишет отметку времени', () => {
    expect(parseSave(serializeSave(createInitialState('v', 'pop'), 12345))?.savedAt).toBe(12345);
  });
});
