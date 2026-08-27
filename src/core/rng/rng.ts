/**
 * Сидированный ГПСЧ (раздел 3).
 * Math.random() запрещён во всём проекте: одинаковый сид + одинаковые
 * действия обязаны давать одинаковый результат — на этом стоят
 * тесты баланса и воспроизведение багов.
 *
 * Алгоритм: mulberry32. 32 бита состояния, сериализуется одним числом.
 */

const UINT32 = 0x100000000;

/** Стабильный хеш строки в 32-битный сид (FNV-1a). */
export function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export interface RngState {
  readonly value: number;
}

export class Rng {
  private state: number;

  constructor(seed: number | string) {
    this.state = (typeof seed === 'string' ? hashSeed(seed) : seed >>> 0) || 1;
  }

  /** Восстановление из сохранения. */
  static fromState(state: RngState): Rng {
    return new Rng(state.value);
  }

  getState(): RngState {
    return { value: this.state };
  }

  /** Следующее целое 0..2^32-1. */
  nextUint32(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }

  /** Число в [0, 1). */
  float(): number {
    return this.nextUint32() / UINT32;
  }

  /** Число в [min, max). */
  range(min: number, max: number): number {
    return min + this.float() * (max - min);
  }

  /** Целое в [min, max] включительно. */
  int(min: number, max: number): number {
    if (max < min) throw new RangeError(`Rng.int: max (${max}) < min (${min})`);
    return min + Math.floor(this.float() * (max - min + 1));
  }

  /** true с вероятностью chance (0..1). */
  chance(probability: number): boolean {
    return this.float() < probability;
  }

  /** Равновероятный элемент непустого списка. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new RangeError('Rng.pick: пустой список');
    return items[this.int(0, items.length - 1)] as T;
  }

  /**
   * Элемент из взвешенного списка. Используется движком событий (9.4).
   * Веса должны быть неотрицательными и в сумме больше нуля.
   */
  pickWeighted<T>(items: readonly T[], weightOf: (item: T) => number): T {
    let total = 0;
    for (const item of items) {
      const weight = weightOf(item);
      if (weight < 0) throw new RangeError('Rng.pickWeighted: отрицательный вес');
      total += weight;
    }
    if (total <= 0) throw new RangeError('Rng.pickWeighted: суммарный вес равен нулю');

    let roll = this.float() * total;
    for (const item of items) {
      roll -= weightOf(item);
      if (roll < 0) return item;
    }
    return items[items.length - 1] as T;
  }

  /** Копия перемешанного списка (Фишер—Йетс). Исходный не трогаем. */
  shuffle<T>(items: readonly T[]): T[] {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = this.int(0, i);
      [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
    }
    return copy;
  }

  /**
   * Независимый поток от того же сида. Нужен, чтобы, например, поток
   * событий не сдвигал бросок оценки выступления и наоборот.
   */
  fork(label: string): Rng {
    return new Rng((this.nextUint32() ^ hashSeed(label)) >>> 0);
  }
}
