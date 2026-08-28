/**
 * Геометрия мира (раздел 8). Мир — это презентация: на симуляцию он не
 * влияет, время на ходьбу не тратится (раздел 4). Типы лежат в core/types
 * рядом с остальными, чтобы данные и рендер сходились на одном описании.
 */
export interface WorldRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface WorldPoint {
  readonly x: number;
  readonly y: number;
}

/** Дом на экране района. Вход — через дверь, не через меню. */
export interface BuildingDef {
  readonly locationId: string;
  readonly rect: WorldRect;
  /** Заглушка вехи 5; на вехе 7 её сменит тайлсет. */
  readonly color: number;
  readonly door: WorldRect;
}

export interface DistrictDef {
  readonly width: number;
  readonly height: number;
  readonly spawn: WorldPoint;
  readonly buildings: readonly BuildingDef[];
  /** Непроходимые куски улицы: бордюры, ограды. */
  readonly solids: readonly WorldRect[];
  /** Площадки прямо на улице — переход и заказы. */
  readonly points: readonly RoomPointDef[];
}

/** Точка взаимодействия: часть дел локации, привязанная к месту в комнате. */
export interface RoomPointDef {
  readonly id: string;
  readonly nameKey: string;
  readonly rect: WorldRect;
  readonly color: number;
  readonly activities: readonly string[];
  readonly venues: readonly string[];
  /** Точка открывает гардероб, а не список дел (9.2). */
  readonly opensShop?: boolean | undefined;
}

export interface RoomDef {
  readonly locationId: string;
  readonly width: number;
  readonly height: number;
  readonly spawn: WorldPoint;
  readonly floor: number;
  readonly solids: readonly WorldRect[];
  readonly points: readonly RoomPointDef[];
  /** Выход обратно на улицу. */
  readonly exit: WorldRect;
}
