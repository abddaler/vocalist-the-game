import { FONT_METRICS, GLYPHS } from './glyphs';
import type { Glyph } from './glyphs';

/** Символ без собственного рисунка заменяется видимой заглушкой. */
export function glyphOf(char: string): Glyph {
  return GLYPHS[char] ?? GLYPHS[FONT_METRICS.fallback]!;
}

export function advanceOf(char: string): number {
  return glyphOf(char).width + FONT_METRICS.letterSpacing;
}

export function measureLine(line: string): number {
  let width = 0;
  for (const char of line) width += advanceOf(char);
  // Просвет после последней буквы в ширину надписи не входит.
  return Math.max(0, width - FONT_METRICS.letterSpacing);
}

/**
 * Перенос по словам. Слово длиннее строки не режется: в игре таких нет,
 * а разрыв посреди слова читается как опечатка.
 */
export function wrapText(text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && measureLine(candidate) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}

export function measureBlock(lines: readonly string[]): { width: number; height: number } {
  const width = lines.reduce((max, line) => Math.max(max, measureLine(line)), 0);
  const height =
    lines.length === 0
      ? 0
      : FONT_METRICS.height + (lines.length - 1) * FONT_METRICS.lineHeight;
  return { width, height };
}
