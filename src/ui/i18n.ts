/**
 * Словарь строк (раздел 9.6). Один язык (ru), но всё — через t(),
 * чтобы локализация позже не превращалась в раскопки по сценам.
 */
const ru = {
  'app.title': 'Vocalist Sim',
  'app.subtitle': 'вертикальный срез',
  'boot.hint': 'Веха 1: каркас. Игровые сцены появятся на вехе 4.',
} as const;

export type StringKey = keyof typeof ru;

const dictionary: Record<StringKey, string> = ru;

export function t(key: StringKey): string {
  return dictionary[key] ?? key;
}
