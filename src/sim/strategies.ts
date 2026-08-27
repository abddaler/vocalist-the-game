import { availableChoices } from '@core/systems/events';
import { checkPerformance, expectedScore, songCapacity } from '@core/systems/performance';
import { healthTier, isInjured } from '@core/systems/vocal';
import { Rng } from '@core/rng';
import { SLOTS, tierIndex } from '@core/types';
import type { GameEventDef, GameState, VenueDef } from '@core/types';
import { VENUES } from '@data/venues';
import { OUTFITS } from '@data/outfits';
import { ACTIVITIES } from '@data/activities';
import { imageLevel } from '@core/systems/outfit';

/**
 * Стратегия отвечает на три вопроса: что делать в этом слоте, куда идти
 * петь и что выбрать в событии. Прогон берёт первое незаблокированное
 * действие из списка; молчание и сон не блокируются никогда, поэтому
 * тупика не бывает.
 */
export interface Strategy {
  readonly id: string;
  readonly title: string;
  pick(state: GameState): readonly string[];
  pickChoice?(state: GameState, event: GameEventDef): number;
  pickGig?(state: GameState): { venueId: string; songs: number } | null;
  /** Покупка одежды: слотов не тратит, но открывает площадки (9.2). */
  pickPurchase?(state: GameState): string | null;
}

/**
 * Самая дешёвая обновка, поднимающая имидж, — но только если после
 * покупки останется заданный запас наличности.
 */
export function affordableUpgrade(state: GameState, reserve: number): string | null {
  const image = imageLevel(state);
  const needed = VENUES.reduce(
    (need, venue) =>
      (venue.requires.image ?? 0) > image ? Math.min(need, venue.requires.image ?? 0) : need,
    Number.POSITIVE_INFINITY,
  );
  if (!Number.isFinite(needed)) return null;

  const candidates = OUTFITS.filter(
    (item) =>
      !state.wardrobe.owned.includes(item.id) &&
      item.stage > 0 &&
      state.resources.money - item.price >= reserve &&
      (item.genreFit[state.genre] ?? 0) >= 0,
  ).sort((a, b) => a.price / a.stage - b.price / b.stage);

  return candidates[0]?.id ?? null;
}

const slotOf = (state: GameState): string => SLOTS[state.slotIndex] as string;

/** Вариант события, который меньше всего вредит связкам. */
export function safestChoice(state: GameState, event: GameEventDef): number {
  const choices = availableChoices(state, event);
  let best = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  choices.forEach((choice, index) => {
    const harm = choice.effects.reduce(
      (sum, effect) =>
        sum + (effect.kind === 'vocalHealth' && effect.delta < 0 ? -effect.delta : 0),
      0,
    );
    const score = (choice.risk?.chance ?? 0) * 100 + harm;
    if (score < bestScore) {
      bestScore = score;
      best = index;
    }
  });
  return best;
}

/** Вариант с максимальной сиюминутной выгодой в деньгах и славе. */
export function greediestChoice(state: GameState, event: GameEventDef): number {
  const choices = availableChoices(state, event);
  let best = 0;
  let bestGain = Number.NEGATIVE_INFINITY;
  choices.forEach((choice, index) => {
    const gain = choice.effects.reduce((sum, effect) => {
      if (effect.kind === 'money') return sum + effect.delta / 1000;
      if (effect.kind === 'fame') return sum + effect.delta;
      if (effect.kind === 'fans') return sum + effect.delta / 10;
      return sum;
    }, 0);
    if (gain > bestGain) {
      bestGain = gain;
      best = index;
    }
  });
  return best;
}

/**
 * Самая денежная площадка, куда пускают прямо сейчас.
 * Если requireChance, площадка ещё и должна быть по силам: провал не
 * приносит ни славы, ни денег, а слот съедает.
 */
function topVenue(
  state: GameState,
  songs: (venue: VenueDef) => number,
  requireChance = false,
): VenueDef | null {
  let best: VenueDef | null = null;
  for (const venue of VENUES) {
    const count = songs(venue);
    if (checkPerformance(state, venue, count)) continue;
    // Площадку выше своей ступени играют всегда: это карьерная веха,
    // а не заработок, и отказываться от неё живой человек не станет.
    const isStepUp = tierIndex(venue.tier) > tierIndex(state.career.tier);
    if (requireChance && !isStepUp && expectedScore(state, count) < venue.thresholds.ok) continue;
    if (!best || venue.payout.base > best.payout.base) best = venue;
  }
  return best;
}

/** Столько песен, сколько тянет выносливость, но в рамках сет-листа площадки. */
const comfortableSongs = (state: GameState) => (venue: VenueDef) =>
  Math.max(
    venue.setlist.min,
    Math.min(venue.setlist.max, songCapacity(state.skills.stamina)),
  );

const maxSongs = () => (venue: VenueDef) => venue.setlist.max;

/**
 * «Сначала опора»: две фазы. Пока техника сырая — распевка, уроки и
 * практика, сцена только чтобы не голодать. Как опора набрана —
 * конвертирует её в славу, выступая при каждой возможности.
 */
export const supportFirst: Strategy = {
  id: 'support',
  title: 'Сначала опора',
  pickChoice: safestChoice,
  pickPurchase: (state) => affordableUpgrade(state, 6000),

  pickGig(state) {
    // Петь осипшим — ровно та ошибка, от которой эта стратегия бережётся.
    if (state.resources.vocalHealth < 50) return null;

    const venue = topVenue(state, comfortableSongs(state), true);
    if (!venue) return null;
    // Переход бросаем, когда он перестаёт приносить славу (потолок 60).
    if (venue.id === 'underpass' && state.resources.fame > 50) return null;
    // Сцена занимает только вечер: утро под распевку, день под уроки.
    // Иначе стратегия бросает учиться, едва опора станет сносной, и
    // упирается в потолок площадок, которые уже переросла.
    if (slotOf(state) !== 'evening') return null;
    return { venueId: venue.id, songs: comfortableSongs(state)(venue) };
  },

  pick(state) {
    if (slotOf(state) === 'night') return ['sleep'];

    if (isInjured(state)) {
      return state.resources.money > 8000
        ? ['doctor_visit', 'vocal_rest', 'home_rest']
        : ['vocal_rest', 'home_rest'];
    }

    const tier = healthTier(state.resources.vocalHealth);
    if (tier === 'hoarse' || tier === 'critical') return ['vocal_rest', 'tea_regimen'];
    if (state.resources.mood < 20) return ['home_rest', 'gym'];

    // Распевка окупается весь день: 35% скидки к износу всему, что дальше.
    if (state.vocal.warmedUpOnDay !== state.day && slotOf(state) === 'morning') {
      return ['warmup'];
    }
    // Вечер — единственный слот, когда платят за смену, поэтому деньги
    // зарабатываются там, а утро и день уходят на технику.
    if (slotOf(state) === 'evening') {
      return ['restaurant_shift', ...lessons(state), 'practice_free', 'home_rest'];
    }
    return [...lessons(state), 'practice_free', 'gym', 'home_rest'];
  },
};

/** Уроки по средствам: мастер дороже и быстрее, но не в долг. */
function lessons(state: GameState): string[] {
  const money = state.resources.money;
  if (money > 26000) {
    return ['lesson_breathSupport_master', 'lesson_timbre_master', 'lesson_pitch_master'];
  }
  if (money > 11000) {
    return ['lesson_breathSupport_mid', 'lesson_timbre_mid', 'lesson_pitch_mid'];
  }
  if (money > 3000) {
    return ['lesson_breathSupport_junior', 'lesson_timbre_junior', 'lesson_pitch_junior'];
  }
  return [];
}

/** «Берёт все концерты»: поёт всегда и максимально длинным сет-листом. */
export const gigGrinder: Strategy = {
  id: 'gigs',
  title: 'Берёт все концерты',
  pickChoice: greediestChoice,
  pickPurchase: (state) => affordableUpgrade(state, 1000),

  pickGig(state) {
    const venue = topVenue(state, maxSongs());
    return venue ? { venueId: venue.id, songs: venue.setlist.max } : null;
  },

  pick(state) {
    if (slotOf(state) === 'night') return ['sleep'];
    if (isInjured(state)) return ['doctor_visit', 'vocal_rest'];
    if (slotOf(state) === 'evening') return ['restaurant_shift', 'practice_free', 'vocal_rest'];
    return ['practice_free', 'restaurant_shift', 'vocal_rest'];
  },
};

/** «Жадный к деньгам»: не тратит ни рубля, работает и молчит. */
export const pennyPincher: Strategy = {
  id: 'money',
  title: 'Жадный к деньгам',
  pickChoice: greediestChoice,

  pickGig(state) {
    const venue = topVenue(state, comfortableSongs(state));
    return venue ? { venueId: venue.id, songs: comfortableSongs(state)(venue) } : null;
  },

  pick(state) {
    if (slotOf(state) === 'night') return ['sleep'];
    if (slotOf(state) === 'evening') return ['restaurant_shift', 'vocal_rest'];
    return ['vocal_rest'];
  },
};

const ALL_IDS = ACTIVITIES.map((activity) => activity.id);

/**
 * «Случайные действия»: контрольная группа. Случайность выводится из
 * состояния, поэтому стратегия остаётся воспроизводимой по сиду.
 */
export const randomWalker: Strategy = {
  id: 'random',
  title: 'Случайные действия',

  pickChoice(state, event) {
    return rngOf(state).int(0, Math.max(0, availableChoices(state, event).length - 1));
  },

  pickGig(state) {
    if (!rngOf(state).chance(0.35)) return null;
    const venue = topVenue(state, maxSongs());
    if (!venue) return null;
    const rng = rngOf(state);
    return { venueId: venue.id, songs: rng.int(venue.setlist.min, venue.setlist.max) };
  },

  pick(state) {
    const rng = rngOf(state);
    // Хвост из сна и молчания гарантирует, что хоть что-то пройдёт.
    return [...rng.shuffle(ALL_IDS).slice(0, 6), 'vocal_rest', 'sleep'];
  },
};

function rngOf(state: GameState): Rng {
  return new Rng((state.rng.value ^ (state.stats.slotsUsed * 2654435761)) >>> 0);
}

export const STRATEGIES: readonly Strategy[] = [
  supportFirst,
  gigGrinder,
  pennyPincher,
  randomWalker,
];

export function getStrategy(id: string): Strategy {
  const strategy = STRATEGIES.find((item) => item.id === id);
  if (!strategy) {
    throw new Error(
      `Неизвестная стратегия "${id}". Доступны: ${STRATEGIES.map((s) => s.id).join(', ')}`,
    );
  }
  return strategy;
}
