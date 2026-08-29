import { describe, expect, it } from 'vitest';
import type { DecorKind } from '@core/types';
import { DECOR_KINDS } from '@core/types';
import { hasBillboard } from './index';
import { ISO_PROPS } from '../iso/props';

/**
 * Каталог мелочи неполон по типу: щитовой реестр держит только предметы
 * без объёма. Полноту держит эта проверка — иначе новый вид молча
 * рисовался бы пустым местом.
 */
describe('каталог мелочи', () => {
  it('у каждого вида есть либо объём, либо щит', () => {
    for (const kind of DECOR_KINDS) {
      const drawn = ISO_PROPS[kind] !== undefined || hasBillboard(kind as DecorKind);
      expect(drawn, kind).toBe(true);
    }
  });
});
