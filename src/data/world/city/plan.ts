import type { BuildingDef, DecorDef, GateDef, SceneryDef, WorldRect } from '@core/types';

/**
 * Общая разметка улицы. Все районы устроены одинаково: ряд домов сверху,
 * проезжая часть посередине, ряд домов снизу. Единый каркас держит
 * ходьбу предсказуемой — игрок не переучивается на каждом экране, — а
 * различаются районы небом, цветом и тем, чем улица заставлена.
 */
export const STREET = {
  /** Ровно по высоте игрового поля: район прокручивается только вбок. */
  height: 210,
  /**
   * Полоса неба над крышами. Без неё город был сплошной стеной и время
   * суток читалось только по свету в окнах; теперь его видно сразу.
   */
  skyH: 38,
  topRowY: 38,
  topRowH: 56,
  /** Тротуар и проезжая часть между рядами домов. */
  walkTop: 94,
  walkBottom: 150,
  bottomRowY: 150,
  bottomRowH: 58,
  doorW: 24,
  doorH: 16,
  /** Створ перехода в соседний район. */
  gateW: 12,
} as const;

const centered = (x: number, w: number): number => x + (w - STREET.doorW) / 2;

/** Дом верхнего ряда: дверь снизу, игрок подходит к ней с мостовой. */
export function upper(locationId: string, x: number, w: number, color: number): BuildingDef {
  return {
    locationId,
    color,
    rect: { x, y: STREET.topRowY, w, h: STREET.topRowH },
    door: {
      x: centered(x, w),
      y: STREET.topRowY + STREET.topRowH - STREET.doorH,
      w: STREET.doorW,
      h: STREET.doorH,
    },
  };
}

/** Дом нижнего ряда: дверь сверху. */
export function lower(locationId: string, x: number, w: number, color: number): BuildingDef {
  return {
    locationId,
    color,
    rect: { x, y: STREET.bottomRowY, w, h: STREET.bottomRowH },
    door: { x: centered(x, w), y: STREET.bottomRowY, w: STREET.doorW, h: STREET.doorH },
  };
}

/** Чужой дом верхнего ряда: внутрь не войти, но улица перестаёт зиять. */
export function fillUpper(x: number, w: number, color: number, signKey?: string): SceneryDef {
  return { rect: { x, y: STREET.topRowY, w, h: STREET.topRowH }, color, signKey };
}

export function fillLower(x: number, w: number, color: number, signKey?: string): SceneryDef {
  return { rect: { x, y: STREET.bottomRowY, w, h: STREET.bottomRowH }, color, signKey };
}

export const decor = (kind: DecorDef['kind'], x: number, y: number, variant?: number): DecorDef => ({
  kind,
  x,
  y,
  ...(variant === undefined ? {} : { variant }),
});

/** Створы по краям улицы: налево и направо от района. */
export function gateLeft(to: GateDef['to']): GateDef {
  return { to, rect: { x: 0, y: 104, w: STREET.gateW, h: 40 } };
}

export function gateRight(to: GateDef['to'], width: number): GateDef {
  return { to, rect: { x: width - STREET.gateW, y: 104, w: STREET.gateW, h: 40 } };
}

/**
 * Невидимые границы улицы: небо сверху и обрез снизу. Рисовать их нельзя
 * — небо тогда закрасится, — поэтому они и отделены от домов.
 */
export function curbs(width: number): readonly WorldRect[] {
  return [
    { x: 0, y: 0, w: width, h: STREET.topRowY },
    { x: 0, y: STREET.height - 2, w: width, h: 2 },
  ];
}
