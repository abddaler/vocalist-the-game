import { ROWS } from './kit';
import type { OutfitFrames } from './kit';

const { SLEEVE, CHEST, SHOULDER, HEM, TROUSERS, SIDE_TROUSERS, SIDE_SLEEVE, SIDE_CHEST, SIDE_HEM } =
  ROWS;

/** Повседневное: футболка, майка, худи, топ с юбкой, спортивный костюм. */
export const CASUAL: Readonly<Record<'tee' | 'tank' | 'hoodie' | 'crop' | 'track', OutfitFrames>> = {
  // Футболка: рукав до середины плеча, дальше голые предплечья.
  tee: {
    front: [SHOULDER, SLEEVE, SLEEVE, CHEST, CHEST, CHEST, HEM, ...TROUSERS],
    back: [SHOULDER, SLEEVE, SLEEVE, CHEST, CHEST, CHEST, HEM, ...TROUSERS],
    side: [SIDE_SLEEVE, SIDE_SLEEVE, SIDE_SLEEVE, SIDE_CHEST, SIDE_CHEST, SIDE_CHEST, SIDE_HEM, ...SIDE_TROUSERS],
  },
  // Майка: плечи открыты целиком.
  tank: {
    front: [CHEST, CHEST, CHEST, CHEST, CHEST, CHEST, HEM, ...TROUSERS],
    back: [CHEST, CHEST, CHEST, CHEST, CHEST, CHEST, HEM, ...TROUSERS],
    side: [SIDE_CHEST, SIDE_CHEST, SIDE_CHEST, SIDE_CHEST, SIDE_CHEST, SIDE_CHEST, SIDE_HEM, ...SIDE_TROUSERS],
  },
  // Худи: капюшон за шеей, карман-кенгуру, шнурки.
  hoodie: {
    front: [
      SLEEVE,
      '16668BB8866661',
      SLEEVE,
      SLEEVE,
      '16668888866661',
      '....888866....',
      HEM,
      ...TROUSERS,
    ],
    back: [SLEEVE, SLEEVE, '.166766667661.', SLEEVE, SLEEVE, CHEST, HEM, ...TROUSERS],
    side: [
      '..1666666661..',
      '..1668BB8661..',
      '..1666666661..',
      '..1666666661..',
      '..1666888661..',
      '...16688861...',
      SIDE_HEM,
      ...SIDE_TROUSERS,
    ],
  },
  // Топ и юбка: открытые плечи и полоса живота между ними.
  crop: {
    front: [
      CHEST,
      CHEST,
      CHEST,
      '...77777777...',
      '..............',
      '..1999999991..',
      '.199999999991.',
      '.199999999991.',
      '.177777777771.',
      '..12211..1221.',
    ],
    back: [
      CHEST,
      CHEST,
      CHEST,
      '...77777777...',
      '..............',
      '..1999999991..',
      '.199999999991.',
      '.199999999991.',
      '.177777777771.',
      '..12211..1221.',
    ],
    side: [
      SIDE_CHEST,
      SIDE_CHEST,
      SIDE_CHEST,
      '...17777771...',
      '..............',
      '...19999991...',
      '..1999999991..',
      '..1999999991..',
      '...17777771...',
      '....122221....',
    ],
  },
  // Спортивный костюм: лампасы по рукаву и по штанине.
  track: {
    front: [
      SHOULDER,
      '18666666666681',
      '18666666666681',
      '18666666666681',
      '18666666666681',
      CHEST,
      HEM,
      '..1998119891..',
      '..1998119891..',
      '..1998119891..',
      '..1999119991..',
    ],
    back: [
      SHOULDER,
      '18666666666681',
      '18666666666681',
      '18666666666681',
      '18666666666681',
      CHEST,
      HEM,
      '..1998119891..',
      '..1998119891..',
      '..1998119891..',
      '..1999119991..',
    ],
    side: [
      SIDE_SLEEVE,
      '..1866666681..',
      '..1866666681..',
      '..1866666681..',
      '..1866666681..',
      SIDE_CHEST,
      SIDE_HEM,
      '....198891....',
      '....198891....',
      '....198891....',
      '....199991....',
    ],
  },
};
