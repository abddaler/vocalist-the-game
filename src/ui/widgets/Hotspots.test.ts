import { describe, expect, it, vi } from 'vitest';
import type { GameButton, InputController, TapPoint } from '@platform/input';
import { Hotspots } from './Hotspots';

class FakeInput implements InputController {
  readonly move = { x: 0, y: 0 };
  private tap: TapPoint | null = null;
  private pressed: GameButton | null = null;

  tapAt(x: number, y: number): void {
    this.tap = { x, y };
  }

  press(button: GameButton): void {
    this.pressed = button;
  }

  isDown(): boolean {
    return false;
  }

  justPressed(button: GameButton): boolean {
    const hit = this.pressed === button;
    this.pressed = null;
    return hit;
  }

  consumeTap(): TapPoint | null {
    const tap = this.tap;
    this.tap = null;
    return tap;
  }

  update(): void {}
  destroy(): void {}
}

const spot = (x: number, y: number, onActivate = vi.fn(), enabled = true) => ({
  rect: { x, y, w: 40, h: 20 },
  label: `spot-${x}-${y}`,
  enabled,
  onActivate,
});

describe('минимальная область тапа', () => {
  it('меньше 16x16 не принимается — это ограничение 2.4', () => {
    const hotspots = new Hotspots();
    expect(() =>
      hotspots.add({ rect: { x: 0, y: 0, w: 15, h: 20 }, label: 'узкая', enabled: true, onActivate: () => {} }),
    ).toThrow(/16x16/);
    expect(() =>
      hotspots.add({ rect: { x: 0, y: 0, w: 20, h: 8 }, label: 'низкая', enabled: true, onActivate: () => {} }),
    ).toThrow(/16x16/);
  });

  it('ровно 16x16 проходит', () => {
    const hotspots = new Hotspots();
    expect(() =>
      hotspots.add({ rect: { x: 0, y: 0, w: 16, h: 16 }, label: 'ок', enabled: true, onActivate: () => {} }),
    ).not.toThrow();
  });
});

describe('попадание тапом', () => {
  it('срабатывает внутри и молчит снаружи', () => {
    const hotspots = new Hotspots();
    const onActivate = vi.fn();
    hotspots.add(spot(10, 10, onActivate));

    const input = new FakeInput();
    input.tapAt(20, 15);
    expect(hotspots.handle(input)).toBe(true);
    expect(onActivate).toHaveBeenCalledTimes(1);

    input.tapAt(100, 100);
    expect(hotspots.handle(input)).toBe(false);
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('границы: левый верхний угол внутри, правый нижний — уже нет', () => {
    const hotspots = new Hotspots();
    const onActivate = vi.fn();
    hotspots.add(spot(10, 10, onActivate));

    const input = new FakeInput();
    input.tapAt(10, 10);
    hotspots.handle(input);
    input.tapAt(50, 30);
    hotspots.handle(input);
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('выключенную зону не нажать', () => {
    const hotspots = new Hotspots();
    const onActivate = vi.fn();
    hotspots.add(spot(10, 10, onActivate, false));

    const input = new FakeInput();
    input.tapAt(20, 15);
    expect(hotspots.handle(input)).toBe(false);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('тап переносит фокус на нажатое', () => {
    const hotspots = new Hotspots();
    hotspots.add(spot(10, 10));
    const second = spot(10, 40);
    hotspots.add(second);

    const input = new FakeInput();
    input.tapAt(20, 45);
    hotspots.handle(input);
    expect(hotspots.isFocused(second)).toBe(true);
  });
});

describe('клавиатура делает то же, что тап (ограничение 2.2)', () => {
  it('confirm жмёт то, что в фокусе', () => {
    const hotspots = new Hotspots();
    const onActivate = vi.fn();
    hotspots.add(spot(10, 10, onActivate));

    const input = new FakeInput();
    input.press('confirm');
    expect(hotspots.handle(input)).toBe(true);
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('фокус ходит по кругу и пропускает выключенные', () => {
    const hotspots = new Hotspots();
    const first = spot(10, 10);
    const disabled = spot(10, 40, vi.fn(), false);
    const last = spot(10, 70);
    hotspots.add(first);
    hotspots.add(disabled);
    hotspots.add(last);

    hotspots.moveFocus(1);
    expect(hotspots.isFocused(last)).toBe(true);
    hotspots.moveFocus(1);
    expect(hotspots.isFocused(first)).toBe(true);
    hotspots.moveFocus(-1);
    expect(hotspots.isFocused(last)).toBe(true);
  });

  it('на пустом экране фокус никуда не уходит', () => {
    const hotspots = new Hotspots();
    expect(() => hotspots.moveFocus(1)).not.toThrow();
    expect(hotspots.focusedIndex).toBe(0);
  });
});

describe('очистка', () => {
  it('сбрасывает зоны и фокус между кадрами', () => {
    const hotspots = new Hotspots();
    hotspots.add(spot(10, 10));
    hotspots.moveFocus(1);
    hotspots.clear();
    expect(hotspots.all).toHaveLength(0);
    expect(hotspots.focusedIndex).toBe(0);
  });
});
