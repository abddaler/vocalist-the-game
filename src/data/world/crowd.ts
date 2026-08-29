import type { WorldPoint } from '@core/types';

/**
 * Прохожие и завсегдатаи (ориентир — Nights: локация обжитая, в ней
 * кто-то занят своим делом). Симуляции они не касаются вовсе: это
 * оформление, у него нет ни статов, ни влияния на баланс.
 *
 * Координаты — в плитках сетки района, как и всё остальное в мире.
 */
export interface CrowdMember {
  readonly id: string;
  /** Локация: id района или id комнаты. */
  readonly locationId: string;
  /** Имя внешности (см. game/art/looks.ts). Слой отображения её и разрешает. */
  readonly look: string;
  /** Точки маршрута. Одна точка — человек стоит на месте. */
  readonly path: readonly WorldPoint[];
  /** Пауза на точке, миллисекунды. */
  readonly dwell: number;
  /** Скорость, плиток в секунду. */
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
  speed = 1.5,
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
  // — Холмы: терраса наверху (ряды 2–4), улица внизу (ряды 5–11) —
  walker('hills_1', 'hills', 'passer_1', [
    { x: 3.5, y: 8.5 },
    { x: 19.5, y: 8.5 },
    { x: 36.5, y: 8.5 },
  ], 900, 1.8),
  walker('hills_2', 'hills', 'passer_2', [
    { x: 37.5, y: 10.5 },
    { x: 22.5, y: 10.5 },
    { x: 6.5, y: 10.5 },
  ], 1500),
  walker('hills_3', 'hills', 'passer_3', [
    { x: 14.5, y: 10.5 },
    { x: 14.5, y: 5.5 },
  ], 2600),
  walker('hills_4', 'hills', 'passer_7', [
    { x: 28.5, y: 5.5 },
    { x: 33.5, y: 9.5 },
    { x: 25.5, y: 9.5 },
  ], 800, 2),
  stander('hills_5', 'hills', 'passer_4', { x: 32.5, y: 7.5 }),
  walker('hills_6', 'hills', 'passer_8', [
    { x: 5.5, y: 6.5 },
    { x: 9.5, y: 9.5 },
  ], 2000, 1.1),
  walker('hills_7', 'hills', 'passer_11', [
    { x: 24.5, y: 3.5 },
    { x: 33.5, y: 3.5 },
    { x: 22.5, y: 3.5 },
  ], 1100, 1.7),
  stander('hills_8', 'hills', 'staff_apron', { x: 9.5, y: 3.5 }),
  walker('hills_9', 'hills', 'passer_12', [
    { x: 37.5, y: 5.5 },
    { x: 27.5, y: 5.5 },
  ], 1900, 1.3),
  stander('hills_10', 'hills', 'passer_8', { x: 13.5, y: 6.5 }),

  // — Даунтаун: площадь наверху (ряды 2–5), улица внизу (ряды 6–12) —
  walker('dt_1', 'downtown', 'passer_7', [
    { x: 2.5, y: 6.5 },
    { x: 34.5, y: 6.5 },
  ], 400, 1.9),
  walker('dt_2', 'downtown', 'passer_2', [
    { x: 34.5, y: 11.5 },
    { x: 3.5, y: 11.5 },
  ], 400, 1.8),
  walker('dt_3', 'downtown', 'passer_1', [
    { x: 11.5, y: 6.5 },
    { x: 11.5, y: 12.5 },
  ], 1200, 1.5),
  walker('dt_4', 'downtown', 'passer_3', [
    { x: 24.5, y: 12.5 },
    { x: 29.5, y: 7.5 },
    { x: 22.5, y: 8.5 },
  ], 700),
  stander('dt_5', 'downtown', 'passer_5', { x: 15.5, y: 9.5 }),
  named('rival', 'downtown', { x: 20.5, y: 10.5 }, 'npc.rival'),
  walker('dt_7', 'downtown', 'passer_9', [
    { x: 35.5, y: 8.5 },
    { x: 27.5, y: 9.5 },
  ], 1600, 1.3),
  walker('dt_8', 'downtown', 'passer_6', [
    { x: 4.5, y: 3.5 },
    { x: 17.5, y: 3.5 },
    { x: 30.5, y: 3.5 },
  ], 500, 2),
  stander('dt_9', 'downtown', 'passer_12', { x: 8.5, y: 4.5 }),
  stander('dt_10', 'downtown', 'passer_11', { x: 26.5, y: 2.5 }),
  walker('dt_11', 'downtown', 'passer_3', [
    { x: 35.5, y: 2.5 },
    { x: 35.5, y: 4.5 },
  ], 1500, 1.4),

  // — Бульвар: очередь в клуб, гуляющие, кто-то курит у входа —
  walker('blvd_1', 'boulevard', 'passer_5', [
    { x: 3.5, y: 7.5 },
    { x: 20.5, y: 7.5 },
    { x: 39.5, y: 7.5 },
  ], 800),
  walker('blvd_2', 'boulevard', 'passer_1', [
    { x: 39.5, y: 11.5 },
    { x: 18.5, y: 11.5 },
    { x: 4.5, y: 11.5 },
  ], 1100),
  stander('blvd_3', 'boulevard', 'passer_3', { x: 5.5, y: 2.5 }),
  stander('blvd_4', 'boulevard', 'passer_10', { x: 6.5, y: 3.5 }),
  stander('blvd_5', 'boulevard', 'passer_2', { x: 7.5, y: 2.5 }),
  walker('blvd_6', 'boulevard', 'passer_4', [
    { x: 14.5, y: 3.5 },
    { x: 14.5, y: 11.5 },
  ], 1800, 1.2),
  walker('blvd_7', 'boulevard', 'passer_8', [
    { x: 32.5, y: 11.5 },
    { x: 26.5, y: 5.5 },
  ], 1300),
  named('blogger', 'boulevard', { x: 20.5, y: 3.5 }, 'npc.blogger'),
  stander('blvd_9', 'boulevard', 'passer_9', { x: 16.5, y: 2.5 }),
  stander('blvd_10', 'boulevard', 'passer_12', { x: 18.5, y: 2.5 }),
  walker('blvd_11', 'boulevard', 'passer_11', [
    { x: 38.5, y: 2.5 },
    { x: 29.5, y: 4.5 },
    { x: 36.5, y: 6.5 },
  ], 900, 1.7),
  stander('blvd_12', 'boulevard', 'staff_apron', { x: 13.5, y: 2.5 }),

  // — Причал: улица наверху (ряды 2–7), берег внизу (ряды 8–14) —
  walker('pier_1', 'pier', 'passer_9', [
    { x: 4.5, y: 9.5 },
    { x: 18.5, y: 9.5 },
  ], 2400, 1),
  walker('pier_2', 'pier', 'passer_3', [
    { x: 25.5, y: 8.5 },
    { x: 25.5, y: 13.5 },
  ], 2000, 1.1),
  stander('pier_3', 'pier', 'passer_2', { x: 12.5, y: 6.5 }),
  stander('pier_4', 'pier', 'passer_7', { x: 13.5, y: 7.5 }),
  walker('pier_5', 'pier', 'passer_1', [
    { x: 36.5, y: 9.5 },
    { x: 20.5, y: 10.5 },
    { x: 34.5, y: 12.5 },
  ], 900, 1.7),
  walker('pier_6', 'pier', 'passer_12', [
    { x: 3.5, y: 2.5 },
    { x: 15.5, y: 2.5 },
  ], 2100, 1.2),
  stander('pier_7', 'pier', 'passer_11', { x: 30.5, y: 2.5 }),
  stander('pier_8', 'pier', 'passer_6', { x: 32.5, y: 3.5 }),

  // — квартира: соседка за стеной не нужна, дом должен быть пустым —

  // — вокальная студия —
  stander('studio_pupil', 'vocal_studio', 'passer_10', { x: 9.5, y: 5.5 }),
  named('teacher', 'vocal_studio', { x: 7.5, y: 3.5 }, 'npc.teacher'),

  // — репбаза —
  stander('band_guitar', 'rehearsal_base', 'passer_1', { x: 6.5, y: 4.5 }),
  stander('band_drums', 'rehearsal_base', 'passer_4', { x: 11.5, y: 4.5 }),
  walker('base_sound', 'rehearsal_base', 'passer_3', [
    { x: 2.5, y: 7.5 },
    { x: 6.5, y: 6.5 },
  ], 3000, 0.8),

  // — ресторан —
  walker('waiter', 'restaurant', 'passer_6', [
    { x: 2.5, y: 6.5 },
    { x: 12.5, y: 5.5 },
    { x: 7.5, y: 8.5 },
  ], 700, 1.3),
  stander('diner_1', 'restaurant', 'passer_2', { x: 3.5, y: 4.5 }),
  stander('diner_2', 'restaurant', 'passer_5', { x: 11.5, y: 5.5 }),

  // — клуб —
  walker('club_guest_1', 'club_vertigo', 'passer_1', [
    { x: 4.5, y: 8.5 },
    { x: 10.5, y: 7.5 },
  ], 1100),
  walker('club_guest_2', 'club_vertigo', 'passer_5', [
    { x: 12.5, y: 5.5 },
    { x: 6.5, y: 8.5 },
  ], 1400),
  stander('bartender', 'club_vertigo', 'passer_3', { x: 2.5, y: 7.5 }),
  named('promoter', 'club_vertigo', { x: 16.5, y: 4.5 }, 'npc.promoter'),
  walker('club_guest_3', 'club_vertigo', 'passer_9', [
    { x: 8.5, y: 8.5 },
    { x: 12.5, y: 9.5 },
    { x: 9.5, y: 11.5 },
  ], 600, 1.2),
  stander('club_guest_4', 'club_vertigo', 'passer_10', { x: 11.5, y: 7.5 }),
  stander('club_guest_5', 'club_vertigo', 'passer_12', { x: 6.5, y: 10.5 }),
  walker('club_guest_6', 'club_vertigo', 'passer_2', [
    { x: 15.5, y: 8.5 },
    { x: 12.5, y: 6.5 },
  ], 900, 1),
  stander('club_guest_7', 'club_vertigo', 'passer_7', { x: 14.5, y: 11.5 }),

  // — студия звукозаписи —
  named('engineer', 'record_studio', { x: 11.5, y: 4.5 }, 'npc.engineer'),

  // — магазин одежды —
  stander('shop_clerk', 'clothes_shop', 'staff_apron', { x: 6.5, y: 3.5 }),
  walker('shopper', 'clothes_shop', 'passer_1', [
    { x: 3.5, y: 7.5 },
    { x: 11.5, y: 6.5 },
  ], 1800, 1.1),

  // — фониатр —
  stander('doctor', 'phoniatrist', 'passer_7', { x: 6.5, y: 3.5 }),
  stander('patient', 'phoniatrist', 'passer_5', { x: 2.5, y: 7.5 }),

  // — спортзал —
  walker('gym_runner', 'gym', 'passer_3', [
    { x: 3.5, y: 6.5 },
    { x: 11.5, y: 6.5 },
  ], 400, 2),
  stander('gym_coach', 'gym', 'staff_coach', { x: 9.5, y: 3.5 }),
];

export function crowdIn(locationId: string): CrowdMember[] {
  return CROWD.filter((member) => member.locationId === locationId);
}
