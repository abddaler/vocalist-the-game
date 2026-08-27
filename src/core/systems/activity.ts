import { BALANCE } from '@data/balance';
import { getGenre } from '@data/genres';
import type { Rng } from '../rng';
import { pushLog } from '../state/log';
import { clamp, round2 } from '../util/num';
import { SLOTS } from '../types';
import type { ActivityDef, GameState, SkillKey } from '../types';
import { applySkillGains } from './skills';
import { canAfford } from './money';
import { advanceTime } from './time';
import { applyLoad, healInjury, isInjured, loadForActivity, recover } from './vocal';

export type BlockReason =
  | 'runOver'
  | 'eventPending'
  | 'injured'
  | 'wrongSlot'
  | 'noEnergy'
  | 'noMoney'
  | 'lowSkill'
  | 'wrongGenre'
  | 'locked';

/**
 * Можно ли выполнить действие прямо сейчас.
 * Требования по деньгам и энергии выводятся из самой стоимости действия,
 * чтобы контент не дублировал одно и то же число дважды.
 */
export function checkActivity(state: GameState, def: ActivityDef): BlockReason | null {
  if (state.over) return 'runOver';
  // Пока событие ждёт ответа, игра стоит: сначала разберись с ним.
  if (state.events.pending) return 'eventPending';

  const injured = isInjured(state);
  if (injured && (def.tags.includes('vocal') || def.requires.notInjured)) return 'injured';

  const allowedSlots = def.requires.slots;
  if (allowedSlots && !allowedSlots.includes(SLOTS[state.slotIndex] as never)) {
    return 'wrongSlot';
  }

  if (def.energy < 0 && state.resources.energy + def.energy < 0) return 'noEnergy';
  if (def.requires.minEnergy !== undefined && state.resources.energy < def.requires.minEnergy) {
    return 'noEnergy';
  }

  if (def.money < 0 && !canAfford(state, def.money)) return 'noMoney';
  if (def.requires.minMoney !== undefined && state.resources.money < def.requires.minMoney) {
    return 'noMoney';
  }

  for (const [key, required] of Object.entries(def.requires.minSkill ?? {})) {
    if (state.skills[key as SkillKey] < (required ?? 0)) return 'lowSkill';
  }

  const genres = def.requires.genres;
  if (genres && !genres.includes(state.genre)) return 'wrongGenre';

  for (const flag of def.requires.flagSet ?? []) {
    if (!(state.flags[flag] ?? 0)) return 'locked';
  }

  return null;
}

/** Применяет действие к черновику состояния и двигает время. */
export function performActivity(draft: GameState, def: ActivityDef, rng: Rng): void {
  applyEnergy(draft, def);
  applyVocalLoad(draft, def, rng);
  applyRecovery(draft, def);
  applySkills(draft, def);
  applyEconomy(draft, def);
  applyRelations(draft, def);
  applyTags(draft, def);

  draft.stats.activityCounts[def.id] = (draft.stats.activityCounts[def.id] ?? 0) + 1;
  pushLog(draft, 'activity.done', { id: def.id, slots: def.slots });

  advanceTime(draft, def.slots, rng);
}

function applyEnergy(draft: GameState, def: ActivityDef): void {
  draft.resources.energy = clamp(draft.resources.energy + def.energy, 0, BALANCE.energy.max);
}

function applyVocalLoad(draft: GameState, def: ActivityDef, rng: Rng): void {
  if (def.baseLoad <= 0) return;

  const genre = getGenre(draft.genre);
  const load = loadForActivity(draft, def.baseLoad, genre);
  const outcome = applyLoad(draft, load, rng);

  draft.resources.vocalHealth = outcome.vocalHealth;
  draft.vocal.loadToday = round2(draft.vocal.loadToday + outcome.load);

  if (outcome.injuryDays > 0) {
    draft.vocal.injuryDaysLeft = outcome.injuryDays;
    draft.vocal.injuryCount += 1;
    pushLog(draft, 'injury.start', { days: outcome.injuryDays, id: def.id });
  }
}

function applyRecovery(draft: GameState, def: ActivityDef): void {
  if (def.vocalHealth === 0) return;
  draft.resources.vocalHealth = recover(draft.resources.vocalHealth, def.vocalHealth);
}

function applySkills(draft: GameState, def: ActivityDef): void {
  if (Object.keys(def.skillGain).length === 0) return;
  const { skills, applied } = applySkillGains(draft, def.skillGain);
  draft.skills = skills;
  if (Object.keys(applied).length > 0) {
    pushLog(draft, 'skill.up', applied as Record<string, number>);
  }
}

function applyEconomy(draft: GameState, def: ActivityDef): void {
  const r = draft.resources;
  if (def.money !== 0) r.money = round2(r.money + def.money);
  if (def.wages !== 0) draft.economy.pendingWages = round2(draft.economy.pendingWages + def.wages);
  if (def.mood !== 0) r.mood = clamp(r.mood + def.mood, 0, BALANCE.mood.max);
  if (def.fame !== 0) r.fame = Math.max(0, r.fame + def.fame);
  if (def.fans !== 0) r.fans = Math.max(0, r.fans + def.fans);
  if (def.reputation !== 0) {
    r.reputation = clamp(
      r.reputation + def.reputation,
      BALANCE.reputation.min,
      BALANCE.reputation.max,
    );
  }
}

function applyRelations(draft: GameState, def: ActivityDef): void {
  for (const [npc, delta] of Object.entries(def.relationGain)) {
    const state = draft.npcs[npc as keyof GameState['npcs']];
    state.relation = clamp(state.relation + (delta ?? 0), 0, 100);
    state.met = true;
  }
}

function applyTags(draft: GameState, def: ActivityDef): void {
  if (def.tags.includes('warmup')) draft.vocal.warmedUpOnDay = draft.day;
  if (def.tags.includes('record')) {
    draft.career.singles += 1;
    pushLog(draft, 'single.recorded', { singles: draft.career.singles });
  }
  if (def.tags.includes('sleep')) draft.vocal.sleptTonight = true;
  if (def.tags.includes('silence')) draft.vocal.silentSlotsToday += 1;

  if (def.tags.includes('medical') && draft.vocal.injuryDaysLeft > 0) {
    const before = draft.vocal.injuryDaysLeft;
    draft.vocal.injuryDaysLeft = healInjury(before);
    pushLog(draft, 'injury.healed', { from: before, to: draft.vocal.injuryDaysLeft });
  }
}
