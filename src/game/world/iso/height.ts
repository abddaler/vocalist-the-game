import type { WorldPoint } from '@core/types';
import { cellAt } from './map';
import type { IsoMap } from './map';

/**
 * Уровень под точкой, дробный. На ступенях он растёт плавно по мере
 * прохода плитки: иначе человек скакал бы вверх на целый уровень, и
 * лестница читалась бы телепортом.
 */
export function heightAt(map: IsoMap, point: WorldPoint): number {
  const tx = Math.floor(point.x);
  const ty = Math.floor(point.y);
  const cell = cellAt(map, tx, ty);
  if (cell === null) return 0;
  if (cell.kind !== 'steps') return cell.level;

  const below = cellAt(map, tx, ty + 1);
  if (below !== null && below.level < cell.level) {
    return cell.level - (cell.level - below.level) * (point.y - ty);
  }
  const right = cellAt(map, tx + 1, ty);
  if (right !== null && right.level < cell.level) {
    return cell.level - (cell.level - right.level) * (point.x - tx);
  }
  return cell.level;
}
