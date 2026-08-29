import type { PropKind } from '@core/types';
import { COLORS } from '@ui/theme';
import type { Painter } from '@ui/widgets/Painter';
import { mix, scale } from '../ambience';
import type { Ambience } from '../ambience';
import type { WorldTarget } from '../targets';
import { TILE } from './project';
import type { ScreenPoint } from './project';
import { isoAt, mast, panel, plate, ramp } from './planes';
import { boxAt, quad } from './shapes';
import type { BoxSkin } from './shapes';

/**
 * Мебель и оборудование объёмами. Каждый предмет — коробка нужного
 * размера плюс то, по чему его узнают: подушка на кровати, стойка
 * микрофона, экран пульта, тарелки барабанов.
 *
 * Все детали задаются в плитках вдоль осей мира и подъёмом в пикселях.
 * Прямоугольник в осях экрана смотрел бы в камеру, как персонаж, и весь
 * предмет читался бы вырезанным из бумаги.
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

const shade = (color: number, k: number): BoxSkin => ({
  top: scale(color, 1.22 * k),
  left: scale(color, 0.72 * k),
  right: scale(color, 0.92 * k),
  outline: mix(color, 0x0d0b14, 0.72),
});

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

  boxAt(painter, at, shape, shade(body, 1));
  TOPPER[kind]?.({ painter, at, shape, body, ambience });

  if (active) {
    const w = Math.round((shape.w + shape.d) * TILE.halfW);
    painter.fill({ x: at.x - w / 2, y: at.y - 1, w, h: 2 }, COLORS.borderFocus, 0.55);
  }
}

interface Detail {
  readonly painter: Painter;
  readonly at: ScreenPoint;
  readonly shape: PropShape;
  readonly body: number;
  readonly ambience: Ambience;
}

type Topper = (d: Detail) => void;

/** Полотно на лицевой грани предмета: она обращена к камере влево-вниз. */
const front = (d: Detail, def: { span: number; along?: number; top: number; height: number }, color: number, alpha = 1): void => {
  panel(d.painter, d.at, 'x', { ...def, across: d.shape.d / 2 }, color, alpha);
};

/** Полотно на правой грани: она смотрит вправо-вниз. */
const side = (d: Detail, def: { span: number; along?: number; top: number; height: number }, color: number, alpha = 1): void => {
  panel(d.painter, d.at, 'y', { ...def, across: d.shape.w / 2 }, color, alpha);
};

const block = (d: Detail, dx: number, dy: number, lift: number, size: PropShape, color: number): void => {
  boxAt(d.painter, isoAt(d.at, dx, dy, lift), size, shade(color, 1));
};

const TOPPER: Partial<Record<PropKind, Topper>> = {
  bed: (d) => {
    const { h } = d.shape;
    // Одеяло площадкой на матрасе, подушка коробкой у изголовья.
    plate(d.painter, d.at, { w: 1.5, d: 1.4, dy: 0.35, lift: h + 1 }, scale(d.body, 0.78));
    block(d, 0, -0.75, h, { w: 1.2, d: 0.5, h: 5 }, 0xf0ece2);
  },
  mirror: (d) => {
    const glass = mix(scale(0xb8d8e8, d.ambience.light), d.ambience.skyLow, 0.2);
    front(d, { span: 0.8, top: d.shape.h - 3, height: d.shape.h - 9 }, glass);
    front(d, { span: 0.2, along: -0.24, top: d.shape.h - 5, height: d.shape.h - 17 }, 0xffffff, 0.45);
  },
  mic: (d) => {
    mast(d.painter, isoAt(d.at, 0, 0, d.shape.h), 26, 0x2a2e3a);
    block(d, 0, 0, d.shape.h + 24, { w: 0.24, d: 0.24, h: 5 }, 0x8a94a8);
  },
  drums: (d) => {
    const { h } = d.shape;
    block(d, -0.4, 0.1, h, { w: 0.7, d: 0.7, h: 10 }, scale(d.body, 1.1));
    plate(d.painter, d.at, { w: 0.7, d: 0.7, dx: -0.4, dy: 0.1, lift: h + 10 }, 0xf0ece2);
    // Тарелка — тот же ромб: круг в изометрии и есть эллипс.
    plate(d.painter, d.at, { w: 0.62, d: 0.62, dx: 0.45, dy: -0.2, lift: h + 16 }, 0xd8b45f);
    mast(d.painter, isoAt(d.at, 0.45, -0.2, h), 16, 0x6a6f7a, 1);
  },
  stage: (d) => {
    const { w, h } = d.shape;
    // Задник в плоскости дальней стены сцены, приборы — на его кромке.
    panel(d.painter, d.at, 'x', { span: w, across: -d.shape.d / 2, top: h + 46, height: 44 }, scale(d.body, 0.45));
    for (let i = 0; i < 4; i += 1) {
      const dx = -w / 2 + 0.42 + i * ((w - 0.84) / 3);
      block(d, dx, -d.shape.d / 2, h + 48, { w: 0.34, d: 0.2, h: 4 }, 0x3a3f4c);
      if (d.ambience.lampsOn) {
        ramp(
          d.painter,
          d.at,
          { w: 0.6, d: d.shape.d, dx, far: h + 44, near: h },
          [0xff5fb8, 0x5fc9ff, 0xffd35f, 0x8f5fff][i]!,
          0.16,
        );
      }
    }
  },
  bar: (d) => {
    const { w, d: depth, h } = d.shape;
    plate(d.painter, d.at, { w: w + 0.2, d: depth + 0.2, lift: h + 2 }, scale(d.body, 1.5));
    for (let i = 0; i < 5; i += 1) {
      block(d, -0.9 + i * 0.45, -0.1, h + 3, { w: 0.16, d: 0.16, h: 7 },
        [0xe8b45f, 0x8fd8c8, 0xe86a8a, 0xd8d8e8, 0x9f7fd8][i]!);
    }
  },
  console: (d) => {
    const { w, d: depth, h } = d.shape;
    // Наклонная панель пульта: плоская крышка не читается прибором.
    ramp(d.painter, d.at, { w, d: depth, far: h + 12, near: h + 4 }, scale(d.body, 0.6));
    for (let i = 0; i < 9; i += 1) {
      plate(
        d.painter,
        d.at,
        { w: 0.14, d: 0.14, dx: -0.85 + i * 0.21, dy: (i % 3) * 0.16 - 0.16, lift: h + 8 },
        d.ambience.lampsOn ? 0x5fffc9 : 0x7a8090,
      );
    }
  },
  rack: (d) => {
    const { h } = d.shape;
    for (let i = 0; i < 3; i += 1) {
      const lift = h - 26 + i * 9;
      plate(d.painter, d.at, { w: 0.9, d: 0.6, lift }, scale(d.body, 1 + i * 0.08));
      front(d, { span: 0.9, top: lift, height: 2 }, scale(d.body, 0.7));
      for (let k = 0; k < 3; k += 1) {
        block(d, -0.26 + k * 0.26, 0, lift, { w: 0.18, d: 0.18, h: 5 }, 0x2a2e3a);
      }
    }
  },
  curtain: (d) => {
    // Складки идут вдоль стены: полосами по экрану ткань висела поперёк.
    for (let i = 0; i < 9; i += 1) {
      front(
        d,
        { span: d.shape.w / 9, along: -d.shape.w / 2 + (d.shape.w / 9) * (i + 0.5), top: d.shape.h, height: d.shape.h },
        scale(d.body, i % 2 === 0 ? 1.15 : 0.8),
      );
    }
  },
  treadmill: (d) => {
    const { h } = d.shape;
    mast(d.painter, isoAt(d.at, -0.35, -0.7, h), 22, scale(d.body, 0.6), 3);
    mast(d.painter, isoAt(d.at, 0.35, -0.7, h), 22, scale(d.body, 0.6), 3);
    panel(d.painter, d.at, 'x', { span: 0.8, across: -0.7, top: h + 24, height: 3 }, scale(d.body, 1.3));
  },
  board: (d) => {
    const { h } = d.shape;
    front(d, { span: 1.1, top: h + 20, height: 22 }, scale(d.body, 1.15));
    for (let i = 0; i < 3; i += 1) {
      front(d, { span: 0.34, along: -0.2 + (i % 2) * 0.4, top: h + 16 - i * 5, height: 3 }, 0xe8e4d8);
    }
  },
  stairs: (d) => {
    // Спуск в переход: ступени уходят вниз и в темноту.
    const { h } = d.shape;
    for (let i = 0; i < 4; i += 1) {
      plate(d.painter, d.at, { w: 1.9 - i * 0.3, d: 1.5 - i * 0.3, lift: h - i * 4 }, scale(d.body, 0.8 - i * 0.15));
    }
    const rail = scale(0x8a94a8, d.ambience.light);
    for (const dx of [-0.85, 0.85]) mast(d.painter, isoAt(d.at, dx, 0, h), 12, rail);
    panel(d.painter, d.at, 'x', { span: 1.7, top: h + 12, height: 2 }, rail);
  },
  kitchen: (d) => {
    const { w, d: depth, h } = d.shape;
    plate(d.painter, d.at, { w: w + 0.15, d: depth + 0.15, lift: h + 2 }, scale(d.body, 1.45));
    block(d, 0.5, -0.1, h + 2, { w: 0.4, d: 0.35, h: 8 }, 0x8a94a8);
  },
  sofa: (d) => {
    const { w, h } = d.shape;
    // Спинка у дальней кромки, подлокотники по торцам.
    block(d, 0, -0.38, h, { w, d: 0.24, h: 14 }, scale(d.body, 0.85));
    block(d, -w / 2 + 0.14, 0.05, h, { w: 0.28, d: 0.7, h: 8 }, scale(d.body, 1.1));
    block(d, w / 2 - 0.14, 0.05, h, { w: 0.28, d: 0.7, h: 8 }, scale(d.body, 1.1));
  },
  piano: (d) => {
    const { w, h } = d.shape;
    block(d, 0, -0.3, h, { w, d: 0.55, h: 12 }, scale(d.body, 0.7));
    // Клавиатура — площадка, а не полоска: она лежит, а не висит.
    plate(d.painter, d.at, { w: w - 0.2, d: 0.3, dy: 0.32, lift: h + 1 }, 0xf0ece2);
    for (let i = 0; i < 9; i += 1) {
      plate(d.painter, d.at, { w: 0.05, d: 0.3, dx: -0.7 + i * 0.18, dy: 0.32, lift: h + 2 }, 0x1a1a22);
    }
  },
  booth: (d) => {
    const { w, h } = d.shape;
    const glass = mix(scale(0xb8d8e8, d.ambience.light), d.ambience.skyLow, 0.25);
    front(d, { span: w - 0.2, top: h + 14, height: 13 }, glass, 0.75);
    front(d, { span: w - 0.2, top: h + 14, height: 2 }, scale(glass, 1.3));
    side(d, { span: 0.6, top: h + 14, height: 13 }, scale(glass, 0.8), 0.75);
  },
  chair: (d) => {
    block(d, 0, -0.3, d.shape.h, { w: 0.7, d: 0.2, h: 12 }, scale(d.body, 0.9));
  },
};
