/**
 * Растровый шрифт набирается вручную, поэтому запись должна читаться как
 * рисунок: '#' — пиксель, '.' — пустота, по строке на ряд.
 *
 * Ряды считаются от верха прописной буквы. Базовая линия проходит после
 * ряда 6, ряды 7 и 8 отданы выносным элементам (у, р, д, Ц).
 */
export interface Glyph {
  /** Номер ряда, с которого начинается рисунок. */
  readonly top: number;
  readonly rows: readonly string[];
  /** Ширина в пикселях: у пустых знаков её не вывести из рисунка. */
  readonly width: number;
}

/**
 * Пустые колонки по краям срезаются: рисовать «о» как `.###.` удобно —
 * так видно, что буква круглая, — но если оставить поля в шрифте, между
 * буквами набегает по два пикселя и текст расползается.
 */
export function g(top: number, ...rows: readonly string[]): Glyph {
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const padded = rows.map((row) => row.padEnd(width, '.'));
  const inked = (column: number): boolean => padded.some((row) => row[column] === '#');

  let left = 0;
  while (left < width && !inked(left)) left += 1;
  // Пробел: рисунка нет, остаётся только объявленная ширина.
  if (left === width) return { top, rows: padded, width };

  let right = width - 1;
  while (right > left && !inked(right)) right -= 1;

  return { top, rows: padded.map((row) => row.slice(left, right + 1)), width: right - left + 1 };
}
