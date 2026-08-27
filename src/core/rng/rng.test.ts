import { describe, expect, it } from 'vitest';
import { Rng, hashSeed } from './rng';

const take = (rng: Rng, count: number): number[] =>
  Array.from({ length: count }, () => rng.float());

describe('Rng', () => {
  it('даёт одинаковую последовательность для одинакового сида', () => {
    expect(take(new Rng('vocalist'), 20)).toEqual(take(new Rng('vocalist'), 20));
  });

  it('даёт разные последовательности для разных сидов', () => {
    expect(take(new Rng('a'), 10)).not.toEqual(take(new Rng('b'), 10));
  });

  it('float() лежит в [0, 1)', () => {
    const rng = new Rng(12345);
    for (let i = 0; i < 5000; i += 1) {
      const value = rng.float();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('int() покрывает границы включительно и не выходит за них', () => {
    const rng = new Rng('int');
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i += 1) seen.add(rng.int(1, 6));
    expect([...seen].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('int() ругается на перевёрнутый диапазон', () => {
    expect(() => new Rng(1).int(5, 2)).toThrow(RangeError);
  });

  it('chance() примерно соблюдает вероятность', () => {
    const rng = new Rng('chance');
    let hits = 0;
    const runs = 20000;
    for (let i = 0; i < runs; i += 1) if (rng.chance(0.25)) hits += 1;
    expect(hits / runs).toBeGreaterThan(0.23);
    expect(hits / runs).toBeLessThan(0.27);
  });

  it('pickWeighted() уважает веса', () => {
    const rng = new Rng('weights');
    const items = [
      { id: 'rare', weight: 1 },
      { id: 'common', weight: 9 },
    ];
    const counts = { rare: 0, common: 0 };
    for (let i = 0; i < 10000; i += 1) {
      counts[rng.pickWeighted(items, (item) => item.weight).id as 'rare' | 'common'] += 1;
    }
    expect(counts.common).toBeGreaterThan(counts.rare * 5);
  });

  it('pickWeighted() и pick() падают на пустом входе', () => {
    expect(() => new Rng(1).pick([])).toThrow(RangeError);
    expect(() => new Rng(1).pickWeighted([{ w: 0 }], (i) => i.w)).toThrow(RangeError);
  });

  it('shuffle() не мутирует исходный список и сохраняет состав', () => {
    const source = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = new Rng('shuffle').shuffle(source);
    expect(source).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(source);
  });

  it('состояние сериализуется и восстанавливается', () => {
    const rng = new Rng('save');
    take(rng, 7);
    const restored = Rng.fromState(rng.getState());
    expect(take(restored, 10)).toEqual(take(rng, 10));
  });

  it('fork() даёт воспроизводимые, но независимые потоки', () => {
    const makeForks = () => {
      const base = new Rng('base');
      return [base.fork('events'), base.fork('performance')] as const;
    };
    const [eventsA, perfA] = makeForks();
    const [eventsB, perfB] = makeForks();

    expect(take(eventsA, 10)).toEqual(take(eventsB, 10));
    expect(take(perfA, 10)).toEqual(take(perfB, 10));
    expect(take(new Rng('base').fork('events'), 10)).not.toEqual(
      take(new Rng('base').fork('performance'), 10),
    );
  });

  it('hashSeed() стабилен и различает строки', () => {
    expect(hashSeed('vocalist')).toBe(hashSeed('vocalist'));
    expect(hashSeed('vocalist')).not.toBe(hashSeed('vocalists'));
  });
});
