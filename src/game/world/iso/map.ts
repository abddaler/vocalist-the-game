import type { IsoMapDef, TileDef, TileKind } from '@core/types';

/**
 * Разбор сетки плиток. Строка — это ряд y (в глубину), символ в ней —
 * x (вдоль улицы); пробел означает, что земли здесь нет.
 */

export interface IsoMap {
  readonly width: number;
  readonly depth: number;
  /** Самый высокий уровень: по нему считается высота текстуры. */
  readonly levels: number;
  readonly cells: readonly (TileDef | null)[];
}

const VOID: TileDef = { kind: 'void', level: 0 };

export function parseMap(def: IsoMapDef): IsoMap {
  const depth = def.rows.length;
  const width = Math.max(...def.rows.map((row) => row.length));
  const cells: (TileDef | null)[] = [];
  let levels = 0;

  for (let y = 0; y < depth; y += 1) {
    const row = def.rows[y] ?? '';
    for (let x = 0; x < width; x += 1) {
      const char = row[x] ?? ' ';
      const cell = char === ' ' ? VOID : def.legend[char];
      if (cell === undefined) {
        throw new Error(`Плитка «${char}» в ряду ${y} не описана в легенде`);
      }
      cells.push(cell.kind === 'void' ? null : cell);
      levels = Math.max(levels, cell.level);
    }
  }
  return { width, depth, levels, cells };
}

export function cellAt(map: IsoMap, x: number, y: number): TileDef | null {
  if (x < 0 || y < 0 || x >= map.width || y >= map.depth) return null;
  return map.cells[y * map.width + x] ?? null;
}

/** По воде не ходят: она рисуется, но землёй не считается. */
export function standable(map: IsoMap, x: number, y: number): boolean {
  const cell = cellAt(map, Math.floor(x), Math.floor(y));
  return cell !== null && cell.kind !== 'water';
}

/** Уровень плитки под точкой; null — земли нет. */
export function levelAt(map: IsoMap, x: number, y: number): number | null {
  return cellAt(map, Math.floor(x), Math.floor(y))?.level ?? null;
}

export function kindAt(map: IsoMap, x: number, y: number): TileKind | null {
  return cellAt(map, Math.floor(x), Math.floor(y))?.kind ?? null;
}

/**
 * Можно ли перейти из одной плитки в другую. Разница уровней проходима
 * только через ступени: в этом и состоит многоуровневость — обрыв между
 * набережной и улицей не перепрыгнуть, к нему надо идти по лестнице.
 */
export function stepAllowed(map: IsoMap, from: { x: number; y: number }, to: { x: number; y: number }): boolean {
  const a = cellAt(map, Math.floor(from.x), Math.floor(from.y));
  const b = cellAt(map, Math.floor(to.x), Math.floor(to.y));
  if (b === null || b.kind === 'water') return false;
  if (a === null || a.level === b.level) return true;
  return a.kind === 'steps' || b.kind === 'steps';
}
