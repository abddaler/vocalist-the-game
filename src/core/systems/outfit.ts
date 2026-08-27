import { BALANCE } from '@data/balance';
import { getOutfitItem } from '@data/outfits';
import { clamp, round2 } from '../util/num';
import { OUTFIT_SLOTS } from '../types';
import type { GameState, GenreId, OutfitItemDef, OutfitSlot } from '../types';

const P = BALANCE.performance;

export function equippedItems(state: GameState): OutfitItemDef[] {
  const items: OutfitItemDef[] = [];
  for (const slot of OUTFIT_SLOTS) {
    const id = state.wardrobe.equipped[slot as OutfitSlot];
    if (id) items.push(getOutfitItem(id));
  }
  return items;
}

/**
 * Уровень имиджа (9.2): сумма сценического вклада надетого.
 * Дорогие площадки требуют минимума для допуска.
 */
export function imageLevel(state: GameState): number {
  return equippedItems(state).reduce((sum, item) => sum + item.stage, 0);
}

/**
 * Множитель наряда к оценке выступления.
 * Соответствие жанру помогает, несоответствие штрафует.
 */
export function outfitModifier(state: GameState, genre: GenreId): number {
  const fit = equippedItems(state).reduce((sum, item) => sum + (item.genreFit[genre] ?? 0), 0);
  return round2(clamp(1 + fit * P.outfitFitStep, P.outfitMin, P.outfitMax));
}

/** Настроение, которое наряд даёт своему владельцу. */
export function outfitMood(state: GameState): number {
  return equippedItems(state).reduce((sum, item) => sum + item.mood, 0);
}

export function owns(state: GameState, itemId: string): boolean {
  return state.wardrobe.owned.includes(itemId);
}
