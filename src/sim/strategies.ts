import type { GameState } from '@core/types';
import { SLOTS } from '@core/types';
import { healthTier, isInjured } from '@core/systems/vocal';

/**
 * Стратегия отвечает на один вопрос: что игрок хочет сделать в этом слоте.
 * Возвращает список предпочтений; прогон берёт первое незаблокированное.
 * Молчание и сон не блокируются никогда, поэтому тупика не бывает.
 */
export interface Strategy {
  readonly id: string;
  readonly title: string;
  pick(state: GameState): readonly string[];
}

const slotOf = (state: GameState): string => SLOTS[state.slotIndex] as string;

/** «Сначала опора»: бережёт связки, вкладывается в дыхание, работает по нужде. */
export const supportFirst: Strategy = {
  id: 'support',
  title: 'Сначала опора',
  pick(state) {
    if (slotOf(state) === 'night') return ['sleep'];

    if (isInjured(state)) {
      return state.resources.money > 6000
        ? ['doctor_visit', 'vocal_rest', 'tea_regimen']
        : ['vocal_rest', 'tea_regimen'];
    }

    const tier = healthTier(state.resources.vocalHealth);
    if (tier === 'hoarse' || tier === 'critical') return ['vocal_rest', 'tea_regimen'];

    switch (slotOf(state)) {
      case 'morning':
        return state.vocal.warmedUpOnDay === state.day
          ? ['lesson_breath', 'practice_free', 'vocal_rest']
          : ['warmup'];
      case 'day':
        return state.resources.money > 9000
          ? ['lesson_breath', 'practice_free', 'vocal_rest']
          : ['practice_free', 'vocal_rest'];
      default:
        return state.resources.money < 12000
          ? ['restaurant_shift', 'practice_free', 'vocal_rest']
          : ['gym', 'vocal_rest'];
    }
  },
};

/**
 * «Берёт все смены»: поёт всегда, когда пускают, и выкупает у травмы дни
 * через фониатра — лишь бы скорее вернуться на сцену.
 */
export const gigGrinder: Strategy = {
  id: 'gigs',
  title: 'Берёт все смены',
  pick(state) {
    if (slotOf(state) === 'night') return ['sleep'];
    if (isInjured(state)) return ['doctor_visit', 'vocal_rest'];
    if (slotOf(state) === 'evening') return ['restaurant_shift', 'practice_free', 'vocal_rest'];
    return ['practice_free', 'restaurant_shift', 'vocal_rest'];
  },
};

/**
 * «Жадный к деньгам»: не тратит ни рубля — ни на уроки, ни на врача,
 * ни на спортзал. Работает вечерами, остальное время молчит.
 */
export const pennyPincher: Strategy = {
  id: 'money',
  title: 'Жадный к деньгам',
  pick(state) {
    if (slotOf(state) === 'night') return ['sleep'];
    if (slotOf(state) === 'evening') return ['restaurant_shift', 'vocal_rest'];
    return ['vocal_rest'];
  },
};

export const STRATEGIES: readonly Strategy[] = [supportFirst, gigGrinder, pennyPincher];

export function getStrategy(id: string): Strategy {
  const strategy = STRATEGIES.find((item) => item.id === id);
  if (!strategy) {
    throw new Error(`Неизвестная стратегия "${id}". Доступны: ${STRATEGIES.map((s) => s.id).join(', ')}`);
  }
  return strategy;
}
