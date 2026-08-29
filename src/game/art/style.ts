/**
 * Словарь внешности: какие бывают стрижки, одежда и приметы. Раньше эти
 * перечисления жили рядом с пиксельными раскладками — каждый вид одежды
 * был картинкой из строк, и тип брался оттуда же. Рисунок теперь
 * векторный и собирается по скелету, а список остался: по нему сверяются
 * данные толпы и таблицы рукавов, юбок и примет в figure/.
 */

export type HairStyle = 'short' | 'curly' | 'long' | 'ponytail' | 'bob' | 'cap' | 'bald';

export type OutfitStyle =
  | 'tee'
  | 'tank'
  | 'jacket'
  | 'hoodie'
  | 'suit'
  | 'dress'
  | 'crop'
  | 'track'
  | 'coat';

export type Accessory =
  | 'none'
  | 'headphones'
  | 'glasses'
  | 'shades'
  | 'earrings'
  | 'scarf'
  | 'necklace'
  | 'bag';
