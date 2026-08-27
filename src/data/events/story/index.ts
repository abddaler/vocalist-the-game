import type { GameEventDef } from '@core/types';
import { STORY_ACT_1 } from './act1';
import { STORY_ACT_2 } from './act2';

/**
 * Сюжетные события (9.4) в том порядке, в котором игрок их увидит:
 * каждое привязано к ступени карьеры и открывает следующую.
 *
 * У каждого, кроме первого, есть ещё и дневные ворота: слава растёт
 * быстрее, чем разворачивается история, и без них весь сюжет
 * пролетал за первую неделю.
 */
export const STORY_EVENTS: readonly GameEventDef[] = [...STORY_ACT_1, ...STORY_ACT_2];
