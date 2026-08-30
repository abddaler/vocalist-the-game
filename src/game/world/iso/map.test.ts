import { describe, expect, it } from 'vitest';
import { fromTiled } from '@data/world';
import type { TiledMap } from '@data/world';
import { cellAt, kindAt, levelAt, parseMap, standable, stepAllowed } from './map';
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

describe('карта из Tiled', () => {
  /** Та же выгрузка, что в data/world/tiled.test.ts, только поменьше. */
  const exported: TiledMap = {
    orientation: 'isometric',
    width: 3,
    height: 2,
    tileheight: 16,
    tilesets: [
      {
        firstgid: 1,
        tiles: [
          { id: 0, properties: [{ name: 'kind', value: 'pavement' }] },
          { id: 1, properties: [{ name: 'kind', value: 'road' }] },
          { id: 2, properties: [{ name: 'kind', value: 'pavement' }, { name: 'level', value: 1 }] },
        ],
      },
    ],
    layers: [{ type: 'tilelayer', name: 'ground', width: 3, height: 2, data: [1, 2, 0, 3, 2, 1] }],
  };

  it('читается тем же разборщиком, что и рукописная', () => {
    // Смысл импорта в этом и есть: дальше по игре разницы быть не должно.
    const map = parseMap(fromTiled(exported).tiles);
    expect(map.width).toBe(3);
    expect(map.depth).toBe(2);
    expect(map.levels).toBe(1);
    expect(map.cells[0]).toEqual({ kind: 'pavement', level: 0 });
    expect(map.cells[1]).toEqual({ kind: 'road', level: 0 });
    // Дыра остаётся дырой: по ней не ходят и её не рисуют.
    expect(map.cells[2]).toBeNull();
  });

  it('импортированная карта проходима там же, где нарисована', () => {
    const map = parseMap(fromTiled(exported).tiles);
    expect(standable(map, 0.5, 0.5)).toBe(true);
    expect(standable(map, 2.5, 0.5)).toBe(false);
  });
});
