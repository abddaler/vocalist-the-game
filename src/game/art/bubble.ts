import type Phaser from 'phaser';
import { blob, shape, stroke, tone } from './figure/draw';
import type { Brush } from './figure/draw';

/**
 * Пузыри над головами. Из всего, чем сцена показывает, что она живая,
 * это самое дешёвое: прохожий, над которым всплыла нота, читается
 * занятым, а прохожий без пузыря — расставленной фигурой. Детализация
 * плитки такого не даёт ни за какие деньги.
 *
 * Значки рисуются теми же кистями, что и фигуры, и складываются в один
 * атлас: отдельная текстура на значок заставила бы видеокарту
 * переключаться на каждый пузырь в кадре.
 */
export const BUBBLE_TEXTURE = 'bubbles';

/** Размер клетки значка в атласе. */
export const BUBBLE_CELL = { width: 14, height: 14 } as const;

/** Во сколько раз холст крупнее клетки при рисовании. */
const SUPERSAMPLE = 4;

const at = (x: number, y: number): { x: number; y: number } => ({ x, y });

/** Середина клетки: значки строятся от неё. */
const MID = { x: BUBBLE_CELL.width / 2, y: BUBBLE_CELL.height / 2 } as const;

type Icon = (brush: Brush) => void;

const NOTE = '#4a4560';
const WARM = '#e8734a';
const COOL = '#3fa9c9';

/**
 * Значки. Десять штук: больше глаз в кадре не различит, меньше — и
 * толпа начинает повторяться.
 */
const ICONS: Readonly<Record<string, Icon>> = {
  // Нота: головка с флажком. Главный значок улицы с клубами.
  note: (brush) => {
    blob(brush, at(MID.x - 1.6, MID.y + 2.6), 2.2, 1.8, NOTE);
    stroke(brush, at(MID.x + 0.5, MID.y + 2.6), at(MID.x + 0.5, MID.y - 1), at(MID.x + 0.5, MID.y - 4), 1.1, NOTE);
    shape(brush, [
      at(MID.x + 0.6, MID.y - 4.2),
      at(MID.x + 3.6, MID.y - 2.8),
      at(MID.x + 3.4, MID.y - 0.6),
      at(MID.x + 0.6, MID.y - 1.8),
    ], NOTE);
  },

  // Сердце: две доли и остриё вниз.
  heart: (brush) => {
    blob(brush, at(MID.x - 1.9, MID.y - 1.6), 2.3, 2.2, '#e0496b');
    blob(brush, at(MID.x + 1.9, MID.y - 1.6), 2.3, 2.2, '#e0496b');
    shape(brush, [
      at(MID.x - 4.1, MID.y - 0.9),
      at(MID.x + 4.1, MID.y - 0.9),
      at(MID.x, MID.y + 4.4),
    ], '#e0496b');
  },

  // Смех: дуга рта шире, чем у улыбки, и зажмуренные глаза.
  laugh: (brush) => {
    blob(brush, MID, 5.2, 5.2, '#f2c94c');
    stroke(brush, at(MID.x - 3.4, MID.y - 1.4), at(MID.x - 2.2, MID.y - 2.6), at(MID.x - 1, MID.y - 1.4), 0.9, NOTE);
    stroke(brush, at(MID.x + 1, MID.y - 1.4), at(MID.x + 2.2, MID.y - 2.6), at(MID.x + 3.4, MID.y - 1.4), 0.9, NOTE);
    stroke(brush, at(MID.x - 2.6, MID.y + 1), at(MID.x, MID.y + 3.4), at(MID.x + 2.6, MID.y + 1), 1.2, NOTE);
  },

  // Досада: бровь домиком и три чёрточки пара.
  annoyed: (brush) => {
    blob(brush, at(MID.x, MID.y + 0.8), 4.6, 4.6, '#d9694f');
    stroke(brush, at(MID.x - 3.2, MID.y - 1.4), at(MID.x - 2, MID.y - 0.4), at(MID.x - 0.8, MID.y - 0.2), 0.9, NOTE);
    stroke(brush, at(MID.x + 0.8, MID.y - 0.2), at(MID.x + 2, MID.y - 0.4), at(MID.x + 3.2, MID.y - 1.4), 0.9, NOTE);
    stroke(brush, at(MID.x - 2.4, MID.y + 2.8), at(MID.x, MID.y + 1.8), at(MID.x + 2.4, MID.y + 2.8), 0.9, NOTE);
  },

  // Деньги: банкнота с кружком номинала.
  money: (brush) => {
    shape(brush, [
      at(MID.x - 5, MID.y - 3),
      at(MID.x + 5, MID.y - 3),
      at(MID.x + 5, MID.y + 3),
      at(MID.x - 5, MID.y + 3),
    ], '#5fbf7d');
    blob(brush, MID, 1.9, 1.9, tone('#5fbf7d', 0.72));
  },

  // Сон: три «z» лесенкой.
  sleep: (brush) => {
    const z = (x: number, y: number, size: number): void => {
      stroke(brush, at(x - size, y - size), at(x, y - size), at(x + size, y - size), 0.9, COOL);
      stroke(brush, at(x + size, y - size), at(x, y), at(x - size, y + size), 0.9, COOL);
      stroke(brush, at(x - size, y + size), at(x, y + size), at(x + size, y + size), 0.9, COOL);
    };
    z(MID.x - 2.6, MID.y + 3, 1.4);
    z(MID.x + 0.6, MID.y - 0.4, 1.8);
    z(MID.x + 4, MID.y - 4, 2.2);
  },

  // Мысль: лампочка с цоколем.
  idea: (brush) => {
    blob(brush, at(MID.x, MID.y - 1.4), 3.4, 3.6, '#f2d24c');
    shape(brush, [
      at(MID.x - 1.8, MID.y + 1.8),
      at(MID.x + 1.8, MID.y + 1.8),
      at(MID.x + 1.4, MID.y + 4.4),
      at(MID.x - 1.4, MID.y + 4.4),
    ], tone('#f2d24c', 0.55));
  },

  // Стакан: коктейль на ножке.
  drink: (brush) => {
    shape(brush, [
      at(MID.x - 4.2, MID.y - 4),
      at(MID.x + 4.2, MID.y - 4),
      at(MID.x, MID.y + 1.4),
    ], COOL);
    stroke(brush, at(MID.x, MID.y + 1), at(MID.x, MID.y + 3), at(MID.x, MID.y + 4.6), 0.9, COOL);
    stroke(brush, at(MID.x - 2.4, MID.y + 4.8), at(MID.x, MID.y + 4.8), at(MID.x + 2.4, MID.y + 4.8), 0.9, COOL);
  },

  // Звезда: пять лучей. Ею отмечают чужой успех, а не свой.
  star: (brush) => {
    const points = [];
    for (let i = 0; i < 10; i += 1) {
      const angle = (Math.PI * i) / 5 - Math.PI / 2;
      const radius = i % 2 === 0 ? 5.2 : 2.2;
      points.push(at(MID.x + Math.cos(angle) * radius, MID.y + Math.sin(angle) * radius));
    }
    shape(brush, points, '#f2c94c');
  },

  // Вопрос: крюк и точка.
  question: (brush) => {
    stroke(brush, at(MID.x - 2.4, MID.y - 2.6), at(MID.x + 2.6, MID.y - 4), at(MID.x + 0.4, MID.y + 0.6), 1.3, WARM);
    blob(brush, at(MID.x + 0.2, MID.y + 3.6), 1.1, 1.1, WARM);
  },
};

/** Имена значков в порядке клеток атласа. */
export const BUBBLE_ICONS = Object.keys(ICONS) as readonly string[];

/** Имя кадра значка в атласе. */
export function bubbleFrame(icon: string): string {
  return icon;
}

export function buildBubbleTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists(BUBBLE_TEXTURE)) return;

  const atlas = scene.textures.createCanvas(
    BUBBLE_TEXTURE,
    BUBBLE_ICONS.length * BUBBLE_CELL.width,
    BUBBLE_CELL.height,
  );
  if (!atlas) return;
  const target = atlas.getContext();
  target.imageSmoothingEnabled = false;

  const big = document.createElement('canvas');
  big.width = BUBBLE_CELL.width * SUPERSAMPLE;
  big.height = BUBBLE_CELL.height * SUPERSAMPLE;
  const brush: Brush = { ctx: big.getContext('2d') as CanvasRenderingContext2D, scale: SUPERSAMPLE };

  BUBBLE_ICONS.forEach((name, column) => {
    brush.ctx.clearRect(0, 0, big.width, big.height);
    ICONS[name]?.(brush);
    target.drawImage(big, column * BUBBLE_CELL.width, 0, BUBBLE_CELL.width, BUBBLE_CELL.height);
    atlas.add(bubbleFrame(name), 0, column * BUBBLE_CELL.width, 0, BUBBLE_CELL.width, BUBBLE_CELL.height);
  });

  atlas.refresh();
  atlas.setFilter(0);
}
