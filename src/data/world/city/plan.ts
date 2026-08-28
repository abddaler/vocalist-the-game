import type { BuildingDef, DecorDef, GateDef, SceneryDef, WorldRect } from '@core/types';

/**
 * Разметка улицы. Камера стоит близко (мир рисуется вдвое крупнее
 * экранных пикселей), поэтому в кадр помещается 240 на 105 единиц мира —
 * два-три дома и человек ростом в треть здания. Дальше отходить нельзя:
 * весь смысл этого вида в том, что видно лица и витрины.
 *
 * Ряд домов один. Второй ряд при такой крупности пришлось бы обрезать
 * по нижнему краю, и улица превратилась бы в щель между стенами.
 */
export const STREET = {
  /** Ровно во весь кадр: район прокручивается только вбок. */
  height: 105,
  /** Полоса неба над крышами: по ней читается время суток. */
  skyH: 24,
  rowY: 24,
  rowH: 42,
  /** Тротуар, по которому ходят. */
  walkTop: 66,
  walkBottom: 100,
  doorW: 18,
  doorH: 14,
  /** Створ перехода в соседний район. */
  gateW: 10,
} as const;

const centered = (x: number, w: number): number => x + Math.round((w - STREET.doorW) / 2);

/** Дом с дверью на тротуар. */
export function house(locationId: string, x: number, w: number, color: number): BuildingDef {
  return {
    locationId,
    color,
    rect: { x, y: STREET.rowY, w, h: STREET.rowH },
    door: {
      x: centered(x, w),
      y: STREET.rowY + STREET.rowH - STREET.doorH,
      w: STREET.doorW,
      h: STREET.doorH,
    },
  };
}

/** Чужой дом: внутрь не войти, но улица перестаёт зиять. */
export function fill(x: number, w: number, color: number, signKey?: string): SceneryDef {
  return { rect: { x, y: STREET.rowY, w, h: STREET.rowH }, color, signKey };
}

export const decor = (kind: DecorDef['kind'], x: number, y: number, variant?: number): DecorDef => ({
  kind,
  x,
  y,
  ...(variant === undefined ? {} : { variant }),
});

/** Створы по краям улицы: налево и направо от района. */
export function gateLeft(to: GateDef['to']): GateDef {
  return { to, rect: { x: 0, y: 70, w: STREET.gateW, h: 26 } };
}

export function gateRight(to: GateDef['to'], width: number): GateDef {
  return { to, rect: { x: width - STREET.gateW, y: 70, w: STREET.gateW, h: 26 } };
}

/**
 * Невидимые границы улицы: небо сверху и обрез снизу. Рисовать их нельзя
 * — небо тогда закрасится, — поэтому они и отделены от домов.
 */
export function curbs(width: number): readonly WorldRect[] {
  return [
    { x: 0, y: 0, w: width, h: STREET.rowY },
    { x: 0, y: STREET.walkBottom, w: width, h: STREET.height - STREET.walkBottom },
  ];
}
