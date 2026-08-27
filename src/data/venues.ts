import type { VenueDef } from '@core/types';

/**
 * Площадки карьерной лестницы (9.5).
 *
 * Пороги оценки посажены на реальную кривую навыков из симулятора:
 * с прежними значениями игрок проваливал корпоратив три десятка раз
 * подряд, а провал не даёт славы вовсе — прогресс упирался в стену.
 *
 * Отдача по славе выставлена так, чтобы за 60 дней срез проходился:
 * пороги допуска (клуб — слава 150) заданы документом, поэтому крутить
 * приходится именно выдачу. Шкала подобрана симулятором: переход доводит
 * примерно до 70, корпоративы до 190, бар пробивает 150 к середине среза,
 * оставляя время на сам клубный концерт. Ресторан «Соната» сюда не входит:
 * документ описывает его как стабильную подработку, а не сцену с оценкой,
 * поэтому он остался обычным действием.
 *
 * Отдельной локации «бар» в разделе 8 нет, поэтому барная ступень — это
 * открытый микрофон в «Vertigo»: та же локация, другая сцена.
 */
export const VENUES: readonly VenueDef[] = [
  {
    id: 'underpass',
    nameKey: 'venue.underpass',
    locationId: 'district',
    tier: 'underpass',
    slots: ['day', 'evening'],
    timeCost: 1,
    setlist: { min: 2, max: 4 },
    loadPerSong: 2.2,
    energyPerSong: 10,
    requires: {},
    // Нижняя ступень обязана пускать новичка: со стартовыми статами
    // оценка выходит около шести, и порог 8 не проходил никто.
    thresholds: { ok: 5, good: 12, triumph: 22 },
    // Переход должен кормить впроголодь: неделя пения здесь не закрывает
    // аренду, иначе игроку незачем лезть на следующую ступень.
    interceptable: false,
    payout: { base: 100, perSong: 90 },
    fame: { base: 2, perSong: 3 },
    fameCeiling: 70,
    fansPerFame: 1.2,
  },
  {
    id: 'corporate',
    nameKey: 'venue.corporate',
    locationId: 'district',
    tier: 'events',
    slots: ['day', 'evening'],
    timeCost: 2,
    setlist: { min: 3, max: 5 },
    loadPerSong: 3,
    energyPerSong: 9,
    requires: { fame: 25, image: 2 },
    thresholds: { ok: 10, good: 18, triumph: 28 },
    interceptable: true,
    payout: { base: 1800, perSong: 700 },
    fame: { base: 4.5, perSong: 4.8 },
    fameCeiling: 190,
    fansPerFame: 1.6,
  },
  {
    id: 'bar_stage',
    nameKey: 'venue.barStage',
    locationId: 'club_vertigo',
    tier: 'bar',
    slots: ['evening', 'night'],
    timeCost: 1,
    setlist: { min: 3, max: 5 },
    loadPerSong: 3.4,
    energyPerSong: 10,
    requires: { fame: 60, image: 4 },
    thresholds: { ok: 16, good: 26, triumph: 38 },
    interceptable: true,
    payout: { base: 1800, perSong: 700 },
    fame: { base: 6, perSong: 5 },
    fameCeiling: 420,
    fansPerFame: 2.2,
  },
  {
    id: 'club_stage',
    nameKey: 'venue.clubStage',
    locationId: 'club_vertigo',
    tier: 'club',
    slots: ['evening', 'night'],
    timeCost: 2,
    setlist: { min: 4, max: 5 },
    loadPerSong: 4.5,
    energyPerSong: 12,
    requires: { fame: 150, image: 7 },
    thresholds: { ok: 24, good: 36, triumph: 50 },
    interceptable: true,
    payout: { base: 6000, perSong: 1600 },
    fame: { base: 9, perSong: 6 },
    fameCeiling: 900,
    fansPerFame: 3,
  },
];

const BY_ID = new Map(VENUES.map((venue) => [venue.id, venue]));

export function getVenue(id: string): VenueDef {
  const venue = BY_ID.get(id);
  if (!venue) throw new Error(`Неизвестная площадка: "${id}"`);
  return venue;
}

export function hasVenue(id: string): boolean {
  return BY_ID.has(id);
}

/** Площадки, куда игрок в принципе допущен по славе и имиджу. */
export function venuesForTier(fame: number, image: number): VenueDef[] {
  return VENUES.filter(
    (venue) => fame >= (venue.requires.fame ?? 0) && image >= (venue.requires.image ?? 0),
  );
}
