import { describe, expect, it } from 'vitest';
import { BALANCE } from '@data/balance';
import { OUTFITS, getOutfitItem } from '@data/outfits';
import { OUTFIT_SLOTS } from '../types';
import { makeState } from '../testing/fixtures';
import { equippedItems, imageLevel, outfitModifier, outfitMood, owns } from './outfit';

const dressed = (...ids: string[]) =>
  makeState({
    wardrobe: {
      owned: ids,
      equipped: Object.fromEntries(ids.map((id) => [getOutfitItem(id).slot, id])),
    },
  });

describe('имидж', () => {
  it('без одежды равен нулю и ничего не меняет', () => {
    const bare = makeState();
    expect(imageLevel(bare)).toBe(0);
    expect(equippedItems(bare)).toEqual([]);
    expect(outfitModifier(bare, 'pop')).toBe(1);
  });

  it('складывается из сценического вклада надетого', () => {
    const state = dressed('jacket_leather', 'boots_heavy');
    expect(imageLevel(state)).toBe(
      getOutfitItem('jacket_leather').stage + getOutfitItem('boots_heavy').stage,
    );
    expect(outfitMood(state)).toBeGreaterThan(0);
  });

  it('в слоте держится только один предмет', () => {
    const state = dressed('jacket_leather', 'tee_black');
    expect(equippedItems(state)).toHaveLength(1);
  });
});

describe('жанровое соответствие (9.2)', () => {
  it('наряд в тему помогает, наряд мимо — штрафует', () => {
    const rockOutfit = dressed('jacket_leather', 'boots_heavy', 'chain_steel');
    expect(outfitModifier(rockOutfit, 'rock')).toBeGreaterThan(1);
    expect(outfitModifier(rockOutfit, 'estrada')).toBeLessThan(1);
  });

  it('множитель зажат в границах баланса', () => {
    const loud = dressed(...OUTFITS.filter((i) => (i.genreFit.metal ?? 0) > 0).map((i) => i.id));
    expect(outfitModifier(loud, 'metal')).toBeLessThanOrEqual(BALANCE.performance.outfitMax);
    expect(outfitModifier(loud, 'estrada')).toBeGreaterThanOrEqual(BALANCE.performance.outfitMin);
  });
});

describe('гардероб', () => {
  it('знает, что куплено', () => {
    const state = dressed('sneakers');
    expect(owns(state, 'sneakers')).toBe(true);
    expect(owns(state, 'earpiece')).toBe(false);
  });
});

describe('ассортимент магазина', () => {
  it('покрывает все пять слотов имиджа', () => {
    const slots = new Set(OUTFITS.map((item) => item.slot));
    for (const slot of OUTFIT_SLOTS) expect(slots).toContain(slot);
  });

  it('у всех предметов есть цена и id уникальны', () => {
    const ids = new Set<string>();
    for (const item of OUTFITS) {
      expect(item.price).toBeGreaterThan(0);
      expect(ids.has(item.id)).toBe(false);
      ids.add(item.id);
    }
  });
});
