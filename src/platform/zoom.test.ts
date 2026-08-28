import { describe, expect, it } from 'vitest';
import { chooseZoom, isPortraitBlocked } from './zoom';

describe('подбор зума', () => {
  it('берёт целое, когда округление почти ничего не стоит', () => {
    expect(chooseZoom(1920, 1080)).toBe(4);
    expect(chooseZoom(960, 540)).toBe(2);
    expect(chooseZoom(1000, 560)).toBe(2);
  });

  it('берёт дробное, когда целое отняло бы заметную долю экрана', () => {
    // 844x390 — телефон в ландшафте: floor дал бы ×1 и треть экрана.
    expect(chooseZoom(844, 390)).toBeCloseTo(390 / 270);
    expect(chooseZoom(1000, 500)).toBeCloseTo(500 / 270);
  });

  it('на экране меньше внутреннего разрешения показывает игру целиком', () => {
    const zoom = chooseZoom(390, 844);
    expect(zoom).toBeLessThan(1);
    expect(zoom).toBeCloseTo(390 / 480);
  });

  it('никогда не возвращает ноль или отрицательное', () => {
    for (const [w, h] of [[1, 1], [0, 0], [10, 900]]) {
      expect(chooseZoom(w as number, h as number)).toBeGreaterThan(0);
    }
  });

  it('вписывается в экран при любом размере', () => {
    for (const [w, h] of [[1920, 1080], [844, 390], [390, 844], [1280, 800], [480, 270]]) {
      const zoom = chooseZoom(w as number, h as number);
      expect(480 * zoom).toBeLessThanOrEqual((w as number) + 0.001);
      expect(270 * zoom).toBeLessThanOrEqual((h as number) + 0.001);
    }
  });
});

describe('узкий портрет', () => {
  it('на телефоне в портрете просит повернуть', () => {
    expect(isPortraitBlocked(390, 844)).toBe(true);
    expect(isPortraitBlocked(360, 640)).toBe(true);
  });

  it('в ландшафте и на широких экранах не мешает', () => {
    expect(isPortraitBlocked(844, 390)).toBe(false);
    expect(isPortraitBlocked(1920, 1080)).toBe(false);
    expect(isPortraitBlocked(768, 1024)).toBe(false);
  });
});
