import type { DecorKind } from '@core/types';
import { CANOPY_BASE, CANOPY_TOP } from './canopy';
import { INDOOR_PROPS } from './indoor';
import { STREET_PROPS } from './street';
import type { Draw } from './prop';

/**
 * Каталог объёмной мелочи. Остальное — пальмы, фонари, вывески — рисуется
 * щитом: у тонкого столба нет грани, которую камера показала бы боком.
 */
export const ISO_PROPS: Partial<Record<DecorKind, Draw>> = {
  ...STREET_PROPS,
  ...INDOOR_PROPS,
  ...CANOPY_BASE,
};

/**
 * Верхняя половина навесов и крыш. Рисуется отдельным проходом после
 * всех людей: прохожий, оказавшийся ближе к камере, иначе встаёт поверх
 * крыши и выглядит забравшимся на неё.
 */
export const ISO_OVERHEAD: Partial<Record<DecorKind, Draw>> = { ...CANOPY_TOP };
