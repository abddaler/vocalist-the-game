import { BALANCE } from '@data/balance';
import { RANDOM_EVENTS, STORY_EVENTS, getEvent } from '@data/events';
import type { Rng } from '../rng';
import { pushLog } from '../state/log';
import { clamp, round2 } from '../util/num';
import type {
  Effect,
  EventChoice,
  EventCondition,
  GameEventDef,
  GameState,
  NumericRange,
  SkillKey,
} from '../types';
import { tierIndex } from '../types';
import { isInjured } from './vocal';

const inRange = (value: number, range: NumericRange | undefined): boolean => {
  if (!range) return true;
  if (range.lt !== undefined && !(value < range.lt)) return false;
  if (range.gte !== undefined && !(value >= range.gte)) return false;
  return true;
};

/** Проверка условия события (9.4). Все указанные поля должны совпасть. */
export function matchesCondition(state: GameState, cond: EventCondition): boolean {
  const r = state.resources;
  if (!inRange(state.day, cond.day)) return false;
  if (!inRange(r.vocalHealth, cond.vocalHealth)) return false;
  if (!inRange(r.money, cond.money)) return false;
  if (!inRange(r.fame, cond.fame)) return false;
  if (!inRange(r.fans, cond.fans)) return false;
  if (!inRange(r.mood, cond.mood)) return false;
  if (!inRange(r.reputation, cond.reputation)) return false;
  if (!inRange(r.energy, cond.energy)) return false;
  if (!inRange(state.career.performances, cond.performances)) return false;

  for (const [key, range] of Object.entries(cond.skill ?? {})) {
    if (!inRange(state.skills[key as SkillKey], range)) return false;
  }
  for (const [npc, range] of Object.entries(cond.relation ?? {})) {
    if (!inRange(state.npcs[npc as keyof GameState['npcs']].relation, range)) return false;
  }

  if (cond.tier !== undefined && state.career.tier !== cond.tier) return false;
  if (cond.genres && !cond.genres.includes(state.genre)) return false;
  if (cond.injured !== undefined && isInjured(state) !== cond.injured) return false;

  for (const flag of cond.flagSet ?? []) if (!(state.flags[flag] ?? 0)) return false;
  for (const flag of cond.flagUnset ?? []) if (state.flags[flag] ?? 0) return false;

  return true;
}

const seenCount = (state: GameState, id: string): number => state.events.seen[id] ?? 0;

function isEligible(state: GameState, event: GameEventDef): boolean {
  if (event.trigger.once !== false && seenCount(state, event.id) > 0) return false;
  return matchesCondition(state, event.trigger);
}

/** Варианты выбора, доступные игроку прямо сейчас. */
export function availableChoices(state: GameState, event: GameEventDef): EventChoice[] {
  return event.choices.filter(
    (choice) => !choice.requires || matchesCondition(state, choice.requires),
  );
}

/**
 * Что выпадет следующим. Сюжет всегда вперёд случайного и в объявленном
 * порядке — именно это даёт ощущение истории, а не набора карточек.
 */
export function pickEvent(state: GameState, rng: Rng): GameEventDef | null {
  const story = STORY_EVENTS.find((event) => isEligible(state, event));
  if (story) return story;

  if (state.events.slotsSinceEvent < BALANCE.events.minSlotsBetween) return null;
  if (!rng.chance(BALANCE.events.chancePerSlot)) return null;

  const pool = RANDOM_EVENTS.filter((event) => isEligible(state, event));
  if (pool.length === 0) return null;
  return rng.pickWeighted(pool, (event) => event.weight);
}

/** Вызывается после каждого действия: может подвесить событие на выбор. */
export function rollEvent(draft: GameState, rng: Rng): void {
  if (draft.events.pending || draft.over) return;

  draft.events.slotsSinceEvent += 1;
  const event = pickEvent(draft, rng);
  if (!event) return;

  draft.events.pending = event.id;
  draft.events.slotsSinceEvent = 0;
  draft.events.seen[event.id] = seenCount(draft, event.id) + 1;
  pushLog(draft, 'event.fired', { id: event.id });
}

/** Применение выбора игрока, включая бросок риска. */
export function resolveEvent(draft: GameState, choiceIndex: number, rng: Rng): boolean {
  const id = draft.events.pending;
  if (!id) return false;

  const event = getEvent(id);
  const choices = availableChoices(draft, event);
  const choice = choices[choiceIndex];
  if (!choice) return false;

  draft.events.pending = null;

  const risked = choice.risk !== undefined && rng.chance(choice.risk.chance);
  applyEffects(draft, risked ? choice.risk!.effects : choice.effects, rng);

  pushLog(draft, 'event.resolved', {
    id,
    choice: choice.textKey,
    // Ключ последствия отличается от выбора только когда сработал риск.
    result: risked ? choice.risk!.textKey : choice.textKey,
  });
  return true;
}

/** Декларативные эффекты. Новый контент не требует правок в системе. */
export function applyEffects(draft: GameState, effects: readonly Effect[], rng: Rng): void {
  const r = draft.resources;
  for (const effect of effects) {
    switch (effect.kind) {
      case 'money':
        r.money = round2(r.money + effect.delta);
        break;
      case 'energy':
        r.energy = clamp(r.energy + effect.delta, 0, BALANCE.energy.max);
        break;
      case 'vocalHealth':
        r.vocalHealth = clamp(r.vocalHealth + effect.delta, 0, BALANCE.vocal.max);
        break;
      case 'mood':
        r.mood = clamp(r.mood + effect.delta, 0, BALANCE.mood.max);
        break;
      case 'fame':
        r.fame = Math.max(0, round2(r.fame + effect.delta));
        break;
      case 'fans':
        r.fans = Math.max(0, r.fans + effect.delta);
        break;
      case 'reputation':
        r.reputation = clamp(
          r.reputation + effect.delta,
          BALANCE.reputation.min,
          BALANCE.reputation.max,
        );
        break;
      case 'skill':
        draft.skills[effect.key] = clamp(
          round2(draft.skills[effect.key] + effect.delta),
          0,
          BALANCE.skills.max,
        );
        break;
      case 'relation': {
        const npc = draft.npcs[effect.npc];
        npc.relation = clamp(npc.relation + effect.delta, 0, 100);
        npc.met = true;
        break;
      }
      case 'injury':
        if (effect.days > draft.vocal.injuryDaysLeft) {
          draft.vocal.injuryDaysLeft = effect.days;
          draft.vocal.injuryCount += 1;
          pushLog(draft, 'injury.start', { days: effect.days, id: 'event' });
        }
        break;
      case 'flag':
        draft.flags[effect.key] = effect.value;
        break;
      case 'tier':
        // Карьера ходит только вперёд: сюжетное событие не должно
        // отбрасывать игрока назад, если он уже забрался выше сам.
        if (tierIndex(effect.tier) > tierIndex(draft.career.tier)) {
          draft.career.tier = effect.tier;
          pushLog(draft, 'career.up', { tier: effect.tier });
        }
        break;
    }
  }
  void rng;
}
