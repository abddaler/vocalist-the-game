/**
 * Изометрический мир (раздел 8). Карта — сетка плиток: у каждой своё
 * покрытие и уровень. Между соседними плитками разных уровней сама собой
 * встаёт стенка, а лестница — это плитка, которая уровни связывает.
 *
 * Сетка задаётся строками символов с легендой: так карту видно глазами
 * прямо в исходнике, и «пляж под улицей» не приходится держать в уме.
 */
export type TileKind =
  | 'road'
  | 'pavement'
  | 'plaza'
  | 'deck'
  | 'sand'
  | 'water'
  | 'grass'
  | 'carpet'
  | 'steps'
  | 'wood'
  | 'marble'
  | 'dance'
  | 'stage'
  | 'rug'
  /** Дыры в карте нет: сюда просто не ходят и её не рисуют. */
  | 'void';

export interface TileDef {
  readonly kind: TileKind;
  /** Уровень земли. Между разными уровнями ходят только по лестницам. */
  readonly level: number;
}

/**
 * Что стоит на земле. Коробка — стойка, диван, парапет, дом; предмет —
 * пальма, зонт, урна: он рисуется прежними процедурами и стоит щитом,
 * как и в самой Miami Nights.
 */
export type StructureKind =
  | 'building'
  | 'counter'
  | 'seat'
  | 'planter'
  | 'railing'
  | 'stall'
  | 'canopy'
  | 'block'
  | 'screen';

export interface StructureDef {
  readonly kind: StructureKind;
  /** Северный угол основания, в плитках. */
  readonly x: number;
  readonly y: number;
  /** Размер основания в плитках. */
  readonly w: number;
  readonly d: number;
  /** Высота в пикселях экрана. */
  readonly h: number;
  readonly color: number;
  /** Подпись на фасаде или на вывеске. */
  readonly signKey?: string | undefined;
  readonly variant?: number | undefined;
}
