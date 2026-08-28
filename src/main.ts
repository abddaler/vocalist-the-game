import Phaser from 'phaser';
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from '@platform/config';
import { attachDisplay } from '@platform/display';
import { LocalStorageSaveAdapter } from '@platform/SaveAdapter';
import { MenuScene } from '@game/scenes/MenuScene';
import { GameScene } from '@game/scenes/GameScene';
import { t } from '@ui/i18n';

/**
 * Внутреннее разрешение фиксировано 480x270 (раздел 2, ограничение 3).
 * Режим NONE плюс подбор зума вручную: см. platform/display.ts.
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
  input: { activePointers: 2 },
  scene: [MenuScene, GameScene],
});

// Адаптер сохранений живёт в реестре: сцены не знают, где лежат данные.
game.registry.set('save', new LocalStorageSaveAdapter());

const rotateHint = document.getElementById('rotate');
if (rotateHint) rotateHint.textContent = t('ui.rotate');

attachDisplay(game, {
  onPortraitBlock: (blocked) => {
    document.body.classList.toggle('portrait-blocked', blocked);
  },
});
