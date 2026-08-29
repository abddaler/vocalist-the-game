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
  /** Окно, за которое заливка не выходит. Нужен небу: силуэт за крышами
   * растёт вверх и без окна залезал бы на панель ресурсов. */
  private clipRect: Rect | null = null;

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
    this.clipRect = null;
    this.layer.bringToTop(this.shapes);
  }

  /** Ограничить заливку прямоугольником; null снимает ограничение. */
  clip(rect: Rect | null): void {
    this.clipRect = rect;
  }

  /** Спрайт с привязкой к нижнему центру: персонаж стоит ногами в точке. */
  sprite(x: number, y: number, key: string, flipX = false, scale = 1): void {
    const image = this.scene.add.image(Math.round(x), Math.round(y), key);
    image.setOrigin(0.5, 1);
    image.setFlipX(flipX);
    if (scale !== 1) image.setScale(scale);
    this.layer.add(image);
    this.images.push(image);
  }

  fill(rect: Rect, color: number, alpha: number = 1): void {
    const box = this.clipRect ? intersect(rect, this.clipRect) : rect;
    if (!box) return;
    this.shapes.fillStyle(color, alpha);
    this.shapes.fillRect(box.x, box.y, box.w, box.h);
  }

  /**
   * Заливка многоугольника одной командой. Изометрия состоит из ромбов и
   * скошенных граней; собранные из прямоугольников столбик за столбиком,
   * они стоили сотен тысяч заливок в секунду и клали телефон.
   */
  polygon(points: ReadonlyArray<{ x: number; y: number }>, color: number, alpha = 1): void {
    if (points.length < 3) return;
    if (this.clipRect && outside(points, this.clipRect)) return;
    this.shapes.fillStyle(color, alpha);
    this.shapes.fillPoints(points as { x: number; y: number }[], true);
  }

  stroke(rect: Rect, color: number): void {
    this.shapes.lineStyle(1, color, 1);
    this.shapes.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
  }

  panel(rect: Rect, fill: number = COLORS.panel, border: number = COLORS.border): void {
    this.fill(rect, fill);
    this.stroke(rect, border);
  }

  /**
   * Табличка со скошенными углами. Прямые углы на такой палитре выглядят
   * веб-страницей; срезанный пиксель на каждом углу — примета аркадного
   * интерфейса и стоит четыре вызова заливки.
   */
  plate(rect: Rect, fill: number, border: number, glow = false): void {
    const { x, y, w, h } = rect;
    this.fill({ x: x + 2, y, w: w - 4, h }, fill);
    this.fill({ x, y: y + 2, w, h: h - 4 }, fill);
    this.fill({ x: x + 1, y: y + 1, w: w - 2, h: h - 2 }, fill);

    this.fill({ x: x + 2, y, w: w - 4, h: 1 }, border);
    this.fill({ x: x + 2, y: y + h - 1, w: w - 4, h: 1 }, border);
    this.fill({ x, y: y + 2, w: 1, h: h - 4 }, border);
    this.fill({ x: x + w - 1, y: y + 2, w: 1, h: h - 4 }, border);
    this.fill({ x: x + 1, y: y + 1, w: 1, h: 1 }, border);
    this.fill({ x: x + w - 2, y: y + 1, w: 1, h: 1 }, border);
    this.fill({ x: x + 1, y: y + h - 2, w: 1, h: 1 }, border);
    this.fill({ x: x + w - 2, y: y + h - 2, w: 1, h: 1 }, border);

    // Отсвет вокруг рамки: подсвеченная кнопка должна светиться, а не
    // просто менять цвет обводки.
    if (glow) this.fill({ x: x - 1, y: y - 1, w: w + 2, h: h + 2 }, border, 0.18);
  }

  /**
   * Полоска ресурса. Пустая часть приглушена, заполненная — с бликом
   * сверху и тенью снизу: плоский прямоугольник на этой палитре теряется.
   */
  bar(rect: Rect, value: number, max: number, color: number): void {
    this.fill(rect, COLORS.panelDeep);
    const ratio = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
    if (ratio > 0) {
      const filled = { ...rect, w: Math.max(2, Math.round(rect.w * ratio)) };
      this.fill(filled, color);
      this.fill({ ...filled, h: 1 }, 0xffffff, 0.45);
      this.fill({ ...filled, y: filled.y + filled.h - 1, h: 1 }, 0x000000, 0.28);
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
        : state.accent
          ? COLORS.accent
          : COLORS.border;
    this.plate(rect, state.focused ? COLORS.panelAlt : COLORS.panel, border, state.focused);
    // Блик по верхней кромке: кнопка должна выглядеть выпуклой.
    this.fill({ x: rect.x + 2, y: rect.y + 1, w: rect.w - 4, h: 1 }, 0xffffff, 0.1);
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

/** Целиком ли многоугольник за пределами окна отсечения. */
function outside(points: ReadonlyArray<{ x: number; y: number }>, clip: Rect): boolean {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  return maxX <= clip.x || minX >= clip.x + clip.w || maxY <= clip.y || minY >= clip.y + clip.h;
}

/** Пересечение прямоугольников или null, если его нет. */
function intersect(a: Rect, b: Rect): Rect | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const w = Math.min(a.x + a.w, b.x + b.w) - x;
  const h = Math.min(a.y + a.h, b.y + b.h) - y;
  return w > 0 && h > 0 ? { x, y, w, h } : null;
}
