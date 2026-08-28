import Phaser from 'phaser';
import { FONT_METRICS, GLYPHS } from './glyphs';
import { advanceOf } from './metrics';

/**
 * Растровый шрифт: атлас глифов рисуется в canvas-текстуру и регистрируется
 * как bitmap-шрифт Phaser.
 *
 * Цвет запечён в текстуру, а не наложен tint'ом: tint у BitmapText работает
 * только в WebGL, а Phaser.AUTO вправе выбрать canvas. Цветов в палитре
 * около десятка, атлас крошечный, так что своя текстура на цвет дешевле
 * любой развилки по рендереру.
 */
const ATLAS_WIDTH = 256;
const PADDING = 1;

const keyFor = (color: number): string => `px-${color.toString(16).padStart(6, '0')}`;

interface Placed {
  readonly char: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly top: number;
}

/** Раскладка глифов по атласу. Одна на все цвета: рисунок от цвета не зависит. */
function layout(): { placed: Placed[]; height: number } {
  const placed: Placed[] = [];
  let x = 0;
  let y = 0;

  for (const [char, glyph] of Object.entries(GLYPHS)) {
    const w = glyph.width;
    const h = glyph.rows.length;
    if (x + w > ATLAS_WIDTH) {
      x = 0;
      y += FONT_METRICS.height + PADDING;
    }
    placed.push({ char, x, y, w, h, top: glyph.top });
    x += w + PADDING;
  }

  return { placed, height: y + FONT_METRICS.height + PADDING };
}

const LAYOUT = layout();

function paintAtlas(texture: Phaser.Textures.CanvasTexture, color: number): void {
  const ctx = texture.getContext();
  ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;

  for (const spot of LAYOUT.placed) {
    const rows = GLYPHS[spot.char]!.rows;
    rows.forEach((row, dy) => {
      for (let dx = 0; dx < row.length; dx += 1) {
        if (row[dx] === '#') ctx.fillRect(spot.x + dx, spot.y + dy, 1, 1);
      }
    });
  }

  texture.refresh();
}

function fontData(texture: Phaser.Textures.CanvasTexture, key: string): unknown {
  const chars: Record<number, unknown> = {};
  const width = texture.width;
  const height = texture.height;

  for (const spot of LAYOUT.placed) {
    const ink = GLYPHS[spot.char]!.rows.some((row) => row.includes('#'));
    // Пробел рисовать нечем: у него остаётся только шаг.
    const w = ink ? spot.w : 0;
    const h = ink ? spot.h : 0;

    if (ink) {
      const frame = texture.add(spot.char, 0, spot.x, spot.y, w, h);
      if (frame) {
        frame.setUVs(w, h, spot.x / width, spot.y / height, (spot.x + w) / width, (spot.y + h) / height);
      }
    }

    chars[spot.char.codePointAt(0)!] = {
      x: spot.x,
      y: spot.y,
      width: w,
      height: h,
      centerX: Math.floor(w / 2),
      centerY: Math.floor(h / 2),
      xOffset: 0,
      yOffset: spot.top,
      xAdvance: advanceOf(spot.char),
      data: {},
      kerning: {},
      u0: spot.x / width,
      v0: spot.y / height,
      u1: (spot.x + w) / width,
      v1: (spot.y + h) / height,
    };
  }

  return { font: key, size: FONT_METRICS.height, lineHeight: FONT_METRICS.lineHeight, chars };
}

/**
 * Ключ bitmap-шрифта нужного цвета. Текстура строится один раз на игру:
 * повторный вызов только возвращает ключ.
 */
export function pixelFont(scene: Phaser.Scene, color: number): string {
  const key = keyFor(color);
  if (scene.cache.bitmapFont.has(key)) return key;

  const texture = scene.textures.createCanvas(key, ATLAS_WIDTH, LAYOUT.height);
  if (!texture) throw new Error(`не удалось создать текстуру шрифта ${key}`);

  paintAtlas(texture, color);
  scene.cache.bitmapFont.add(key, {
    data: fontData(texture, key) as Phaser.Types.GameObjects.BitmapText.BitmapFontData,
    texture: key,
    frame: null,
  });

  return key;
}
