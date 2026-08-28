/**
 * Абстракция сохранений (раздел 2, ограничение 6).
 * Замена localStorage на файловую систему Tauri не должна трогать игровой код.
 */
export interface SaveAdapter {
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

/**
 * Обращение к localStorage не всегда безобидно: браузер с запретом
 * хранилища (Safari с заблокированными куками, часть встроенных
 * вебвью) бросает SecurityError на само чтение свойства, а не
 * возвращает null. Необязательная цепочка от этого не спасает, и игра
 * падала на первом же сохранении.
 *
 * Поэтому доступ обёрнут: без хранилища игра просто не помнит прогон.
 */
function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export class LocalStorageSaveAdapter implements SaveAdapter {
  async read(key: string): Promise<string | null> {
    try {
      return storage()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  async write(key: string, value: string): Promise<void> {
    // Место может кончиться в приватном режиме: потеря сохранения — не
    // повод ронять игру.
    try {
      storage()?.setItem(key, value);
    } catch {
      /* пусто */
    }
  }

  async remove(key: string): Promise<void> {
    try {
      storage()?.removeItem(key);
    } catch {
      /* пусто */
    }
  }
}

/** Для тестов и headless-симулятора: сохранения в памяти. */
export class MemorySaveAdapter implements SaveAdapter {
  private readonly store = new Map<string, string>();

  async read(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async write(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key);
  }
}
