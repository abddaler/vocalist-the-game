import { palette } from './palettes';
import type { ActorPalette, Colors } from './palettes';
import type { HairStyle } from './hair';
import type { Accessory } from './accessory';

/**
 * Внешность персонажа: палитра, стрижка и примета. Из трёх независимых
 * слоёв людей набирается сколько угодно, и толпа перестаёт быть шестью
 * перекрашенными копиями.
 *
 * Первым идёт игрок, дальше — названные по имени NPC, дальше прохожие.
 * Порядок важен: на него ссылаются данные толпы.
 */
export interface Look {
  readonly id: string;
  readonly colors: Colors;
  readonly hair: HairStyle;
  readonly accessory: Accessory;
}

const look = (
  id: string,
  colors: Colors,
  hair: HairStyle,
  accessory: Accessory = 'none',
): Look => ({ id, colors, hair, accessory });

export const LOOKS: readonly Look[] = [
  // — игрок —
  look(
    'player',
    { skin: '#e8c9a0', hair: '#3b2a1e', cloth: '#7fbf74', legs: '#3a4358', shoes: '#26262e', accent: '#e8c46a' },
    'short',
  ),

  // — названные (раздел 9.3): каждого должно быть видно с другого конца улицы —
  look(
    'teacher',
    { skin: '#f0d4b4', hair: '#6a3f2f', cloth: '#8f6ac9', legs: '#33304a', shoes: '#2a2630', accent: '#e0708f' },
    'long',
    'scarf',
  ),
  look(
    'engineer',
    { skin: '#d6a97c', hair: '#221c1a', cloth: '#4a5566', legs: '#2c3038', shoes: '#22242a', accent: '#e8a13f' },
    'short',
    'headphones',
  ),
  look(
    'promoter',
    { skin: '#c99a72', hair: '#191720', cloth: '#22242e', legs: '#22242e', shoes: '#16161c', accent: '#c94f7a' },
    'ponytail',
    'jacket',
  ),
  look(
    'blogger',
    { skin: '#f0d0b8', hair: '#c95f8f', cloth: '#e8e2ea', legs: '#5a7fc9', shoes: '#e8e8ee', accent: '#5fc9c0' },
    'long',
    'bag',
  ),
  look(
    'rival',
    { skin: '#e0bb92', hair: '#d8c46a', cloth: '#c94a4a', legs: '#2a2c38', shoes: '#20222a', accent: '#1c1e26' },
    'curly',
    'glasses',
  ),

  // — прохожие —
  look(
    'passer_1',
    { skin: '#e8c9a0', hair: '#2a2028', cloth: '#c96a6a', legs: '#3a3d4a', shoes: '#24242c', accent: '#f0e0c0' },
    'short',
  ),
  look(
    'passer_2',
    { skin: '#a8764f', hair: '#1e1a20', cloth: '#5f8ac9', legs: '#2f3648', shoes: '#22222b', accent: '#e8c46a' },
    'curly',
    'bag',
  ),
  look(
    'passer_3',
    { skin: '#f0d6b4', hair: '#8f6a30', cloth: '#e8c46a', legs: '#4a4030', shoes: '#3a3028', accent: '#c95f4a' },
    'long',
  ),
  look(
    'passer_4',
    { skin: '#c99a72', hair: '#3a2a44', cloth: '#8a6ac9', legs: '#33304a', shoes: '#26242e', accent: '#5fc98f' },
    'ponytail',
    'glasses',
  ),
  look(
    'passer_5',
    { skin: '#e8c9a0', hair: '#7a3a3a', cloth: '#5fa89a', legs: '#2f3f44', shoes: '#242a2c', accent: '#e88f4a' },
    'cap',
  ),
  look(
    'passer_6',
    { skin: '#8f6340', hair: '#141218', cloth: '#d8d2c8', legs: '#5a6070', shoes: '#2a2c34', accent: '#4a8fd9' },
    'short',
    'apron',
  ),
  look(
    'passer_7',
    { skin: '#f0dcc0', hair: '#b8b0a4', cloth: '#6a7080', legs: '#40465a', shoes: '#2a2c34', accent: '#a8b8c8' },
    'bald',
    'jacket',
  ),
  look(
    'passer_8',
    { skin: '#d0a37e', hair: '#4a2f22', cloth: '#e88fb8', legs: '#c96a9a', shoes: '#e8e0e8', accent: '#f0e8a0' },
    'long',
    'headphones',
  ),
  look(
    'passer_9',
    { skin: '#b98a5f', hair: '#2a2420', cloth: '#3f8f6a', legs: '#2c3a34', shoes: '#20262a', accent: '#e8c46a' },
    'cap',
    'bag',
  ),
  look(
    'passer_10',
    { skin: '#e8c9a0', hair: '#d8a83f', cloth: '#4a4f5c', legs: '#33363f', shoes: '#22242a', accent: '#e85f5f' },
    'ponytail',
    'scarf',
  ),
];

const INDEX = new Map(LOOKS.map((entry, index) => [entry.id, index]));

/** Номер внешности по имени. На него ссылаются данные толпы. */
export function lookIndex(id: string): number {
  const index = INDEX.get(id);
  if (index === undefined) throw new Error(`Неизвестная внешность: "${id}"`);
  return index;
}

export const PALETTES: readonly ActorPalette[] = LOOKS.map((entry) => palette(entry.colors));
