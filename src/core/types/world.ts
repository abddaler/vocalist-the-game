import type { TileDef } from './iso';

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

/**
 * Чем занят дом. От этого зависит, как он нарисован: у клуба маркиза с
 * лампами и канат у входа, у склада роль-ставня и гофрированная стена, у
 * виллы черепица и арки. Одинаковые коробки с разными вывесками городом
 * не выглядят — по фасаду должно быть понятно, куда ты идёшь.
 */
export type BuildingKind =
  | 'apartment'
  | 'club'
  | 'restaurant'
  | 'shop'
  | 'studio'
  | 'record'
  | 'gym'
  | 'clinic'
  | 'office'
  | 'hotel'
  | 'diner'
  | 'cinema'
  | 'theatre'
  | 'villa'
  | 'warehouse'
  | 'market'
  | 'bar'
  | 'shack';

/**
 * Дом на экране района: объём на сетке. rect — основание в плитках,
 * tall — высота в пикселях экрана, door — плитка порога, с которой
 * входят внутрь.
 */
export interface BuildingDef {
  readonly locationId: string;
  readonly kind: BuildingKind;
  readonly rect: WorldRect;
  readonly tall: number;
  readonly color: number;
  readonly door: WorldRect;
}

/**
 * Дом, в который не войти. Город из одних только рабочих дверей выглядит
 * декорацией на девять комнат; заполнение улицы чужими домами — самый
 * дешёвый способ показать, что мир больше игрока.
 */
export interface SceneryDef {
  readonly kind: BuildingKind;
  readonly rect: WorldRect;
  readonly tall: number;
  readonly color: number;
  /** Вывеска на фасаде. Без неё дом остаётся просто стеной. */
  readonly signKey?: string | undefined;
}

/**
 * Мелочь на улице. Рисуется параметрически по типу и месту: пальма у
 * пирса и пальма на бульваре — одна процедура с разной высотой.
 */
export type DecorKind =
  | 'palm'
  | 'lamp'
  | 'bench'
  | 'car'
  | 'billboard'
  | 'hydrant'
  | 'planter'
  | 'bin'
  | 'busStop'
  | 'crate'
  | 'bollard'
  | 'newsbox'
  | 'parasol'
  | 'gull'
  | 'rug'
  | 'poster'
  | 'shelf'
  | 'tree'
  | 'bush'
  | 'flowerbed'
  | 'lifeguard'
  | 'deckchair'
  | 'umbrella'
  | 'boat'
  | 'bike'
  | 'trafficLight'
  | 'mailbox'
  | 'dog'
  | 'surfboard'
  | 'towel'
  | 'stall'
  | 'kiosk'
  | 'hut'
  | 'seat'
  | 'screen'
  | 'table';

export interface DecorDef {
  readonly kind: DecorKind;
  /** Точка опоры: низ предмета, как у персонажа. */
  readonly x: number;
  readonly y: number;
  /** Вариация: высота пальмы, цвет машины, поворот вывески. */
  readonly variant?: number | undefined;
}

/**
 * Районы города. Идентификатор заодно задаёт характер: небо, мостовую и
 * набор мелочей рисуют по нему же — второго «холмистого» района, который
 * выглядел бы иначе, в срезе нет.
 */
export type DistrictId = 'hills' | 'downtown' | 'boulevard' | 'pier';

/** Переход в соседний район: створ в конце улицы. */
export interface GateDef {
  readonly to: DistrictId;
  readonly rect: WorldRect;
}

/**
 * Сетка плиток района: строки символов и легенда к ним. Пишется прямо в
 * исходнике картинкой, поэтому «пляж под улицей» видно глазами, а не
 * держится в уме списком прямоугольников.
 */
export interface IsoMapDef {
  readonly legend: Readonly<Record<string, TileDef>>;
  readonly rows: readonly string[];
}

/**
 * Район. Все координаты — в плитках сетки, а не в пикселях: изометрия
 * рисует одну и ту же плитку всегда одинаково, и данные не должны знать,
 * какого она размера на экране.
 */
export interface DistrictDef {
  readonly id: DistrictId;
  readonly nameKey: string;
  /** Земля района. */
  readonly tiles: IsoMapDef;
  /** Место на карте города, в её собственных координатах. */
  readonly map: WorldRect;
  readonly spawn: WorldPoint;
  readonly buildings: readonly BuildingDef[];
  readonly scenery: readonly SceneryDef[];
  readonly decor: readonly DecorDef[];
  readonly gates: readonly GateDef[];
  /** Площадки прямо на улице — переход и заказы. */
  readonly points: readonly RoomPointDef[];
}

/**
 * Что за предмет стоит в этой точке. Рисуется параметрически по размеру
 * прямоугольника, а не готовым спрайтом: точки разной величины, и одна
 * картинка на всех либо растянулась бы, либо не заполнила место.
 */
export type PropKind =
  | 'bed'
  | 'mirror'
  | 'kitchen'
  | 'sofa'
  | 'piano'
  | 'mic'
  | 'drums'
  | 'stage'
  | 'bar'
  | 'booth'
  | 'console'
  | 'rack'
  | 'curtain'
  | 'chair'
  | 'treadmill'
  | 'stairs'
  | 'board';

/** Точка взаимодействия: часть дел локации, привязанная к месту в комнате. */
export interface RoomPointDef {
  readonly id: string;
  readonly nameKey: string;
  readonly rect: WorldRect;
  readonly color: number;
  readonly prop: PropKind;
  readonly activities: readonly string[];
  readonly venues: readonly string[];
  /** Точка открывает гардероб, а не список дел (9.2). */
  readonly opensShop?: boolean | undefined;
}

export interface RoomDef {
  readonly locationId: string;
  /** Пол комнаты той же сеткой плиток, что и улица. */
  readonly tiles: IsoMapDef;
  readonly spawn: WorldPoint;
  readonly floor: number;
  /** Стены и мебель, через которые не пройти: прямоугольники в плитках. */
  readonly solids: readonly WorldRect[];
  readonly points: readonly RoomPointDef[];
  /** Обстановка, с которой нечего делать: растения, стулья, урны. */
  readonly decor: readonly DecorDef[];
  /** Выход обратно на улицу. */
  readonly exit: WorldRect;
}
