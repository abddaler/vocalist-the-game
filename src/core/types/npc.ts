/** NPC среза (9.3): пятеро, включая конкурента. */
export const NPC_IDS = ['teacher', 'engineer', 'promoter', 'blogger', 'rival'] as const;
export type NpcId = (typeof NPC_IDS)[number];

/** Что открывает порог отношений. */
export type PerkKind =
  /** Скидка на услуги этого NPC, доля 0..1. */
  | 'discount'
  /** Приглашение на площадку. */
  | 'invite'
  /** Разовый подарок славы или фанатов. */
  | 'boost';

export interface NpcPerk {
  readonly relation: number;
  readonly kind: PerkKind;
  readonly value: number;
  readonly textKey: string;
}

export interface NpcDef {
  readonly id: NpcId;
  readonly nameKey: string;
  readonly roleKey: string;
  readonly perks: readonly NpcPerk[];
  /**
   * Конкурент — единственный с отрицательной динамикой: его слава растёт
   * сама, и чем сильнее он оторвался, тем чаще перехватывает концерты.
   */
  readonly rival?: boolean;
}

export interface NpcState {
  relation: number;
  met: boolean;
}
