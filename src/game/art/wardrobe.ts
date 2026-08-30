import type { Wardrobe } from '@core/types';
import { LOOKS } from './looks';
import type { Figure } from './figure/paint';
import { PLAYER_LOOK } from './player';

/**
 * Как надетая вещь меняет фигуру игрока. Магазин был витриной цифр:
 * кожаная куртка за семь шестьсот двигала имидж и настроение, а на
 * улице выходил тот же человек в той же футболке. Покупка одежды в игре
 * про сцену обязана быть видна на сцене.
 *
 * Слоями, как рисуют спрайты вручную, тут ничего собирать не нужно:
 * фигура и так строится кодом, поэтому вещь правит не картинку, а
 * описание человека — форму одежды и её цвет. Кадры игрока после этого
 * перерисовываются заново, все девятнадцать.
 */
interface Wear {
  /** Форма одежды: от неё зависят рукава и юбка. */
  readonly outfit?: string;
  readonly hair?: string;
  readonly accessory?: string;
  readonly cloth?: string;
  readonly trim?: string;
  readonly legs?: string;
  readonly shoes?: string;
  readonly accent?: string;
}

const WEAR: Readonly<Record<string, Wear>> = {
  // — голова —
  cap_plain: { hair: 'cap', accent: '#3f6fbf' },
  bandana: { hair: 'cap', accent: '#c0392b' },
  hat_felt: { hair: 'cap', accent: '#4a3b2a' },

  // — верх —
  tee_black: { outfit: 'tee', cloth: '#26262e', trim: '#4a4a56' },
  shirt_satin: { outfit: 'jacket', cloth: '#c9a227', trim: '#f0d97a' },
  jacket_leather: { outfit: 'jacket', cloth: '#2b2430', trim: '#6a5a4a' },

  // — низ —
  jeans_worn: { legs: '#4a5a7a' },
  trousers_dress: { legs: '#2e3242' },
  pants_stage: { legs: '#1b1b24' },

  // — обувь —
  sneakers: { shoes: '#e8e6ee' },
  boots_heavy: { shoes: '#1a1a20' },
  shoes_patent: { shoes: '#3a2a3a' },

  // — примета —
  scarf_wool: { accessory: 'scarf', accent: '#c85a4a' },
  chain_steel: { accessory: 'necklace', accent: '#c6cbd6' },
  earpiece: { accessory: 'headphones', accent: '#2e2e38' },
};

/** Есть ли у вещи вид. Нужно тесту: молчаливая дыра хуже пустого слота. */
export function wearOf(itemId: string): Wear | undefined {
  return WEAR[itemId];
}

/**
 * Фигура игрока по надетому. Слоты идут в том же порядке, что и рисунок:
 * низ, верх, обувь, волосы, примета. Пустой слот оставляет своё из
 * базовой внешности.
 */
export function playerFigure(equipped: Wardrobe): Figure {
  const base = LOOKS[PLAYER_LOOK];
  if (!base) throw new Error('Нет базовой внешности игрока');

  let figure: Figure = {
    colors: base.colors,
    hair: base.hair,
    outfit: base.outfit,
    accessory: base.accessory,
  };

  for (const slot of ['bottom', 'top', 'shoes', 'head', 'accessory'] as const) {
    const id = equipped[slot];
    const wear = id ? WEAR[id] : undefined;
    if (!wear) continue;
    figure = {
      colors: {
        ...figure.colors,
        ...(wear.cloth ? { cloth: wear.cloth } : {}),
        ...(wear.trim ? { trim: wear.trim } : {}),
        ...(wear.legs ? { legs: wear.legs } : {}),
        ...(wear.shoes ? { shoes: wear.shoes } : {}),
        ...(wear.accent ? { accent: wear.accent } : {}),
      },
      hair: wear.hair ?? figure.hair,
      outfit: wear.outfit ?? figure.outfit,
      accessory: wear.accessory ?? figure.accessory,
    };
  }

  return figure;
}

/**
 * Отпечаток надетого. По нему видно, надо ли перерисовывать кадры: без
 * него игрок пересобирался бы каждый кадр, а это двадцать фигур на
 * холсте втрое крупнее.
 */
export function wardrobeKey(equipped: Wardrobe): string {
  return (['head', 'top', 'bottom', 'shoes', 'accessory'] as const)
    .map((slot) => equipped[slot] ?? '')
    .join('|');
}
