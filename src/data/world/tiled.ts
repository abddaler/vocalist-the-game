import { DECOR_KINDS } from '@core/types';
import type { DecorDef, DecorKind, IsoMapDef, TileDef, TileKind } from '@core/types';

/**
 * Импорт карты из Tiled.
 *
 * Свой редактор карт писать нельзя: он съест недели и всё равно будет
 * хуже. Tiled умеет изометрию, и от нас требуется одно — принять его
 * выгрузку. Разбор живёт в data/, потому что это чтение контента, и не
 * знает ни про Phaser, ни про экран: на выходе те же строки с легендой,
 * что пишутся руками, и тот же список мелочи.
 *
 * Читается подмножество формата: ортогональные слои плиток и слои
 * объектов. Всё остальное — бесконечные карты, слои изображений, группы —
 * отвергается с внятной ошибкой, а не молча теряется.
 *
 * Как настроить карту в Tiled:
 *   — ориентация Isometric, «Infinite» снять;
 *   — у каждой плитки набора свойство `kind` со значением из покрытий
 *     (road, pavement, sand, …) и, если нужно, целое `level`;
 *   — земля — первый слой плиток; пустая клетка означает дыру;
 *   — мелочь — слой объектов, у объекта класс равен виду предмета
 *     (palm, bench, …), необязательные свойства `variant` и `facing`;
 *   — сохранять как JSON со встроенным набором плиток: без него
 *     свойства плиток в файл не попадут.
 */
export interface TiledProperty {
  readonly name: string;
  readonly value: string | number | boolean;
}

export interface TiledTile {
  readonly id: number;
  readonly properties?: readonly TiledProperty[] | undefined;
}

export interface TiledTileset {
  readonly firstgid: number;
  readonly tiles?: readonly TiledTile[] | undefined;
}

export interface TiledObject {
  readonly x: number;
  readonly y: number;
  /** Вид предмета. В новых версиях поле зовётся class, в старых type. */
  readonly class?: string | undefined;
  readonly type?: string | undefined;
  readonly properties?: readonly TiledProperty[] | undefined;
}

export interface TiledLayer {
  readonly type: string;
  readonly name?: string | undefined;
  readonly data?: readonly number[] | undefined;
  readonly objects?: readonly TiledObject[] | undefined;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
}

export interface TiledMap {
  readonly orientation: string;
  readonly infinite?: boolean | undefined;
  readonly width: number;
  readonly height: number;
  readonly tileheight: number;
  readonly layers: readonly TiledLayer[];
  readonly tilesets: readonly TiledTileset[];
}

export interface TiledWorld {
  readonly tiles: IsoMapDef;
  readonly decor: readonly DecorDef[];
}

/**
 * Символы легенды. Пробел не используется: им обозначается дыра в карте,
 * куда не ходят и которую не рисуют.
 */
const ALPHABET = '.,:;+=*#%@0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Старшие три бита gid — отражения и поворот плитки. Нам они не нужны,
 * но без их снятия номер превращается в миллиард и плитка «не находится».
 */
const GID_FLAGS = 0x1fffffff;

const KINDS = new Set<string>([
  'road', 'roadLine', 'pavement', 'plaza', 'deck', 'sand', 'water', 'grass',
  'carpet', 'steps', 'wood', 'marble', 'dance', 'stage', 'rug', 'void',
]);

const DECOR = new Set<string>(DECOR_KINDS);

const propertyOf = (
  properties: readonly TiledProperty[] | undefined,
  name: string,
): string | number | boolean | undefined => properties?.find((entry) => entry.name === name)?.value;

/** Плитки по номеру: вид и уровень берутся из свойств плитки в наборе. */
function tileTable(tilesets: readonly TiledTileset[]): Map<number, TileDef> {
  const table = new Map<number, TileDef>();
  for (const set of tilesets) {
    for (const tile of set.tiles ?? []) {
      const kind = propertyOf(tile.properties, 'kind');
      if (kind === undefined) continue;
      if (typeof kind !== 'string' || !KINDS.has(kind)) {
        throw new Error(`Плитка ${set.firstgid + tile.id}: неизвестное покрытие «${String(kind)}»`);
      }
      const level = propertyOf(tile.properties, 'level') ?? 0;
      if (typeof level !== 'number' || !Number.isInteger(level) || level < 0) {
        throw new Error(`Плитка ${set.firstgid + tile.id}: уровень должен быть целым от нуля`);
      }
      table.set(set.firstgid + tile.id, { kind: kind as TileKind, level });
    }
  }
  return table;
}

/** Первый слой плиток: он и есть земля. */
function groundOf(map: TiledMap): TiledLayer {
  const ground = map.layers.find((layer) => layer.type === 'tilelayer');
  if (!ground || !ground.data) throw new Error('В карте нет ни одного слоя плиток');
  if (ground.data.length !== map.width * map.height) {
    throw new Error(
      `Слой «${ground.name ?? '?'}»: ${ground.data.length} плиток при карте ${map.width}x${map.height}`,
    );
  }
  return ground;
}

/**
 * Объект в плитки. У изометрической карты Tiled держит координаты
 * объектов в косой системе, где обе оси меряются высотой плитки, а не
 * шириной. Делить x на ширину — самая частая ошибка при переносе, и
 * карта тогда растягивается вдвое.
 */
const objectTile = (value: number, tileheight: number): number =>
  Math.round((value / tileheight) * 100) / 100;

function decorOf(map: TiledMap): DecorDef[] {
  const decor: DecorDef[] = [];
  for (const layer of map.layers) {
    if (layer.type !== 'objectgroup') continue;
    for (const object of layer.objects ?? []) {
      const kind = object.class ?? object.type;
      if (kind === undefined || kind === '') continue;
      if (!DECOR.has(kind)) {
        throw new Error(`Слой «${layer.name ?? '?'}»: неизвестный предмет «${kind}»`);
      }
      const variant = propertyOf(object.properties, 'variant');
      const facing = propertyOf(object.properties, 'facing');
      if (facing !== undefined && facing !== 'x' && facing !== 'y') {
        throw new Error(`Предмет «${kind}»: сторона бывает только x или y`);
      }
      decor.push({
        kind: kind as DecorKind,
        x: objectTile(object.x, map.tileheight),
        y: objectTile(object.y, map.tileheight),
        ...(typeof variant === 'number' ? { variant } : {}),
        ...(facing === undefined ? {} : { facing }),
      });
    }
  }
  return decor;
}

export function fromTiled(map: TiledMap): TiledWorld {
  if (map.orientation !== 'isometric') {
    throw new Error(`Карта должна быть изометрической, а не «${map.orientation}»`);
  }
  if (map.infinite === true) {
    throw new Error('Бесконечная карта не поддерживается: в Tiled снимите «Infinite»');
  }

  const table = tileTable(map.tilesets);
  const ground = groundOf(map);
  const data = ground.data as readonly number[];

  // Легенда набирается по ходу: разных плиток на карте всегда меньше,
  // чем клеток, и держать символ на каждую пару «покрытие плюс уровень»
  // дешевле, чем на каждую клетку.
  const legend: Record<string, TileDef> = {};
  const symbols = new Map<string, string>();
  const rows: string[] = [];

  for (let y = 0; y < map.height; y += 1) {
    let row = '';
    for (let x = 0; x < map.width; x += 1) {
      const gid = (data[y * map.width + x] ?? 0) & GID_FLAGS;
      if (gid === 0) {
        row += ' ';
        continue;
      }
      const tile = table.get(gid);
      if (!tile) throw new Error(`Плитка ${gid} в ряду ${y}: нет свойства «kind» в наборе`);
      if (tile.kind === 'void') {
        row += ' ';
        continue;
      }

      const key = `${tile.kind}:${tile.level}`;
      let symbol = symbols.get(key);
      if (symbol === undefined) {
        symbol = ALPHABET[symbols.size];
        if (symbol === undefined) {
          throw new Error(`Слишком много разных плиток: больше ${ALPHABET.length} легенда не вмещает`);
        }
        symbols.set(key, symbol);
        legend[symbol] = tile;
      }
      row += symbol;
    }
    rows.push(row);
  }

  return { tiles: { legend, rows }, decor: decorOf(map) };
}
