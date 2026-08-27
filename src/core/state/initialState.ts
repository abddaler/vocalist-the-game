import { BALANCE } from '@data/balance';
import { Rng } from '../rng';
import { NPC_IDS } from '../types';
import type { GameState, GenreId, NpcId, NpcState, VocalSkills } from '../types';

export const SAVE_VERSION = 1;

export function createInitialState(seed: string, genre: GenreId): GameState {
  const rng = new Rng(seed);
  return {
    version: SAVE_VERSION,
    seed,
    rng: rng.getState(),

    day: 1,
    slotIndex: 0,

    genre,
    genreSwitches: 0,

    skills: { ...BALANCE.skills.start } as VocalSkills,
    resources: {
      money: BALANCE.money.start,
      energy: BALANCE.energy.start,
      vocalHealth: BALANCE.vocal.start,
      fame: 0,
      fans: 0,
      mood: BALANCE.mood.start,
      reputation: BALANCE.reputation.start,
    },
    vocal: {
      warmedUpOnDay: null,
      injuryDaysLeft: 0,
      injuryCount: 0,
      loadToday: 0,
      silentSlotsToday: 0,
      sleptTonight: false,
    },
    economy: { pendingWages: 0, weeksPaid: 0, monthsPaid: 0 },
    career: {
      tier: 'underpass',
      performances: 0,
      singles: 0,
      rivalFame: BALANCE.rival.startFame,
      manager: false,
    },
    npcs: Object.fromEntries(
      NPC_IDS.map((id) => [id, { relation: 0, met: false } satisfies NpcState]),
    ) as Record<NpcId, NpcState>,
    wardrobe: { owned: [], equipped: {} },
    events: { seen: {}, pending: null, slotsSinceEvent: 0 },
    stats: {
      slotsUsed: 0,
      activityCounts: {},
      missedNights: 0,
      blockedAttempts: 0,
      outcomes: {},
    },

    flags: {},
    log: [],
    over: false,
  };
}
