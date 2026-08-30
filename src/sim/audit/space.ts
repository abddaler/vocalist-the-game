import type { WorldPoint } from '@core/types';
import { cellAt } from '@game/world/iso/map';
import { findPath, walkableIn } from '@game/world/iso/route';
import type { Finding } from './rules';
import type { Location } from './scenes';

/**
 * Правила про пространство: где игрок протискивается боком, куда он не
 * ходит вовсе и где стена тянется голой.
 *
 * Всё считается по той же проходимости, что и в игре. Мерить по данным
 * нельзя: мебель, мелочь и стены лежат в разных списках, и сумма
 * ручается за файлы, а не за место, по которому ходит игрок.
 */
const KEY = (x: number, y: number, width: number): number => y * width + x;

/** Проходимые клетки локации. */
function open(place: Location): Set<number> {
  const walkable = walkableIn(place.scene);
  const free = new Set<number>();
  for (let y = 0; y < place.scene.map.depth; y += 1) {
    for (let x = 0; x < place.scene.map.width; x += 1) {
      if (!cellAt(place.scene.map, x, y)) continue;
      if (walkable.free({ x: x + 0.5, y: y + 0.5 })) free.add(KEY(x, y, place.scene.map.width));
    }
  }
  return free;
}

/**
 * Узкие места: клетка, у которой заняты обе стороны поперёк прохода.
 * Пройти по ней можно только строго друг за другом, и толпа в таком
 * месте встаёт пробкой.
 */
export function narrow(place: Location): Finding[] {
  const width = place.scene.map.width;
  const free = open(place);
  const found: Finding[] = [];

  for (const cell of free) {
    const x = cell % width;
    const y = Math.floor(cell / width);
    const pinchedX = !free.has(KEY(x - 1, y, width)) && !free.has(KEY(x + 1, y, width));
    const pinchedY = !free.has(KEY(x, y - 1, width)) && !free.has(KEY(x, y + 1, width));
    // Зажата с обеих сторон вдоль обеих осей — это не проход, а тупик:
    // о нём скажет правило достижимости, а не это.
    if (pinchedX === pinchedY) continue;
    found.push({
      location: place.id,
      rule: 'узкое место',
      subject: `(${x}, ${y})`,
      value: 'проход в одну плитку',
      norm: 'не уже двух',
      blocker: false,
    });
  }
  // Одна находка на локацию: перечислять полсотни клеток бессмысленно,
  // важно, сколько их и где начинать.
  if (found.length <= 1) return found;
  return [{
    ...(found[0] as Finding),
    subject: `${found.length} клеток, первая ${found[0]?.subject ?? ''}`,
    blocker: found.length > place.scene.map.width,
  }];
}

/**
 * Мёртвые зоны: пустой прямоугольник от четырёх на четыре, через
 * который не проходит ни один маршрут между целями. Пустота бывает
 * намеренной — танцпол, сцена, коридор, — поэтому одной пустоты мало:
 * мёртвой её делает то, что игрок туда не ходит.
 */
export function dead(place: Location): Finding[] {
  const width = place.scene.map.width;
  const free = open(place);
  const routes = new Set<number>();
  const targets = place.scene.targets;

  for (let i = 0; i < targets.length; i += 1) {
    for (let j = i + 1; j < targets.length; j += 1) {
      const from = middle(targets[i]!.rect);
      const to = middle(targets[j]!.rect);
      for (const step of findPath(place.scene, from, to)) {
        routes.add(KEY(Math.floor(step.x), Math.floor(step.y), width));
      }
    }
  }

  const SIDE = 4;
  const found: string[] = [];
  for (let y = 0; y + SIDE <= place.scene.map.depth; y += SIDE) {
    for (let x = 0; x + SIDE <= width; x += SIDE) {
      let empty = 0;
      let visited = false;
      for (let dy = 0; dy < SIDE; dy += 1) {
        for (let dx = 0; dx < SIDE; dx += 1) {
          const cell = KEY(x + dx, y + dy, width);
          if (free.has(cell)) empty += 1;
          if (routes.has(cell)) visited = true;
        }
      }
      if (empty === SIDE * SIDE && !visited) found.push(`(${x}, ${y})`);
    }
  }

  if (found.length === 0) return [];
  return [{
    location: place.id,
    rule: 'мёртвая зона',
    subject: `${found.length} участков, первый ${found[0]}`,
    value: `${SIDE}x${SIDE} пусто и без маршрутов`,
    norm: 'занять или увести маршрут',
    blocker: false,
  }];
}

/**
 * Голая стена длиннее шести плиток. Считается по объёмам со флагом
 * стены: у комнаты это её периметр, и пустая полоса в полстены читается
 * недоделанной коробкой.
 */
export function walls(place: Location): Finding[] {
  const LIMIT = 6;
  const found: Finding[] = [];
  for (const block of place.scene.blocks) {
    if (!block.wall) continue;
    const run = Math.max(block.rect.w, block.rect.h);
    if (run <= LIMIT) continue;
    // Декор у стены считается своим: он и есть её наполнение.
    const near = place.scene.decor.filter(
      (item) =>
        item.x >= block.rect.x - 1 &&
        item.x <= block.rect.x + block.rect.w + 1 &&
        item.y >= block.rect.y - 1 &&
        item.y <= block.rect.y + block.rect.h + 1,
    ).length;
    if (near > 0) continue;
    found.push({
      location: place.id,
      rule: 'голая стена',
      subject: `(${block.rect.x}, ${block.rect.y}) на ${run}`,
      value: 'без декора',
      norm: `не длиннее ${LIMIT} плиток подряд`,
      blocker: false,
    });
  }
  return found;
}

const middle = (rect: { x: number; y: number; w: number; h: number }): WorldPoint => ({
  x: rect.x + rect.w / 2,
  y: rect.y + rect.h / 2,
});
