import type { LocationDef } from '@core/types';
import { ACTIVITIES } from './activities';

/** Все уроки студии — их набор задаётся таблицей в activities/lessons.ts. */
const STUDIO_LESSONS = ACTIVITIES.filter((activity) => activity.id.startsWith('lesson_')).map(
  (activity) => activity.id,
);

/**
 * Девять локаций района (раздел 8). Часы работы задают, в каких слотах
 * дверь открыта; экран района и ходьба приедут на вехе 5.
 *
 * «Район» — не локация, а улица между ними: там стоит переход, в котором
 * начинается карьера.
 */
export const LOCATIONS: readonly LocationDef[] = [
  {
    id: 'apartment',
    nameKey: 'location.apartment',
    openSlots: ['morning', 'day', 'evening', 'night'],
    activities: ['sleep', 'warmup', 'vocal_rest', 'tea_regimen', 'home_rest'],
    venues: [],
  },
  {
    id: 'vocal_studio',
    nameKey: 'location.vocalStudio',
    openSlots: ['morning', 'day'],
    activities: STUDIO_LESSONS,
    venues: [],
  },
  {
    id: 'rehearsal_base',
    nameKey: 'location.rehearsalBase',
    openSlots: ['morning', 'day', 'evening'],
    activities: ['practice_free', 'band_rehearsal'],
    venues: [],
  },
  {
    id: 'restaurant',
    nameKey: 'location.restaurant',
    openSlots: ['evening'],
    activities: ['restaurant_shift'],
    venues: [],
  },
  {
    id: 'club_vertigo',
    nameKey: 'location.clubVertigo',
    openSlots: ['evening', 'night'],
    activities: ['networking'],
    venues: ['bar_stage', 'club_stage'],
  },
  {
    id: 'record_studio',
    nameKey: 'location.recordStudio',
    openSlots: ['morning', 'day'],
    activities: ['record_single'],
    venues: [],
  },
  {
    id: 'clothes_shop',
    nameKey: 'location.clothesShop',
    openSlots: ['day', 'evening'],
    activities: ['shopping'],
    venues: [],
  },
  {
    id: 'phoniatrist',
    nameKey: 'location.phoniatrist',
    openSlots: ['morning', 'day'],
    activities: ['doctor_visit', 'checkup'],
    venues: [],
  },
  {
    id: 'gym',
    nameKey: 'location.gym',
    openSlots: ['morning', 'day', 'evening'],
    activities: ['gym'],
    venues: [],
  },
  {
    id: 'district',
    nameKey: 'location.district',
    openSlots: ['morning', 'day', 'evening', 'night'],
    activities: [],
    venues: ['underpass', 'corporate'],
  },
];

const BY_ID = new Map(LOCATIONS.map((location) => [location.id, location]));

export function getLocation(id: string): LocationDef {
  const location = BY_ID.get(id);
  if (!location) throw new Error(`Неизвестная локация: "${id}"`);
  return location;
}

/** Локация, в которой можно выполнить это действие. */
export function locationOfActivity(activityId: string): LocationDef | undefined {
  return LOCATIONS.find((location) => location.activities.includes(activityId));
}
