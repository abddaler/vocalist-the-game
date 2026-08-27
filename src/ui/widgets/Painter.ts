import Phaser from 'phaser';
import { COLORS, FONT, hex } from '../theme';
import type { Rect } from './Hotspots';

export interface TextStyle {
  size?: keyof typeof FONT | undefined;
  color?: number | undefined;
  align?: 'left' | 'center' | 'right' | undefined;
  wrapWidth?: number | undefined;
}

/**
 * Немедленный режим отрисовки: экран перерисовывается целиком при каждом
 * изменении состояния. При 480x270 объектов десятки, так что это дешевле
 * и куда понятнее, чем ручная синхронизация дерева виджетов.
 */
export class Painter {
  private readonly shapes: Phaser.GameObjects.Graphics;
  private readonly texts: Phaser.GameObjects.Text[] = [];

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
    this.layer.bringToTop(this.shapes);
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

  text(x: number, y: number, value: string, style: TextStyle = {}): Phaser.GameObjects.Text {
    const object = this.scene.add.text(x, y, value, {
      fontFamily: FONT.family,
      fontSize: FONT[style.size ?? 'small'],
      color: hex(style.color ?? COLORS.text),
      align: style.align ?? 'left',
      ...(style.wrapWidth ? { wordWrap: { width: style.wrapWidth, useAdvancedWrap: true } } : {}),
    });
    object.setResolution(1);
    if (style.align === 'center') object.setOrigin(0.5, 0);
    else if (style.align === 'right') object.setOrigin(1, 0);

    this.layer.add(object);
    this.texts.push(object);
    return object;
  }

  /** Текст, вписанный по вертикали в прямоугольник. */
  label(rect: Rect, value: string, style: TextStyle = {}): void {
    const object = this.text(rect.x, rect.y, value, style);
    const align = style.align ?? 'left';
    const x = align === 'center' ? rect.x + rect.w / 2 : align === 'right' ? rect.x + rect.w : rect.x;
    object.setPosition(x, rect.y + (rect.h - object.height) / 2);
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
