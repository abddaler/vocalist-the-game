import { describe, expect, it } from 'vitest';
import { GENRE_IDS, SKILL_KEYS } from '@core/types';
import { ACTIVITIES, getActivity, hasActivity } from './activities';
import { GENRES } from './genres';
import { parseActivities } from './schema';

describe('валидация контента', () => {
  it('пропускает корректную запись и подставляет значения по умолчанию', () => {
    const [activity] = parseActivities([{ id: 'x', nameKey: 'activity.x' }]);
    expect(activity).toMatchObject({ slots: 1, baseLoad: 0, energy: 0, tags: [], skillGain: {} });
  });

  it('ловит опечатку в ключе навыка', () => {
    expect(() =>
      parseActivities([{ id: 'x', nameKey: 'x', skillGain: { brethSupport: 1 } }]),
    ).toThrow(/ключ навыка/);
  });

  it('ловит отрицательный износ и слишком длинное действие', () => {
    expect(() => parseActivities([{ id: 'x', nameKey: 'x', baseLoad: -5 }])).toThrow();
    expect(() => parseActivities([{ id: 'x', nameKey: 'x', slots: 3 }])).toThrow();
  });

  it('ловит дубли id', () => {
    expect(() =>
      parseActivities([
        { id: 'dup', nameKey: 'a' },
        { id: 'dup', nameKey: 'b' },
      ]),
    ).toThrow(/дубль/);
  });
});

describe('действия среза', () => {
  it('находятся по id, а неизвестный id падает громко', () => {
    expect(hasActivity('sleep')).toBe(true);
    expect(getActivity('sleep').id).toBe('sleep');
    expect(() => getActivity('нет')).toThrow(/Неизвестное действие/);
  });

  it('покрывают весь механический словарь вехи 2', () => {
    const tags = new Set(ACTIVITIES.flatMap((activity) => activity.tags));
    for (const required of ['sleep', 'warmup', 'silence', 'work', 'medical', 'training', 'vocal']) {
      expect(tags).toContain(required);
    }
  });

  it('используют только существующие ключи навыков', () => {
    for (const activity of ACTIVITIES) {
      for (const key of Object.keys(activity.skillGain)) {
        expect(SKILL_KEYS).toContain(key);
      }
    }
  });

  it('вокальные действия несут ненулевую нагрузку, невокальные — нулевую', () => {
    for (const activity of ACTIVITIES) {
      if (activity.tags.includes('vocal')) expect(activity.baseLoad).toBeGreaterThan(0);
      else expect(activity.baseLoad).toBe(0);
    }
  });
});

describe('жанры', () => {
  it('описаны все четыре жанра среза', () => {
    expect(Object.keys(GENRES).sort()).toEqual([...GENRE_IDS].sort());
  });

  it('веса статов нормализованы к единице', () => {
    for (const genre of Object.values(GENRES)) {
      const sum = Object.values(genre.statWeights).reduce((acc, w) => acc + w, 0);
      expect(sum).toBeCloseTo(1, 5);
    }
  });

  it('множители износа идут по возрастанию: эстрада, поп, рок, метал (раздел 7)', () => {
    expect(GENRES.estrada.vocalLoadMultiplier).toBe(1.0);
    expect(GENRES.pop.vocalLoadMultiplier).toBe(1.1);
    expect(GENRES.rock.vocalLoadMultiplier).toBe(1.4);
    expect(GENRES.metal.vocalLoadMultiplier).toBe(1.8);
  });

  it('экстрим разрешён только металу', () => {
    expect(GENRES.metal.allowsExtreme).toBe(true);
    for (const id of ['pop', 'rock', 'estrada'] as const) {
      expect(GENRES[id].allowsExtreme).toBe(false);
    }
  });

  it('веса ссылаются только на существующие статы', () => {
    for (const genre of Object.values(GENRES)) {
      for (const key of Object.keys(genre.statWeights)) expect(SKILL_KEYS).toContain(key);
    }
  });
});
