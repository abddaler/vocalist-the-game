import { BALANCE } from '@data/balance';
import { DECOR_KINDS } from '@core/types';
import type { DecorDef, WorldPoint, WorldRect } from '@core/types';
import { footprintOf } from '@game/world/decor';
import { cellAt, standable } from '@game/world/iso/map';
import { findPath, walkableIn } from '@game/world/iso/route';
import type { Location } from './scenes';

/**
 * Правила разбора локаций. Каждое отвечает на вопрос, который иначе
 * пришлось бы решать глазами по скриншоту, — а глаза дороги и считают
 * одинаковые стулья хуже машины.
 *
 * Находка всегда называет место, величину и норму: «многовато» нельзя
 * ни подтвердить, ни оспорить, а «0.71 при норме до 0.6» можно.
 */
export interface Finding {
  readonly location: string;
  readonly rule: string;
  readonly subject: string;
  readonly value: string;
  readonly norm: string;
  /** Блокер держит сдачу: с ним локация не принимается. */
  readonly blocker: boolean;
}

type Rule = (place: Location) => Finding[];

const at = (item: DecorDef): string => `${item.kind} (${item.x}, ${item.y})`;

/** Шаг в плитках без хвоста из плавающей точки. */
const round = (value: number): number => Math.round(value * 100) / 100;

/**
 * Что не стоит на земле по своей природе. Чайка над водой — не ошибка
 * расстановки, а чайка.
 */
const AIRBORNE = new Set<string>(['gull']);

/** Клетки пола: по ним считается и заполненность, и пустоты. */
function floorTiles(place: Location): WorldPoint[] {
  const tiles: WorldPoint[] = [];
  for (let y = 0; y < place.scene.map.depth; y += 1) {
    for (let x = 0; x < place.scene.map.width; x += 1) {
      if (cellAt(place.scene.map, x, y)) tiles.push({ x, y });
    }
  }
  return tiles;
}

/**
 * Доля пола под предметами.
 *
 * Считается тем же, чем игра считает проходимость: клетка занята, если
 * на неё нельзя встать. Складывать следы предметов из данных нельзя —
 * мебель комнаты лежит в одном списке, мелочь в другом, стены в третьем,
 * и сумма ручается за файлы, а не за место, по которому ходит игрок.
 * Первая же попытка так и вышла: комната показала одну сотую при норме
 * в половину.
 */
const fill: Rule = (place) => {
  const tiles = floorTiles(place);
  if (tiles.length === 0) return [];
  const walkable = walkableIn(place.scene);
  const free = tiles.filter((tile) => walkable.free({ x: tile.x + 0.5, y: tile.y + 0.5 })).length;

  const share = 1 - free / tiles.length;
  const norm = BALANCE.scenery.fill[place.norm];
  if (share >= norm.min && share <= norm.max) return [];
  return [{
    location: place.id,
    rule: 'заполненность',
    subject: 'пол',
    value: share.toFixed(2),
    norm: `${norm.min}–${norm.max}`,
    // Пустая сцена читается недоделанной, забитая — непроходимой.
    blocker: share < norm.min * 0.7 || share > norm.max * 1.15,
  }];
};

/** Один и тот же предмет без вариации. */
const repeats: Rule = (place) => {
  const seen = new Map<string, number>();
  for (const item of place.scene.decor) {
    // Оттенок, поворот и отражение считаются вариацией: одинаковыми
    // предметы делает не вид, а совпадение всех примет разом.
    const key = `${item.kind}|${item.variant ?? 0}|${item.facing ?? '-'}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  const limit = BALANCE.scenery.sameKindLimit;
  return [...seen.entries()]
    .filter(([, count]) => count > limit)
    .map(([key, count]) => ({
      location: place.id,
      rule: 'повторы',
      subject: key.split('|')[0] ?? key,
      value: String(count),
      norm: `не более ${limit}`,
      blocker: count > limit * 2,
    }));
};

/** Ровный ряд одинаковых предметов с равным шагом. */
const rows: Rule = (place) => {
  const found: Finding[] = [];
  const byKind = new Map<string, DecorDef[]>();
  for (const item of place.scene.decor) {
    const list = byKind.get(item.kind) ?? [];
    list.push(item);
    byKind.set(item.kind, list);
  }

  for (const [kind, items] of byKind) {
    for (const axis of ['x', 'y'] as const) {
      const other = axis === 'x' ? 'y' : 'x';
      const lines = new Map<number, number[]>();
      for (const item of items) {
        const line = lines.get(item[other]) ?? [];
        line.push(item[axis]);
        lines.set(item[other], line);
      }
      for (const [line, values] of lines) {
        const sorted = [...values].sort((a, b) => a - b);
        // Ряд ищется целиком и называется один раз: сообщать о нём на
        // каждом следующем предмете значит трижды повторить одну находку.
        let run = 1;
        let step = 0;
        let from = sorted[0] as number;
        for (let i = 1; i <= sorted.length; i += 1) {
          const gap = i < sorted.length ? round((sorted[i] as number) - (sorted[i - 1] as number)) : -1;
          if (gap > 0 && (run === 1 || gap === step)) {
            if (run === 1) from = sorted[i - 1] as number;
            run = run === 1 ? 2 : run + 1;
            step = gap;
            continue;
          }
          if (run >= BALANCE.scenery.rowLength) {
            found.push({
              location: place.id,
              rule: 'ровный ряд',
              // Начало ряда обязательно: два разных ряда одного вида на
              // одной линии выглядели в отчёте одной находкой, и идти
              // по ней было некуда.
              subject: `${kind} от ${axis}=${from} при ${other}=${line}`,
              value: `${run} подряд, шаг ${step}`,
              norm: `ломать ритм до ${BALANCE.scenery.rowLength}`,
              blocker: false,
            });
          }
          run = gap > 0 ? 2 : 1;
          step = gap > 0 ? gap : 0;
          if (gap > 0) from = sorted[i - 1] as number;
        }
      }
    }
  }
  return found;
};

/** Достижима ли каждая цель от точки входа. */
const reach: Rule = (place) => {
  const from = entrance(place);
  if (!from) {
    return [{
      location: place.id,
      rule: 'достижимость',
      subject: 'вход',
      value: 'встать негде',
      norm: 'хотя бы одна проходимая клетка',
      blocker: true,
    }];
  }

  return place.scene.targets
    .filter((target) => findPath(place.scene, from, centerOf(target.rect)).length === 0)
    .map((target) => ({
      location: place.id,
      rule: 'достижимость',
      subject: `${target.kind}:${target.id}`,
      value: 'пути нет',
      norm: 'дойти от входа',
      // До цели, до которой не дойти, игрок не доберётся никогда.
      blocker: true,
    }));
};

/**
 * Откуда игрок приходит: ближайшая к середине проходимая клетка. Точный
 * порог разбору не нужен — ему нужна связность, а она от выбора клетки
 * внутри одной области не зависит.
 */
function entrance(place: Location): WorldPoint | null {
  const walkable = walkableIn(place.scene);
  const middle = { x: place.scene.map.width / 2, y: place.scene.map.depth / 2 };
  const near = floorTiles(place).sort(
    (a, b) => Math.hypot(a.x - middle.x, a.y - middle.y) - Math.hypot(b.x - middle.x, b.y - middle.y),
  );
  for (const tile of near) {
    const point = { x: tile.x + 0.5, y: tile.y + 0.5 };
    if (walkable.free(point)) return point;
  }
  return null;
}

/** Середина цели: путь ищется в неё, а не в угол прямоугольника. */
const centerOf = (rect: WorldRect): WorldPoint => ({
  x: rect.x + rect.w / 2,
  y: rect.y + rect.h / 2,
});

/** Предмет вне карты, на дыре или внутри другого предмета. */
const geometry: Rule = (place) => {
  const found: Finding[] = [];
  const boxes: { item: DecorDef; box: NonNullable<ReturnType<typeof footprintOf>> }[] = [];

  for (const item of place.scene.decor) {
    if (!AIRBORNE.has(item.kind) && !standable(place.scene.map, item.x, item.y)) {
      found.push({
        location: place.id,
        rule: 'геометрия',
        subject: at(item),
        value: 'вне пола',
        norm: 'стоять на плитке',
        blocker: true,
      });
    }
    const box = footprintOf(item);
    if (box) boxes.push({ item, box });
  }

  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i] as (typeof boxes)[number];
      const b = boxes[j] as (typeof boxes)[number];
      const overlap =
        a.box.x < b.box.x + b.box.w &&
        b.box.x < a.box.x + a.box.w &&
        a.box.y < b.box.y + b.box.h &&
        b.box.y < a.box.y + a.box.h;
      if (!overlap) continue;
      found.push({
        location: place.id,
        rule: 'геометрия',
        subject: `${at(a.item)} и ${at(b.item)}`,
        value: 'следы наложились',
        norm: 'не пересекаться',
        blocker: false,
      });
    }
  }
  return found;
};

import { dead, narrow, walls } from './space';

export const RULES: readonly Rule[] = [fill, repeats, rows, reach, geometry, narrow, dead, walls];

/** Виды предметов, не встречающиеся ни в одной локации. */
export function unusedKinds(places: readonly Location[]): Finding[] {
  const used = new Set<string>();
  for (const place of places) for (const item of place.scene.decor) used.add(item.kind);
  return DECOR_KINDS.filter((kind) => !used.has(kind)).map((kind) => ({
    location: '—',
    rule: 'неиспользуемое',
    subject: kind,
    value: 'нигде не стоит',
    norm: 'убрать или поставить',
    blocker: false,
  }));
}
