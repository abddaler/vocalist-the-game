/**
 * Абстракция сохранений (раздел 2, ограничение 6).
 * Замена localStorage на файловую систему Tauri не должна трогать игровой код.
 */
export interface SaveAdapter {
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export class LocalStorageSaveAdapter implements SaveAdapter {
  async read(key: string): Promise<string | null> {
    return globalThis.localStorage?.getItem(key) ?? null;
  }

  async write(key: string, value: string): Promise<void> {
    globalThis.localStorage?.setItem(key, value);
  }

  async remove(key: string): Promise<void> {
    globalThis.localStorage?.removeItem(key);
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
