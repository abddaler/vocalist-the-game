/**
 * Переключатели разработки. Живут в platform/, потому что их включает
 * не игра, а тот, кто её запускает: клавишей на клавиатуре или адресом
 * страницы. В сборку они входят, но по умолчанию выключены и не стоят
 * ничего, кроме одного `if` в кадре.
 *
 * `?debug=iso` включает сетку сразу — на телефоне клавиши F1 нет, а
 * посмотреть на сортировку по глубине нужно именно там.
 */
export type DevFlag = 'iso' | 'plain';

const FLAGS: Record<DevFlag, boolean> = { iso: false, plain: false };

/**
 * Что просили в адресе страницы. Разбирается один раз при загрузке:
 * читать location в каждом кадре незачем.
 */
export function readDevFlags(search: string): void {
  const asked = new URLSearchParams(search).get('debug');
  if (!asked) return;
  for (const name of asked.split(',')) {
    if (name === 'iso' || name === 'plain') FLAGS[name] = true;
  }
}

export function devFlag(flag: DevFlag): boolean {
  return FLAGS[flag];
}

export function toggleDevFlag(flag: DevFlag): boolean {
  FLAGS[flag] = !FLAGS[flag];
  return FLAGS[flag];
}
