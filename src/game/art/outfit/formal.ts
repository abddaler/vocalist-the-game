import { ROWS } from './kit';
import type { OutfitFrames } from './kit';

const {
  SLEEVE, CUFF, CHEST, STRAP, HEM,
  SIDE_SLEEVE, SIDE_CUFF, SIDE_CHEST, SIDE_HEM,
  LAPEL, SHIRT, TIE, BELT, SIDE_LAPEL, SIDE_BELT,
} = ROWS;

const rep = (row: string, times: number): string[] => Array.from({ length: times }, () => row);

/** Выходное: пиджак, костюм, платье, длинное пальто. */
export const FORMAL: Readonly<Record<'jacket' | 'suit' | 'dress' | 'coat', OutfitFrames>> = {
  // Пиджак: лацканы и рубашка в вырезе, рукав до кисти.
  jacket: {
    front: [CUFF, LAPEL, LAPEL, ...rep(SHIRT, 3), ...rep(SLEEVE, 1), ...rep(CUFF, 6), HEM],
    back: [CUFF, ...rep(SLEEVE, 6), ...rep(CUFF, 6), HEM],
    side: [SIDE_CUFF, ...rep(SIDE_LAPEL, 3), ...rep(SIDE_SLEEVE, 3), ...rep(SIDE_CUFF, 6), SIDE_HEM],
    legs: 'trousers',
  },
  // Костюм: тот же пиджак, но с галстуком — по нему его и узнают.
  suit: {
    front: [CUFF, LAPEL, LAPEL, SHIRT, TIE, TIE, ...rep(CUFF, 7), HEM],
    back: [CUFF, ...rep(SLEEVE, 6), ...rep(CUFF, 6), HEM],
    side: [SIDE_CUFF, ...rep(SIDE_LAPEL, 3), ...rep(SIDE_SLEEVE, 3), ...rep(SIDE_CUFF, 6), SIDE_HEM],
    legs: 'trousers',
  },
  // Платье: открытые плечи, лиф и юбка ниже пояса.
  dress: {
    front: [...rep(STRAP, 2), ...rep(CHEST, 11), HEM],
    back: [...rep(STRAP, 2), ...rep(CHEST, 11), HEM],
    side: [...rep(SIDE_CHEST, 13), SIDE_HEM],
    legs: 'skirt',
  },
  // Пальто: рукав до кисти, пояс и полы ниже бёдер.
  coat: {
    front: [CUFF, ...rep(SLEEVE, 6), BELT, ...rep(CUFF, 5), HEM],
    back: [CUFF, ...rep(SLEEVE, 6), BELT, ...rep(CUFF, 5), HEM],
    side: [SIDE_CUFF, ...rep(SIDE_SLEEVE, 6), SIDE_BELT, ...rep(SIDE_CUFF, 5), SIDE_HEM],
    legs: 'trousers',
  },
};
