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
    front: [CUFF, ...rep(LAPEL, 2), ...rep(SHIRT, 3), ...rep(SLEEVE, 3), ...rep(CUFF, 8), HEM],
    back: [CUFF, ...rep(SLEEVE, 8), ...rep(CUFF, 8), HEM],
    side: [SIDE_CUFF, ...rep(SIDE_LAPEL, 3), ...rep(SIDE_SLEEVE, 5), ...rep(SIDE_CUFF, 8), SIDE_HEM],
    legs: 'trousers',
  },
  // Костюм: тот же пиджак, но с галстуком — по нему его и узнают.
  suit: {
    front: [CUFF, ...rep(LAPEL, 2), SHIRT, ...rep(TIE, 3), ...rep(SLEEVE, 2), ...rep(CUFF, 8), HEM],
    back: [CUFF, ...rep(SLEEVE, 8), ...rep(CUFF, 8), HEM],
    side: [SIDE_CUFF, ...rep(SIDE_LAPEL, 3), ...rep(SIDE_SLEEVE, 5), ...rep(SIDE_CUFF, 8), SIDE_HEM],
    legs: 'trousers',
  },
  // Платье: открытые плечи, лиф и юбка ниже пояса.
  dress: {
    front: [...rep(STRAP, 2), ...rep(CHEST, 15), HEM],
    back: [...rep(STRAP, 2), ...rep(CHEST, 15), HEM],
    side: [...rep(SIDE_CHEST, 17), SIDE_HEM],
    legs: 'skirt',
  },
  // Пальто: рукав до кисти, пояс и полы ниже бёдер.
  coat: {
    front: [CUFF, ...rep(SLEEVE, 8), BELT, ...rep(CUFF, 7), HEM],
    back: [CUFF, ...rep(SLEEVE, 8), BELT, ...rep(CUFF, 7), HEM],
    side: [SIDE_CUFF, ...rep(SIDE_SLEEVE, 8), SIDE_BELT, ...rep(SIDE_CUFF, 7), SIDE_HEM],
    legs: 'trousers',
  },
};
