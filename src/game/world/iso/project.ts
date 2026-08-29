/**
 * Изометрическая проекция мира. Камера смотрит на землю сверху под углом,
 * поэтому по земле видно, где ты идёшь: отсюда и уровни, и лестницы, и
 * пляж под улицей. Вид сбоку такого показать не может — там земля вырождена
 * в полосу.
 *
 * Плитка — классический ромб два к одному: 32 на 16 внутренних пикселей.
 * Ряды ромба идут шириной 2, 6, 10 … 30, 30 … 2, поэтому его край ложится
 * ровно по пикселям и не рябит.
 */
export const TILE = {
  /** Половина ширины ромба. */
  halfW: 16,
  /** Половина высоты ромба. */
  halfH: 8,
  /** Высота одного уровня земли на экране. */
  level: 12,
} as const;

/**
 * Полоса неба над самой дальней плиткой карты: её высота входит в
 * текстуру подложки, чтобы небо и крыши не разъезжались при прокрутке.
 */
export const SKY_BAND = 96;

/**
 * Размер текстуры подложки. Один на все районы и комнаты: она выделяется
 * ровно однажды и дальше только перерисовывается. Менять размер на
 * каждый переход — тот же поток выделений памяти, от которого телефонный
 * WebGL теряет контекст и чернеет.
 */
export const CANVAS_SIZE = { width: 1024, height: 640 } as const;

/** Точка на земле в плитках. z — уровень, а не пиксели. */
export interface IsoPoint {
  readonly x: number;
  readonly y: number;
  readonly z?: number | undefined;
}

export interface ScreenPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * Плитка в экранные координаты карты. Начало координат — точка (0,0);
 * сдвиг карты в кадр добавляет вызывающий, чтобы проекция оставалась
 * чистой функцией.
 */
export function toScreen(point: IsoPoint): ScreenPoint {
  return {
    x: (point.x - point.y) * TILE.halfW,
    y: (point.x + point.y) * TILE.halfH - (point.z ?? 0) * TILE.level,
  };
}

/**
 * Экранная точка обратно в плитку нулевого уровня. Нужна тапу: игрок
 * тычет в землю, а идти надо в плитку.
 */
export function toGround(screen: ScreenPoint): IsoPoint {
  const u = screen.x / TILE.halfW;
  const v = screen.y / TILE.halfH;
  return { x: (v + u) / 2, y: (v - u) / 2 };
}

/**
 * Порядок отрисовки: чем больше, тем ближе к камере и тем позже рисуется.
 * Уровень входит в глубину слабее плитки — иначе предмет на верхней
 * площадке заслонял бы то, что стоит перед ней.
 */
export function depthOf(point: IsoPoint): number {
  return point.x + point.y + (point.z ?? 0) * 0.001;
}

/** Размер карты на экране в пикселях. */
export function mapSize(width: number, depth: number, levels = 0): { w: number; h: number } {
  return {
    w: (width + depth) * TILE.halfW,
    h: (width + depth) * TILE.halfH + levels * TILE.level,
  };
}

/**
 * Сдвиг начала карты внутри её текстуры: у плитки (0, depth) самый левый
 * край, и без сдвига половина карты ушла бы в отрицательные координаты.
 */
export function mapOrigin(depth: number, levels = 0): ScreenPoint {
  return { x: depth * TILE.halfW, y: levels * TILE.level };
}
