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
  it('в покое всегда первый кадр', () => {
    expect(lookFor('down', 999, false).pose).toBe('downA');
  });

  it('на ходу кадры чередуются', () => {
    const poses = [0, 7, 14, 21].map((walked) => lookFor('down', walked, true).pose);
    expect(poses).toEqual(['downA', 'downB', 'downA', 'downB']);
  });

  it('профиль отзеркаливается, а не дублируется отдельными кадрами', () => {
    expect(lookFor('left', 0, true)).toEqual({ pose: 'sideA', flipX: true });
    expect(lookFor('right', 0, true)).toEqual({ pose: 'sideA', flipX: false });
  });
});
