import type { GameEventDef } from '@core/types';
import { RANDOM_LIFE } from './life';
import { RANDOM_MONEY } from './money';
import { RANDOM_SCENE } from './scene';
import { RANDOM_STAGE } from './stage';

/** Взвешенный пул случайных событий (9.4). */
export const RANDOM_EVENTS: readonly GameEventDef[] = [
  ...RANDOM_LIFE,
  ...RANDOM_MONEY,
  ...RANDOM_SCENE,
  ...RANDOM_STAGE,
];
