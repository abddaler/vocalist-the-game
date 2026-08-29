import { beforeEach, describe, expect, it } from 'vitest';
import { devFlag, readDevFlags, toggleDevFlag } from './devtools';

const reset = (): void => {
  for (const flag of ['iso', 'plain'] as const) if (devFlag(flag)) toggleDevFlag(flag);
};

describe('переключатели разработки', () => {
  beforeEach(reset);

  it('по умолчанию выключены', () => {
    expect(devFlag('iso')).toBe(false);
    expect(devFlag('plain')).toBe(false);
  });

  it('включаются из адреса страницы', () => {
    readDevFlags('?debug=iso');
    expect(devFlag('iso')).toBe(true);
    expect(devFlag('plain')).toBe(false);
  });

  it('в адресе можно перечислить несколько', () => {
    readDevFlags('?debug=iso,plain');
    expect(devFlag('iso')).toBe(true);
    expect(devFlag('plain')).toBe(true);
  });

  it('чужое имя не включает ничего', () => {
    readDevFlags('?debug=whatever');
    expect(devFlag('iso')).toBe(false);
  });

  it('переключение возвращает новое состояние', () => {
    expect(toggleDevFlag('iso')).toBe(true);
    expect(toggleDevFlag('iso')).toBe(false);
  });
});
