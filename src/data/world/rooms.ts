import { ACTIVITIES } from '../activities';
import type { DecorDef, IsoMapDef, RoomDef, RoomPointDef, TileKind } from '@core/types';

/**
 * Комнаты локаций (раздел 8). Точки взаимодействия делят дела локации по
 * местам: спать — у кровати, распеваться — у зеркала.
 *
 * Комната — та же изометрическая сетка, что и улица: пол из плиток, две
 * задние стены объёмами и выход у ближнего края. Дальний угол сетки —
 * самый дальний от камеры, поэтому стены и стоят по рядам x = 0 и y = 0.
 */
const ROOM_W = 20;
const ROOM_D = 14;
/** Высота стен комнаты на экране. */
const WALL_H = 52;
const EXIT = { x: Math.floor(ROOM_W / 2), y: ROOM_D - 1, w: 1, h: 1 };

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

/** Пол комнаты: одно покрытие на всю сетку плюс ковёр в середине. */
function floorOf(kind: TileKind, rug: TileKind = 'rug'): IsoMapDef {
  const rows: string[] = [];
  for (let y = 0; y < ROOM_D; y += 1) {
    let row = '';
    for (let x = 0; x < ROOM_W; x += 1) {
      const inRug = x >= 8 && x <= 12 && y >= 7 && y <= 10;
      row += inRug ? '*' : '.';
    }
    rows.push(row);
  }
  return { legend: { '.': { kind, level: 0 }, '*': { kind: rug, level: 0 } }, rows };
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
  spawn: { x: ROOM_W / 2, y: ROOM_D - 1.5 },
  floor,
  // Две задние стены: остальное — открытый край, за который просто не ходят.
  solids: [
    { x: 0, y: 0, w: ROOM_W, h: 1 },
    { x: 0, y: 1, w: 1, h: ROOM_D - 1 },
  ],
  points,
  decor: decoration,
  exit: EXIT,
});

export const ROOMS: readonly RoomDef[] = [
  room('apartment', 0x2b3040, floorOf('wood'), [
    point('bed', 'point.bed', { x: 2, y: 2, w: 2, h: 2 }, 0x4a5570, 'bed', ['sleep']),
    point('mirror', 'point.mirror', { x: 8, y: 1.5, w: 1, h: 1 }, 0x6d7a94, 'mirror', ['warmup', 'vocal_rest']),
    point('kitchen', 'point.kitchen', { x: 14, y: 2, w: 2, h: 1 }, 0x5a4f3d, 'kitchen', ['tea_regimen']),
    point('sofa', 'point.sofa', { x: 4, y: 8, w: 2, h: 1 }, 0x4c4258, 'sofa', ['home_rest']),
  ], [
    decor('planter', 18.5, 3.5),
    decor('bin', 1.5, 12.5),
    decor('bench', 15.5, 11.5),
    decor('poster', 5.5, 1.2, 1),
    decor('shelf', 17.5, 1.2),
    decor('table', 11.5, 8.5),
    decor('planter', 2.5, 12.5),
  ]),

  room('vocal_studio', 0x33293f, floorOf('marble'), [
    point('teacher_junior', 'point.teacherJunior', { x: 3, y: 2.5, w: 2, h: 1 }, 0x584a6b, 'piano', lessonsOf('junior')),
    point('teacher_mid', 'point.teacherMid', { x: 9, y: 2.5, w: 2, h: 1 }, 0x6b5a80, 'piano', lessonsOf('mid')),
    point('teacher_master', 'point.teacherMaster', { x: 15, y: 2.5, w: 2, h: 1 }, 0x8a6ea3, 'piano', lessonsOf('master')),
  ], [
    decor('planter', 1.5, 12.5),
    decor('bench', 10.5, 12.5),
    decor('planter', 18.5, 6.5),
    decor('poster', 4.5, 1.2, 0),
    decor('poster', 16.5, 1.2, 3),
    decor('bench', 4.5, 11.5),
  ]),

  room('rehearsal_base', 0x25343a, floorOf('wood'), [
    point('mic_stand', 'point.micStand', { x: 6, y: 3, w: 1, h: 1 }, 0x557080, 'mic', ['practice_free']),
    point('band_corner', 'point.bandCorner', { x: 13, y: 3, w: 2, h: 2 }, 0x466070, 'drums', ['band_rehearsal']),
  ], [
    decor('crate', 1.5, 12.5, 0),
    decor('crate', 2.5, 11.5, 1),
    decor('bin', 18.5, 12.5),
    decor('bench', 14.5, 11.5),
    decor('poster', 4.5, 1.2, 2),
    decor('shelf', 17.5, 1.2),
    decor('crate', 17.5, 4.5, 0),
  ]),

  room('restaurant', 0x3d2f24, floorOf('marble'), [
    point('small_stage', 'point.smallStage', { x: 8, y: 2.5, w: 3, h: 2 }, 0x6b543c, 'stage', ['restaurant_shift']),
  ], [
    decor('table', 4.5, 8.5),
    decor('table', 15.5, 8.5),
    decor('table', 9.5, 11.5),
    decor('parasol', 4.5, 6.5),
    decor('parasol', 15.5, 6.5),
    decor('planter', 1.5, 6.5),
    decor('planter', 18.5, 6.5),
    decor('poster', 4.5, 1.2, 3),
  ]),

  room('club_vertigo', 0x35223d, floorOf('dance', 'dance'), [
    point('bar_counter', 'point.barCounter', { x: 2, y: 8, w: 3, h: 1 }, 0x5c3a68, 'bar', ['networking']),
    point('open_mic', 'point.openMic', { x: 3.5, y: 2.5, w: 2, h: 2 }, 0x74468a, 'stage', [], { venues: ['bar_stage'] }),
    point('main_stage', 'point.mainStage', { x: 13, y: 2.5, w: 3, h: 2 }, 0x9a4fb8, 'stage', [], { venues: ['club_stage'] }),
  ], [
    decor('screen', 7.5, 1.1, 0),
    decor('screen', 16.5, 1.1, 2),
    decor('seat', 3.5, 6.5, 0),
    decor('seat', 3.5, 9.5, 1),
    decor('seat', 17.5, 6.5, 2),
    decor('seat', 17.5, 9.5, 3),
    decor('seat', 7.5, 12.5, 1),
    decor('seat', 13.5, 12.5, 0),
    decor('table', 10.5, 5.5),
    decor('bin', 18.5, 12.5),
    decor('bollard', 2.5, 12.5),
  ]),

  room('record_studio', 0x243440, floorOf('wood'), [
    point('booth', 'point.booth', { x: 5, y: 2.5, w: 2, h: 2 }, 0x3f5f78, 'booth', ['record_single']),
    point('console', 'point.console', { x: 13, y: 3, w: 2, h: 1 }, 0x50708a, 'console', []),
  ], [
    decor('crate', 1.5, 12.5, 1),
    decor('planter', 18.5, 6.5),
    decor('bench', 6.5, 11.5),
    decor('shelf', 2.5, 1.2),
    decor('poster', 16.5, 1.2, 2),
    decor('crate', 17.5, 11.5, 0),
  ]),

  room('clothes_shop', 0x3d3524, floorOf('marble'), [
    point('rack', 'point.rack', { x: 4, y: 2.5, w: 2, h: 1 }, 0x7a6a45, 'rack', ['shopping']),
    point('fitting_room', 'point.fittingRoom', { x: 13, y: 2.5, w: 2, h: 1 }, 0x8a7a55, 'curtain', [], {
      opensShop: true,
    }),
  ], [
    decor('planter', 1.5, 12.5),
    decor('bench', 10.5, 11.5),
    decor('planter', 18.5, 12.5),
    decor('poster', 16.5, 1.2, 0),
    decor('shelf', 2.5, 1.2),
    decor('shelf', 8.5, 1.2),
  ]),

  room('phoniatrist', 0x27392f, floorOf('marble'), [
    point('exam_chair', 'point.examChair', { x: 5, y: 2.5, w: 1, h: 1 }, 0x477a5c, 'chair', ['doctor_visit']),
    point('prevention', 'point.prevention', { x: 13, y: 2.5, w: 1, h: 1 }, 0x3f6b52, 'chair', ['checkup']),
  ], [
    decor('bench', 4.5, 11.5),
    decor('bench', 14.5, 11.5),
    decor('planter', 18.5, 5.5),
    decor('shelf', 16.5, 1.2),
    decor('poster', 4.5, 1.2, 1),
    decor('planter', 1.5, 12.5),
  ]),

  room('gym', 0x3a2828, floorOf('wood'), [
    point('treadmill', 'point.treadmill', { x: 9, y: 2.5, w: 1, h: 2 }, 0x7a4a4a, 'treadmill', ['gym']),
  ], [
    decor('bin', 1.5, 12.5),
    decor('bench', 5.5, 11.5),
    decor('bench', 14.5, 11.5),
    decor('bench', 3.5, 5.5),
    decor('bollard', 18.5, 12.5),
    decor('poster', 5.5, 1.2, 3),
    decor('poster', 16.5, 1.2, 0),
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
