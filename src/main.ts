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

/**
 * Подсказка о повороте гаснет сама и по первому касанию. Прятать за ней
 * игру нельзя: с блокировкой поворота из такого экрана нет выхода, и
 * игра для человека просто не работает.
 */
const HINT_MS = 6000;

const hint = document.getElementById('rotate');
if (hint) hint.textContent = t('ui.rotate');

let hintTimer = 0;
const hideHint = (): void => {
  window.clearTimeout(hintTimer);
  document.body.classList.add('hint-fading');
};

attachDisplay(game, {
  onNarrowPortrait: (narrow) => {
    document.body.classList.toggle('portrait-hint', narrow);
    document.body.classList.remove('hint-fading');
    window.clearTimeout(hintTimer);
    if (narrow) hintTimer = window.setTimeout(hideHint, HINT_MS);
  },
});

window.addEventListener('pointerdown', hideHint, { once: true });

/**
 * Чёрный экран не сообщает ни игроку, ни разработчику ничего. Любая
 * ошибка на старте показывается словами — по ним хотя бы понятно, куда
 * смотреть.
 */
function reportFailure(reason: string): void {
  const box = document.getElementById('boot');
  if (!box || document.body.classList.contains('boot-failed')) return;
  box.textContent = `Игра не запустилась.\n${reason}`;
  document.body.classList.add('boot-failed');
}

window.addEventListener('error', (event) => {
  // Ошибки после старта игру не убивают: сообщаем только про самый старт.
  if (game.isBooted) return;
  reportFailure(event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  if (game.isBooted) return;
  reportFailure(String(event.reason));
});

// Двух секунд движку хватает с запасом; если канваса нет — что-то не так.
window.setTimeout(() => {
  if (!game.canvas) reportFailure('Не удалось создать холст: браузер без canvas или WebGL.');
}, 2500);
