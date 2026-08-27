import { describe, expect, it } from 'vitest';
import { NPC_IDS, SKILL_KEYS, SLOTS, GENRE_IDS, CAREER_TIERS } from '@core/types';
import { ACTIVITIES } from '../activities';
import { ALL_EVENTS } from '../events';
import { LOCATIONS } from '../locations';
import { OUTFITS } from '../outfits';
import { VENUES } from '../venues';
import { RU } from './index';

const has = (key: string): boolean => key in RU;

/**
 * Все тексты идут через словарь (9.6). Забытый ключ виден в игре как
 * сырое `activity.foo` — этот тест ловит такое до запуска.
 */
describe('полнота словаря', () => {
  it('знает имя каждого действия', () => {
    for (const activity of ACTIVITIES) {
      expect(has(activity.nameKey), activity.nameKey).toBe(true);
    }
  });

  it('знает имя каждой площадки, локации и предмета одежды', () => {
    for (const venue of VENUES) expect(has(venue.nameKey), venue.nameKey).toBe(true);
    for (const location of LOCATIONS) expect(has(location.nameKey), location.nameKey).toBe(true);
    for (const item of OUTFITS) expect(has(item.nameKey), item.nameKey).toBe(true);
  });

  it('знает заголовок, текст и каждый выбор всех событий', () => {
    for (const event of ALL_EVENTS) {
      expect(has(event.titleKey), event.titleKey).toBe(true);
      expect(has(event.textKey), event.textKey).toBe(true);
      for (const choice of event.choices) {
        expect(has(choice.textKey), choice.textKey).toBe(true);
        if (choice.risk) expect(has(choice.risk.textKey), choice.risk.textKey).toBe(true);
      }
    }
  });

  it('знает название и подсказку каждого стата (9.6)', () => {
    for (const key of SKILL_KEYS) {
      expect(has(`skill.${key}`), key).toBe(true);
      expect(has(`skill.${key}.hint`), key).toBe(true);
    }
  });

  it('знает слоты дня, жанры, ступени карьеры и всех NPC', () => {
    for (const slot of SLOTS) expect(has(`slot.${slot}`), slot).toBe(true);
    for (const genre of GENRE_IDS) expect(has(`genre.${genre}`), genre).toBe(true);
    for (const tier of CAREER_TIERS) expect(has(`tier.${tier}`), tier).toBe(true);
    for (const npc of NPC_IDS) {
      expect(has(`npc.${npc}`), npc).toBe(true);
      expect(has(`npc.${npc}.role`), npc).toBe(true);
    }
  });

  it('в словаре нет пустых строк', () => {
    for (const [key, value] of Object.entries(RU)) {
      expect(value.trim().length, key).toBeGreaterThan(0);
    }
  });
});
