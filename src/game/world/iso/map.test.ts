import { describe, expect, it } from 'vitest';
import { cellAt, kindAt, levelAt, parseMap, stepAllowed } from './map';
import type { IsoMapDef } from '@core/types';

/** Улица на уровне 1, набережная на нуле, между ними одна лестница. */
const SHORE: IsoMapDef = {
  legend: {
    '.': { kind: 'road', level: 1 },
    '/': { kind: 'steps', level: 1 },
    '=': { kind: 'deck', level: 0 },
    '~': { kind: 'water', level: 0 },
  },
  rows: [
    '.....',
    '../..',
    '=====',
    '~~~~~',
  ],
};

describe('карта плиток', () => {
  const map = parseMap(SHORE);

  it('читает размер и высоту из строк', () => {
    expect(map.width).toBe(5);
    expect(map.depth).toBe(4);
    expect(map.levels).toBe(1);
  });

  it('знает, что под ногами', () => {
    expect(kindAt(map, 0, 0)).toBe('road');
    expect(levelAt(map, 0, 0)).toBe(1);
    expect(levelAt(map, 0, 2)).toBe(0);
  });

  it('за краем карты земли нет', () => {
    expect(cellAt(map, -1, 0)).toBeNull();
    expect(levelAt(map, 9, 0)).toBeNull();
  });

  it('пропускает вниз только по лестнице', () => {
    expect(stepAllowed(map, { x: 2, y: 1 }, { x: 2, y: 2 })).toBe(true);
    expect(stepAllowed(map, { x: 0, y: 1 }, { x: 0, y: 2 })).toBe(false);
    expect(stepAllowed(map, { x: 0, y: 2 }, { x: 1, y: 2 })).toBe(true);
  });

  it('в пробел не ходят', () => {
    const holed = parseMap({ legend: SHORE.legend, rows: ['..', '. '] });
    expect(stepAllowed(holed, { x: 0, y: 1 }, { x: 1, y: 1 })).toBe(false);
  });

  it('незнакомый символ — это ошибка карты, а не пустая плитка', () => {
    expect(() => parseMap({ legend: SHORE.legend, rows: ['#'] })).toThrow();
  });
});
