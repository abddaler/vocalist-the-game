import { describe, expect, it } from 'vitest';
import { facingFrom, lookFor } from './actorSprite';

describe('поворот персонажа', () => {
  it('следует за преобладающей осью движения', () => {
    expect(facingFrom({ x: 0, y: 0 }, { x: 5, y: 1 }, 'down')).toBe('right');
    expect(facingFrom({ x: 0, y: 0 }, { x: -5, y: 1 }, 'down')).toBe('left');
    expect(facingFrom({ x: 0, y: 0 }, { x: 1, y: 5 }, 'up')).toBe('down');
    expect(facingFrom({ x: 0, y: 0 }, { x: 1, y: -5 }, 'down')).toBe('up');
  });

  it('стоящий сохраняет поворот, а не разворачивается к зрителю', () => {
    expect(facingFrom({ x: 3, y: 3 }, { x: 3, y: 3 }, 'left')).toBe('left');
    expect(facingFrom({ x: 3, y: 3 }, { x: 3.01, y: 3 }, 'up')).toBe('up');
  });
});

describe('кадр анимации', () => {
  /** Шаг меряется в плитках, и одна фаза — заметно меньше плитки. */
  const PHASE = 0.55;
  const walk = (facing: 'down' | 'left', phases: number[]): string[] =>
    phases.map((n) => lookFor(facing, n * PHASE + PHASE / 2, true).pose);

  it('в покое всегда первый кадр', () => {
    expect(lookFor('down', 999, false).pose).toBe('downA');
    expect(lookFor('down', 999, false).lift).toBe(0);
  });

  it('шаг укладывается в плитку, а не в семь', () => {
    // На семи плитках кадр менялся раз в две с половиной секунды.
    expect(lookFor('down', 0, true).pose).not.toBe(lookFor('down', 1, true).pose);
  });

  it('анфас кадры чередуются: касание и пронос', () => {
    expect(walk('down', [0, 1, 2, 3, 4])).toEqual([
      'downB', 'downA', 'downB', 'downA', 'downB',
    ]);
  });

  it('в профиль вперёд выносится то одна нога, то другая', () => {
    expect(walk('left', [0, 1, 2, 3, 4])).toEqual([
      'sideB', 'sideA', 'sideC', 'sideA', 'sideB',
    ]);
  });

  it('на проносе корпус выше, чем в момент касания', () => {
    expect(lookFor('down', PHASE / 2, true).lift).toBe(0);
    expect(lookFor('down', PHASE * 1.5, true).lift).toBe(1);
  });

  it('профиль отзеркаливается, а не дублируется отдельными кадрами', () => {
    expect(lookFor('left', 0, true).flipX).toBe(true);
    expect(lookFor('right', 0, true).flipX).toBe(false);
  });
});
