import type { DecorDef, DecorKind } from '@core/types';
import type { Painter } from '@ui/widgets/Painter';
import type { Ambience } from '../ambience';
import { drawShadow } from '../backdrop';
import { drawDecor, shadowWidth } from '../decor';
import type { ScreenPoint } from './project';
import { CANOPY_BASE, CANOPY_TOP } from './canopy';
import { INDOOR_PROPS } from './indoor';
import { ROADSIDE_PROPS } from './roadside';
import { STREET_PROPS } from './street';
import type { Draw } from './prop';

/**
 * Каталог объёмной мелочи. Остальное — пальмы, фонари, вывески — рисуется
 * щитом: у тонкого столба нет грани, которую камера показала бы боком.
 */
export const ISO_PROPS: Partial<Record<DecorKind, Draw>> = {
  ...STREET_PROPS,
  ...ROADSIDE_PROPS,
  ...INDOOR_PROPS,
  ...CANOPY_BASE,
};

/**
 * Верхняя половина навесов и крыш. Рисуется отдельным проходом после
 * всех людей: прохожий, оказавшийся ближе к камере, иначе встаёт поверх
 * крыши и выглядит забравшимся на неё.
 */
export const ISO_OVERHEAD: Partial<Record<DecorKind, Draw>> = { ...CANOPY_TOP };

/** Во сколько раз щитовая мелочь крупнее собственных пикселей. */
export const DECOR_UNIT = 2;

/**
 * Имя предмета в атласе. Одинаковые предметы делят клетку, поэтому в
 * имени только то, от чего зависит рисунок: вид, вариация, ось и то,
 * верхняя это половина навеса или нижняя.
 */
export function propId(item: DecorDef, over = false): string {
  return `${item.kind}|${item.variant ?? 0}|${item.facing ?? 'x'}|${over ? 't' : 'b'}`;
}

/**
 * Рисует предмет по имени с опорой в точке. Одним и тем же кодом он
 * ложится и в клетку атласа, и прямо в кадр, если в атлас не поместился.
 */
export function paintProp(
  painter: Painter,
  ambience: Ambience,
  id: string,
  at: ScreenPoint,
): void {
  const [kind, variant, facing, half] = id.split('|') as [DecorKind, string, 'x' | 'y', string];
  const table = half === 't' ? ISO_OVERHEAD : ISO_PROPS;
  const volume = table[kind];
  if (volume) {
    volume({ painter, ambience, at, variant: Number(variant), facing });
    return;
  }
  if (half === 't') return;
  // У щитов своя тень полоской под ногами: она печётся вместе с ними.
  const width = shadowWidth(kind) * DECOR_UNIT;
  if (width > 0) drawShadow(painter, at.x, at.y, width, ambience);
  drawDecor(
    painter,
    { kind, x: 0, y: 0, variant: Number(variant) },
    at.x,
    at.y,
    ambience,
    DECOR_UNIT,
  );
}
