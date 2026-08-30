/**
 * Переключатели разработки. Живут в platform/, потому что их включает
 * не игра, а тот, кто её запускает: клавишей на клавиатуре или адресом
 * страницы. В сборку они входят, но по умолчанию выключены и не стоят
 * ничего, кроме одного `if` в кадре.
 *
 * `?debug=iso` включает сетку сразу — на телефоне клавиши F1 нет, а
 * посмотреть на сортировку по глубине нужно именно там.
 *
 * Флаги съёмки нужны разбору локаций: кадр для ревью обязан быть
 * воспроизводим побитово. Ревью по нестабильным снимкам хуже отсутствия
 * ревью — оно даёт ложную уверенность.
 */
export type DevFlag = 'iso' | 'plain' | 'bare' | 'still' | 'cast' | 'walk' | 'hook';

const FLAGS: Record<DevFlag, boolean> = {
  /** Сетка плиток, номера глубины, непроходимые клетки. */
  iso: false,
  /** Весь мир заглушками. */
  plain: false,
  /** Без интерфейса: чистый кадр локации. */
  bare: false,
  /** Время стоит: толпа не идёт, пузыри не всплывают, дыхания нет. */
  still: false,
  /** Игрок сразу в восьми точках: проверка, что его везде видно. */
  cast: false,
  /** Заливка проходимого пола поверх сцены. */
  walk: false,
  /**
   * Ручка перехода в локацию для съёмки. Узкая нарочно: снимку нужно
   * попасть в место, а не управлять игрой, и открывать ради этого всю
   * сцену — значит завести второй способ ею пользоваться.
   */
  hook: false,
};

const NAMES = Object.keys(FLAGS) as readonly DevFlag[];

/**
 * Что просили в адресе страницы. Разбирается один раз при загрузке:
 * читать location в каждом кадре незачем.
 */
export function readDevFlags(search: string): void {
  const asked = new URLSearchParams(search).get('debug');
  if (!asked) return;
  for (const name of asked.split(',')) {
    const flag = NAMES.find((known) => known === name);
    if (flag) FLAGS[flag] = true;
  }
}

export function devFlag(flag: DevFlag): boolean {
  return FLAGS[flag];
}

export function toggleDevFlag(flag: DevFlag): boolean {
  FLAGS[flag] = !FLAGS[flag];
  return FLAGS[flag];
}
