import type { Slot } from './time';

/**
 * Карьерная лестница (9.5): переход → корпоративы → ресторан → бар → клуб.
 * Фестиваль лежит за границей среза и служит горизонтом.
 */
export const CAREER_TIERS = [
  'underpass',
  'events',
  'restaurant',
  'bar',
  'club',
  'festival',
] as const;

export type CareerTier = (typeof CAREER_TIERS)[number];

export function tierIndex(tier: CareerTier): number {
  return CAREER_TIERS.indexOf(tier);
}

export type PerformanceOutcome = 'fail' | 'ok' | 'good' | 'triumph';

/** Площадка. Живёт внутри локации; переход — на экране района. */
export interface VenueDef {
  readonly id: string;
  readonly nameKey: string;
  readonly locationId: string;
  readonly tier: CareerTier;
  /** В каких слотах здесь играют. */
  readonly slots: readonly Slot[];
  /** Сколько слотов дня занимает выступление. */
  readonly timeCost: number;
  /** Границы сет-листа (9.1). */
  readonly setlist: { readonly min: number; readonly max: number };
  /** Базовый износ за песню до модификаторов раздела 6. */
  readonly loadPerSong: number;
  readonly energyPerSong: number;

  readonly requires: {
    readonly fame?: number | undefined;
    /** Минимальный уровень имиджа для допуска (9.2). */
    readonly image?: number | undefined;
    readonly tier?: CareerTier | undefined;
  };

  /** Пороги оценки на шкале 0..100 (9.1). Ниже ok — провал. */
  readonly thresholds: {
    readonly ok: number;
    readonly good: number;
    readonly triumph: number;
  };

  /**
   * Можно ли увести площадку из-под носа (9.3). Переход никто не
   * бронирует — там нечего перехватывать.
   */
  readonly interceptable: boolean;
  readonly payout: { readonly base: number; readonly perSong: number };
  readonly fame: { readonly base: number; readonly perSong: number };
  /**
   * Слава, выше которой площадка перестаёт делать тебя известнее.
   * Переход не сделает звездой того, кого уже знают: именно это
   * выталкивает игрока на следующую ступень, а не запрет сверху.
   */
  readonly fameCeiling: number;
  /** Сколько фанатов приносит единица славы с этой площадки. */
  readonly fansPerFame: number;
}
