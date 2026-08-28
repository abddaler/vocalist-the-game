import type { WorldPoint } from '@core/types';

/**
 * Прохожие и завсегдатаи (ориентир — Nights: локация обжитая, в ней
 * кто-то занят своим делом). Симуляции они не касаются вовсе: это
 * оформление, у него нет ни статов, ни влияния на баланс.
 */
export interface CrowdMember {
  readonly id: string;
  /** Локация: 'district' — улица, иначе id комнаты. */
  readonly locationId: string;
  /** Индекс палитры среди CROWD_PALETTES. */
  readonly palette: number;
  /** Точки маршрута. Одна точка — человек стоит на месте. */
  readonly path: readonly WorldPoint[];
  /** Пауза на точке, миллисекунды. */
  readonly dwell: number;
  /** Скорость, внутренних пикселей в секунду. */
  readonly speed: number;
}

const walker = (
  id: string,
  locationId: string,
  palette: number,
  path: readonly WorldPoint[],
  dwell = 1200,
  speed = 26,
): CrowdMember => ({ id, locationId, palette, path, dwell, speed });

const stander = (id: string, locationId: string, palette: number, at: WorldPoint): CrowdMember =>
  walker(id, locationId, palette, [at], 0, 0);

export const CROWD: readonly CrowdMember[] = [
  // — улица —
  walker('street_1', 'district', 0, [
    { x: 60, y: 122 },
    { x: 300, y: 118 },
    { x: 620, y: 124 },
  ], 900),
  walker('street_2', 'district', 1, [
    { x: 660, y: 134 },
    { x: 380, y: 138 },
    { x: 120, y: 132 },
  ], 1500),
  walker('street_3', 'district', 2, [
    { x: 210, y: 142 },
    { x: 210, y: 106 },
  ], 2600),
  walker('street_4', 'district', 4, [
    { x: 500, y: 108 },
    { x: 560, y: 140 },
    { x: 470, y: 140 },
  ], 800),
  stander('busker', 'district', 3, { x: 318, y: 126 }),

  // — квартира: соседка за стеной не нужна, дом должен быть пустым —

  // — вокальная студия —
  stander('studio_pupil', 'vocal_studio', 1, { x: 150, y: 92 }),
  walker('studio_teacher', 'vocal_studio', 5, [
    { x: 60, y: 74 },
    { x: 190, y: 74 },
  ], 2200, 14),

  // — репбаза —
  stander('band_guitar', 'rehearsal_base', 0, { x: 150, y: 78 }),
  stander('band_drums', 'rehearsal_base', 3, { x: 186, y: 76 }),
  walker('base_sound', 'rehearsal_base', 2, [
    { x: 40, y: 110 },
    { x: 100, y: 104 },
  ], 3000, 12),

  // — ресторан —
  walker('waiter', 'restaurant', 5, [
    { x: 40, y: 108 },
    { x: 200, y: 104 },
    { x: 120, y: 130 },
  ], 700, 22),
  stander('diner_1', 'restaurant', 1, { x: 60, y: 92 }),
  stander('diner_2', 'restaurant', 4, { x: 176, y: 96 }),

  // — клуб —
  walker('club_guest_1', 'club_vertigo', 0, [
    { x: 60, y: 128 },
    { x: 170, y: 124 },
  ], 1100),
  walker('club_guest_2', 'club_vertigo', 4, [
    { x: 200, y: 118 },
    { x: 110, y: 134 },
  ], 1400),
  stander('bartender', 'club_vertigo', 2, { x: 48, y: 88 }),
  stander('promoter', 'club_vertigo', 5, { x: 214, y: 96 }),

  // — студия звукозаписи —
  stander('engineer', 'record_studio', 1, { x: 180, y: 74 }),

  // — магазин одежды —
  stander('shop_clerk', 'clothes_shop', 3, { x: 118, y: 74 }),
  walker('shopper', 'clothes_shop', 0, [
    { x: 60, y: 110 },
    { x: 180, y: 106 },
  ], 1800, 18),

  // — фониатр —
  stander('doctor', 'phoniatrist', 5, { x: 96, y: 72 }),
  stander('patient', 'phoniatrist', 4, { x: 40, y: 116 }),

  // — спортзал —
  walker('gym_runner', 'gym', 2, [
    { x: 60, y: 116 },
    { x: 180, y: 116 },
  ], 400, 34),
  stander('gym_coach', 'gym', 1, { x: 200, y: 92 }),
];

export function crowdIn(locationId: string): CrowdMember[] {
  return CROWD.filter((member) => member.locationId === locationId);
}
