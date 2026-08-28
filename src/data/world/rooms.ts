import { ACTIVITIES } from '../activities';
import type { RoomDef, RoomPointDef } from '@core/types';

/**
 * Комнаты локаций (раздел 8). Точки взаимодействия делят дела локации по
 * местам: спать — у кровати, распеваться — у зеркала. Прямоугольники —
 * заглушки вехи 5; тайлмапы придут с артом на вехе 7.
 */
const ROOM_W = 240;
const ROOM_H = 152;
const EXIT = { x: ROOM_W / 2 - 16, y: ROOM_H - 8, w: 32, h: 8 };

const lessonsOf = (level: string): string[] =>
  ACTIVITIES.filter((a) => a.id.startsWith('lesson_') && a.id.endsWith(level)).map((a) => a.id);

const point = (
  id: string,
  nameKey: string,
  rect: RoomPointDef['rect'],
  color: number,
  activities: readonly string[],
  extra: Partial<RoomPointDef> = {},
): RoomPointDef => ({ id, nameKey, rect, color, activities, venues: [], ...extra });

const room = (
  locationId: string,
  floor: number,
  points: readonly RoomPointDef[],
  solids: RoomDef['solids'] = [],
): RoomDef => ({
  locationId,
  width: ROOM_W,
  height: ROOM_H,
  spawn: { x: ROOM_W / 2, y: ROOM_H - 12 },
  floor,
  solids,
  points,
  exit: EXIT,
});

export const ROOMS: readonly RoomDef[] = [
  room('apartment', 0x2b3040, [
    point('bed', 'point.bed', { x: 18, y: 26, w: 46, h: 26 }, 0x4a5570, ['sleep']),
    point('mirror', 'point.mirror', { x: 96, y: 22, w: 26, h: 30 }, 0x6d7a94, ['warmup', 'vocal_rest']),
    point('kitchen', 'point.kitchen', { x: 152, y: 24, w: 44, h: 28 }, 0x5a4f3d, ['tea_regimen']),
    point('sofa', 'point.sofa', { x: 88, y: 92, w: 54, h: 22 }, 0x4c4258, ['home_rest']),
  ]),

  room('vocal_studio', 0x33293f, [
    point('teacher_junior', 'point.teacherJunior', { x: 20, y: 30, w: 48, h: 28 }, 0x584a6b, lessonsOf('junior')),
    point('teacher_mid', 'point.teacherMid', { x: 96, y: 26, w: 48, h: 32 }, 0x6b5a80, lessonsOf('mid')),
    point('teacher_master', 'point.teacherMaster', { x: 172, y: 30, w: 48, h: 28 }, 0x8a6ea3, lessonsOf('master')),
  ]),

  room('rehearsal_base', 0x25343a, [
    point('mic_stand', 'point.micStand', { x: 60, y: 34, w: 26, h: 34 }, 0x557080, ['practice_free']),
    point('band_corner', 'point.bandCorner', { x: 140, y: 30, w: 60, h: 38 }, 0x466070, ['band_rehearsal']),
  ]),

  room('restaurant', 0x3d2f24, [
    point('small_stage', 'point.smallStage', { x: 84, y: 28, w: 72, h: 32 }, 0x6b543c, ['restaurant_shift']),
  ]),

  room('club_vertigo', 0x35223d, [
    point('bar_counter', 'point.barCounter', { x: 18, y: 92, w: 66, h: 22 }, 0x5c3a68, ['networking']),
    point('open_mic', 'point.openMic', { x: 30, y: 26, w: 62, h: 34 }, 0x74468a, [], { venues: ['bar_stage'] }),
    point('main_stage', 'point.mainStage', { x: 128, y: 22, w: 92, h: 40 }, 0x9a4fb8, [], { venues: ['club_stage'] }),
  ]),

  room('record_studio', 0x243440, [
    point('booth', 'point.booth', { x: 66, y: 26, w: 60, h: 40 }, 0x3f5f78, ['record_single']),
    point('console', 'point.console', { x: 150, y: 34, w: 62, h: 26 }, 0x50708a, []),
  ]),

  room('clothes_shop', 0x3d3524, [
    point('rack', 'point.rack', { x: 34, y: 26, w: 70, h: 32 }, 0x7a6a45, ['shopping']),
    point('fitting_room', 'point.fittingRoom', { x: 140, y: 24, w: 52, h: 36 }, 0x8a7a55, [], {
      opensShop: true,
    }),
  ]),

  room('phoniatrist', 0x27392f, [
    point('exam_chair', 'point.examChair', { x: 52, y: 28, w: 54, h: 34 }, 0x477a5c, ['doctor_visit']),
    point('prevention', 'point.prevention', { x: 140, y: 30, w: 56, h: 30 }, 0x3f6b52, ['checkup']),
  ]),

  room('gym', 0x3a2828, [
    point('treadmill', 'point.treadmill', { x: 72, y: 26, w: 90, h: 38 }, 0x7a4a4a, ['gym']),
  ]),
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
