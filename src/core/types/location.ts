import type { Slot } from './time';

/** Локация района (раздел 8). Что в ней можно делать и когда она открыта. */
export interface LocationDef {
  readonly id: string;
  readonly nameKey: string;
  /** В каких слотах локация работает. */
  readonly openSlots: readonly Slot[];
  /** Действия, доступные внутри. */
  readonly activities: readonly string[];
  /** Площадки для выступлений, если они здесь есть. */
  readonly venues: readonly string[];
}
