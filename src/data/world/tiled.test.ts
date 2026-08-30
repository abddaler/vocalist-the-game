import { describe, expect, it } from 'vitest';
import { fromTiled } from './tiled';
import type { TiledMap } from './tiled';

/**
 * Маленькая выгрузка из Tiled: два вида плиток, дыра и один предмет.
 * Проще держать её здесь, чем файлом: она читается вместе с проверками.
 */
const sample = (patch: Partial<TiledMap> = {}): TiledMap => ({
  orientation: 'isometric',
  infinite: false,
  width: 3,
  height: 2,
  tileheight: 16,
  tilesets: [
    {
      firstgid: 1,
      tiles: [
        { id: 0, properties: [{ name: 'kind', value: 'pavement' }] },
        { id: 1, properties: [{ name: 'kind', value: 'road' }, { name: 'level', value: 0 }] },
        { id: 2, properties: [{ name: 'kind', value: 'pavement' }, { name: 'level', value: 1 }] },
      ],
    },
  ],
  layers: [
    { type: 'tilelayer', name: 'ground', width: 3, height: 2, data: [1, 2, 0, 3, 2, 1] },
    {
      type: 'objectgroup',
      name: 'props',
      objects: [
        {
          x: 32,
          y: 16,
          class: 'palm',
          properties: [{ name: 'variant', value: 2 }, { name: 'facing', value: 'y' }],
        },
      ],
    },
  ],
  ...patch,
});

describe('импорт карты из Tiled', () => {
  it('плитки становятся строками с легендой', () => {
    const { tiles } = fromTiled(sample());
    expect(tiles.rows).toHaveLength(2);
    // Ноль — дыра: туда не ходят и её не рисуют.
    expect(tiles.rows[0]![2]).toBe(' ');
    expect(Object.keys(tiles.legend)).toHaveLength(3);
  });

  it('одинаковые плитки делят один символ легенды', () => {
    const { tiles } = fromTiled(sample());
    expect(tiles.rows[0]![0]).toBe(tiles.rows[1]![2]);
  });

  it('уровень берётся из свойства, а без него равен нулю', () => {
    const { tiles } = fromTiled(sample());
    const levels = Object.values(tiles.legend).map((tile) => tile.level);
    expect(levels).toContain(0);
    expect(levels).toContain(1);
  });

  it('отражённая плитка не теряется', () => {
    // Старшие биты gid — отражения; без их снятия номер превращается в
    // миллиард, и плитка «не находится».
    const flipped = 1 | 0x80000000;
    const { tiles } = fromTiled(
      sample({ layers: [{ type: 'tilelayer', name: 'g', width: 3, height: 2, data: [flipped, 2, 0, 3, 2, 1] }] }),
    );
    expect(tiles.rows[0]![0]).not.toBe(' ');
  });

  it('предметы переводятся в плитки по высоте плитки, а не по ширине', () => {
    // Самая частая ошибка переноса: делить x на ширину. Карта тогда
    // растягивается вдвое, и всё встаёт мимо земли.
    const { decor } = fromTiled(sample());
    expect(decor).toEqual([{ kind: 'palm', x: 2, y: 1, variant: 2, facing: 'y' }]);
  });

  it('ортогональная карта отвергается', () => {
    expect(() => fromTiled(sample({ orientation: 'orthogonal' }))).toThrow(/изометрической/);
  });

  it('бесконечная карта отвергается', () => {
    expect(() => fromTiled(sample({ infinite: true }))).toThrow(/Бесконечная/);
  });

  it('карта без слоя плиток отвергается', () => {
    expect(() => fromTiled(sample({ layers: [] }))).toThrow(/слоя плиток/);
  });

  it('слой не того размера отвергается', () => {
    expect(() =>
      fromTiled(sample({ layers: [{ type: 'tilelayer', name: 'g', width: 3, height: 2, data: [1, 2] }] })),
    ).toThrow(/2 плиток при карте 3x2/);
  });

  it('незнакомое покрытие названо по имени', () => {
    expect(() =>
      fromTiled(sample({ tilesets: [{ firstgid: 1, tiles: [{ id: 0, properties: [{ name: 'kind', value: 'лава' }] }] }] })),
    ).toThrow(/лава/);
  });

  it('плитка без свойства kind названа номером', () => {
    expect(() => fromTiled(sample({ tilesets: [{ firstgid: 1, tiles: [] }] }))).toThrow(/Плитка 1/);
  });

  it('незнакомый предмет назван по имени', () => {
    expect(() =>
      fromTiled(sample({
        layers: [
          { type: 'tilelayer', name: 'g', width: 3, height: 2, data: [1, 1, 1, 1, 1, 1] },
          { type: 'objectgroup', name: 'p', objects: [{ x: 0, y: 0, class: 'дракон' }] },
        ],
      })),
    ).toThrow(/дракон/);
  });

  it('старое поле type читается наравне с class', () => {
    const { decor } = fromTiled(sample({
      layers: [
        { type: 'tilelayer', name: 'g', width: 3, height: 2, data: [1, 1, 1, 1, 1, 1] },
        { type: 'objectgroup', name: 'p', objects: [{ x: 16, y: 32, type: 'bench' }] },
      ],
    }));
    expect(decor).toEqual([{ kind: 'bench', x: 1, y: 2 }]);
  });
});
