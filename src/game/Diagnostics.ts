import type Phaser from 'phaser';

/**
 * Строка состояния для отладки на настоящем телефоне. Два раза подряд я
 * искал причину тормозов замерами в эмуляторе и оба раза не угадал:
 * эмулятор показывает свой процессор и свою видеокарту, а не те, что у
 * игрока. Пусть игра сама скажет, чем она рисует и сколько у неё кадров.
 *
 * Строка мелкая и тусклая, живёт в углу и не мешает: цена вопроса —
 * скриншот, по которому наконец видно, что происходит.
 */
export class Diagnostics {
  private frames = 0;
  private since = 0;
  private fps = 0;
  private worst = 0;
  private shown = 0;
  private last = 0;
  private objects = 0;

  constructor(private readonly game: Phaser.Game) {}

  /**
   * Считает кадры за секунду и худший кадр в этой секунде. Возвращает
   * true, когда строка изменилась: перерисовывать экран ради счётчика
   * чаще раза в секунду незачем.
   */
  tick(now: number, delta: number): boolean {
    if (this.last > 0) this.worst = Math.max(this.worst, delta);
    this.last = now;
    this.frames += 1;
    if (this.since === 0) this.since = now;
    if (now - this.since < 1000) return false;
    this.fps = Math.round((this.frames * 1000) / (now - this.since));
    this.shown = Math.round(this.worst);
    this.frames = 0;
    this.since = now;
    this.worst = 0;
    return true;
  }

  /**
   * Сколько объектов ушло в прошлый кадр. Тормозящий телефон надо
   * отличать от телефона, которому подсунули втрое больше работы, чем
   * эмулятору, — а по одним кадрам в секунду это неразличимо.
   */
  count(drawn: number): void {
    this.objects = drawn;
  }

  /** Что показать: кадры, худший кадр, объекты, рендерер и размер холста. */
  line(): string {
    const canvas = this.game.canvas;
    const renderer = this.game.renderer.type === 2 ? 'gl' : 'cv';
    const dpr = Math.round(window.devicePixelRatio * 10) / 10;
    const view = canvas ? `${canvas.width}x${canvas.height}` : '?';
    const css = canvas ? `${Math.round(canvas.clientWidth)}` : '?';
    return `${this.fps} fps · ${this.shown} ms · ${this.objects} об · ${renderer} · ${view}→${css} · dpr ${dpr}`;
  }
}
