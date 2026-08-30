import type Phaser from 'phaser';
import { LOOKS } from './looks';
import { EXTRA } from './figure/extra';
import { paintFigure } from './figure/paint';
import type { Figure } from './figure/paint';
import { POSE } from './figure/pose';

/**
 * Портреты для диалога. Собираются из той же фигуры, что ходит по улице:
 * рисунок берётся крупнее и обрезается по плечи. Отдельный набор голов
 * пришлось бы держать в согласии с фигурами вручную, и первая же правка
 * причёски развела бы человека на улице и его же портрет.
 */
export const PORTRAIT_TEXTURE = 'portraits';

/** Сторона клетки портрета. */
export const PORTRAIT_SIZE = 32;

/** Во сколько раз холст крупнее клетки при рисовании. */
const SUPERSAMPLE = 4;

/**
 * Какой кусок кадра фигуры попадает в портрет. Верх — над макушкой,
 * низ — по грудь: портрет по пояс в клетке 32x32 превращает лицо в
 * несколько пикселей.
 */
const CROP = { top: 2, bottom: 24, middle: 18 } as const;

/** Имя кадра портрета в атласе. */
export function portraitFrame(lookIndex: number): string {
  return `p${lookIndex}`;
}

export function buildPortraitTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists(PORTRAIT_TEXTURE)) return;

  const atlas = scene.textures.createCanvas(
    PORTRAIT_TEXTURE,
    LOOKS.length * PORTRAIT_SIZE,
    PORTRAIT_SIZE,
  );
  if (!atlas) return;
  const target = atlas.getContext();
  target.imageSmoothingEnabled = false;

  const big = document.createElement('canvas');
  big.width = PORTRAIT_SIZE * SUPERSAMPLE;
  big.height = PORTRAIT_SIZE * SUPERSAMPLE;
  const ctx = big.getContext('2d') as CanvasRenderingContext2D;

  // Кадр фигуры сжимается в клетку: голову видно, ног нет.
  const zoom = PORTRAIT_SIZE / (CROP.bottom - CROP.top);
  const scale = zoom * SUPERSAMPLE;
  const offsetX = (PORTRAIT_SIZE / 2 - CROP.middle * zoom) * SUPERSAMPLE;
  const offsetY = -CROP.top * zoom * SUPERSAMPLE;
  // Спокойная стойка в три четверти: поднятая рука разговора лезет
  // в кадр портрета, а в три четверти лицо читается живее анфаса.
  const joints = POSE.seA;
  if (!joints) return;

  LOOKS.forEach((look, index) => {
    const figure: Figure = {
      colors: look.colors,
      hair: look.hair,
      outfit: look.outfit,
      accessory: look.accessory,
    };
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, big.width, big.height);
    ctx.setTransform(1, 0, 0, 1, offsetX, offsetY);
    paintFigure({ ctx, scale }, figure, joints);
    EXTRA[figure.accessory]?.({ ctx, scale }, figure, joints, joints.lift);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    target.drawImage(big, index * PORTRAIT_SIZE, 0, PORTRAIT_SIZE, PORTRAIT_SIZE);
    atlas.add(portraitFrame(index), 0, index * PORTRAIT_SIZE, 0, PORTRAIT_SIZE, PORTRAIT_SIZE);
  });

  atlas.refresh();
  atlas.setFilter(0);
}
