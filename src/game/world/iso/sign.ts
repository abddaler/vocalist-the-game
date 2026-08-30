import { t } from '@ui/i18n';
import { TILE } from './project';

/** Отступ от края щита до буквы. */
export const SIGN_PAD = 4;

/**
 * Ширина вывески на фасаде. Живёт отдельным правилом, потому что по ней
 * расставляется и мелочь: дерево или фонарь напротив щита срезает
 * полнадписи, и проверить это можно только зная его настоящий размер.
 */
export function signWidth(nameKey: string, tiles: number): number {
  return Math.min(tiles * TILE.halfW * 1.7, t(nameKey).length * 6 + 18);
}

/** Половина вывески в плитках: столько места ей нужно слева и справа. */
export function signReach(nameKey: string, tiles: number): number {
  return signWidth(nameKey, tiles) / 2 / TILE.halfW + 0.4;
}
