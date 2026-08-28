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
  // — Холмы: соседи, выгул собак, бегуны —
  walker('hills_1', 'hills', 0, [
    { x: 60, y: 128 },
    { x: 320, y: 122 },
    { x: 620, y: 130 },
  ], 900),
  walker('hills_2', 'hills', 1, [
    { x: 650, y: 142 },
    { x: 380, y: 146 },
    { x: 120, y: 140 },
  ], 1500),
  walker('hills_3', 'hills', 2, [
    { x: 214, y: 148 },
    { x: 214, y: 106 },
  ], 2600),
  walker('hills_4', 'hills', 4, [
    { x: 470, y: 110 },
    { x: 560, y: 144 },
    { x: 430, y: 144 },
  ], 800, 34),
  stander('hills_5', 'hills', 3, { x: 552, y: 132 }),
  walker('hills_6', 'hills', 5, [
    { x: 96, y: 112 },
    { x: 160, y: 134 },
  ], 2000, 18),

  // — Даунтаун: поток служащих, у перехода всегда кто-то стоит —
  walker('dt_1', 'downtown', 5, [
    { x: 40, y: 124 },
    { x: 600, y: 128 },
  ], 400, 32),
  walker('dt_2', 'downtown', 1, [
    { x: 590, y: 142 },
    { x: 60, y: 138 },
  ], 400, 30),
  walker('dt_3', 'downtown', 0, [
    { x: 150, y: 106 },
    { x: 150, y: 146 },
  ], 1200, 26),
  walker('dt_4', 'downtown', 2, [
    { x: 420, y: 146 },
    { x: 500, y: 112 },
    { x: 380, y: 118 },
  ], 700),
  stander('dt_5', 'downtown', 4, { x: 268, y: 132 }),
  stander('dt_6', 'downtown', 3, { x: 356, y: 136 }),
  walker('dt_7', 'downtown', 1, [
    { x: 620, y: 114 },
    { x: 470, y: 122 },
  ], 1600, 22),

  // — Бульвар: очередь в клуб, гуляющие, кто-то курит у входа —
  walker('blvd_1', 'boulevard', 4, [
    { x: 60, y: 130 },
    { x: 340, y: 124 },
    { x: 690, y: 132 },
  ], 800),
  walker('blvd_2', 'boulevard', 0, [
    { x: 680, y: 144 },
    { x: 300, y: 148 },
    { x: 70, y: 142 },
  ], 1100),
  stander('blvd_3', 'boulevard', 2, { x: 96, y: 106 }),
  stander('blvd_4', 'boulevard', 5, { x: 108, y: 114 }),
  stander('blvd_5', 'boulevard', 1, { x: 120, y: 106 }),
  walker('blvd_6', 'boulevard', 3, [
    { x: 262, y: 110 },
    { x: 262, y: 144 },
  ], 1800, 20),
  walker('blvd_7', 'boulevard', 2, [
    { x: 560, y: 146 },
    { x: 460, y: 112 },
  ], 1300),
  stander('blvd_8', 'boulevard', 0, { x: 316, y: 140 }),

  // — Причал: грузчики, курьер, чайки и их люди —
  walker('pier_1', 'pier', 5, [
    { x: 80, y: 146 },
    { x: 300, y: 142 },
  ], 2400, 16),
  walker('pier_2', 'pier', 2, [
    { x: 400, y: 112 },
    { x: 400, y: 148 },
  ], 2000, 18),
  stander('pier_3', 'pier', 1, { x: 168, y: 114 }),
  stander('pier_4', 'pier', 4, { x: 182, y: 120 }),
  walker('pier_5', 'pier', 0, [
    { x: 560, y: 138 },
    { x: 300, y: 132 },
    { x: 540, y: 124 },
  ], 900, 28),

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
    { x: 40, y: 116 },
    { x: 100, y: 110 },
  ], 3000, 12),

  // — ресторан —
  walker('waiter', 'restaurant', 5, [
    { x: 40, y: 114 },
    { x: 200, y: 110 },
    { x: 120, y: 136 },
  ], 700, 22),
  stander('diner_1', 'restaurant', 1, { x: 60, y: 92 }),
  stander('diner_2', 'restaurant', 4, { x: 176, y: 102 }),

  // — клуб —
  walker('club_guest_1', 'club_vertigo', 0, [
    { x: 60, y: 134 },
    { x: 170, y: 130 },
  ], 1100),
  walker('club_guest_2', 'club_vertigo', 4, [
    { x: 200, y: 124 },
    { x: 110, y: 140 },
  ], 1400),
  stander('bartender', 'club_vertigo', 2, { x: 48, y: 88 }),
  stander('promoter', 'club_vertigo', 5, { x: 214, y: 102 }),

  // — студия звукозаписи —
  stander('engineer', 'record_studio', 1, { x: 180, y: 74 }),

  // — магазин одежды —
  stander('shop_clerk', 'clothes_shop', 3, { x: 118, y: 74 }),
  walker('shopper', 'clothes_shop', 0, [
    { x: 60, y: 116 },
    { x: 180, y: 112 },
  ], 1800, 18),

  // — фониатр —
  stander('doctor', 'phoniatrist', 5, { x: 96, y: 72 }),
  stander('patient', 'phoniatrist', 4, { x: 40, y: 122 }),

  // — спортзал —
  walker('gym_runner', 'gym', 2, [
    { x: 60, y: 122 },
    { x: 180, y: 122 },
  ], 400, 34),
  stander('gym_coach', 'gym', 1, { x: 200, y: 92 }),
];

export function crowdIn(locationId: string): CrowdMember[] {
  return CROWD.filter((member) => member.locationId === locationId);
}
