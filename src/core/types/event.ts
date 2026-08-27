import type { CareerTier } from './career';
import type { GenreId } from './genre';
import type { NpcId } from './npc';
import type { SkillKey } from './skills';

export interface NumericRange {
  readonly lt?: number | undefined;
  readonly gte?: number | undefined;
}

/**
 * Условие срабатывания события (9.4). Все указанные поля должны совпасть.
 * Пустое условие = событие подходит всегда.
 */
export interface EventCondition {
  readonly day?: NumericRange | undefined;
  readonly vocalHealth?: NumericRange | undefined;
  readonly money?: NumericRange | undefined;
  readonly fame?: NumericRange | undefined;
  readonly fans?: NumericRange | undefined;
  readonly mood?: NumericRange | undefined;
  readonly reputation?: NumericRange | undefined;
  readonly energy?: NumericRange | undefined;
  readonly skill?: Readonly<Partial<Record<SkillKey, NumericRange>>> | undefined;
  readonly relation?: Readonly<Partial<Record<NpcId, NumericRange>>> | undefined;
  readonly tier?: CareerTier | undefined;
  readonly genres?: readonly GenreId[] | undefined;
  readonly injured?: boolean | undefined;
  readonly performances?: NumericRange | undefined;
  readonly flagSet?: readonly string[] | undefined;
  readonly flagUnset?: readonly string[] | undefined;
  /** Событие может случиться только раз за прохождение. */
  readonly once?: boolean | undefined;
}

/** Декларативный эффект выбора. Систему событий менять не нужно ради контента. */
export type Effect =
  | { readonly kind: 'money'; readonly delta: number }
  | { readonly kind: 'energy'; readonly delta: number }
  | { readonly kind: 'vocalHealth'; readonly delta: number }
  | { readonly kind: 'mood'; readonly delta: number }
  | { readonly kind: 'fame'; readonly delta: number }
  | { readonly kind: 'fans'; readonly delta: number }
  | { readonly kind: 'reputation'; readonly delta: number }
  | { readonly kind: 'skill'; readonly key: SkillKey; readonly delta: number }
  | { readonly kind: 'relation'; readonly npc: NpcId; readonly delta: number }
  | { readonly kind: 'injury'; readonly days: number }
  | { readonly kind: 'flag'; readonly key: string; readonly value: number }
  | { readonly kind: 'tier'; readonly tier: CareerTier };

export interface EventChoice {
  readonly textKey: string;
  /** Выбор показывается только при выполненном условии. */
  readonly requires?: EventCondition | undefined;
  readonly effects: readonly Effect[];
  /** Риск: с вероятностью chance вместо обычного исхода прилетает это. */
  readonly risk?:
    | { readonly chance: number; readonly effects: readonly Effect[]; readonly textKey: string }
    | undefined;
}

export interface GameEventDef {
  readonly id: string;
  /**
   * story — жёстко привязаны к вехам карьеры и идут по порядку: именно они
   * дают ощущение истории. random — взвешенный пул по условиям.
   */
  readonly kind: 'story' | 'random';
  readonly trigger: EventCondition;
  readonly weight: number;
  readonly titleKey: string;
  readonly textKey: string;
  readonly choices: readonly EventChoice[];
}
