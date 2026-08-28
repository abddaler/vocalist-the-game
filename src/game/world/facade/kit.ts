import type { BuildingKind } from '@core/types';
import type { Rect } from '@ui/widgets/Hotspots';
import type { Painter } from '@ui/widgets/Painter';
import { scale } from '../ambience';
import type { Ambience } from '../ambience';

/** Устойчивый хеш строки: свет в окнах должен быть одинаков между кадрами. */
export function hash(text: string, salt: number): number {
  let value = 0x811c9dc5 ^ salt;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 0x01000193);
  }
  return (value >>> 0) / 0x100000000;
}

export function shade(color: number, factor: number): number {
  return scale(color, factor);
}

export const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export interface FacadeParams {
  readonly rect: Rect;
  readonly color: number;
  readonly kind: BuildingKind;
  /** Ключ дома: по нему разложены окна, маркиза и свет. Один дом — одна картинка. */
  readonly seed: string;
  readonly ambience: Ambience;
  /** Куда рисовать нельзя: вывеска и дверной проём. */
  readonly reserved: readonly Rect[];
  /** Проём двери в экранных координатах; null — в дом не входят. */
  readonly door: Rect | null;
}

/**
 * Всё, что нужно любому куску фасада. Цвет стены считается один раз:
 * иначе каждая процедура заново пересчитывала бы его под свет.
 */
export interface Facade extends FacadeParams {
  readonly painter: Painter;
  readonly wall: number;
  /** Высота первого этажа в экранных пикселях. */
  readonly groundH: number;
}

/** Прямоугольник внутри фасада, в его собственных координатах. */
export const at = (f: Facade, dx: number, dy: number, w: number, h: number): Rect => ({
  x: Math.round(f.rect.x + dx),
  y: Math.round(f.rect.y + dy),
  w: Math.max(1, Math.round(w)),
  h: Math.max(1, Math.round(h)),
});

export const fill = (f: Facade, dx: number, dy: number, w: number, h: number, color: number, alpha = 1): void =>
  f.painter.fill(at(f, dx, dy, w, h), color, alpha);

/** Свет, который зажигается вечером: неон, витрина, лампа над дверью. */
export const glow = (f: Facade, color: number): number =>
  f.ambience.lampsOn ? scale(color, 1.6) : scale(color, f.ambience.light);

export type Part = (f: Facade) => void;
