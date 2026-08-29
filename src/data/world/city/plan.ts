import type {
  BuildingDef,
  BuildingKind,
  DecorDef,
  GateDef,
  SceneryDef,
} from '@core/types';

/**
 * Разметка района на изометрической сетке. Все координаты — в плитках:
 * плитка всегда рисуется одинаково, и данные не должны знать, сколько в
 * ней экранных пикселей.
 *
 * Дома стоят двумя рядами в глубину у дальнего края и открываются
 * дверью на третий ряд — тот, по которому уже ходят.
 */
export const STREET = {
  /** Ряд, с которого начинается дом. */
  rowY: 0,
  /** Глубина дома в плитках. */
  rowD: 2,
  /** Ряд перед домами: сюда выходят двери. */
  frontY: 2,
  /** Ширина створа в плитках. */
  gateW: 1,
} as const;

/** Дом с дверью на тротуар. */
export function house(
  locationId: string,
  kind: BuildingKind,
  x: number,
  w: number,
  tall: number,
  color: number,
): BuildingDef {
  return {
    locationId,
    kind,
    color,
    tall,
    rect: { x, y: STREET.rowY, w, h: STREET.rowD },
    door: { x: x + Math.floor(w / 2), y: STREET.frontY, w: 1, h: 1 },
  };
}

/** Чужой дом: внутрь не войти, но улица перестаёт зиять. */
export function fill(
  kind: BuildingKind,
  x: number,
  w: number,
  tall: number,
  color: number,
  signKey?: string,
): SceneryDef {
  return { kind, rect: { x, y: STREET.rowY, w, h: STREET.rowD }, tall, color, signKey };
}

export const decor = (kind: DecorDef['kind'], x: number, y: number, variant?: number): DecorDef => ({
  kind,
  x,
  y,
  ...(variant === undefined ? {} : { variant }),
});

/** Створы по краям улицы: налево и направо от района. */
export function gateLeft(to: GateDef['to'], y: number): GateDef {
  return { to, rect: { x: 0, y, w: STREET.gateW, h: 2 } };
}

export function gateRight(to: GateDef['to'], width: number, y: number): GateDef {
  return { to, rect: { x: width - STREET.gateW, y, w: STREET.gateW, h: 2 } };
}
