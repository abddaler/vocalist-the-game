import { ACT_LOOKS, LOOKS, lookIndex } from './looks';

/**
 * Персонажи рисуются векторно: пути на холсте со сглаженной кромкой и
 * градиентом вместо строк из символов палитры. Пиксельная раскладка
 * упёрлась в потолок — на тридцати шести столбцах человек выходил
 * угловатым, и увеличение сетки делало его только крупнее, но не
 * красивее. Сама сборка кадров — в figure/.
 */
export {
  ACT_POSES,
  ACTOR_SPRITE,
  repaintActor,
  ACTOR_TEXTURE,
  POSES,
  actorTexture,
  buildActorTextures,
} from './figure';
export type { ActorPose } from './figure';
export { ACT_LOOKS, LOOKS, lookIndex };
export type { Look } from './looks';
export type { Accessory, HairStyle, OutfitStyle } from './style';

/** Индекс внешности игрока. Прохожие идут дальше по списку. */
export { PLAYER_LOOK } from './player';
export { playerFigure, wardrobeKey, wearOf } from './wardrobe';
