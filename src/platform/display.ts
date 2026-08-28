import type Phaser from 'phaser';
import { chooseZoom, isPortraitBlocked } from './zoom';

/**
 * Привязка подбора зума к движку и к окну. Сама политика — в zoom.ts.
 * Игра о реальном размере экрана не знает: наружу торчит только этот
 * модуль в platform/ (ограничение 2.5).
 */
export interface DisplayHooks {
  /** Вызывается, когда экран становится слишком узким и обратно. */
  onPortraitBlock?: (blocked: boolean) => void;
}

export function attachDisplay(game: Phaser.Game, hooks: DisplayHooks = {}): () => void {
  let blocked: boolean | null = null;

  const apply = (): void => {
    // visualViewport точнее innerWidth на мобильных: он учитывает панели
    // браузера и экранную клавиатуру.
    const viewport = window.visualViewport;
    const width = Math.round(viewport?.width ?? window.innerWidth);
    const height = Math.round(viewport?.height ?? window.innerHeight);

    game.scale.setZoom(chooseZoom(width, height));

    const next = isPortraitBlocked(width, height);
    if (next !== blocked) {
      blocked = next;
      hooks.onPortraitBlock?.(next);
    }
  };

  // iOS сообщает о повороте до того, как размеры успевают обновиться.
  const applyLater = (): void => {
    apply();
    window.setTimeout(apply, 120);
    window.setTimeout(apply, 400);
  };

  apply();
  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', applyLater);
  window.visualViewport?.addEventListener('resize', apply);

  return () => {
    window.removeEventListener('resize', apply);
    window.removeEventListener('orientationchange', applyLater);
    window.visualViewport?.removeEventListener('resize', apply);
  };
}
