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
  /** Имя внешности (см. game/art/looks.ts). Слой отображения её и разрешает. */
  readonly look: string;
  /** Точки маршрута. Одна точка — человек стоит на месте. */
  readonly path: readonly WorldPoint[];
  /** Пауза на точке, миллисекунды. */
  readonly dwell: number;
  /** Скорость, внутренних пикселей в секунду. */
  readonly speed: number;
  /**
   * Табличка над головой. Есть только у названных: в толпе безымянных
   * подписи ничего не сообщают, а нужного человека без них не найти.
   */
  readonly nameKey?: string | undefined;
}

const walker = (
  id: string,
  locationId: string,
  look: string,
  path: readonly WorldPoint[],
  dwell = 1200,
  speed = 26,
): CrowdMember => ({ id, locationId, look, path, dwell, speed });

const stander = (id: string, locationId: string, look: string, at: WorldPoint): CrowdMember =>
  walker(id, locationId, look, [at], 0, 0);

/** Названный персонаж: та же живность, но с именем над головой. */
const named = (
  id: string,
  locationId: string,
  at: WorldPoint,
  nameKey: string,
): CrowdMember => ({ ...stander(id, locationId, id, at), nameKey });

export const CROWD: readonly CrowdMember[] = [
  // — Холмы: соседи, выгул собак, бегуны —
  walker('hills_1', 'hills', 'passer_1', [
    { x: 60, y: 128 },
    { x: 320, y: 122 },
    { x: 620, y: 130 },
  ], 900),
  walker('hills_2', 'hills', 'passer_2', [
    { x: 650, y: 142 },
    { x: 380, y: 146 },
    { x: 120, y: 140 },
  ], 1500),
  walker('hills_3', 'hills', 'passer_3', [
    { x: 214, y: 148 },
    { x: 214, y: 106 },
  ], 2600),
  walker('hills_4', 'hills', 'passer_7', [
    { x: 470, y: 110 },
    { x: 560, y: 144 },
    { x: 430, y: 144 },
  ], 800, 34),
  stander('hills_5', 'hills', 'passer_4', { x: 552, y: 132 }),
  walker('hills_6', 'hills', 'passer_8', [
    { x: 96, y: 112 },
    { x: 160, y: 134 },
  ], 2000, 18),

  walker('hills_7', 'hills', 'passer_11', [
    { x: 420, y: 82 },
    { x: 560, y: 86 },
    { x: 380, y: 80 },
  ], 1100, 30),
  stander('hills_8', 'hills', 'staff_apron', { x: 486, y: 84 }),
  walker('hills_9', 'hills', 'passer_12', [
    { x: 640, y: 100 },
    { x: 460, y: 104 },
  ], 1900, 22),
  stander('hills_10', 'hills', 'passer_8', { x: 214, y: 98 }),

  // — Даунтаун: поток служащих, у перехода всегда кто-то стоит —
  walker('dt_1', 'downtown', 'passer_7', [
    { x: 40, y: 124 },
    { x: 600, y: 128 },
  ], 400, 32),
  walker('dt_2', 'downtown', 'passer_2', [
    { x: 590, y: 142 },
    { x: 60, y: 138 },
  ], 400, 30),
  walker('dt_3', 'downtown', 'passer_1', [
    { x: 150, y: 106 },
    { x: 150, y: 146 },
  ], 1200, 26),
  walker('dt_4', 'downtown', 'passer_3', [
    { x: 420, y: 146 },
    { x: 500, y: 112 },
    { x: 380, y: 118 },
  ], 700),
  stander('dt_5', 'downtown', 'passer_5', { x: 268, y: 132 }),
  named('rival', 'downtown', { x: 356, y: 136 }, 'npc.rival'),
  walker('dt_7', 'downtown', 'passer_9', [
    { x: 620, y: 114 },
    { x: 470, y: 122 },
  ], 1600, 22),

  walker('dt_8', 'downtown', 'passer_6', [
    { x: 90, y: 104 },
    { x: 300, y: 100 },
    { x: 520, y: 108 },
  ], 500, 34),
  stander('dt_9', 'downtown', 'passer_12', { x: 152, y: 86 }),
  stander('dt_10', 'downtown', 'passer_11', { x: 440, y: 82 }),
  walker('dt_11', 'downtown', 'passer_3', [
    { x: 600, y: 82 },
    { x: 600, y: 88 },
  ], 1500, 24),

  // — Бульвар: очередь в клуб, гуляющие, кто-то курит у входа —
  walker('blvd_1', 'boulevard', 'passer_5', [
    { x: 60, y: 130 },
    { x: 340, y: 124 },
    { x: 690, y: 132 },
  ], 800),
  walker('blvd_2', 'boulevard', 'passer_1', [
    { x: 680, y: 144 },
    { x: 300, y: 148 },
    { x: 70, y: 142 },
  ], 1100),
  stander('blvd_3', 'boulevard', 'passer_3', { x: 96, y: 106 }),
  stander('blvd_4', 'boulevard', 'passer_10', { x: 108, y: 114 }),
  stander('blvd_5', 'boulevard', 'passer_2', { x: 120, y: 106 }),
  walker('blvd_6', 'boulevard', 'passer_4', [
    { x: 262, y: 110 },
    { x: 262, y: 144 },
  ], 1800, 20),
  walker('blvd_7', 'boulevard', 'passer_8', [
    { x: 560, y: 146 },
    { x: 460, y: 112 },
  ], 1300),
  named('blogger', 'boulevard', { x: 316, y: 140 }, 'npc.blogger'),

  stander('blvd_9', 'boulevard', 'passer_9', { x: 268, y: 88 }),
  stander('blvd_10', 'boulevard', 'passer_12', { x: 306, y: 88 }),
  walker('blvd_11', 'boulevard', 'passer_11', [
    { x: 660, y: 80 },
    { x: 480, y: 94 },
    { x: 620, y: 96 },
  ], 900, 28),
  stander('blvd_12', 'boulevard', 'staff_apron', { x: 226, y: 82 }),

  // — Причал: грузчики, курьер, чайки и их люди —
  walker('pier_1', 'pier', 'passer_9', [
    { x: 80, y: 146 },
    { x: 300, y: 142 },
  ], 2400, 16),
  walker('pier_2', 'pier', 'passer_3', [
    { x: 400, y: 112 },
    { x: 400, y: 148 },
  ], 2000, 18),
  stander('pier_3', 'pier', 'passer_2', { x: 168, y: 114 }),
  stander('pier_4', 'pier', 'passer_7', { x: 182, y: 120 }),
  walker('pier_5', 'pier', 'passer_1', [
    { x: 560, y: 138 },
    { x: 300, y: 134 },
    { x: 540, y: 150 },
  ], 900, 28),

  walker('pier_6', 'pier', 'passer_12', [
    { x: 60, y: 94 },
    { x: 240, y: 90 },
  ], 2100, 20),
  stander('pier_7', 'pier', 'passer_11', { x: 470, y: 80 }),
  stander('pier_8', 'pier', 'passer_6', { x: 486, y: 86 }),

  // — квартира: соседка за стеной не нужна, дом должен быть пустым —

  // — вокальная студия —
  stander('studio_pupil', 'vocal_studio', 'passer_10', { x: 150, y: 68 }),
  named('teacher', 'vocal_studio', { x: 118, y: 55 }, 'npc.teacher'),

  // — репбаза —
  stander('band_guitar', 'rehearsal_base', 'passer_1', { x: 150, y: 58 }),
  stander('band_drums', 'rehearsal_base', 'passer_4', { x: 186, y: 57 }),
  walker('base_sound', 'rehearsal_base', 'passer_3', [
    { x: 40, y: 85 },
    { x: 100, y: 80 },
  ], 3000, 12),

  // — ресторан —
  walker('waiter', 'restaurant', 'passer_6', [
    { x: 40, y: 83 },
    { x: 200, y: 80 },
    { x: 120, y: 98 },
  ], 700, 22),
  stander('diner_1', 'restaurant', 'passer_2', { x: 60, y: 68 }),
  stander('diner_2', 'restaurant', 'passer_5', { x: 176, y: 75 }),

  // — клуб —
  walker('club_guest_1', 'club_vertigo', 'passer_1', [
    { x: 60, y: 97 },
    { x: 170, y: 94 },
  ], 1100),
  walker('club_guest_2', 'club_vertigo', 'passer_5', [
    { x: 200, y: 90 },
    { x: 110, y: 101 },
  ], 1400),
  stander('bartender', 'club_vertigo', 'passer_3', { x: 48, y: 65 }),
  named('promoter', 'club_vertigo', { x: 214, y: 75 }, 'npc.promoter'),

  // — студия звукозаписи —
  named('engineer', 'record_studio', { x: 180, y: 55 }, 'npc.engineer'),

  // — магазин одежды —
  stander('shop_clerk', 'clothes_shop', 'staff_apron', { x: 118, y: 55 }),
  walker('shopper', 'clothes_shop', 'passer_1', [
    { x: 60, y: 85 },
    { x: 180, y: 81 },
  ], 1800, 18),

  // — фониатр —
  stander('doctor', 'phoniatrist', 'passer_7', { x: 96, y: 54 }),
  stander('patient', 'phoniatrist', 'passer_5', { x: 40, y: 88 }),

  // — спортзал —
  walker('gym_runner', 'gym', 'passer_3', [
    { x: 60, y: 88 },
    { x: 180, y: 88 },
  ], 400, 34),
  stander('gym_coach', 'gym', 'staff_coach', { x: 200, y: 68 }),
];

export function crowdIn(locationId: string): CrowdMember[] {
  return CROWD.filter((member) => member.locationId === locationId);
}
