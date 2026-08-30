import { describe, expect, it } from 'vitest';
import { CROWD } from '@data/world';
import { LOOKS, TINT_COUNT, lookIndex, tintedLook } from './looks';

describe('перекраска прохожих', () => {
  it('у каждого прохожего есть все обещанные перекраски', () => {
    // Промах здесь — человек просит кадр, которого не собрали.
    for (const look of LOOKS.filter((entry) => /^passer_\d+$/.test(entry.id))) {
      for (let step = 0; step <= TINT_COUNT; step += 1) {
        expect(() => lookIndex(tintedLook(look.id, step)), `${look.id}~${step}`).not.toThrow();
      }
    }
  });

  it('названные и игрок не перекрашиваются', () => {
    // У них примета в цвете: фуксия промоутера и чёрное конкурента —
    // это они и есть.
    for (const id of ['player', 'teacher', 'engineer', 'promoter', 'blogger', 'rival']) {
      for (let step = 0; step <= TINT_COUNT; step += 1) expect(tintedLook(id, step)).toBe(id);
    }
  });

  it('перекраска меняет цвет, а не стрижку и одежду', () => {
    const base = LOOKS.find((entry) => entry.id === 'passer_1');
    const painted = LOOKS.find((entry) => entry.id === 'passer_1~1');
    expect(base).toBeDefined();
    expect(painted).toBeDefined();
    expect(painted!.hair).toBe(base!.hair);
    expect(painted!.outfit).toBe(base!.outfit);
    expect(painted!.colors.cloth).not.toBe(base!.colors.cloth);
    // Кожа остаётся: сдвиг тона по кругу даёт зелёных людей.
    expect(painted!.colors.skin).toBe(base!.colors.skin);
  });

  it('вся толпа ссылается на существующие внешности', () => {
    for (const member of CROWD) expect(() => lookIndex(member.look), member.look).not.toThrow();
  });
});
