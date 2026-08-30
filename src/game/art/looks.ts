import { NPC_IDS } from '@core/types';
import { palette } from './palettes';
import type { ActorPalette, Colors } from './palettes';
import type { Accessory, HairStyle, OutfitStyle } from './style';

/**
 * Внешность персонажа: палитра, стрижка, одежда и примета. Четыре
 * независимых слоя дают столько людей, сколько нужно, и в толпе
 * перестаёт мозолить глаз повтор.
 *
 * Первым идёт игрок, дальше — названные по имени, дальше прохожие.
 * Порядок важен: на имена внешностей ссылаются данные толпы.
 */
export interface Look {
  readonly id: string;
  readonly colors: Colors;
  readonly hair: HairStyle;
  readonly outfit: OutfitStyle;
  readonly accessory: Accessory;
}

const look = (
  id: string,
  colors: Colors,
  hair: HairStyle,
  outfit: OutfitStyle,
  accessory: Accessory = 'none',
): Look => ({ id, colors, hair, outfit, accessory });

/** Тона кожи: пять оттенков на весь город, чтобы толпа не была одной расы. */
const SKIN = {
  light: '#f0d0ae',
  fair: '#e6bc93',
  tan: '#c9975f',
  olive: '#a87a4c',
  deep: '#7d5334',
} as const;

export const LOOKS: readonly Look[] = [
  // — игрок —
  look(
    'player',
    {
      skin: SKIN.fair,
      hair: '#4a3020',
      cloth: '#3fbf8f',
      trim: '#8ff0cc',
      legs: '#38405c',
      shoes: '#26262e',
      accent: '#ffd34d',
    },
    'ponytail',
    'tee',
    'earrings',
  ),

  // — названные (9.3): каждого должно быть видно с другого конца улицы —
  // Педагог: высокий тугой пучок и очки на цепочке, глубокий бордовый.
  // Пучок меняет силуэт, а силуэт читается раньше лица.
  look(
    'teacher',
    {
      skin: SKIN.light,
      hair: '#6f6a72',
      cloth: '#7a1f38',
      trim: '#c9899c',
      legs: '#33303a',
      shoes: '#2a2630',
      accent: '#e0c060',
    },
    'bun',
    'coat',
    'spectacles',
  ),
  // Звукорежиссёр: наушники на шее и серо-оливковая толстовка. На голову
  // он их не надевает — по шее его и узнают.
  look(
    'engineer',
    {
      skin: SKIN.tan,
      hair: '#241c18',
      cloth: '#5e6349',
      trim: '#8e9470',
      legs: '#2c3038',
      shoes: '#22242a',
      accent: '#ff9a3d',
    },
    'short',
    'hoodie',
    'collar',
  ),
  // Промоутер: тёмные очки в помещении и слишком узкая куртка цвета
  // фуксии. Ни у кого в кадре больше нет этого цвета — так и задумано.
  look(
    'promoter',
    {
      skin: SKIN.olive,
      hair: '#191720',
      cloth: '#d6249f',
      trim: '#f27ac9',
      legs: '#1d1c28',
      shoes: '#141419',
      accent: '#ffd34d',
    },
    'short',
    'jacket',
    'shades',
  ),
  // Блогер: телефон в руке во всех кадрах и мятно-зелёный. В позе
  // разговора рука поднята — телефон поднимается вместе с ней.
  look(
    'blogger',
    {
      skin: SKIN.light,
      hair: '#e8dfa8',
      cloth: '#4fd6b0',
      trim: '#a8f0dc',
      legs: '#3a4256',
      shoes: '#e8e8ee',
      accent: '#5fe0ff',
    },
    'long',
    'crop',
    'phone',
  ),
  // Конкурент: тот же силуэт, что у игрока, но всегда в чёрном и с
  // идеально уложенными волосами. Сходство намеренное — он должен
  // читаться как «ты, но собранный».
  look(
    'rival',
    {
      skin: SKIN.fair,
      hair: '#1e1a20',
      cloth: '#1b1a22',
      trim: '#3c3a48',
      legs: '#16161c',
      shoes: '#101014',
      accent: '#c9c2d8',
    },
    'short',
    'jacket',
    'shades',
  ),

  // — прохожие —
  look('passer_1', body(SKIN.fair, '#2a2028', '#c96a6a', '#f0b0b0', '#3a3d4a', '#24242c', '#f0e0c0'), 'short', 'tee'),
  look('passer_2', body(SKIN.deep, '#1e1a20', '#4f8fd9', '#a8d0f0', '#2f3648', '#22222b', '#ffd34d'), 'curly', 'jacket', 'bag'),
  look('passer_3', body(SKIN.light, '#c9a24a', '#e8c46a', '#fff0c0', '#4a4030', '#3a3028', '#c95f4a'), 'long', 'dress', 'necklace'),
  look('passer_4', body(SKIN.tan, '#3a2a44', '#8a6ac9', '#d0b0f0', '#33304a', '#26242e', '#5fc98f'), 'ponytail', 'crop', 'glasses'),
  look('passer_5', body(SKIN.fair, '#7a3a3a', '#3fa89a', '#a0e8dc', '#2f3f44', '#242a2c', '#ff9a3d'), 'cap', 'track'),
  look('passer_6', body(SKIN.deep, '#141218', '#d8d2c8', '#ffffff', '#5a6070', '#2a2c34', '#4a8fd9'), 'short', 'suit'),
  look('passer_7', body(SKIN.light, '#b8b0a4', '#5f6880', '#a8b4cc', '#40465a', '#2a2c34', '#a8b8c8'), 'bald', 'coat'),
  look('passer_8', body(SKIN.tan, '#4a2f22', '#e88fb8', '#ffd0e8', '#c96a9a', '#e8e0e8', '#f0e8a0'), 'bob', 'dress', 'headphones'),
  look('passer_9', body(SKIN.olive, '#2a2420', '#3f8f6a', '#8fd8b8', '#2c3a34', '#20262a', '#ffd34d'), 'cap', 'tank', 'bag'),
  look('passer_10', body(SKIN.light, '#d8a83f', '#4a4f5c', '#8f96a8', '#33363f', '#22242a', '#ff5f5f'), 'ponytail', 'hoodie', 'scarf'),
  look('passer_11', body(SKIN.deep, '#2a1e18', '#ff8f5f', '#ffd0b0', '#2e3244', '#22242a', '#5fd8e8'), 'curly', 'tank', 'earrings'),
  look('passer_12', body(SKIN.fair, '#5a3a6a', '#5f6ad8', '#b0b8ff', '#2a2c3c', '#1e2028', '#e8e0a0'), 'long', 'coat', 'glasses'),

  // Хозяева заведений: узнаются по форме, а не по имени.
  look('staff_apron', body(SKIN.tan, '#3a2a20', '#d8d4c8', '#ffffff', '#4a4a56', '#2a2c34', '#c95f4a'), 'short', 'tee', 'necklace'),
  look('staff_coach', body(SKIN.olive, '#221c1a', '#e85f5f', '#ffb0b0', '#2c2f3c', '#20222a', '#ffd34d'), 'cap', 'track'),
];

/** Короткая запись палитры прохожего: у них нет ничего, кроме цветов. */
function body(
  skin: string,
  hair: string,
  cloth: string,
  trim: string,
  legs: string,
  shoes: string,
  accent: string,
): Colors {
  return { skin, hair, cloth, trim, legs, shoes, accent };
}

const INDEX = new Map(LOOKS.map((entry, index) => [entry.id, index]));

/** Номер внешности по имени. На него ссылаются данные толпы. */
/**
 * Кому собирают позы дела: игроку и названным. Список один на всех —
 * и сборку атласа, и выбор кадра на улице: разойдись они, человек
 * попросил бы кадр, которого не собрали, и пропал бы из кадра.
 *
 * Названные совпадают с NPC по идентификатору: внешность заводится под
 * тем же именем, что и человек в симуляции.
 */
export const ACT_LOOKS: ReadonlySet<string> = new Set<string>([
  LOOKS[0]?.id ?? '',
  ...NPC_IDS,
]);

export function lookIndex(id: string): number {
  const index = INDEX.get(id);
  if (index === undefined) throw new Error(`Неизвестная внешность: "${id}"`);
  return index;
}

export const PALETTES: readonly ActorPalette[] = LOOKS.map((entry) => palette(entry.colors));
