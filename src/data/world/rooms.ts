import { ACTIVITIES } from '../activities';
import type { DecorDef, RoomDef, RoomPointDef } from '@core/types';

/**
 * Комнаты локаций (раздел 8). Точки взаимодействия делят дела локации по
 * местам: спать — у кровати, распеваться — у зеркала. Прямоугольники —
 * заглушки вехи 5; тайлмапы придут с артом на вехе 7.
 */
const ROOM_W = 240;
const ROOM_H = 105;
const EXIT = { x: ROOM_W / 2 - 14, y: ROOM_H - 7, w: 28, h: 7 };

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

const room = (
  locationId: string,
  floor: number,
  points: readonly RoomPointDef[],
  decoration: readonly DecorDef[] = [],
): RoomDef => ({
  locationId,
  width: ROOM_W,
  height: ROOM_H,
  spawn: { x: ROOM_W / 2, y: ROOM_H - 12 },
  floor,
  solids: [],
  points,
  decor: decoration,
  exit: EXIT,
});

export const ROOMS: readonly RoomDef[] = [
  room('apartment', 0x2b3040, [
    point('bed', 'point.bed', { x: 18, y: 23, w: 35, h: 18 }, 0x4a5570, 'bed', ['sleep']),
    point('mirror', 'point.mirror', { x: 96, y: 19, w: 20, h: 21 }, 0x6d7a94, 'mirror', ['warmup', 'vocal_rest']),
    point('kitchen', 'point.kitchen', { x: 152, y: 21, w: 34, h: 19 }, 0x5a4f3d, 'kitchen', ['tea_regimen']),
    point('sofa', 'point.sofa', { x: 88, y: 68, w: 42, h: 16 }, 0x4c4258, 'sofa', ['home_rest']),
  ], [decor('planter', 217, 63), decor('bin', 23, 94), decor('bench', 183, 100), decor('rug', 58, 94, 0), decor('poster', 70, 24, 1), decor('shelf', 210, 24)]),

  room('vocal_studio', 0x33293f, [
    point('teacher_junior', 'point.teacherJunior', { x: 20, y: 25, w: 37, h: 19 }, 0x584a6b, 'piano', lessonsOf('junior')),
    point('teacher_mid', 'point.teacherMid', { x: 96, y: 23, w: 37, h: 23 }, 0x6b5a80, 'piano', lessonsOf('mid')),
    point('teacher_master', 'point.teacherMaster', { x: 172, y: 25, w: 37, h: 19 }, 0x8a6ea3, 'piano', lessonsOf('master')),
  ], [decor('planter', 26, 95), decor('bench', 143, 98), decor('planter', 224, 64), decor('rug', 120, 94, 1), decor('poster', 24, 24, 0), decor('poster', 214, 24, 3)]),

  room('rehearsal_base', 0x25343a, [
    point('mic_stand', 'point.micStand', { x: 60, y: 28, w: 20, h: 24 }, 0x557080, 'mic', ['practice_free']),
    point('band_corner', 'point.bandCorner', { x: 140, y: 25, w: 46, h: 26 }, 0x466070, 'drums', ['band_rehearsal']),
  ], [decor('crate', 25, 94, 0), decor('crate', 40, 95, 1), decor('bin', 222, 92), decor('bench', 171, 100), decor('rug', 130, 94, 2), decor('poster', 40, 24, 2), decor('shelf', 220, 24)]),

  room('restaurant', 0x3d2f24, [
    point('small_stage', 'point.smallStage', { x: 84, y: 24, w: 55, h: 23 }, 0x6b543c, 'stage', ['restaurant_shift']),
  ], [decor('parasol', 53, 100), decor('parasol', 188, 100), decor('planter', 26, 70), decor('planter', 220, 70), decor('rug', 120, 94, 0), decor('poster', 30, 24, 3)]),

  room('club_vertigo', 0x35223d, [
    point('bar_counter', 'point.barCounter', { x: 18, y: 68, w: 51, h: 16 }, 0x5c3a68, 'bar', ['networking']),
    point('open_mic', 'point.openMic', { x: 30, y: 23, w: 48, h: 24 }, 0x74468a, 'stage', [], { venues: ['bar_stage'] }),
    point('main_stage', 'point.mainStage', { x: 128, y: 19, w: 71, h: 28 }, 0x9a4fb8, 'stage', [], { venues: ['club_stage'] }),
  ], [decor('bin', 226, 95), decor('bench', 171, 102), decor('bollard', 34, 95), decor('poster', 26, 24, 0), decor('poster', 214, 24, 1)]),

  room('record_studio', 0x243440, [
    point('booth', 'point.booth', { x: 66, y: 23, w: 46, h: 28 }, 0x3f5f78, 'booth', ['record_single']),
    point('console', 'point.console', { x: 150, y: 28, w: 48, h: 18 }, 0x50708a, 'console', []),
  ], [decor('crate', 25, 96, 1), decor('planter', 219, 68), decor('bench', 69, 102), decor('rug', 120, 94, 1), decor('shelf', 30, 24), decor('poster', 216, 24, 2)]),

  room('clothes_shop', 0x3d3524, [
    point('rack', 'point.rack', { x: 34, y: 23, w: 54, h: 23 }, 0x7a6a45, 'rack', ['shopping']),
    point('fitting_room', 'point.fittingRoom', { x: 140, y: 21, w: 40, h: 25 }, 0x8a7a55, 'curtain', [], {
      opensShop: true,
    }),
  ], [decor('planter', 27, 94), decor('bench', 143, 101), decor('planter', 222, 94), decor('rug', 120, 94, 2), decor('poster', 214, 24, 0), decor('shelf', 26, 24)]),

  room('phoniatrist', 0x27392f, [
    point('exam_chair', 'point.examChair', { x: 52, y: 24, w: 42, h: 24 }, 0x477a5c, 'chair', ['doctor_visit']),
    point('prevention', 'point.prevention', { x: 140, y: 25, w: 43, h: 21 }, 0x3f6b52, 'chair', ['checkup']),
  ], [decor('bench', 55, 100), decor('bench', 171, 100), decor('planter', 220, 65), decor('rug', 120, 94, 1), decor('shelf', 216, 24), decor('poster', 26, 24, 1)]),

  room('gym', 0x3a2828, [
    point('treadmill', 'point.treadmill', { x: 72, y: 23, w: 70, h: 26 }, 0x7a4a4a, 'treadmill', ['gym']),
  ], [decor('bin', 25, 94), decor('bench', 69, 101), decor('bench', 171, 101), decor('bollard', 219, 95), decor('rug', 120, 94, 2), decor('poster', 30, 24, 3), decor('poster', 212, 24, 0)]),
];

const BY_LOCATION = new Map(ROOMS.map((r) => [r.locationId, r]));

export function getRoom(locationId: string): RoomDef {
  const found = BY_LOCATION.get(locationId);
  if (!found) throw new Error(`Нет комнаты для локации "${locationId}"`);
  return found;
}

export function hasRoom(locationId: string): boolean {
  return BY_LOCATION.has(locationId);
}
