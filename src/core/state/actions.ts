import type { GenreId } from '../types';

export type Action =
  | { readonly type: 'NEW_GAME'; readonly seed: string; readonly genre: GenreId }
  | { readonly type: 'DO_ACTIVITY'; readonly activityId: string }
  /** Смена жанра разрешена один раз за прохождение, раздел 7. */
  | { readonly type: 'SWITCH_GENRE'; readonly genre: GenreId };

export const newGame = (seed: string, genre: GenreId): Action => ({
  type: 'NEW_GAME',
  seed,
  genre,
});

export const doActivity = (activityId: string): Action => ({
  type: 'DO_ACTIVITY',
  activityId,
});

export const switchGenre = (genre: GenreId): Action => ({ type: 'SWITCH_GENRE', genre });
