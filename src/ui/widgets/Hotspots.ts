import type { InputController, TapPoint } from '@platform/input';
import { LAYOUT } from '../theme';

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface Hotspot {
  readonly rect: Rect;
  readonly onActivate: () => void;
  readonly enabled: boolean;
  /** Подсказка для отладки и будущей озвучки. */
  readonly label: string;
}

const contains = (rect: Rect, point: TapPoint): boolean =>
  point.x >= rect.x && point.x < rect.x + rect.w && point.y >= rect.y && point.y < rect.y + rect.h;

/**
 * Реестр интерактивных зон экрана.
 *
 * Весь ввод идёт сюда из InputController (ограничение 2.1), а не из
 * Phaser-объектов: одна точка входа и для тапа, и для клавиатуры, и
 * гарантия, что всё нажимаемое доступно пальцем (ограничение 2.2).
 */
export class Hotspots {
  private items: Hotspot[] = [];
  private focus = 0;

  clear(): void {
    this.items = [];
    this.focus = 0;
  }

  add(hotspot: Hotspot): void {
    if (hotspot.rect.w < LAYOUT.minTap || hotspot.rect.h < LAYOUT.minTap) {
      throw new Error(
        `Область тапа «${hotspot.label}» меньше ${LAYOUT.minTap}x${LAYOUT.minTap}: ` +
          `${hotspot.rect.w}x${hotspot.rect.h}`,
      );
    }
    this.items.push(hotspot);
  }

  get all(): readonly Hotspot[] {
    return this.items;
  }

  get focusedIndex(): number {
    return this.focus;
  }

  isFocused(hotspot: Hotspot): boolean {
    return this.items[this.focus] === hotspot;
  }

  /**
   * Возвращает true, если что-то сработало и экран надо перерисовать.
   * onMiss получает тап, не попавший ни в одну зону: на экране мира это
   * приказ идти в указанное место.
   */
  handle(input: InputController, onMiss?: (tap: TapPoint) => void): boolean {
    const tap = input.consumeTap();
    if (tap) {
      const hit = this.items.find((item) => item.enabled && contains(item.rect, tap));
      if (hit) {
        this.focus = this.items.indexOf(hit);
        hit.onActivate();
        return true;
      }
      if (onMiss) {
        onMiss(tap);
        return true;
      }
      return false;
    }

    const step = Number(input.justPressed('confirm'));
    if (step && this.items[this.focus]?.enabled) {
      this.items[this.focus]?.onActivate();
      return true;
    }
    return false;
  }

  /** Перемещение фокуса с клавиатуры. Дублирует то, что делается тапом. */
  moveFocus(delta: number): void {
    if (this.items.length === 0) return;
    const enabled = this.items.filter((item) => item.enabled);
    if (enabled.length === 0) return;

    let next = this.focus;
    for (let i = 0; i < this.items.length; i += 1) {
      next = (next + delta + this.items.length) % this.items.length;
      if (this.items[next]?.enabled) break;
    }
    this.focus = next;
  }
}
