import { parseSave, serializeSave } from '@core/state';
import type { GameState } from '@core/types';
import { SAVE_KEY } from './config';
import type { SaveAdapter } from './SaveAdapter';

/**
 * Игровой код знает только про эти две функции. Замена localStorage на
 * файловую систему Tauri сводится к подмене адаптера (ограничение 2.6).
 */
export async function saveGame(adapter: SaveAdapter, state: GameState): Promise<void> {
  await adapter.write(SAVE_KEY, serializeSave(state, Date.now()));
}

export async function loadGame(adapter: SaveAdapter): Promise<GameState | null> {
  return parseSave(await adapter.read(SAVE_KEY))?.state ?? null;
}

export async function hasSave(adapter: SaveAdapter): Promise<boolean> {
  return (await loadGame(adapter)) !== null;
}

export async function clearSave(adapter: SaveAdapter): Promise<void> {
  await adapter.remove(SAVE_KEY);
}
