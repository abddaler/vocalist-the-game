import type {
  BuildingDef,
  BuildingKind,
  DecorDef,
  GateDef,
  SceneryDef,
  SurfaceKind,
  TerrainDef,
  WorldRect,
} from '@core/types';

/**
 * Разметка района. Камера стоит близко (мир рисуется вдвое крупнее
 * экранных пикселей), поэтому в кадр помещается 240 на 105 единиц мира —
 * два-три дома и человек ростом в треть здания.
 *
 * Район выше кадра: по нему ходят не только вбок, но и от домов вглубь,
 * к воде или к площади. Ради этого земля и собирается из плит: тротуар,
 * мостовая, настил, песок — и разрывы между ними, через которые ведут
 * только лестницы.
 */
export const STREET = {
  /** Полоса неба над крышами: по ней читается время суток. */
  skyH: 24,
  rowY: 24,
  rowH: 42,
  /** Низ фасадов: отсюда начинается земля. */
  frontY: 66,
  doorW: 18,
  doorH: 14,
  /** Створ перехода в соседний район. */
  gateW: 10,
} as const;

const centered = (x: number, w: number): number => x + Math.round((w - STREET.doorW) / 2);

/** Дом с дверью на тротуар. */
export function house(
  locationId: string,
  kind: BuildingKind,
  x: number,
  w: number,
  color: number,
): BuildingDef {
  return {
    locationId,
    kind,
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
export function fill(
  kind: BuildingKind,
  x: number,
  w: number,
  color: number,
  signKey?: string,
): SceneryDef {
  return { kind, rect: { x, y: STREET.rowY, w, h: STREET.rowH }, color, signKey };
}

export const decor = (kind: DecorDef['kind'], x: number, y: number, variant?: number): DecorDef => ({
  kind,
  x,
  y,
  ...(variant === undefined ? {} : { variant }),
});

/**
 * Плита земли во всю ширину района: полосы вдоль улицы и есть основной
 * рельеф. `riser` — высота обрыва по нижней кромке; сразу под ним земли
 * нет, и следующая плита начинается ниже на эту же величину.
 */
export function band(
  surface: SurfaceKind,
  y: number,
  h: number,
  width: number,
  riser?: number,
): TerrainDef {
  return { rect: { x: 0, y, w: width, h }, surface, ...(riser === undefined ? {} : { riser }) };
}

/** Кусок другого покрытия поверх полосы: дорожка у входа, островок травы. */
export function patch(
  surface: SurfaceKind,
  x: number,
  y: number,
  w: number,
  h: number,
): TerrainDef {
  return { rect: { x, y, w, h }, surface };
}

/** Лестница через обрыв: перекрывает разрыв между плитами. */
export function stairs(x: number, y: number, w: number, h: number): TerrainDef {
  return { rect: { x, y, w, h }, surface: 'steps' };
}

/** Створы по краям улицы: налево и направо от района. */
export function gateLeft(to: GateDef['to'], y: number): GateDef {
  return { to, rect: { x: 0, y, w: STREET.gateW, h: 22 } };
}

export function gateRight(to: GateDef['to'], width: number, y: number): GateDef {
  return { to, rect: { x: width - STREET.gateW, y, w: STREET.gateW, h: 22 } };
}

/**
 * Небо над крышами: сквозь него не ходят, а нарисовать его домом нельзя —
 * закрасится закат. Низ района держат сами плиты: где земли нет, там и
 * ходьбы нет.
 */
export function curbs(width: number): readonly WorldRect[] {
  return [{ x: 0, y: 0, w: width, h: STREET.rowY }];
}
