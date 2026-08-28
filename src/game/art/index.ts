import type Phaser from 'phaser';
import { ACTOR_FRAMES } from './actors';
import { CROWD_PALETTES, PLAYER_PALETTE } from './palettes';
import type { ActorPalette } from './palettes';

export { ACTOR_SPRITE } from './actors';
export { CROWD_PALETTES, PLAYER_PALETTE } from './palettes';

export type ActorPose = 'downA' | 'downB' | 'upA' | 'upB' | 'sideA' | 'sideB';

/** Ключ текстуры: одна раскладка, разные палитры — разные люди. */
export function actorTexture(paletteIndex: number, pose: ActorPose): string {
  return `actor-${paletteIndex}-${pose}`;
}

/** Индекс палитры игрока. Прохожие идут дальше по списку. */
export const PLAYER_PALETTE_INDEX = 0;

/**
 * Текстуры собираются из строковых раскладок прямо в рантайме: арт лежит
 * в исходниках, читается в диффах и не требует шага сборки. На арт-проходе
 * это место сменится загрузкой настоящих PNG, а ключи текстур останутся.
 */
export function buildActorTextures(scene: Phaser.Scene): void {
  const palettes: readonly ActorPalette[] = [PLAYER_PALETTE, ...CROWD_PALETTES];

  palettes.forEach((palette, index) => {
    for (const [pose, data] of Object.entries(ACTOR_FRAMES)) {
      const key = actorTexture(index, pose as ActorPose);
      if (scene.textures.exists(key)) continue;
      scene.textures.generate(key, {
        data: [...data],
        pixelWidth: 1,
        pixelHeight: 1,
        palette,
      });
    }
  });
}
