import Phaser from 'phaser';
import { Painter } from '@ui/widgets/Painter';

/**
 * Запечённая подложка района. Земля и дома не меняются, пока стоит день
 * и игрок не ушёл в другой район, но перерисовывались каждый кадр — а
 * это тысячи заливок на фасады, окна, крыши и мостовую. На телефоне это
 * и было главным тормозом.
 *
 * Теперь подложка рисуется один раз в текстуру размером с район, а в
 * кадре остаётся один блит. Пересобирается она только когда меняется
 * ключ: район, время суток или комната.
 */
export class WorldCanvas {
  private texture: Phaser.GameObjects.RenderTexture | null = null;
  private key = '';

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly layer: Phaser.GameObjects.Container,
  ) {}

  /**
   * Готовит подложку под этот ключ. Если ключ тот же, ничего не рисуется:
   * ради этого всё и затевалось.
   */
  ensure(key: string, width: number, height: number, paint: (painter: Painter) => void): void {
    if (this.key === key && this.texture) return;

    this.texture?.destroy();
    this.key = key;

    const target = this.scene.add.renderTexture(0, 0, width, height);
    target.setOrigin(0, 0);

    // Рисуем во временный контейнер и снимаем его целиком: Painter умеет
    // рисовать только в контейнер, а RenderTexture принимает его как есть.
    const scratch = this.scene.add.container(0, 0);
    const painter = new Painter(this.scene, scratch);
    paint(painter);
    target.draw(scratch);
    painter.destroy();
    scratch.destroy();

    this.layer.add(target);
    this.layer.sendToBack(target);
    this.texture = target;
  }

  /** Ставит подложку под камеру. Экранные координаты её левого верхнего угла. */
  place(x: number, y: number): void {
    if (!this.texture) return;
    this.texture.setPosition(Math.round(x), Math.round(y));
    this.layer.sendToBack(this.texture);
  }

  /** Прячет подложку: на экранах, где мира нет, она бы висела поверх фона. */
  hide(): void {
    if (this.texture) this.texture.setVisible(false);
  }

  show(): void {
    if (this.texture) this.texture.setVisible(true);
  }

  destroy(): void {
    this.texture?.destroy();
    this.texture = null;
    this.key = '';
  }
}
