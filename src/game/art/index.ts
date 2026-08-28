import type Phaser from 'phaser';
import { ACCESSORY } from './accessory';
import { BODY, FACING_OF, POSES } from './body';
import type { Frame } from './body';
import { HAIR } from './hair';
import { LOOKS, PALETTES } from './looks';
import { OUTFIT, OUTFIT_TOP } from './outfit';

export { ACTOR_SPRITE, POSES } from './body';
export type { ActorPose } from './body';
export { LOOKS, lookIndex } from './looks';
export type { Look } from './looks';

/** Ключ текстуры: внешность плюс поза. */
export function actorTexture(lookIndex: number, pose: string): string {
  return `actor-${lookIndex}-${pose}`;
}

/** Индекс внешности игрока. Прохожие идут дальше по списку. */
export const PLAYER_LOOK = 0;

/**
 * Наложение слоя на кадр, начиная с ряда top. Слой короче кадра —
 * остальное остаётся телом; точка в слое означает «не трогать», а не
 * «стереть».
 */
function overlay(base: Frame, layer: Frame, top = 0): Frame {
  if (layer.length === 0) return base;
  return base.map((row, y) => {
    const patch = layer[y - top];
    if (patch === undefined) return row;
    return [...row]
      .map((cell, x) => {
        const over = patch[x];
        return over === undefined || over === '.' ? cell : over;
      })
      .join('');
  });
}

/**
 * Текстуры собираются из строковых раскладок прямо в рантайме: арт лежит
 * в исходниках, читается в диффах и не требует шага сборки.
 */
export function buildActorTextures(scene: Phaser.Scene): void {
  LOOKS.forEach((look, index) => {
    const colors = PALETTES[index]!;

    for (const pose of POSES) {
      const key = actorTexture(index, pose);
      if (scene.textures.exists(key)) continue;

      const facing = FACING_OF[pose];
      const accessory = ACCESSORY[look.accessory];
      // Порядок слоёв: одежда поверх тела, волосы поверх головы, примета
      // поверх всего — очки должны лечь на лицо, а сумка на пиджак.
      let data = overlay(BODY[pose], OUTFIT[look.outfit][facing], OUTFIT_TOP);
      data = overlay(data, HAIR[look.hair][facing]);
      data = overlay(data, accessory[facing], accessory.top);

      scene.textures.generate(key, {
        data: [...data],
        pixelWidth: 1,
        pixelHeight: 1,
        palette: colors,
      });
    }
  });
}
