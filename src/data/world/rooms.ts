import { ACTIVITIES } from '../activities';
import type { DecorDef, RoomDef, RoomPointDef } from '@core/types';

/**
 * Комнаты локаций (раздел 8). Точки взаимодействия делят дела локации по
 * местам: спать — у кровати, распеваться — у зеркала. Прямоугольники —
 * заглушки вехи 5; тайлмапы придут с артом на вехе 7.
 */
const ROOM_W = 420;
const ROOM_H = 196;
const EXIT = { x: ROOM_W / 2 - 22, y: ROOM_H - 10, w: 44, h: 10 };

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
  spawn: { x: ROOM_W / 2, y: ROOM_H - 16 },
  floor,
  solids: [],
  points,
  decor: decoration,
  exit: EXIT,
});

export const ROOMS: readonly RoomDef[] = [
  room('apartment', 0x2b3040, [
    point('bed', 'point.bed', { x: 32, y: 42, w: 62, h: 34 }, 0x4a5570, 'bed', ['sleep']),
    point('mirror', 'point.mirror', { x: 168, y: 36, w: 35, h: 39 }, 0x6d7a94, 'mirror', ['warmup', 'vocal_rest']),
    point('kitchen', 'point.kitchen', { x: 266, y: 39, w: 59, h: 36 }, 0x5a4f3d, 'kitchen', ['tea_regimen']),
    point('sofa', 'point.sofa', { x: 154, y: 127, w: 73, h: 29 }, 0x4c4258, 'sofa', ['home_rest']),
  ], [decor('planter', 380, 118), decor('bin', 40, 176), decor('bench', 320, 186)]),

  room('vocal_studio', 0x33293f, [
    point('teacher_junior', 'point.teacherJunior', { x: 35, y: 47, w: 65, h: 36 }, 0x584a6b, 'piano', lessonsOf('junior')),
    point('teacher_mid', 'point.teacherMid', { x: 168, y: 42, w: 65, h: 42 }, 0x6b5a80, 'piano', lessonsOf('mid')),
    point('teacher_master', 'point.teacherMaster', { x: 301, y: 47, w: 65, h: 36 }, 0x8a6ea3, 'piano', lessonsOf('master')),
  ], [decor('planter', 46, 178), decor('bench', 250, 182), decor('planter', 392, 120)]),

  room('rehearsal_base', 0x25343a, [
    point('mic_stand', 'point.micStand', { x: 105, y: 52, w: 35, h: 44 }, 0x557080, 'mic', ['practice_free']),
    point('band_corner', 'point.bandCorner', { x: 245, y: 47, w: 81, h: 49 }, 0x466070, 'drums', ['band_rehearsal']),
  ], [decor('crate', 44, 176, 0), decor('crate', 70, 178, 1), decor('bin', 388, 172), decor('bench', 300, 186)]),

  room('restaurant', 0x3d2f24, [
    point('small_stage', 'point.smallStage', { x: 147, y: 44, w: 97, h: 42 }, 0x6b543c, 'stage', ['restaurant_shift']),
  ], [decor('parasol', 92, 186), decor('parasol', 330, 186), decor('planter', 46, 130), decor('planter', 386, 130)]),

  room('club_vertigo', 0x35223d, [
    point('bar_counter', 'point.barCounter', { x: 32, y: 127, w: 89, h: 29 }, 0x5c3a68, 'bar', ['networking']),
    point('open_mic', 'point.openMic', { x: 52, y: 42, w: 84, h: 44 }, 0x74468a, 'stage', [], { venues: ['bar_stage'] }),
    point('main_stage', 'point.mainStage', { x: 224, y: 36, w: 124, h: 52 }, 0x9a4fb8, 'stage', [], { venues: ['club_stage'] }),
  ], [decor('bin', 396, 178), decor('bench', 300, 190), decor('bollard', 60, 178)]),

  room('record_studio', 0x243440, [
    point('booth', 'point.booth', { x: 116, y: 42, w: 81, h: 52 }, 0x3f5f78, 'booth', ['record_single']),
    point('console', 'point.console', { x: 262, y: 52, w: 84, h: 34 }, 0x50708a, 'console', []),
  ], [decor('crate', 44, 180, 1), decor('planter', 384, 126), decor('bench', 120, 190)]),

  room('clothes_shop', 0x3d3524, [
    point('rack', 'point.rack', { x: 60, y: 42, w: 94, h: 42 }, 0x7a6a45, 'rack', ['shopping']),
    point('fitting_room', 'point.fittingRoom', { x: 245, y: 39, w: 70, h: 47 }, 0x8a7a55, 'curtain', [], {
      opensShop: true,
    }),
  ], [decor('planter', 48, 176), decor('bench', 250, 188), decor('planter', 388, 176)]),

  room('phoniatrist', 0x27392f, [
    point('exam_chair', 'point.examChair', { x: 91, y: 44, w: 73, h: 44 }, 0x477a5c, 'chair', ['doctor_visit']),
    point('prevention', 'point.prevention', { x: 245, y: 47, w: 76, h: 39 }, 0x3f6b52, 'chair', ['checkup']),
  ], [decor('bench', 96, 186), decor('bench', 300, 186), decor('planter', 386, 122)]),

  room('gym', 0x3a2828, [
    point('treadmill', 'point.treadmill', { x: 126, y: 42, w: 122, h: 49 }, 0x7a4a4a, 'treadmill', ['gym']),
  ], [decor('bin', 44, 176), decor('bench', 120, 188), decor('bench', 300, 188), decor('bollard', 384, 178)]),
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
