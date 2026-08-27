import type { GenreDef, GenreId } from '@core/types';

/**
 * Жанры среза (раздел 7). Веса статов нормализованы к сумме 1 и задают,
 * что именно площадка слышит в исполнении. Тонкая настройка — на Попе;
 * остальные рабочие, но не выверенные.
 */
export const GENRES: Readonly<Record<GenreId, GenreDef>> = {
  pop: {
    id: 'pop',
    nameKey: 'genre.pop',
    vocalLoadMultiplier: 1.1,
    statWeights: {
      timbre: 0.26,
      pitch: 0.2,
      registers: 0.18,
      stage: 0.16,
      diction: 0.1,
      stamina: 0.1,
    },
    moneyMultiplier: 1.0,
    fameMultiplier: 1.15,
    allowsExtreme: false,
  },
  rock: {
    id: 'rock',
    nameKey: 'genre.rock',
    vocalLoadMultiplier: 1.4,
    statWeights: {
      timbre: 0.22,
      stage: 0.24,
      stamina: 0.18,
      range: 0.14,
      registers: 0.12,
      pitch: 0.1,
    },
    moneyMultiplier: 0.95,
    fameMultiplier: 1.1,
    allowsExtreme: false,
  },
  metal: {
    id: 'metal',
    nameKey: 'genre.metal',
    vocalLoadMultiplier: 1.8,
    statWeights: {
      extreme: 0.26,
      stamina: 0.2,
      stage: 0.18,
      timbre: 0.14,
      range: 0.12,
      registers: 0.1,
    },
    moneyMultiplier: 0.85,
    fameMultiplier: 1.25,
    allowsExtreme: true,
  },
  estrada: {
    id: 'estrada',
    nameKey: 'genre.estrada',
    vocalLoadMultiplier: 1.0,
    statWeights: {
      timbre: 0.24,
      diction: 0.22,
      pitch: 0.2,
      registers: 0.14,
      stage: 0.12,
      stamina: 0.08,
    },
    moneyMultiplier: 1.1,
    fameMultiplier: 0.9,
    allowsExtreme: false,
  },
};

export function getGenre(id: GenreId): GenreDef {
  return GENRES[id];
}
