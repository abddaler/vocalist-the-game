import type { GenreId } from './genre';

/** Слоты имиджа (9.2). */
export const OUTFIT_SLOTS = ['head', 'top', 'bottom', 'shoes', 'accessory'] as const;
export type OutfitSlot = (typeof OUTFIT_SLOTS)[number];

export interface OutfitItemDef {
  readonly id: string;
  readonly nameKey: string;
  readonly slot: OutfitSlot;
  readonly price: number;
  /** Вклад в сценическое присутствие: складывается в уровень имиджа. */
  readonly stage: number;
  readonly mood: number;
  /**
   * Жанровое соответствие: +1 «в точку», −1 «мимо».
   * Жанр, которого нет в карте, считается нейтральным.
   */
  readonly genreFit: Readonly<Partial<Record<GenreId, number>>>;
}

export type Wardrobe = Readonly<Partial<Record<OutfitSlot, string>>>;
