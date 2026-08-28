import { CASUAL } from './casual';
import { FORMAL } from './formal';
import type { OutfitFrames, OutfitStyle } from './kit';

export { OUTFIT_TOP } from './kit';
export type { OutfitStyle } from './kit';

/**
 * Гардероб. Рисунки разведены по двум файлам — повседневное и выходное, —
 * а полный набор собирается здесь, чтобы забытый вид одежды не собрался.
 */
export const OUTFIT: Readonly<Record<OutfitStyle, OutfitFrames>> = { ...CASUAL, ...FORMAL };
