import type { OutfitItemDef } from '@core/types';

/**
 * Магазин одежды (раздел 8, локация 7) и имидж (9.2).
 * genreFit: +1 «в точку», −1 «мимо». Жанр вне карты нейтрален.
 */
export const OUTFITS: readonly OutfitItemDef[] = [
  // — голова —
  { id: 'cap_plain', nameKey: 'outfit.capPlain', slot: 'head', price: 900, stage: 1, mood: 0, genreFit: { pop: 1, estrada: -1 } },
  { id: 'bandana', nameKey: 'outfit.bandana', slot: 'head', price: 1400, stage: 2, mood: 1, genreFit: { rock: 2, metal: 1, estrada: -2 } },
  { id: 'hat_felt', nameKey: 'outfit.hatFelt', slot: 'head', price: 3200, stage: 3, mood: 1, genreFit: { estrada: 2, pop: 1, metal: -2 } },

  // — верх —
  { id: 'tee_black', nameKey: 'outfit.teeBlack', slot: 'top', price: 1100, stage: 1, mood: 0, genreFit: { rock: 1, metal: 1 } },
  { id: 'shirt_satin', nameKey: 'outfit.shirtSatin', slot: 'top', price: 4800, stage: 4, mood: 2, genreFit: { pop: 2, estrada: 2, metal: -2 } },
  { id: 'jacket_leather', nameKey: 'outfit.jacketLeather', slot: 'top', price: 7600, stage: 5, mood: 3, genreFit: { rock: 3, metal: 2, estrada: -2 } },

  // — низ —
  { id: 'jeans_worn', nameKey: 'outfit.jeansWorn', slot: 'bottom', price: 1600, stage: 1, mood: 0, genreFit: { rock: 1, estrada: -1 } },
  { id: 'trousers_dress', nameKey: 'outfit.trousersDress', slot: 'bottom', price: 4200, stage: 3, mood: 1, genreFit: { estrada: 2, pop: 1, metal: -2 } },
  { id: 'pants_stage', nameKey: 'outfit.pantsStage', slot: 'bottom', price: 6100, stage: 4, mood: 2, genreFit: { pop: 2, rock: 1 } },

  // — обувь —
  { id: 'sneakers', nameKey: 'outfit.sneakers', slot: 'shoes', price: 2100, stage: 1, mood: 1, genreFit: { pop: 1, estrada: -1 } },
  { id: 'boots_heavy', nameKey: 'outfit.bootsHeavy', slot: 'shoes', price: 5400, stage: 3, mood: 1, genreFit: { metal: 3, rock: 2, estrada: -2 } },
  { id: 'shoes_patent', nameKey: 'outfit.shoesPatent', slot: 'shoes', price: 5900, stage: 3, mood: 1, genreFit: { estrada: 3, pop: 1, metal: -3 } },

  // — аксессуар —
  { id: 'scarf_wool', nameKey: 'outfit.scarfWool', slot: 'accessory', price: 1200, stage: 1, mood: 2, genreFit: {} },
  { id: 'chain_steel', nameKey: 'outfit.chainSteel', slot: 'accessory', price: 3300, stage: 2, mood: 1, genreFit: { metal: 2, rock: 1, estrada: -2 } },
  { id: 'earpiece', nameKey: 'outfit.earpiece', slot: 'accessory', price: 8200, stage: 5, mood: 0, genreFit: { pop: 2, estrada: 1 } },
];

const BY_ID = new Map(OUTFITS.map((item) => [item.id, item]));

export function getOutfitItem(id: string): OutfitItemDef {
  const item = BY_ID.get(id);
  if (!item) throw new Error(`Неизвестный предмет одежды: "${id}"`);
  return item;
}

export function hasOutfitItem(id: string): boolean {
  return BY_ID.has(id);
}
