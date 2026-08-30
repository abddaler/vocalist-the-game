import type Phaser from 'phaser';
import { ACT_LOOKS, LOOKS } from '../looks';
import { EXTRA } from './extra';
import { paintFigure } from './paint';
import type { Figure } from './paint';
import { ACT_POSES, ACTOR_SPRITE, POSE, POSES } from './pose';

export { ACT_POSES, ACTOR_SPRITE, POSES } from './pose';
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

/**
 * Холст втрое крупнее кадра и кисть по нему. Заводится один раз на
 * сборку: перерисовка игрока при каждой обновке иначе выделяла бы новый
 * холст, а от потока выделений телефонный WebGL и теряет контекст.
 */
function easel(): { canvas: HTMLCanvasElement; brush: { ctx: CanvasRenderingContext2D; scale: number } } {
  const canvas = document.createElement('canvas');
  canvas.width = ACTOR_SPRITE.width * SUPERSAMPLE;
  canvas.height = ACTOR_SPRITE.height * SUPERSAMPLE;
  return {
    canvas,
    brush: { ctx: canvas.getContext('2d') as CanvasRenderingContext2D, scale: SUPERSAMPLE },
  };
}

/**
 * Перерисовать кадры одного человека поверх уже собранного атласа.
 * Нужно гардеробу: игрок переодевается по ходу игры, и кадры у него
 * меняются, а у остальных нет.
 */
export function repaintActor(scene: Phaser.Scene, index: number, figure: Figure): void {
  if (!scene.textures.exists(ACTOR_TEXTURE)) return;
  const atlas = scene.textures.get(ACTOR_TEXTURE) as Phaser.Textures.CanvasTexture;
  const target = atlas.getContext?.();
  if (!target) return;

  const { canvas, brush } = easel();
  target.imageSmoothingEnabled = true;
  target.imageSmoothingQuality = 'high';

  const poses = [...POSES, ...ACT_POSES];
  poses.forEach((pose, column) => {
    const joints = POSE[pose];
    if (!joints) return;
    brush.ctx.clearRect(0, 0, canvas.width, canvas.height);
    paintFigure(brush, figure, joints);
    EXTRA[figure.accessory]?.(brush, figure, joints, joints.lift);

    const x = column * ACTOR_SPRITE.width;
    const y = index * ACTOR_SPRITE.height;
    // Клетка чистится: новая одежда уже, чем старая, и без очистки от
    // прежней остаётся кайма.
    target.clearRect(x, y, ACTOR_SPRITE.width, ACTOR_SPRITE.height);
    target.drawImage(canvas, x, y, ACTOR_SPRITE.width, ACTOR_SPRITE.height);
  });

  atlas.refresh();
  atlas.setFilter(1);
}

export function buildActorTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists(ACTOR_TEXTURE)) return;

  const columns = POSES.length + ACT_POSES.length;
  const atlas = scene.textures.createCanvas(
    ACTOR_TEXTURE,
    columns * ACTOR_SPRITE.width,
    LOOKS.length * ACTOR_SPRITE.height,
  );
  if (!atlas) return;
  const target = atlas.getContext();

  const { canvas: big, brush } = easel();
  target.imageSmoothingEnabled = true;
  target.imageSmoothingQuality = 'high';

  LOOKS.forEach((look, index) => {
    const figure: Figure = {
      colors: look.colors,
      hair: look.hair,
      outfit: look.outfit,
      accessory: look.accessory,
    };

    // Позы дела — только игроку и названным: поют и разговаривают они,
    // а двенадцать лишних кадров на каждого в толпе стоят четверти
    // секунды загрузки на телефоне.
    const poses = ACT_LOOKS.has(look.id) ? [...POSES, ...ACT_POSES] : POSES;
    poses.forEach((pose, column) => {
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
