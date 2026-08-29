import type { PropKind } from '@core/types';
import { COLORS } from '@ui/theme';
import type { Painter } from '@ui/widgets/Painter';
import { mix, scale } from '../ambience';
import type { Ambience } from '../ambience';
import type { WorldTarget } from '../targets';
import { TILE } from './project';
import type { ScreenPoint } from './project';
import { boxAt, quad } from './shapes';

/**
 * Мебель и оборудование объёмами. Каждый предмет — коробка нужного
 * размера плюс то, по чему его узнают: подушка на кровати, стойка
 * микрофона, экран пульта, тарелки барабанов.
 *
 * Размер задан в плитках, высота — в пикселях экрана: плитка везде
 * одинакова, а высота у стойки бара и у сцены разная.
 */
interface PropShape {
  readonly w: number;
  readonly d: number;
  readonly h: number;
}

const SHAPE: Readonly<Record<PropKind, PropShape>> = {
  bed: { w: 1.6, d: 2.2, h: 12 },
  mirror: { w: 1, d: 0.5, h: 34 },
  kitchen: { w: 2.2, d: 0.9, h: 22 },
  sofa: { w: 2.2, d: 1, h: 16 },
  piano: { w: 1.8, d: 1.2, h: 24 },
  mic: { w: 0.6, d: 0.6, h: 8 },
  drums: { w: 1.6, d: 1.4, h: 16 },
  stage: { w: 3.4, d: 2.2, h: 12 },
  bar: { w: 3, d: 1, h: 26 },
  booth: { w: 2, d: 1.4, h: 16 },
  console: { w: 2.2, d: 1, h: 20 },
  rack: { w: 1, d: 0.8, h: 34 },
  curtain: { w: 2.6, d: 0.4, h: 44 },
  chair: { w: 0.8, d: 0.8, h: 14 },
  treadmill: { w: 1, d: 1.8, h: 14 },
  stairs: { w: 2, d: 1.6, h: 4 },
  board: { w: 1.2, d: 0.4, h: 26 },
};

export function drawIsoProp(
  painter: Painter,
  target: WorldTarget,
  at: ScreenPoint,
  color: number,
  active: boolean,
  ambience: Ambience,
): void {
  const kind = target.prop!;
  const shape = SHAPE[kind];
  const body = scale(color, ambience.light);
  const skin = {
    top: scale(body, 1.22),
    left: scale(body, 0.72),
    right: scale(body, 0.92),
    outline: mix(body, 0x0d0b14, 0.72),
  };

  // Тень под предметом: без неё он висит в воздухе.
  quad(
    painter,
    [
      { x: at.x, y: at.y - (shape.w + shape.d) * TILE.halfH * 0.5 },
      { x: at.x + (shape.w + shape.d) * TILE.halfW * 0.5, y: at.y },
      { x: at.x, y: at.y + (shape.w + shape.d) * TILE.halfH * 0.5 },
      { x: at.x - (shape.w + shape.d) * TILE.halfW * 0.5, y: at.y },
    ],
    0x000000,
    ambience.shadow * 0.8,
  );

  boxAt(painter, at, shape, skin);
  TOPPER[kind]?.(painter, at, shape, body, ambience);

  if (active) {
    const w = Math.round((shape.w + shape.d) * TILE.halfW);
    painter.fill({ x: at.x - w / 2, y: at.y - 1, w, h: 2 }, COLORS.borderFocus, 0.55);
  }
}

type Topper = (
  painter: Painter,
  at: ScreenPoint,
  shape: PropShape,
  body: number,
  ambience: Ambience,
) => void;

/** Столбик над коробкой: стойка микрофона, кран, штанга. */
const pole = (
  painter: Painter,
  at: ScreenPoint,
  lift: number,
  height: number,
  color: number,
): void => {
  painter.fill({ x: at.x - 1, y: at.y - lift - height, w: 2, h: height }, color);
};

const TOPPER: Partial<Record<PropKind, Topper>> = {
  bed: (painter, at, shape, body) => {
    const top = at.y - shape.h - Math.round(shape.d * TILE.halfH);
    painter.fill({ x: at.x - 18, y: top - 2, w: 16, h: 7 }, 0xf0ece2);
    painter.fill({ x: at.x - 18, y: top - 2, w: 16, h: 2 }, 0xffffff);
    painter.fill({ x: at.x - 2, y: top + 2, w: 22, h: 10 }, scale(body, 0.78));
  },
  mirror: (painter, at, shape, body, ambience) => {
    const glass = mix(scale(0xb8d8e8, ambience.light), ambience.skyLow, 0.2);
    painter.fill({ x: at.x - 9, y: at.y - shape.h + 3, w: 18, h: shape.h - 8 }, glass);
    painter.fill({ x: at.x - 7, y: at.y - shape.h + 5, w: 4, h: shape.h - 16 }, 0xffffff, 0.45);
    void body;
  },
  mic: (painter, at, shape) => {
    pole(painter, at, shape.h, 26, 0x2a2e3a);
    painter.fill({ x: at.x - 3, y: at.y - shape.h - 30, w: 6, h: 5 }, 0x8a94a8);
    painter.fill({ x: at.x - 2, y: at.y - shape.h - 29, w: 4, h: 3 }, 0xd8dce6);
  },
  drums: (painter, at, shape, body) => {
    const top = at.y - shape.h;
    painter.fill({ x: at.x - 14, y: top - 10, w: 12, h: 10 }, scale(body, 1.1));
    painter.fill({ x: at.x - 14, y: top - 10, w: 12, h: 2 }, 0xf0ece2);
    painter.fill({ x: at.x + 2, y: top - 16, w: 14, h: 2 }, 0xd8b45f);
    painter.fill({ x: at.x + 8, y: top - 14, w: 1, h: 14 }, 0x6a6f7a);
  },
  stage: (painter, at, shape, body, ambience) => {
    const top = at.y - shape.h;
    // Задник и пара приборов: сцена без света не сцена.
    painter.fill({ x: at.x - 34, y: top - 46, w: 68, h: 44 }, scale(body, 0.45));
    for (let i = 0; i < 4; i += 1) {
      const x = at.x - 26 + i * 17;
      painter.fill({ x, y: top - 48, w: 8, h: 4 }, 0x3a3f4c);
      if (ambience.lampsOn) {
        painter.fill({ x: x - 4, y: top - 44, w: 16, h: 40 }, [0xff5fb8, 0x5fc9ff, 0xffd35f, 0x8f5fff][i]!, 0.16);
      }
    }
  },
  bar: (painter, at, shape, body) => {
    const top = at.y - shape.h - Math.round(shape.d * TILE.halfH);
    painter.fill({ x: at.x - 30, y: top - 3, w: 60, h: 3 }, scale(body, 1.5));
    for (let i = 0; i < 5; i += 1) {
      painter.fill({ x: at.x - 22 + i * 11, y: top - 9, w: 4, h: 7 }, [0xe8b45f, 0x8fd8c8, 0xe86a8a, 0xd8d8e8, 0x9f7fd8][i]!);
    }
  },
  console: (painter, at, shape, body, ambience) => {
    const top = at.y - shape.h;
    painter.fill({ x: at.x - 20, y: top - 12, w: 40, h: 12 }, scale(body, 0.6));
    for (let i = 0; i < 9; i += 1) {
      painter.fill(
        { x: at.x - 17 + i * 4, y: top - 9 + (i % 3), w: 2, h: 2 },
        ambience.lampsOn ? 0x5fffc9 : 0x7a8090,
      );
    }
  },
  rack: (painter, at, shape, body) => {
    for (let i = 0; i < 4; i += 1) {
      painter.fill({ x: at.x - 12, y: at.y - shape.h + 4 + i * 7, w: 24, h: 5 }, scale(body, 1 + i * 0.08));
      painter.fill({ x: at.x - 8, y: at.y - shape.h + 5 + i * 7, w: 6, h: 2 }, 0x2a2e3a);
    }
  },
  curtain: (painter, at, shape, body) => {
    for (let i = 0; i < 9; i += 1) {
      painter.fill(
        { x: at.x - 26 + i * 6, y: at.y - shape.h, w: 5, h: shape.h },
        scale(body, i % 2 === 0 ? 1.15 : 0.8),
      );
    }
  },
  treadmill: (painter, at, shape, body) => {
    painter.fill({ x: at.x - 2, y: at.y - shape.h - 22, w: 3, h: 22 }, scale(body, 0.6));
    painter.fill({ x: at.x - 10, y: at.y - shape.h - 24, w: 20, h: 3 }, scale(body, 1.3));
  },
  board: (painter, at, shape, body) => {
    painter.fill({ x: at.x - 13, y: at.y - shape.h - 18, w: 26, h: 20 }, scale(body, 1.15));
    for (let i = 0; i < 3; i += 1) {
      painter.fill({ x: at.x - 9 + (i % 2) * 10, y: at.y - shape.h - 14 + i * 5, w: 8, h: 3 }, 0xe8e4d8);
    }
  },
  stairs: (painter, at, shape, body) => {
    // Спуск в переход: ступени уходят вниз и в темноту.
    for (let i = 0; i < 4; i += 1) {
      const w = 34 - i * 6;
      painter.fill(
        { x: at.x - w / 2, y: at.y - shape.h + i * 4, w, h: 4 },
        scale(body, 0.8 - i * 0.15),
      );
    }
    painter.fill({ x: at.x - 20, y: at.y - shape.h - 10, w: 2, h: 12 }, 0x8a94a8);
    painter.fill({ x: at.x + 18, y: at.y - shape.h - 10, w: 2, h: 12 }, 0x8a94a8);
    painter.fill({ x: at.x - 20, y: at.y - shape.h - 10, w: 40, h: 2 }, 0x8a94a8);
  },
  kitchen: (painter, at, shape, body) => {
    const top = at.y - shape.h - Math.round(shape.d * TILE.halfH);
    painter.fill({ x: at.x - 26, y: top - 2, w: 52, h: 3 }, scale(body, 1.45));
    painter.fill({ x: at.x + 6, y: top - 9, w: 10, h: 8 }, 0x8a94a8);
  },
  sofa: (painter, at, shape, body) => {
    painter.fill({ x: at.x - 24, y: at.y - shape.h - 14, w: 48, h: 14 }, scale(body, 0.85));
    painter.fill({ x: at.x - 24, y: at.y - shape.h - 14, w: 48, h: 2 }, scale(body, 1.25));
  },
  piano: (painter, at, shape, body) => {
    painter.fill({ x: at.x - 20, y: at.y - shape.h - 12, w: 40, h: 12 }, scale(body, 0.7));
    painter.fill({ x: at.x - 18, y: at.y - shape.h - 2, w: 36, h: 3 }, 0xf0ece2);
    for (let i = 0; i < 9; i += 1) {
      painter.fill({ x: at.x - 16 + i * 4, y: at.y - shape.h - 2, w: 1, h: 3 }, 0x1a1a22);
    }
  },
  booth: (painter, at, shape, body) => {
    painter.fill({ x: at.x - 18, y: at.y - shape.h - 12, w: 36, h: 12 }, scale(body, 0.8));
    painter.fill({ x: at.x - 18, y: at.y - shape.h - 12, w: 36, h: 2 }, scale(body, 1.3));
  },
  chair: (painter, at, shape, body) => {
    painter.fill({ x: at.x - 7, y: at.y - shape.h - 12, w: 14, h: 12 }, scale(body, 0.9));
    painter.fill({ x: at.x - 7, y: at.y - shape.h - 12, w: 14, h: 2 }, scale(body, 1.3));
  },
};
