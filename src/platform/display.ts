import Phaser from 'phaser';
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from './config';

/**
 * Целочисленное масштабирование (раздел 2, ограничение 3).
 *
 * Phaser.Scale.FIT даёт дробный зум (×2.37 на произвольном окне) — пиксели
 * плывут. Поэтому берём зум = floor(вписывающегося) и честно живём с полями
 * по краям: они оформлены как рамка, см. index.html.
 *
 * Единственное исключение — окно меньше 480x270 (узкий телефон в портрете):
 * там целый зум невозможен, и лучше показать всю игру дробно, чем обрезать.
 *
 * Игра о реальном размере экрана по-прежнему не знает: наружу торчит
 * только этот модуль в platform/.
 */
export function attachIntegerScaling(game: Phaser.Game): () => void {
  const apply = (): void => {
    const raw = Math.min(
      window.innerWidth / INTERNAL_WIDTH,
      window.innerHeight / INTERNAL_HEIGHT,
    );
    game.scale.setZoom(raw >= 1 ? Math.floor(raw) : Math.max(raw, 0.1));
  };

  apply();
  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', apply);

  return () => {
    window.removeEventListener('resize', apply);
    window.removeEventListener('orientationchange', apply);
  };
}
