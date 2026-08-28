import Phaser from 'phaser';
import { FONT_METRICS, pixelFont, wrapText } from '../font';
import { COLORS } from '../theme';
import type { Rect } from './Hotspots';

export interface TextStyle {
  /** Кратность растрового шрифта. Только целая: дробная его размывает. */
  scale?: 1 | 2 | undefined;
  color?: number | undefined;
  align?: 'left' | 'center' | 'right' | undefined;
  wrapWidth?: number | undefined;
}

/** Надпись на экране: вызывающему нужна только её ширина под подложку. */
export interface Label {
  readonly width: number;
  readonly height: number;
}

/**
 * Немедленный режим отрисовки: экран перерисовывается целиком при каждом
 * изменении состояния. При 480x270 объектов десятки, так что это дешевле
 * и куда понятнее, чем ручная синхронизация дерева виджетов.
 */
export class Painter {
  private readonly shapes: Phaser.GameObjects.Graphics;
  private readonly texts: Phaser.GameObjects.BitmapText[] = [];
  private readonly images: Phaser.GameObjects.Image[] = [];

  /**
   * Весь текст ложится поверх общей Graphics внутри одного контейнера,
   * поэтому порядок вызовов слои не разделяет. Разделяют контейнеры:
   * мир и интерфейс рисуются разными Painter'ами.
   */

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly layer: Phaser.GameObjects.Container,
  ) {
    this.shapes = scene.add.graphics();
    layer.add(this.shapes);
  }

  clear(): void {
    this.shapes.clear();
    for (const text of this.texts) text.destroy();
    this.texts.length = 0;
    for (const image of this.images) image.destroy();
    this.images.length = 0;
    this.layer.bringToTop(this.shapes);
  }

  /** Спрайт с привязкой к нижнему центру: персонаж стоит ногами в точке. */
  sprite(x: number, y: number, key: string, flipX = false): void {
    const image = this.scene.add.image(Math.round(x), Math.round(y), key);
    image.setOrigin(0.5, 1);
    image.setFlipX(flipX);
    this.layer.add(image);
    this.images.push(image);
  }

  fill(rect: Rect, color: number, alpha: number = 1): void {
    this.shapes.fillStyle(color, alpha);
    this.shapes.fillRect(rect.x, rect.y, rect.w, rect.h);
  }

  stroke(rect: Rect, color: number): void {
    this.shapes.lineStyle(1, color, 1);
    this.shapes.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
  }

  panel(rect: Rect, fill: number = COLORS.panel, border: number = COLORS.border): void {
    this.fill(rect, fill);
    this.stroke(rect, border);
  }

  /** Полоска ресурса. Пустая часть рисуется приглушённо, а не пропадает. */
  bar(rect: Rect, value: number, max: number, color: number): void {
    this.fill(rect, COLORS.disabled);
    const ratio = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
    if (ratio > 0) {
      this.fill({ ...rect, w: Math.max(1, Math.round(rect.w * ratio)) }, color);
    }
    this.stroke(rect, COLORS.border);
  }

  text(x: number, y: number, value: string, style: TextStyle = {}): Phaser.GameObjects.BitmapText {
    const body = style.wrapWidth ? wrapText(value, style.wrapWidth).join('\n') : value;
    const object = this.scene.add.bitmapText(
      Math.round(x),
      Math.round(y),
      pixelFont(this.scene, style.color ?? COLORS.text),
      body,
      FONT_METRICS.height * (style.scale ?? 1),
    );

    if (style.align === 'center') {
      object.setOrigin(0.5, 0);
      object.setCenterAlign();
    } else if (style.align === 'right') {
      object.setOrigin(1, 0);
      object.setRightAlign();
    }

    this.layer.add(object);
    this.texts.push(object);
    return object;
  }

  /**
   * Текст, вписанный по вертикали в прямоугольник.
   * Возвращает надпись, чтобы вызывающий мог узнать её реальную ширину:
   * подложку под текст иначе не подогнать. Порядок вызовов при этом
   * не важен — фигуры всё равно рисуются под текстом.
   */
  label(rect: Rect, value: string, style: TextStyle = {}): Label {
    const object = this.text(rect.x, rect.y, value, style);
    const align = style.align ?? 'left';
    const x = align === 'center' ? rect.x + rect.w / 2 : align === 'right' ? rect.x + rect.w : rect.x;
    object.setPosition(Math.round(x), Math.round(rect.y + (rect.h - object.height) / 2));
    return object;
  }

  button(rect: Rect, label: string, state: { enabled: boolean; focused: boolean; accent?: boolean }): void {
    const border = !state.enabled
      ? COLORS.disabled
      : state.focused
        ? COLORS.borderFocus
        : COLORS.border;
    this.panel(rect, state.focused ? COLORS.panelAlt : COLORS.panel, border);
    this.label(
      { x: rect.x + 4, y: rect.y, w: rect.w - 8, h: rect.h },
      label,
      {
        align: 'center',
        color: !state.enabled ? COLORS.textMuted : state.accent ? COLORS.accent : COLORS.text,
      },
    );
  }

  destroy(): void {
    this.clear();
    this.shapes.destroy();
  }
}
