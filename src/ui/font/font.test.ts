import { describe, expect, it } from 'vitest';
import { RU } from '@data/text';
import { FONT_METRICS, GLYPHS } from './glyphs';
import { advanceOf, glyphOf, measureLine, wrapText } from './metrics';

const ROWS = FONT_METRICS.height;

describe('глифы', () => {
  it('умещаются в высоту шрифта', () => {
    for (const [char, glyph] of Object.entries(GLYPHS)) {
      expect(glyph.top + glyph.rows.length, `${char} вылезает за строку`).toBeLessThanOrEqual(ROWS);
    }
  });

  it('нарисованы прямоугольником: ряды одной ширины', () => {
    for (const [char, glyph] of Object.entries(GLYPHS)) {
      for (const row of glyph.rows) {
        expect(row.length, `${char}: ряд «${row}» не той ширины`).toBe(glyph.width);
      }
    }
  });

  it('состоят только из точек и решёток', () => {
    for (const [char, glyph] of Object.entries(GLYPHS)) {
      for (const row of glyph.rows) {
        expect(row, `${char}: посторонний символ в рисунке`).toMatch(/^[.#]*$/);
      }
    }
  });

  it('покрывают весь текст игры', () => {
    const missing = new Set<string>();
    for (const line of Object.values(RU)) {
      // Подстановки вида {day} в текст не попадают: их заменяет t().
      for (const char of line.replace(/\{\w+\}/g, '')) {
        if (!(char in GLYPHS)) missing.add(char);
      }
    }
    expect([...missing].join(''), 'нет глифа для этих символов').toBe('');
  });

  it('покрывают цифры и латиницу: их подставляют в строки', () => {
    for (const char of '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      expect(char in GLYPHS, `нет глифа ${char}`).toBe(true);
    }
  });
});

describe('метрика', () => {
  it('заменяет неизвестный символ видимой заглушкой', () => {
    expect(glyphOf('☃')).toBe(GLYPHS[FONT_METRICS.fallback]);
  });

  it('ширина строки складывается из шагов без просвета в конце', () => {
    expect(measureLine('')).toBe(0);
    expect(measureLine('А')).toBe(GLYPHS['А']!.width);
    expect(measureLine('АА')).toBe(GLYPHS['А']!.width * 2 + FONT_METRICS.letterSpacing);
  });

  it('шаг шире рисунка ровно на просвет', () => {
    expect(advanceOf('А')).toBe(GLYPHS['А']!.width + FONT_METRICS.letterSpacing);
  });
});

describe('перенос', () => {
  it('не режет строку, которая и так помещается', () => {
    expect(wrapText('раз два', 200)).toEqual(['раз два']);
  });

  it('переносит по словам, не превышая ширину', () => {
    const lines = wrapText('раз два три четыре пять', 40);
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) expect(measureLine(line)).toBeLessThanOrEqual(40);
  });

  it('не теряет и не добавляет слов', () => {
    const source = 'связки требуют отдыха после каждого концерта';
    expect(wrapText(source, 50).join(' ')).toBe(source);
  });

  it('оставляет слишком длинное слово целым: разрыв читался бы опечаткой', () => {
    expect(wrapText('электрификация', 10)).toEqual(['электрификация']);
  });

  it('уважает готовый перенос строки', () => {
    expect(wrapText('раз\nдва', 200)).toEqual(['раз', 'два']);
  });
});
