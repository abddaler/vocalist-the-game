import { describe, expect, it } from 'vitest';
import { BALANCE } from '@data/balance';
import { RULES, unusedKinds } from './rules';
import { locations } from './scenes';

describe('разбор локаций', () => {
  const places = locations();

  it('видит все локации: четыре района и все комнаты', () => {
    expect(places.length).toBeGreaterThanOrEqual(13);
    for (const id of ['hills', 'downtown', 'boulevard', 'pier', 'apartment']) {
      expect(places.some((place) => place.id === id), id).toBe(true);
    }
  });

  it('у каждой локации есть своя норма заполненности', () => {
    for (const place of places) {
      expect(BALANCE.scenery.fill[place.norm], place.id).toBeDefined();
    }
  });

  it('заполненность считается долей, а не суммой площадей', () => {
    // Первая версия складывала следы предметов из данных и выдавала одну
    // сотую в комнате: мебель, мелочь и стены лежат в разных списках.
    const fill = RULES[0];
    expect(fill).toBeDefined();
    for (const place of places) {
      for (const finding of fill!(place)) {
        const share = Number(finding.value);
        expect(share, place.id).toBeGreaterThan(0);
        expect(share, place.id).toBeLessThanOrEqual(1);
      }
    }
  });

  it('каждая находка называет место, величину и норму', () => {
    // «Многовато» нельзя ни подтвердить, ни оспорить, а «0.71 при норме
    // до 0.6» можно.
    for (const place of places) {
      for (const rule of RULES) {
        for (const finding of rule(place)) {
          expect(finding.location).not.toBe('');
          expect(finding.rule).not.toBe('');
          expect(finding.value).not.toBe('');
          expect(finding.norm).not.toBe('');
        }
      }
    }
  });

  it('один ровный ряд называется один раз', () => {
    const rows = RULES[2];
    expect(rows).toBeDefined();
    for (const place of places) {
      const seen = rows!(place).map((finding) => `${finding.subject}|${finding.value}`);
      expect(new Set(seen).size, place.id).toBe(seen.length);
    }
  });

  it('летающее не считается стоящим мимо земли', () => {
    // Чайка над водой — не ошибка расстановки, а чайка.
    const geometry = RULES[4];
    expect(geometry).toBeDefined();
    const pier = places.find((place) => place.id === 'pier');
    expect(pier).toBeDefined();
    for (const finding of geometry!(pier!)) {
      expect(finding.subject).not.toContain('gull');
    }
  });

  it('разбор доходит до конца на каждой локации', () => {
    for (const place of places) {
      for (const rule of RULES) expect(() => rule(place), place.id).not.toThrow();
    }
    expect(() => unusedKinds(places)).not.toThrow();
  });
});
