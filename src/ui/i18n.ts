import { RU } from '@data/text';
import type { CommonKey } from '@data/text';

/**
 * Рендер строк (раздел 9.6). Словарь живёт в data/, потому что проза —
 * это контент. Модуль обязан оставаться чистым: ни Phaser, ни DOM,
 * его читает и headless-прогон в sim/.
 */
export type StringKey = CommonKey | (string & {});

export type TemplateParams = Readonly<Record<string, string | number>>;

/** Подстановка вида {name}. Неизвестный ключ возвращается как есть — видно сразу. */
export function t(key: StringKey, params?: TemplateParams): string {
  const template = RU[key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export function has(key: string): boolean {
  return key in RU;
}
