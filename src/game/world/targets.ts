import type { PropKind, WorldRect } from '@core/types';

/** То, во что можно войти или к чему подойти: дверь, выход, точка, створ. */
export interface WorldTarget {
  readonly kind: 'door' | 'exit' | 'point' | 'gate';
  readonly id: string;
  readonly nameKey: string;
  readonly rect: WorldRect;
  /** Дверь заперта по часам работы локации (раздел 8). */
  readonly locked?: boolean | undefined;
  /** Что за предмет здесь стоит. У дверей и выходов его нет. */
  readonly prop?: PropKind | undefined;
}

