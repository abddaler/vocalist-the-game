import Phaser from 'phaser';
import { Painter } from '@ui/widgets/Painter';
import type { ScreenPoint } from './iso/project';

/**
 * Атлас объёмной мелочи. Скамейка, машина, лоток и киоск собираются из
 * сотни с лишним заливок каждый: пятьдесят предметов в кадре — это
 * тысячи команд рисования на каждый кадр, и профиль на телефоне
 * показывал, что больше половины времени уходит именно на них.
 *
 * Между тем предмет не меняется: он зависит только от вида, вариации,
 * оси и освещения. Поэтому каждый вид рисуется один раз в клетку атласа,
 * а в кадре от него остаётся одна картинка. Атлас пересобирается тогда
 * же, когда и подложка района: при смене места или времени суток.
 */
export const PROP_CELL = { w: 128, h: 128 } as const;

/** Где внутри клетки стоит опора предмета: низ по центру, как у человека. */
export const PROP_ANCHOR = { x: 64, y: 102 } as const;

const COLUMNS = 8;
const ROWS = 8;

/** Сколько предметов помещается в атлас. Остальные рисуются как раньше. */
export const PROP_SLOTS = COLUMNS * ROWS;

const TEXTURE_KEY = 'iso-props';

export class PropAtlas {
  private texture: Phaser.Textures.DynamicTexture | null = null;
  private key = '';
  private readonly slots = new Map<string, string>();

  constructor(private readonly scene: Phaser.Scene) {}

  /**
   * Печёт перечисленные предметы. `paint` рисует один предмет с опорой в
   * переданной точке — тем же кодом, что рисовал бы его в кадре.
   */
  ensure(
    key: string,
    wanted: readonly string[],
    paint: (painter: Painter, id: string, at: ScreenPoint) => void,
  ): void {
    if (this.key === key && this.texture) return;
    this.key = key;
    this.slots.clear();

    const target = this.target();
    if (!target) return;
    target.clear();

    // Рисуем во временный контейнер и снимаем его целиком: Painter умеет
    // рисовать только в контейнер.
    const scratch = this.scene.add.container(0, 0);
    const painter = new Painter(this.scene, scratch);
    const taken = wanted.slice(0, PROP_SLOTS);

    taken.forEach((id, slot) => {
      const col = slot % COLUMNS;
      const row = Math.floor(slot / COLUMNS);
      paint(painter, id, {
        x: col * PROP_CELL.w + PROP_ANCHOR.x,
        y: row * PROP_CELL.h + PROP_ANCHOR.y,
      });
    });

    target.draw(scratch);
    painter.destroy();
    scratch.destroy();

    taken.forEach((id, slot) => {
      const col = slot % COLUMNS;
      const row = Math.floor(slot / COLUMNS);
      const name = `p${slot}`;
      if (target.has(name)) target.remove(name);
      target.add(name, 0, col * PROP_CELL.w, row * PROP_CELL.h, PROP_CELL.w, PROP_CELL.h);
      this.slots.set(id, name);
    });
  }

  /** Имя кадра для предмета или null, если он в атлас не попал. */
  frameOf(id: string): string | null {
    return this.slots.get(id) ?? null;
  }

  get textureKey(): string {
    return TEXTURE_KEY;
  }

  private target(): Phaser.Textures.DynamicTexture | null {
    if (this.texture) return this.texture;
    this.texture = this.scene.textures.addDynamicTexture(
      TEXTURE_KEY,
      COLUMNS * PROP_CELL.w,
      ROWS * PROP_CELL.h,
    );
    return this.texture;
  }

  destroy(): void {
    this.texture?.destroy();
    this.texture = null;
    this.key = '';
    this.slots.clear();
  }
}
