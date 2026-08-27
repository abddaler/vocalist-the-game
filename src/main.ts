import Phaser from 'phaser';
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from '@platform/config';
import { attachIntegerScaling } from '@platform/display';
import { BootScene } from '@game/scenes/BootScene';
import { GameScene } from '@game/scenes/GameScene';

/**
 * Внутреннее разрешение фиксировано 480x270 (раздел 2, ограничение 3).
 * Режим NONE + ручной целочисленный зум: см. platform/display.ts.
 */
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: INTERNAL_WIDTH,
  height: INTERNAL_HEIGHT,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#14161c',
  scale: {
    // Центрирование отдано CSS-гриду в index.html: autoCenter Phaser'а
    // добавляет свои отступы поверх и уводит канвас вниз.
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.NO_CENTER,
  },
  scene: [BootScene, GameScene],
});

attachIntegerScaling(game);
