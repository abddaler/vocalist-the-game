import { describe, expect, it } from 'vitest';
import { t } from '@ui/i18n';
import { CITY } from '@data/world';
import { measureLine } from '../../../ui/font/metrics';
import { SIGN_PAD, signWidth } from './sign';

describe('вывеска', () => {
  it('надпись помещается на своём щите', () => {
    // Текст на вывеске лежит в плоскости фасада: строка шире щита
    // выезжает за его край и повисает прямо на стене. Ширину щита
    // signWidth считает по числу букв, а буквы у нас разной ширины —
    // на широком названии эта оценка врёт в меньшую сторону.
    for (const district of CITY) {
      const signs = [
        ...district.buildings.map((b) => ({ key: b.signKey, tiles: b.rect.w })),
        ...district.scenery
          .filter((h) => h.signKey)
          .map((h) => ({ key: h.signKey!, tiles: h.rect.w })),
      ];
      for (const sign of signs) {
        const text = measureLine(t(sign.key));
        const board = signWidth(sign.key, sign.tiles);
        expect(
          text <= board - SIGN_PAD * 2,
          `${district.id}: «${t(sign.key)}» ${text} px не влезает в щит ${board.toFixed(0)} px`,
        ).toBe(true);
      }
    }
  });
});
