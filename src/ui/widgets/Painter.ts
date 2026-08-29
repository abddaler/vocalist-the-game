import Phaser from 'phaser';
import { FONT_METRICS, measureLine, pixelFont, wrapText } from '../font';
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
 *
 * Порядок вызовов — это порядок слоёв. Раньше вся заливка шла в одну
 * Graphics, а спрайты и надписи добавлялись в контейнер после неё, и
 * потому всегда оказывались сверху: человек стоял поверх дерева, за
 * которым прячется, и поверх машины, из-за которой выходит. Теперь
 * спрайт разрезает поток заливки — то, что нарисовано после него, ложится
 * поверх, а то, что до, остаётся под.
 *
 * Объекты не создаются заново каждый кадр, а берутся из пула: при
 * двадцати прохожих и десятке надписей создание и уничтожение
 * Graphics, Image и BitmapText само по себе стоило кадра.
 */
export class Painter {
  private readonly canvases: Phaser.GameObjects.Graphics[] = [];
  private readonly sprites: Phaser.GameObjects.Image[] = [];
  private readonly labels: Phaser.GameObjects.BitmapText[] = [];
  private used = { canvases: 0, sprites: 0, labels: 0 };
  /** Текущая Graphics: null — значит, поверх спрайта ещё ничего не рисовали. */
  private shapes: Phaser.GameObjects.Graphics | null = null;
  /** Окно, за которое заливка не выходит. Нужен небу: силуэт за крышами
   * растёт вверх и без окна залезал бы на панель ресурсов. */
  private clipRect: Rect | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly layer: Phaser.GameObjects.Container,
  ) {}

  clear(): void {
    for (const item of this.canvases) item.clear();
    for (const item of this.sprites) item.setVisible(false);
    for (const item of this.labels) item.setVisible(false);
    this.used = { canvases: 0, sprites: 0, labels: 0 };
    this.shapes = null;
    this.clipRect = null;
  }

  /**
   * Холст под ближайшую заливку. Новый берётся только после спрайта или
   * надписи: пустых Graphics в контейнере быть не должно.
   */
  private canvas(): Phaser.GameObjects.Graphics {
    if (this.shapes) return this.shapes;
    const index = this.used.canvases;
    this.used.canvases += 1;
    let target = this.canvases[index];
    if (!target) {
      target = this.scene.add.graphics();
      this.canvases[index] = target;
      this.layer.add(target);
    } else {
      this.layer.bringToTop(target);
    }
    this.shapes = target;
    return target;
  }

  /**
   * Ширина надписи до того, как её нарисуют. Нужна подложке: рисовать
   * плашку после текста больше нельзя — она ляжет поверх него.
   */
  measure(value: string, scale: 1 | 2 = 1): number {
    return measureLine(value) * scale;
  }

  /** Ограничить заливку прямоугольником; null снимает ограничение. */
  clip(rect: Rect | null): void {
    this.clipRect = rect;
  }

  /** Спрайт с привязкой к нижнему центру: персонаж стоит ногами в точке. */
  sprite(x: number, y: number, key: string, flipX = false, frame?: string): void {
    const image = this.take(key, frame);
    image.setOrigin(0.5, 1);
    image.setPosition(Math.round(x), Math.round(y));
    image.setFlipX(flipX);
  }

  /**
   * Готовый кадр атласа левым верхним углом в точке. Так рисуется вся
   * объёмная мелочь: её изображение не меняется от кадра к кадру, и
   * пересобирать его из полутора сотен заливок каждый раз незачем.
   */
  stamp(x: number, y: number, key: string, frame: string, alpha = 1): void {
    const image = this.take(key, frame);
    image.setOrigin(0, 0);
    image.setPosition(Math.round(x), Math.round(y));
    image.setFlipX(false);
    image.setAlpha(alpha);
  }

  /** Картинка из пула, поднятая на верх контейнера. */
  private take(key: string, frame?: string): Phaser.GameObjects.Image {
    const index = this.used.sprites;
    this.used.sprites += 1;
    let image = this.sprites[index];
    if (!image) {
      image = this.scene.add.image(0, 0, key, frame);
      this.sprites[index] = image;
      this.layer.add(image);
    } else {
      image.setTexture(key, frame);
      image.setVisible(true);
      this.layer.bringToTop(image);
    }
    // Прозрачность сбрасывается всегда: картинка идёт из пула, и
    // выцветший пузырь оставил бы её полупрозрачной следующему, кто её
    // возьмёт.
    image.setAlpha(1);
    // Следующая заливка ляжет поверх спрайта, а не под него.
    this.shapes = null;
    return image;
  }

  fill(rect: Rect, color: number, alpha: number = 1): void {
    const box = this.clipRect ? intersect(rect, this.clipRect) : rect;
    if (!box) return;
    const shapes = this.canvas();
    shapes.fillStyle(color, alpha);
    shapes.fillRect(box.x, box.y, box.w, box.h);
  }

  /**
   * Заливка многоугольника одной командой. Изометрия состоит из ромбов и
   * скошенных граней; собранные из прямоугольников столбик за столбиком,
   * они стоили сотен тысяч заливок в секунду и клали телефон.
   */
  polygon(points: ReadonlyArray<{ x: number; y: number }>, color: number, alpha = 1): void {
    if (points.length < 3) return;
    if (this.clipRect && outside(points, this.clipRect)) return;
    const shapes = this.canvas();
    shapes.fillStyle(color, alpha);
    shapes.fillPoints(points as { x: number; y: number }[], true);
  }

  stroke(rect: Rect, color: number): void {
    const shapes = this.canvas();
    shapes.lineStyle(1, color, 1);
    shapes.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
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
    const font = pixelFont(this.scene, style.color ?? COLORS.text);
    const size = FONT_METRICS.height * (style.scale ?? 1);

    const index = this.used.labels;
    this.used.labels += 1;
    let object = this.labels[index];
    if (!object) {
      object = this.scene.add.bitmapText(0, 0, font, body, size);
      this.labels[index] = object;
      this.layer.add(object);
    } else {
      object.setFont(font, size);
      object.setText(body);
      object.setVisible(true);
      this.layer.bringToTop(object);
    }

    const align = style.align ?? 'left';
    object.setOrigin(align === 'center' ? 0.5 : align === 'right' ? 1 : 0, 0);
    object.setLeftAlign();
    if (align === 'center') object.setCenterAlign();
    if (align === 'right') object.setRightAlign();
    object.setPosition(Math.round(x), Math.round(y));

    // Надпись тоже разрезает поток: подложка под неё должна лечь ниже.
    this.shapes = null;
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
    for (const item of this.canvases) item.destroy();
    for (const item of this.sprites) item.destroy();
    for (const item of this.labels) item.destroy();
    this.canvases.length = 0;
    this.sprites.length = 0;
    this.labels.length = 0;
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
