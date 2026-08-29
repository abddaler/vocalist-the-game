import type Phaser from 'phaser';
import { LOOKS } from '../looks';
import { EXTRA } from './extra';
import { paintFigure } from './paint';
import type { Figure } from './paint';
import { ACTOR_SPRITE, POSE, POSES } from './pose';

export { ACTOR_SPRITE, POSES } from './pose';
export type { ActorPose } from './pose';

/**
 * Все кадры персонажей в одной текстуре. Отдельная текстура на каждую
 * пару «внешность + поза» — это полторы сотни текстур, и каждый прохожий
 * заставлял видеокарту переключаться на свою.
 */
export const ACTOR_TEXTURE = 'actors';

/** Имя кадра в атласе: внешность плюс поза. */
export function actorTexture(lookIndex: number, pose: string): string {
  return `${lookIndex}-${pose}`;
}

/**
 * Во сколько раз холст крупнее кадра при рисовании. Фигура рисуется
 * втрое крупнее и ужимается: сглаживание тогда считается по трём
 * пикселям на один, и кромка выходит ровной, а не размытой.
 */
const SUPERSAMPLE = 3;

export function buildActorTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists(ACTOR_TEXTURE)) return;

  const columns = POSES.length;
  const atlas = scene.textures.createCanvas(
    ACTOR_TEXTURE,
    columns * ACTOR_SPRITE.width,
    LOOKS.length * ACTOR_SPRITE.height,
  );
  if (!atlas) return;
  const target = atlas.getContext();

  const big = document.createElement('canvas');
  big.width = ACTOR_SPRITE.width * SUPERSAMPLE;
  big.height = ACTOR_SPRITE.height * SUPERSAMPLE;
  const brush = { ctx: big.getContext('2d')!, scale: SUPERSAMPLE };
  target.imageSmoothingEnabled = true;
  target.imageSmoothingQuality = 'high';

  LOOKS.forEach((look, index) => {
    const figure: Figure = {
      colors: look.colors,
      hair: look.hair,
      outfit: look.outfit,
      accessory: look.accessory,
    };

    POSES.forEach((pose, column) => {
      const joints = POSE[pose]!;
      brush.ctx.clearRect(0, 0, big.width, big.height);
      paintFigure(brush, figure, joints);
      EXTRA[figure.accessory]?.(brush, figure, joints, joints.lift);

      target.drawImage(
        big,
        column * ACTOR_SPRITE.width,
        index * ACTOR_SPRITE.height,
        ACTOR_SPRITE.width,
        ACTOR_SPRITE.height,
      );
      atlas.add(
        actorTexture(index, pose),
        0,
        column * ACTOR_SPRITE.width,
        index * ACTOR_SPRITE.height,
        ACTOR_SPRITE.width,
        ACTOR_SPRITE.height,
      );
    });
  });

  atlas.refresh();
  // Кадры фигур сглажены при сборке, поэтому их нельзя тянуть по
  // соседнему пикселю: линейная фильтрация сохраняет мягкую кромку.
  atlas.setFilter(1);
}
