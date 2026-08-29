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
    signKey: `sign.${locationId}`,
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

/**
 * Готовые наборы мелочи. Предметы на улице стоят группами, а не поштучно
 * вразброс: скамейка идёт с урной, лежак — с зонтом и полотенцем, фонари
 * — ровным рядом вдоль бордюра. Набор задаёт эту связь один раз, и на
 * карте её уже нельзя случайно нарушить.
 */
export const group = {
  /** Место отдыха: скамейка и урна рядом с ней. */
  rest(x: number, y: number): DecorDef[] {
    return [decor('bench', x, y), decor('bin', x + 1.4, y)];
  },

  /** Пляжное место: зонт, пара лежаков и полотенце под ними. */
  beach(x: number, y: number, variant: number): DecorDef[] {
    return [
      decor('umbrella', x, y, variant),
      decor('deckchair', x - 0.8, y + 0.7, variant),
      decor('deckchair', x + 0.8, y + 0.7, variant + 1),
      decor('towel', x, y + 1.6, variant),
    ];
  },

  /** Столик кафе: зонт со столом под ним и урна рядом. */
  cafe(x: number, y: number, variant: number): DecorDef[] {
    return [decor('parasol', x, y, variant), decor('bin', x + 1.6, y + 0.6)];
  },

  /** Ряд фонарей вдоль бордюра: ровный шаг, а не случайные точки. */
  lamps(from: number, to: number, step: number, y: number): DecorDef[] {
    const list: DecorDef[] = [];
    for (let x = from; x <= to; x += step) list.push(decor('lamp', x, y));
    return list;
  },

  /** Короткий ряд столбиков: они всегда стоят цепочкой, а не по одному. */
  bollards(from: number, count: number, step: number, y: number): DecorDef[] {
    const list: DecorDef[] = [];
    for (let i = 0; i < count; i += 1) list.push(decor('bollard', from + i * step, y));
    return list;
  },

  /**
   * Торговый ряд: лоток и ящик с товаром сбоку от прилавка. Ящик стоит
   * ближе к камере, а не позади: за лотком он прятался, а на одной с ним
   * линии — упирался в столб фонаря, стоявший в том же экранном столбце.
   */
  market(x: number, y: number, variant: number): DecorDef[] {
    return [decor('stall', x, y, variant), decor('crate', x + 0.5, y + 1.15, variant)];
  },
};
