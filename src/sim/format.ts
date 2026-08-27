/** Оформление консольного отчёта. Никакой игровой логики здесь нет. */
const ESC = '\u001b[';
const RESET = `${ESC}0m`;
const useColor = !process.env.NO_COLOR && process.stdout.isTTY !== false;

const wrap = (code: string) => (text: string) =>
  useColor ? `${ESC}${code}m${text}${RESET}` : text;

export const dim = wrap('2');
export const bold = wrap('1');
export const green = wrap('32');
export const yellow = wrap('33');
export const red = wrap('31');
export const cyan = wrap('36');

/** Полоска ресурса: связки выделены цветом, как требует раздел 9.6. */
export function bar(value: number, max: number, width = 10): string {
  const filled = Math.round((Math.max(0, Math.min(value, max)) / max) * width);
  return '█'.repeat(filled) + dim('·'.repeat(width - filled));
}

export function healthColor(value: number): (text: string) => string {
  if (value > 70) return green;
  if (value >= 40) return yellow;
  return red;
}

export function money(value: number): string {
  const text = new Intl.NumberFormat('ru-RU').format(Math.round(value));
  return value < 0 ? red(`${text} ₽`) : `${text} ₽`;
}

/** Выравнивание с учётом невидимых ANSI-последовательностей. */
// Управляющий символ здесь по делу: срезаем ANSI-раскраску перед подсчётом длины.
// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[\d+m/g;

export function pad(text: string, width: number): string {
  const visible = text.replace(ANSI, '').length;
  return text + ' '.repeat(Math.max(0, width - visible));
}

export function rule(width = 68): string {
  return dim('─'.repeat(width));
}
