import type { SkillKey } from './skills';

export const GENRE_IDS = ['pop', 'rock', 'metal', 'estrada'] as const;
export type GenreId = (typeof GENRE_IDS)[number];

/** Жанр, раздел 7. Веса статов используются при расчёте выступления (9.1). */
export interface GenreDef {
  readonly id: GenreId;
  readonly nameKey: string;
  /** Множитель износа связок: эстрада 1.0 … метал 1.8. */
  readonly vocalLoadMultiplier: number;
  /** Веса статов при оценке выступления. Сумма приведена к 1. */
  readonly statWeights: Readonly<Partial<Record<SkillKey, number>>>;
  readonly moneyMultiplier: number;
  readonly fameMultiplier: number;
  /** Разрешены ли экстрим-техники (fry, growl, дисторшн). */
  readonly allowsExtreme: boolean;
}
