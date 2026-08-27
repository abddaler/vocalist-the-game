import type { ActivityDef } from '@core/types';
import { parseActivities } from './schema';

/**
 * Действия вехи 2 — механический словарь, на котором проверяются системы.
 * Привязка к локациям, концерты и запись синглов приезжают на вехе 3
 * (разделы 8 и 9.1); добавление записи сюда не требует правок в системах.
 *
 * Деньги — рубли. Ориентир: смена в ресторане 1800, урок 1800,
 * аренда 15000 в месяц.
 */
export const ACTIVITIES: readonly ActivityDef[] = parseActivities([
  {
    id: 'sleep',
    nameKey: 'activity.sleep',
    tags: ['sleep'],
    requires: { slots: ['night'] },
    energy: 70,
    vocalHealth: 8,
    mood: 2,
  },
  {
    id: 'warmup',
    nameKey: 'activity.warmup',
    tags: ['warmup', 'vocal'],
    requires: { slots: ['morning', 'day', 'evening'] },
    baseLoad: 2,
    energy: -5,
    skillGain: { breathSupport: 0.3 },
  },
  {
    id: 'vocal_rest',
    nameKey: 'activity.vocalRest',
    tags: ['silence', 'rest'],
    requires: { slots: ['morning', 'day', 'evening'] },
    energy: 5,
    vocalHealth: 6,
    mood: -3,
  },
  {
    id: 'tea_regimen',
    nameKey: 'activity.teaRegimen',
    tags: ['rest'],
    money: -150,
    energy: 3,
    vocalHealth: 3,
    mood: 2,
  },
  {
    id: 'lesson_breath',
    nameKey: 'activity.lessonBreath',
    tags: ['training', 'vocal'],
    requires: { slots: ['morning', 'day'] },
    baseLoad: 6,
    energy: -20,
    money: -1800,
    skillGain: { breathSupport: 2.2, stamina: 0.3 },
    mood: 1,
  },
  {
    id: 'lesson_timbre',
    nameKey: 'activity.lessonTimbre',
    tags: ['training', 'vocal'],
    requires: { slots: ['morning', 'day'] },
    baseLoad: 6,
    energy: -20,
    money: -1800,
    skillGain: { timbre: 2.0, registers: 0.6 },
    mood: 1,
  },
  {
    id: 'lesson_pitch',
    nameKey: 'activity.lessonPitch',
    tags: ['training', 'vocal'],
    requires: { slots: ['morning', 'day'] },
    baseLoad: 6,
    energy: -20,
    money: -1800,
    skillGain: { pitch: 2.0, diction: 0.5 },
    mood: 1,
  },
  {
    id: 'practice_free',
    nameKey: 'activity.practiceFree',
    tags: ['training', 'vocal'],
    requires: { slots: ['morning', 'day', 'evening'] },
    baseLoad: 6,
    energy: -15,
    skillGain: { breathSupport: 0.4, range: 0.7, registers: 0.7, pitch: 0.5 },
  },
  {
    id: 'gym',
    nameKey: 'activity.gym',
    tags: ['training'],
    requires: { slots: ['morning', 'day', 'evening'] },
    energy: -25,
    money: -400,
    skillGain: { stamina: 1.4 },
    mood: 3,
  },
  {
    id: 'restaurant_shift',
    nameKey: 'activity.restaurantShift',
    tags: ['work', 'vocal'],
    requires: { slots: ['evening'] },
    baseLoad: 10,
    energy: -35,
    wages: 1800,
    mood: -4,
    skillGain: { stamina: 0.5, stage: 0.4, diction: 0.2 },
    fame: 1,
  },
  {
    id: 'doctor_visit',
    nameKey: 'activity.doctorVisit',
    tags: ['medical'],
    requires: { slots: ['morning', 'day'] },
    energy: -10,
    money: -4500,
    vocalHealth: 40,
  },
]);

const BY_ID = new Map(ACTIVITIES.map((activity) => [activity.id, activity]));

export function getActivity(id: string): ActivityDef {
  const activity = BY_ID.get(id);
  if (!activity) throw new Error(`Неизвестное действие: "${id}"`);
  return activity;
}

export function hasActivity(id: string): boolean {
  return BY_ID.has(id);
}
