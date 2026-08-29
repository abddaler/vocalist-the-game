import { describe, expect, it } from 'vitest';
import { ALL_EVENTS, RANDOM_EVENTS, STORY_EVENTS, getEvent } from '@data/events';
import { COMMON_RU } from '@data/text';
import { cloneState } from '../state';
import { alwaysRng, makeRng, makeState, neverRng } from '../testing/fixtures';
import type { GameState } from '../types';
import { applyEffects, availableChoices, matchesCondition, pickEvent, resolveEvent, rollEvent, speakerOf } from './events';

describe('условия срабатывания', () => {
  const state = makeState({
    day: 20,
    resources: { money: 5000, vocalHealth: 30, fame: 80 },
    flags: { studioAccess: 1 },
  });

  it('пустое условие подходит всегда', () => {
    expect(matchesCondition(state, {})).toBe(true);
  });

  it('границы диапазонов проверяются строго', () => {
    expect(matchesCondition(state, { vocalHealth: { lt: 35 } })).toBe(true);
    expect(matchesCondition(state, { vocalHealth: { lt: 30 } })).toBe(false);
    expect(matchesCondition(state, { fame: { gte: 80 } })).toBe(true);
    expect(matchesCondition(state, { fame: { gte: 81 } })).toBe(false);
  });

  it('все указанные поля должны совпасть одновременно', () => {
    expect(matchesCondition(state, { day: { gte: 10 }, money: { gte: 1000 } })).toBe(true);
    expect(matchesCondition(state, { day: { gte: 10 }, money: { gte: 90000 } })).toBe(false);
  });

  it('умеет флаги, жанр и травму', () => {
    expect(matchesCondition(state, { flagSet: ['studioAccess'] })).toBe(true);
    expect(matchesCondition(state, { flagUnset: ['studioAccess'] })).toBe(false);
    expect(matchesCondition(state, { genres: ['pop'] })).toBe(true);
    expect(matchesCondition(state, { genres: ['metal'] })).toBe(false);
    expect(matchesCondition(state, { injured: true })).toBe(false);
  });
});

describe('выбор события', () => {
  it('сюжет идёт вперёд случайного и в объявленном порядке', () => {
    const fresh = makeState({ day: 1 });
    expect(pickEvent(fresh, makeRng())?.id).toBe(STORY_EVENTS[0]?.id);
  });

  it('увиденное сюжетное событие больше не выпадает', () => {
    const first = STORY_EVENTS[0]!;
    const seen = makeState({ day: 1, events: { seen: { [first.id]: 1 } } });
    expect(pickEvent(seen, makeRng())?.id).not.toBe(first.id);
  });

  it('случайные не сыплются чаще, чем задано паузой', () => {
    const state = makeState({
      day: 40,
      events: { seen: Object.fromEntries(STORY_EVENTS.map((e) => [e.id, 1])), slotsSinceEvent: 0 },
    });
    expect(pickEvent(state, alwaysRng())).toBeNull();
  });

  it('варианты фильтруются по своим требованиям', () => {
    const scare = getEvent('story_throat_scare');
    const broke = makeState({ resources: { money: 0 } });
    const rich = makeState({ resources: { money: 50000 } });
    expect(availableChoices(rich, scare).length).toBeGreaterThan(availableChoices(broke, scare).length);
  });
});

describe('подвешивание и разбор', () => {
  const fire = (): GameState => {
    const draft = cloneState(makeState({ day: 1 }));
    rollEvent(draft, makeRng());
    return draft;
  };

  it('событие подвисает и отмечается как виденное', () => {
    const draft = fire();
    expect(draft.events.pending).toBe(STORY_EVENTS[0]?.id);
    expect(draft.events.seen[STORY_EVENTS[0]!.id]).toBe(1);
    expect(draft.log.at(-1)?.code).toBe('event.fired');
  });

  it('разбор снимает событие и применяет эффекты', () => {
    const draft = fire();
    const before = draft.resources.mood;
    expect(resolveEvent(draft, 0, makeRng())).toBe(true);
    expect(draft.events.pending).toBeNull();
    expect(draft.resources.mood).not.toBe(before);
  });

  it('несуществующий вариант отклоняется, событие остаётся', () => {
    const draft = fire();
    expect(resolveEvent(draft, 99, makeRng())).toBe(false);
    expect(draft.events.pending).not.toBeNull();
  });

  it('риск срабатывает по броску, а не всегда', () => {
    const risky = getEvent('story_throat_scare');
    const index = risky.choices.findIndex((choice) => choice.risk);
    expect(index).toBeGreaterThanOrEqual(0);

    const lucky = cloneState(makeState({ events: { pending: risky.id } }));
    const unlucky = cloneState(makeState({ events: { pending: risky.id } }));
    resolveEvent(lucky, index, neverRng());
    resolveEvent(unlucky, index, alwaysRng());
    expect(unlucky.vocal.injuryDaysLeft).toBeGreaterThan(lucky.vocal.injuryDaysLeft);
  });
});

describe('эффекты', () => {
  it('не выводят ресурсы за границы', () => {
    const draft = cloneState(makeState({ resources: { mood: 5, vocalHealth: 95 } }));
    applyEffects(draft, [
      { kind: 'mood', delta: -50 },
      { kind: 'vocalHealth', delta: 50 },
    ], makeRng());
    expect(draft.resources.mood).toBe(0);
    expect(draft.resources.vocalHealth).toBe(100);
  });

  it('знакомят с NPC и двигают отношения', () => {
    const draft = cloneState(makeState());
    applyEffects(draft, [{ kind: 'relation', npc: 'promoter', delta: 30 }], makeRng());
    expect(draft.npcs.promoter.relation).toBe(30);
    expect(draft.npcs.promoter.met).toBe(true);
  });

  it('травма не перезаписывается более короткой', () => {
    const draft = cloneState(makeState({ vocal: { injuryDaysLeft: 9 } }));
    applyEffects(draft, [{ kind: 'injury', days: 3 }], makeRng());
    expect(draft.vocal.injuryDaysLeft).toBe(9);
  });
});

describe('контент событий', () => {
  it('в срезе двенадцать сюжетных и двадцать пять случайных (9.4)', () => {
    expect(STORY_EVENTS).toHaveLength(12);
    expect(RANDOM_EVENTS).toHaveLength(25);
  });

  it('у каждого события есть текст и хотя бы один выбор', () => {
    for (const event of ALL_EVENTS) {
      expect(event.titleKey).toBeTruthy();
      expect(event.textKey).toBeTruthy();
      expect(event.choices.length).toBeGreaterThan(0);
      expect(event.weight).toBeGreaterThan(0);
    }
  });

  it('вероятности риска лежат в (0, 1]', () => {
    for (const event of ALL_EVENTS) {
      for (const choice of event.choices) {
        if (!choice.risk) continue;
        expect(choice.risk.chance).toBeGreaterThan(0);
        expect(choice.risk.chance).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('собеседник события', () => {
  const base = { id: 'x', kind: 'random' as const, weight: 1, trigger: {}, titleKey: 't', textKey: 'b' };

  it('один затронутый NPC — он и есть собеседник', () => {
    expect(
      speakerOf({
        ...base,
        choices: [{ textKey: 'a', effects: [{ kind: 'relation', npc: 'teacher', delta: 5 }] }],
      }),
    ).toBe('teacher');
  });

  it('риск считается тем же разговором', () => {
    expect(
      speakerOf({
        ...base,
        choices: [
          {
            textKey: 'a',
            effects: [{ kind: 'mood', delta: 5 }],
            risk: {
              chance: 0.3,
              textKey: 'r',
              effects: [{ kind: 'relation', npc: 'promoter', delta: -5 }],
            },
          },
        ],
      }),
    ).toBe('promoter');
  });

  it('условие по отношению тоже называет собеседника', () => {
    expect(
      speakerOf({
        ...base,
        trigger: { relation: { blogger: { gte: 20 } } },
        choices: [{ textKey: 'a', effects: [{ kind: 'fans', delta: 10 }] }],
      }),
    ).toBe('blogger');
  });

  it('двое затронутых — собеседника нет', () => {
    expect(
      speakerOf({
        ...base,
        choices: [
          { textKey: 'a', effects: [{ kind: 'relation', npc: 'teacher', delta: 5 }] },
          { textKey: 'b', effects: [{ kind: 'relation', npc: 'rival', delta: -5 }] },
        ],
      }),
    ).toBeNull();
  });

  it('никого не затронуто — собеседника нет', () => {
    expect(speakerOf({ ...base, choices: [{ textKey: 'a', effects: [{ kind: 'money', delta: 10 }] }] }))
      .toBeNull();
  });

  it('у каждого названного собеседника есть внешность, имя и роль', () => {
    for (const event of ALL_EVENTS) {
      const npc = speakerOf(event);
      if (!npc) continue;
      expect(COMMON_RU[`npc.${npc}` as keyof typeof COMMON_RU]).toBeTypeOf('string');
      expect(COMMON_RU[`npc.${npc}.role` as keyof typeof COMMON_RU]).toBeTypeOf('string');
    }
  });
});
