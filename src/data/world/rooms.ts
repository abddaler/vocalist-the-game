import { ACTIVITIES } from '../activities';
import type { DecorDef, IsoMapDef, RoomDef, RoomPointDef, TileKind, WorldRect } from '@core/types';

/**
 * Комнаты локаций (раздел 8). Точки взаимодействия делят дела локации по
 * местам: спать — у кровати, распеваться — у зеркала.
 *
 * Комната — та же изометрическая сетка, что и улица: пол из плиток, две
 * задние стены объёмами и дверь, врезанная в левую стену. Пол делится на
 * зоны: сцена, танцпол, ковёр — по ним помещение и узнаётся с порога.
 */
const ROOM_W = 20;
const ROOM_D = 14;
/** Высота стен комнаты на экране. */
const WALL_H = 68;
/** Порог у левой стены: дверь врезана в неё, а не стоит посреди пола. */
const EXIT: WorldRect = { x: 1, y: ROOM_D - 3, w: 1, h: 1 };

const lessonsOf = (level: string): string[] =>
  ACTIVITIES.filter((a) => a.id.startsWith('lesson_') && a.id.endsWith(level)).map((a) => a.id);

const point = (
  id: string,
  nameKey: string,
  rect: RoomPointDef['rect'],
  color: number,
  prop: RoomPointDef['prop'],
  activities: readonly string[],
  extra: Partial<RoomPointDef> = {},
): RoomPointDef => ({ id, nameKey, rect, color, prop, activities, venues: [], ...extra });

const decor = (kind: DecorDef['kind'], x: number, y: number, variant?: number): DecorDef => ({
  kind,
  x,
  y,
  ...(variant === undefined ? {} : { variant }),
});

/**
 * Предмет на стене: он лежит в её плоскости. Задняя стена идёт вдоль x,
 * боковая — вдоль y, и повешенный поперёк экран или афиша сразу читаются
 * наклейкой, а не частью комнаты.
 */
const onBackWall = (kind: DecorDef['kind'], x: number, variant?: number): DecorDef => ({
  ...decor(kind, x, 1.1, variant),
  facing: 'x',
});

const onSideWall = (kind: DecorDef['kind'], y: number, variant?: number): DecorDef => ({
  ...decor(kind, 1.1, y, variant),
  facing: 'y',
});

/** Прямоугольная зона другого покрытия внутри комнаты. */
interface Zone {
  readonly kind: TileKind;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly d: number;
}

const zone = (kind: TileKind, x: number, y: number, w: number, d: number): Zone => ({
  kind, x, y, w, d,
});

/**
 * Пол комнаты: основное покрытие и зоны поверх него. Зона — не украшение,
 * а разметка: по сцене, танцполу и ковру видно, для чего этот угол.
 */
function floorOf(base: TileKind, zones: readonly Zone[] = []): IsoMapDef {
  const legend: Record<string, { kind: TileKind; level: number }> = {
    '.': { kind: base, level: 0 },
  };
  const codes = ['1', '2', '3', '4'];
  zones.forEach((z, i) => {
    legend[codes[i]!] = { kind: z.kind, level: 0 };
  });

  const rows: string[] = [];
  for (let y = 0; y < ROOM_D; y += 1) {
    let row = '';
    for (let x = 0; x < ROOM_W; x += 1) {
      const hit = zones.findIndex((z) => x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.d);
      row += hit >= 0 ? codes[hit]! : '.';
    }
    rows.push(row);
  }
  return { legend, rows };
}

const room = (
  locationId: string,
  floor: number,
  tiles: IsoMapDef,
  points: readonly RoomPointDef[],
  decoration: readonly DecorDef[] = [],
): RoomDef => ({
  locationId,
  tiles,
  spawn: { x: 2.5, y: ROOM_D - 2.5 },
  floor,
  // Две задние стены: остальное — открытый край, за который не ходят.
  solids: [
    { x: 0, y: 0, w: ROOM_W, h: 1 },
    { x: 0, y: 1, w: 1, h: ROOM_D - 1 },
  ],
  points,
  decor: decoration,
  exit: EXIT,
});

export const ROOMS: readonly RoomDef[] = [
  // — Квартира: спальный угол, кухня у стены, гостиная на ковре —
  room('apartment', 0x2b3040, floorOf('wood', [zone('rug', 7, 7, 7, 5)]), [
    point('bed', 'point.bed', { x: 2, y: 2, w: 2, h: 3 }, 0x4a5570, 'bed', ['sleep']),
    point('mirror', 'point.mirror', { x: 7, y: 1.5, w: 1, h: 1 }, 0x6d7a94, 'mirror', ['warmup', 'vocal_rest']),
    point('kitchen', 'point.kitchen', { x: 14, y: 2, w: 2, h: 1 }, 0x5a4f3d, 'kitchen', ['tea_regimen']),
    point('sofa', 'point.sofa', { x: 8.5, y: 6.5, w: 2, h: 1 }, 0x4c4258, 'sofa', ['home_rest']),
  ], [
    onBackWall('window', 11.5),
    onBackWall('window', 17.5),
    onBackWall('poster', 5.5, 1),
    decor('shelf', 18.5, 3.5),
    decor('table', 11.5, 9.5),
    decor('stool', 13.5, 9.5),
    decor('planter', 18.5, 8.5),
    decor('planter', 2.5, 8.5),
    decor('bin', 2.2, 12.5),
    decor('bench', 16.5, 12.5),
  ]),

  // — Вокальная студия: три класса вдоль стены и зал ожидания —
  room('vocal_studio', 0x33293f, floorOf('marble', [zone('rug', 6, 8, 9, 4)]), [
    point('teacher_junior', 'point.teacherJunior', { x: 3, y: 2.5, w: 2, h: 1 }, 0x584a6b, 'piano', lessonsOf('junior')),
    point('teacher_mid', 'point.teacherMid', { x: 9, y: 2.5, w: 2, h: 1 }, 0x6b5a80, 'piano', lessonsOf('mid')),
    point('teacher_master', 'point.teacherMaster', { x: 15, y: 2.5, w: 2, h: 1 }, 0x8a6ea3, 'piano', lessonsOf('master')),
  ], [
    onBackWall('window', 6.5),
    onBackWall('window', 13.5),
    onSideWall('poster', 4.5, 0),
    decor('stool', 4.5, 4.5),
    decor('stool', 10.5, 4.5),
    decor('stool', 15.8, 4.5),
    decor('bench', 8.5, 9.5),
    decor('bench', 12.5, 9.5),
    decor('planter', 18.5, 6.5),
    decor('planter', 2.5, 6.5),
    decor('bin', 2.2, 12.5),
    decor('shelf', 18.5, 2.5),
  ]),

  // — Репбаза: сцена у стены, аппарат по бокам, ящики в углу —
  room('rehearsal_base', 0x25343a, floorOf('wood', [zone('stage', 4, 1, 12, 5)]), [
    point('mic_stand', 'point.micStand', { x: 7, y: 3, w: 1, h: 1 }, 0x557080, 'mic', ['practice_free']),
    point('band_corner', 'point.bandCorner', { x: 12, y: 2.5, w: 2, h: 2 }, 0x466070, 'drums', ['band_rehearsal']),
  ], [
    decor('speaker', 4.5, 2.5),
    decor('speaker', 15.5, 2.5),
    onBackWall('poster', 2.5, 2),
    onSideWall('poster', 3.5, 3),
    decor('crate', 2.6, 11.5, 0),
    decor('crate', 3.5, 10.8, 1),
    decor('crate', 18.5, 10.5, 0),
    decor('bench', 9.5, 11.5),
    decor('stool', 12.5, 11.5),
    decor('bin', 17.5, 12.5),
    decor('shelf', 18.5, 1.5),
  ]),

  // — Ресторан: сцена у стены, зал со столиками, бар у входа —
  room('restaurant', 0x3d2f24, floorOf('marble', [zone('stage', 7, 1, 7, 4), zone('carpet', 2, 6, 16, 6)]), [
    point('small_stage', 'point.smallStage', { x: 9, y: 2, w: 3, h: 2 }, 0x6b543c, 'stage', ['restaurant_shift']),
  ], [
    decor('counter', 3.5, 3.5),
    decor('stool', 3.4, 4.8),
    decor('table', 6.5, 7.5),
    decor('stool', 5.5, 8.2),
    decor('table', 13.5, 7.5),
    decor('stool', 14.5, 8.2),
    decor('table', 9.5, 10.5),
    decor('planter', 17.5, 2.5),
    decor('planter', 17.5, 9.5),
    onBackWall('window', 16.5),
    onSideWall('poster', 6.5, 3),
    decor('speaker', 6.5, 1.8),
    decor('speaker', 13.5, 1.8),
  ]),

  // — Клуб: сцена, танцпол, бар со стульями, диваны по краям —
  room('club_vertigo', 0x35223d, floorOf('dance', [zone('stage', 11, 1, 7, 4), zone('wood', 1, 1, 7, 5)]), [
    point('bar_counter', 'point.barCounter', { x: 2, y: 8.5, w: 3, h: 1 }, 0x5c3a68, 'bar', ['networking']),
    point('open_mic', 'point.openMic', { x: 3.5, y: 2.5, w: 2, h: 2 }, 0x74468a, 'stage', [], { venues: ['bar_stage'] }),
    point('main_stage', 'point.mainStage', { x: 13, y: 2, w: 3, h: 2 }, 0x9a4fb8, 'stage', [], { venues: ['club_stage'] }),
  ], [
    onBackWall('screen', 9.5, 0),
    onBackWall('screen', 17.5, 2),
    decor('speaker', 11.5, 1.8),
    decor('speaker', 17.5, 1.8),
    decor('stool', 2.5, 9.8),
    decor('stool', 4.1, 9.8),
    decor('stool', 6.8, 9.8),
    decor('seat', 10.5, 6.5, 0),
    decor('seat', 16.5, 6.5, 2),
    decor('seat', 10.5, 11.5, 1),
    decor('seat', 16.5, 11.5, 3),
    decor('table', 13.5, 8.5),
    decor('bin', 18.5, 12.5),
    onSideWall('poster', 4.5, 1),
  ]),

  // — Студия звукозаписи: кабина за стеклом, пульт напротив, стойки —
  room('record_studio', 0x243440, floorOf('wood', [zone('rug', 8, 6, 8, 5)]), [
    point('booth', 'point.booth', { x: 4, y: 2, w: 3, h: 3 }, 0x3f5f78, 'booth', ['record_single']),
    point('console', 'point.console', { x: 12, y: 3, w: 2, h: 1 }, 0x50708a, 'console', []),
  ], [
    decor('speaker', 11.5, 1.8),
    decor('speaker', 15.5, 1.8),
    decor('shelf', 18.5, 2.5),
    decor('stool', 13.5, 5.5),
    decor('crate', 2.6, 11.5, 1),
    decor('crate', 3.5, 10.8, 0),
    decor('bench', 11.5, 9.5),
    decor('planter', 18.5, 7.5),
    decor('bin', 17.5, 12.5),
    onBackWall('poster', 8.5, 2),
  ]),

  // — Магазин одежды: вешалки, примерочная, касса у входа —
  room('clothes_shop', 0x3d3524, floorOf('marble', [zone('carpet', 6, 6, 9, 5)]), [
    point('rack', 'point.rack', { x: 4, y: 2.5, w: 3, h: 1 }, 0x7a6a45, 'rack', ['shopping']),
    point('fitting_room', 'point.fittingRoom', { x: 13, y: 2, w: 2, h: 1 }, 0x8a7a55, 'curtain', [], {
      opensShop: true,
    }),
  ], [
    decor('counter', 3.5, 8.5),
    decor('stool', 3.5, 10),
    decor('shelf', 9.5, 1.2),
    decor('shelf', 18.5, 2.5),
    decor('shelf', 18.5, 5.5),
    onBackWall('window', 16.5),
    decor('bench', 12.5, 9.5),
    decor('planter', 17.5, 9.5),
    decor('planter', 2.2, 5.5),
    decor('bin', 18.5, 12.5),
  ]),

  // — Кабинет фониатра: два кресла, зона ожидания у входа —
  room('phoniatrist', 0x27392f, floorOf('marble', [zone('rug', 3, 8, 6, 4)]), [
    point('exam_chair', 'point.examChair', { x: 5, y: 2.5, w: 1, h: 1 }, 0x477a5c, 'chair', ['doctor_visit']),
    point('prevention', 'point.prevention', { x: 13, y: 2.5, w: 1, h: 1 }, 0x3f6b52, 'chair', ['checkup']),
  ], [
    onBackWall('window', 9.5),
    decor('shelf', 17.5, 1.5),
    decor('shelf', 18.5, 4.5),
    decor('bench', 4.5, 9.5),
    decor('bench', 7.5, 9.5),
    decor('planter', 18.5, 8.5),
    decor('planter', 2.2, 6.5),
    decor('stool', 6.5, 4.5),
    decor('stool', 14.5, 4.5),
    decor('bin', 18.5, 12.5),
    onBackWall('poster', 12.5, 1),
  ]),

  // — Спортзал: дорожка, стойка с гантелями, зеркальная стена —
  room('gym', 0x3a2828, floorOf('wood', [zone('rug', 9, 6, 8, 5)]), [
    point('treadmill', 'point.treadmill', { x: 6, y: 2, w: 1, h: 2 }, 0x7a4a4a, 'treadmill', ['gym']),
  ], [
    decor('weights', 12.5, 3.5),
    decor('weights', 16.5, 3.5),
    onBackWall('window', 9.5),
    onBackWall('poster', 3.5, 3),
    onSideWall('poster', 5.5, 0),
    decor('bench', 4.5, 8.5),
    decor('bench', 7.5, 8.5),
    decor('bench', 12.5, 11.5),
    decor('planter', 18.5, 9.5),
    decor('bin', 2.2, 12.5),
    decor('speaker', 18.5, 1.8),
  ]),
];

/** Высота стен комнаты: нужна сцене, чтобы построить объёмы. */
export const ROOM_WALL_H = WALL_H;

const BY_LOCATION = new Map(ROOMS.map((r) => [r.locationId, r]));

export function getRoom(locationId: string): RoomDef {
  const found = BY_LOCATION.get(locationId);
  if (!found) throw new Error(`Нет комнаты для локации "${locationId}"`);
  return found;
}

export function hasRoom(locationId: string): boolean {
  return BY_LOCATION.has(locationId);
}
