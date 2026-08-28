import type { DistrictDef } from '@core/types';

/**
 * Экран района (раздел 8): между локациями игрок ходит, а не выбирает
 * пункт меню. Дома — цветные прямоугольники-заглушки вехи 5, на вехе 7
 * их сменит тайлсет. Вход всегда через дверь.
 */
const BUILDING_W = 120;
const BUILDING_H = 80;
const DOOR_W = 24;
const DOOR_H = 16;

const topRow = (index: number): number => 15 + index * 140;
const bottomRow = (index: number): number => 85 + index * 160;

const upper = (locationId: string, index: number, color: number) => ({
  locationId,
  color,
  rect: { x: topRow(index), y: 26, w: BUILDING_W, h: BUILDING_H },
  // Дверь снизу: игрок подходит к ней с улицы.
  door: { x: topRow(index) + (BUILDING_W - DOOR_W) / 2, y: 126 - DOOR_H, w: DOOR_W, h: DOOR_H },
});

const lower = (locationId: string, index: number, color: number) => ({
  locationId,
  color,
  rect: { x: bottomRow(index), y: 150, w: BUILDING_W, h: 64 },
  door: { x: bottomRow(index) + (BUILDING_W - DOOR_W) / 2, y: 150, w: DOOR_W, h: DOOR_H },
});

export const DISTRICT: DistrictDef = {
  width: 720,
  // Ровно по высоте игрового поля: район прокручивается только вбок,
  // так улица читается целиком и не уезжает под верхнюю панель.
  height: 216,
  spawn: { x: 360, y: 130 },

  buildings: [
    upper('apartment', 0, 0x3b4257),
    upper('vocal_studio', 1, 0x4a3f57),
    upper('rehearsal_base', 2, 0x38474a),
    upper('restaurant', 3, 0x574438),
    upper('club_vertigo', 4, 0x50385a),
    lower('record_studio', 0, 0x3a4a57),
    lower('clothes_shop', 1, 0x574a3a),
    lower('phoniatrist', 2, 0x3f5747),
    lower('gym', 3, 0x574040),
  ],

  // Бордюры вдоль тротуара: улица должна читаться как коридор.
  solids: [
    { x: 0, y: 0, w: 720, h: 6 },
    { x: 0, y: 214, w: 720, h: 2 },
  ],

  points: [
    {
      id: 'underpass_stairs',
      nameKey: 'venue.underpass',
      rect: { x: 330, y: 96, w: 40, h: 22 },
      color: 0x2a2f3d,
      activities: [],
      venues: ['underpass'],
    },
    {
      id: 'orders_board',
      nameKey: 'venue.corporate',
      rect: { x: 640, y: 96, w: 30, h: 22 },
      color: 0x4a4430,
      activities: [],
      venues: ['corporate'],
    },
  ],
};
