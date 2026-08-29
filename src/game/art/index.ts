import type Phaser from 'phaser';
import { ACCESSORY } from './accessory';
import { BODY, BODY_ROWS, FACING_OF, POSES } from './body';
import type { Frame } from './body';
import { HAIR } from './hair';
import { LOOKS, PALETTES } from './looks';
import { OUTFIT, OUTFIT_TOP } from './outfit';
import type { LegWear } from './outfit';

export { ACTOR_SPRITE, POSES } from './body';
export type { ActorPose } from './body';
export { LOOKS, lookIndex } from './looks';
export type { Look } from './looks';

/** Ключ текстуры: внешность плюс поза. */
export function actorTexture(lookIndex: number, pose: string): string {
  return `actor-${lookIndex}-${pose}`;
}

/** Индекс внешности игрока. Прохожие идут дальше по списку. */
export const PLAYER_LOOK = 0;

/**
 * Наложение слоя на кадр, начиная с ряда top. Слой короче кадра —
 * остальное остаётся телом; точка в слое означает «не трогать», а не
 * «стереть».
 */
function overlay(base: Frame, layer: Frame, top = 0): Frame {
  if (layer.length === 0) return base;
  return base.map((row, y) => {
    const patch = layer[y - top];
    if (patch === undefined) return row;
    return [...row]
      .map((cell, x) => {
        const over = patch[x];
        return over === undefined || over === '.' ? cell : over;
      })
      .join('');
  });
}

/** Кожа в брючине: тело красится по своему силуэту, а не закрывается рисунком. */
const CLOTHED: Readonly<Record<string, string>> = { 2: '9', 3: 'H', F: '9' };

/** Юбка: расширяется книзу и обрывается у колена. Ниже — открытая нога. */
const SKIRT: Frame = [
  '......199999999999999991......',
  '.....19999999999999999991.....',
  '....1999999999999999999991....',
  '....1777777777777777777771....',
];

const SIDE_SKIRT: Frame = [
  '.......1999999999999991.......',
  '......19999999999999991......',
  '.....1999999999999999991.....',
  '.....1777777777777777771.....',
];

/**
 * Ноги в одежде. Брюки красят голень по её собственному силуэту, поэтому
 * они не отстают от шага; юбка накрывает верх ног своей формой, а голень
 * оставляет открытой.
 */
export function dressLegs(frame: Frame, wear: LegWear, facing: 'front' | 'back' | 'side'): Frame {
  if (wear === 'bare') return frame;
  if (wear === 'skirt') {
    return overlay(frame, facing === 'side' ? SIDE_SKIRT : SKIRT, BODY_ROWS.legs);
  }
  return frame.map((row, y) =>
    y < BODY_ROWS.legs || y >= BODY_ROWS.feet
      ? row
      : [...row].map((cell) => CLOTHED[cell] ?? cell).join(''),
  );
}

/** Теневой двойник цвета. Символы без пары кромку не принимают. */
const SHADOW: Readonly<Record<string, string>> = {
  2: '3',
  F: '2',
  4: 'J',
  5: '4',
  6: '7',
  8: 'G',
  9: 'H',
  A: 'K',
  B: 'C',
};

/** Световой двойник цвета: им берётся кромка со стороны света. */
const LIGHT: Readonly<Record<string, string>> = {
  2: 'F',
  3: '2',
  4: '5',
  6: 'L',
  7: '6',
  8: 'N',
  9: 'M',
};

/** Толщина теневой кромки и блика в пикселях кадра. */
const RIM = 2;
const GLINT = 1;

/**
 * Теневая кромка по правому краю фигуры. В изометрии свет падает слева
 * сверху, и всё в кадре — от плитки до коробки — тем и держит объём, что
 * правая грань темнее. Персонаж без кромки оставался единственным в мире
 * плоским пятном, вырезанным ножницами.
 *
 * Кромка подставляется при сборке, а не рисуется руками: иначе её
 * пришлось бы повторить в каждой причёске, рубашке и юбке — и в одной из
 * них забыть.
 */
export function rimmed(frame: Frame): Frame {
  return frame.map((row) => {
    const cells = [...row];
    paint(cells, cells.length - 1, -1, SHADOW, RIM);
    paint(cells, 0, 1, LIGHT, GLINT);
    return cells.join('');
  });
}

/**
 * Кромка с одного края строки: пропустить пустоту и контур, затем
 * перекрасить несколько пикселей подряд. Как только попался символ без
 * пары — лицо, глаз, пуговица, — кромка обрывается: рисунок на фигуре
 * важнее её объёма.
 */
function paint(
  cells: string[],
  from: number,
  step: number,
  tones: Readonly<Record<string, string>>,
  width: number,
): void {
  let x = from;
  const inside = (i: number): boolean => i >= 0 && i < cells.length;
  while (inside(x) && cells[x] === '.') x += step;
  while (inside(x) && cells[x] === '1') x += step;
  for (let done = 0; done < width && inside(x); x += step) {
    const tone = tones[cells[x]!];
    if (tone === undefined) break;
    cells[x] = tone;
    done += 1;
  }
}

/**
 * Текстуры собираются из строковых раскладок прямо в рантайме: арт лежит
 * в исходниках, читается в диффах и не требует шага сборки.
 */
export function buildActorTextures(scene: Phaser.Scene): void {
  LOOKS.forEach((look, index) => {
    const colors = PALETTES[index]!;

    for (const pose of POSES) {
      const key = actorTexture(index, pose);
      if (scene.textures.exists(key)) continue;

      const facing = FACING_OF[pose];
      const accessory = ACCESSORY[look.accessory];
      // Порядок слоёв: одежда поверх тела, волосы поверх головы, примета
      // поверх всего — очки должны лечь на лицо, а сумка на пиджак.
      const outfit = OUTFIT[look.outfit];
      let data = overlay(BODY[pose], outfit[facing], OUTFIT_TOP);
      data = dressLegs(data, outfit.legs, facing);
      data = overlay(data, HAIR[look.hair][facing]);
      data = overlay(data, accessory[facing], accessory.top);

      scene.textures.generate(key, {
        data: [...rimmed(data)],
        pixelWidth: 1,
        pixelHeight: 1,
        palette: colors,
      });
    }
  });
}
