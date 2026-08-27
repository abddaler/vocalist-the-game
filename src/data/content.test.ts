import { describe, expect, it } from 'vitest';
import { GENRE_IDS, SKILL_KEYS } from '@core/types';
import { ACTIVITIES, getActivity, hasActivity } from './activities';
import { BALANCE } from './balance';
import { GENRES } from './genres';
import { LOCATIONS } from './locations';
import { parseActivities } from './schema';
import { VENUES, getVenue, hasVenue } from './venues';

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

describe('площадки карьерной лестницы', () => {
  it('покрывают путь от перехода до клуба (9.5)', () => {
    expect(VENUES.map((venue) => venue.tier)).toEqual([
      'underpass',
      'events',
      'bar',
      'club',
    ]);
  });

  it('чем выше ступень, тем строже допуск и щедрее выплата', () => {
    for (let i = 1; i < VENUES.length; i += 1) {
      const prev = VENUES[i - 1]!;
      const next = VENUES[i]!;
      expect(next.requires.fame ?? 0).toBeGreaterThanOrEqual(prev.requires.fame ?? 0);
      expect(next.thresholds.ok).toBeGreaterThan(prev.thresholds.ok);
      expect(next.fameCeiling).toBeGreaterThan(prev.fameCeiling);
    }
  });

  it('клуб открывается на славе 150, как задано разделом 8', () => {
    expect(getVenue('club_stage').requires.fame).toBe(150);
  });

  it('пороги идут по возрастанию внутри площадки', () => {
    for (const venue of VENUES) {
      expect(venue.thresholds.ok).toBeLessThan(venue.thresholds.good);
      expect(venue.thresholds.good).toBeLessThan(venue.thresholds.triumph);
      expect(venue.setlist.min).toBeLessThanOrEqual(venue.setlist.max);
    }
  });
});

describe('локации района', () => {
  it('их девять плюс сам район (раздел 8)', () => {
    expect(LOCATIONS).toHaveLength(10);
    expect(LOCATIONS.some((location) => location.id === 'district')).toBe(true);
  });

  it('ссылаются только на существующие действия и площадки', () => {
    for (const location of LOCATIONS) {
      for (const id of location.activities) expect(hasActivity(id)).toBe(true);
      for (const id of location.venues) expect(hasVenue(id)).toBe(true);
      expect(location.openSlots.length).toBeGreaterThan(0);
    }
  });

  it('каждое действие живёт хотя бы в одной локации', () => {
    const placed = new Set(LOCATIONS.flatMap((location) => location.activities));
    for (const activity of ACTIVITIES) expect(placed.has(activity.id)).toBe(true);
  });

  it('часы локации не спорят с часами её действий', () => {
    for (const location of LOCATIONS) {
      for (const id of location.activities) {
        const slots = getActivity(id).requires.slots;
        if (!slots) continue;
        expect(slots.some((slot) => location.openSlots.includes(slot))).toBe(true);
      }
    }
  });
});

describe('уроки студии', () => {
  it('собраны по три уровня педагога на каждый преподаваемый стат (раздел 8)', () => {
    const lessons = ACTIVITIES.filter((activity) => activity.id.startsWith('lesson_'));
    expect(lessons.length % 3).toBe(0);
    for (const level of ['junior', 'mid', 'master']) {
      expect(lessons.filter((lesson) => lesson.id.endsWith(level)).length).toBe(lessons.length / 3);
    }
  });

  it('дороже значит быстрее', () => {
    const junior = getActivity('lesson_breathSupport_junior');
    const mid = getActivity('lesson_breathSupport_mid');
    const master = getActivity('lesson_breathSupport_master');

    expect(-junior.money).toBeLessThan(-mid.money);
    expect(-mid.money).toBeLessThan(-master.money);
    expect(junior.skillGain.breathSupport!).toBeLessThan(mid.skillGain.breathSupport!);
    expect(mid.skillGain.breathSupport!).toBeLessThan(master.skillGain.breathSupport!);
  });

  it('экстрим заперт жанром и опорой (5.1)', () => {
    const extreme = getActivity('lesson_extreme_mid');
    expect(extreme.requires.genres).toEqual(['metal']);
    expect(extreme.requires.minSkill?.breathSupport).toBe(BALANCE.vocal.extremeUnlockSupport);
  });
});
