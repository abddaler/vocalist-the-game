import type { GenreId } from '../types';

export type Action =
  | { readonly type: 'NEW_GAME'; readonly seed: string; readonly genre: GenreId }
  | { readonly type: 'DO_ACTIVITY'; readonly activityId: string }
  /** Выступление: площадка плюс длина сет-листа (9.1). */
  | { readonly type: 'PERFORM'; readonly venueId: string; readonly songs: number }
  /** Ответ на подвешенное событие (9.4). */
  | { readonly type: 'RESOLVE_EVENT'; readonly choiceIndex: number }
  | { readonly type: 'BUY_OUTFIT'; readonly itemId: string }
  | { readonly type: 'EQUIP_OUTFIT'; readonly itemId: string }
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

export const perform = (venueId: string, songs: number): Action => ({
  type: 'PERFORM',
  venueId,
  songs,
});

export const resolveEventChoice = (choiceIndex: number): Action => ({
  type: 'RESOLVE_EVENT',
  choiceIndex,
});

export const buyOutfit = (itemId: string): Action => ({ type: 'BUY_OUTFIT', itemId });

export const equipOutfit = (itemId: string): Action => ({ type: 'EQUIP_OUTFIT', itemId });

export const switchGenre = (genre: GenreId): Action => ({ type: 'SWITCH_GENRE', genre });
