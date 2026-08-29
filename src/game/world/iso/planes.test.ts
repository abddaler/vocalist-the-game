import { describe, expect, it } from 'vitest';
import type { Painter } from '@ui/widgets/Painter';
import { TILE } from './project';
import { panel, plate, ramp } from './planes';

/**
 * Геометрия предметов. Всё, кроме людей, лежит в плоскостях мира, и
 * проверяется это по наклону рёбер: у изометрии он всегда пол-пикселя на
 * пиксель. Ребро, идущее строго по горизонтали экрана, значит, что
 * предмет развернуло к камере и он снова читается наклейкой.
 */
type Shot = ReadonlyArray<{ x: number; y: number }>;

const recorder = (): { painter: Painter; shots: Shot[] } => {
  const shots: Shot[] = [];
  const painter = {
    polygon: (points: Shot) => shots.push(points.map((p) => ({ ...p }))),
  } as unknown as Painter;
  return { painter, shots };
};

/** Наклон ребра: в изометрии он равен ±halfH/halfW, и ничему иному. */
const slopeOf = (a: { x: number; y: number }, b: { x: number; y: number }): number =>
  (b.y - a.y) / (b.x - a.x);

const ISO_SLOPE = TILE.halfH / TILE.halfW;
const base = { x: 100, y: 100 };

describe('плоскости изометрии', () => {
  it('полотно вдоль x кладётся по своей стене, а не поперёк экрана', () => {
    const { painter, shots } = recorder();
    panel(painter, base, 'x', { span: 2, top: 20, height: 10 }, 0xffffff);
    const [from, to] = shots[0]!;
    expect(slopeOf(from!, to!)).toBeCloseTo(ISO_SLOPE);
  });

  it('полотно вдоль y уходит в другую сторону: стены не параллельны', () => {
    const { painter, shots } = recorder();
    panel(painter, base, 'y', { span: 2, top: 20, height: 10 }, 0xffffff);
    const [from, to] = shots[0]!;
    expect(slopeOf(from!, to!)).toBeCloseTo(-ISO_SLOPE);
  });

  it('полотно висит на заданной высоте и заданной толщины', () => {
    const { painter, shots } = recorder();
    panel(painter, base, 'x', { span: 1, top: 20, height: 10 }, 0xffffff);
    const [from, to, , bottom] = shots[0]!;
    // Середина верхней кромки — ровно на заданной высоте над опорой.
    expect((from!.y + to!.y) / 2).toBe(base.y - 20);
    expect(bottom!.y - from!.y).toBe(10);
  });

  it('сдвиг вдоль оси не сносит полотно поперёк неё', () => {
    const { painter, shots } = recorder();
    panel(painter, base, 'x', { span: 1, along: 1, top: 0, height: 4 }, 0xffffff);
    const [from, to] = shots[0]!;
    // Середина полотна ушла ровно на плитку вдоль x.
    expect((from!.x + to!.x) / 2).toBe(base.x + TILE.halfW);
    expect((from!.y + to!.y) / 2).toBe(base.y + TILE.halfH);
  });

  it('площадка — ромб плитки: оба ребра с изометрическим наклоном', () => {
    const { painter, shots } = recorder();
    plate(painter, base, { w: 2, d: 2 }, 0xffffff);
    const [north, east, south] = shots[0]!;
    expect(slopeOf(north!, east!)).toBeCloseTo(ISO_SLOPE);
    expect(slopeOf(east!, south!)).toBeCloseTo(-ISO_SLOPE);
  });

  it('скат опускается от дальнего ребра к ближнему', () => {
    const { painter, shots } = recorder();
    ramp(painter, base, { w: 2, d: 2, far: 40, near: 20 }, 0xffffff);
    const [north, east, south, west] = shots[0]!;
    // Дальнее ребро выше ближнего, и оба лежат в плоскостях мира.
    expect(north!.y).toBeLessThan(south!.y);
    // Дальнее ребро лежит по сетке, а боковое круче неё — это и есть скат.
    expect(slopeOf(north!, east!)).toBeCloseTo(ISO_SLOPE);
    expect(Math.abs(slopeOf(east!, south!))).toBeGreaterThan(ISO_SLOPE);
    void west;
  });
});
