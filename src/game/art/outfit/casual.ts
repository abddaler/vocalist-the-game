import { ROWS } from './kit';
import type { OutfitFrames } from './kit';

const {
  SLEEVE, CUFF, CHEST, STRAP, HEM,
  SIDE_SLEEVE, SIDE_CUFF, SIDE_CHEST, SIDE_HEM,
  HOOD, DRAW, POCKET, STRIPE, SIDE_STRIPE,
} = ROWS;

/** Повторение ряда: торс — четырнадцать рядов, и считать их руками незачем. */
const rep = (row: string, times: number): string[] => Array.from({ length: times }, () => row);
/** Голая полоса: топ короче торса, и ниже него одежды нет. */
const SKIN = '.'.repeat(28);

/** Повседневное: футболка, майка, худи, топ с юбкой, спортивный костюм. */
export const CASUAL: Readonly<Record<'tee' | 'tank' | 'hoodie' | 'crop' | 'track', OutfitFrames>> = {
  // Футболка: рукав до середины плеча, дальше голые предплечья.
  tee: {
    front: [CUFF, ...rep(SLEEVE, 3), ...rep(CHEST, 9), HEM],
    back: [CUFF, ...rep(SLEEVE, 3), ...rep(CHEST, 9), HEM],
    side: [SIDE_CUFF, ...rep(SIDE_SLEEVE, 3), ...rep(SIDE_CHEST, 9), SIDE_HEM],
    legs: 'trousers',
  },
  // Майка: плечи открыты целиком, остаются только лямки.
  tank: {
    front: [...rep(STRAP, 2), ...rep(CHEST, 11), HEM],
    back: [...rep(STRAP, 2), ...rep(CHEST, 11), HEM],
    side: [...rep(SIDE_CHEST, 13), SIDE_HEM],
    legs: 'trousers',
  },
  // Худи: капюшон за шеей, шнурки и карман-кенгуру.
  hoodie: {
    front: [HOOD, DRAW, ...rep(SLEEVE, 4), ...rep(CUFF, 2), ...rep(POCKET, 5), HEM],
    back: [HOOD, ...rep(SLEEVE, 5), ...rep(CUFF, 7), HEM],
    side: [SIDE_CUFF, ...rep(SIDE_SLEEVE, 6), ...rep(SIDE_CUFF, 6), SIDE_HEM],
    legs: 'trousers',
  },
  // Топ и юбка: открытые плечи и полоса живота между ними.
  crop: {
    front: [...rep(STRAP, 2), ...rep(CHEST, 5), HEM, ...rep(SKIN, 5)],
    back: [...rep(STRAP, 2), ...rep(CHEST, 5), HEM, ...rep(SKIN, 5)],
    side: [...rep(SIDE_CHEST, 7), SIDE_HEM, ...rep(SKIN, 6)],
    legs: 'skirt',
  },
  // Спортивный костюм: лампасы по рукавам и штанинам.
  track: {
    front: [CUFF, ...rep(STRIPE, 6), ...rep(CUFF, 6), HEM],
    back: [CUFF, ...rep(SLEEVE, 6), ...rep(CUFF, 6), HEM],
    side: [SIDE_CUFF, ...rep(SIDE_STRIPE, 6), ...rep(SIDE_CUFF, 6), SIDE_HEM],
    legs: 'trousers',
  },
};
