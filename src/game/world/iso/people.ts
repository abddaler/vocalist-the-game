import type { WorldPoint } from '@core/types';
import { BALANCE } from '@data/balance';
import { devFlag } from '@platform/devtools';
import { t } from '@ui/i18n';
import { COLORS } from '@ui/theme';
import type { Painter } from '@ui/widgets/Painter';
import { ACT_LOOKS, ACTOR_SPRITE, ACTOR_TEXTURE, LOOKS, PLAYER_LOOK, actorTexture, lookIndex } from '../../art';
import { BUBBLE_CELL, BUBBLE_TEXTURE, bubbleFrame } from '../../art/bubble';
import type { ActorPose } from '../../art';
import type { Ambience } from '../ambience';
import { drawShadow } from '../backdrop';
import { ISO_OVERHEAD, paintProp, propId } from './props';
import { PROP_ANCHOR } from '../PropAtlas';
import type { PropAtlas } from '../PropAtlas';
import { idleBreath, lookFor, talkLook, wornLook } from '../actorSprite';
import type { CrowdActor, Mood } from '../Crowd';
import type { Facing } from '../actorSprite';
import type { ScreenPoint } from './project';
import type { IsoScene } from './scene';
import { heightAt } from './height';
import { paintPlainPerson, paintPlainProp } from './plain';

export interface Inhabitants {
  /** Атлас мелочи. Без него предметы рисуются каждый кадр заново. */
  readonly props?: PropAtlas | undefined;
  readonly position: WorldPoint;
  readonly facing: Facing;
  readonly walked: number;
  readonly moving: boolean;
  readonly crowd: readonly CrowdActor[];
  /** Часы сцены, мс. */
  readonly clock: number;
  /** Здоровье связок игрока: ниже порога усталости он ходит севшим. */
  readonly vocalHealth: number;
}

/**
 * Кусок сцены со своим удалением от камеры. В изометрии удаление — это
 * x + y, а не одна координата.
 */
export interface Piece {
  readonly depth: number;
  /**
   * Кусок, который висит над головой: навес, крыша, купол зонта. Такие
   * рисуются после всех остальных, иначе прохожий ближе к камере встаёт
   * поверх крыши и выглядит забравшимся на неё.
   */
  readonly over?: boolean | undefined;
  readonly draw: () => void;
}

/** Рисует куски от дальнего к ближнему: ближний заслоняет дальний. */
export function drawPieces(pieces: readonly Piece[]): void {
  [...pieces]
    .sort((a, b) => Number(a.over ?? false) - Number(b.over ?? false) || a.depth - b.depth)
    .forEach((piece) => piece.draw());
}

/**
 * Мелочь, прохожие и игрок. Возвращает куски, а не рисует их: цели сцены
 * сортируются вместе с ними, иначе человек всегда оказывается поверх
 * лестницы перехода, даже когда стоит за ней.
 */
export function inhabitantPieces(
  painter: Painter,
  params: Inhabitants,
  scene: IsoScene,
  toView: (point: WorldPoint, z: number) => ScreenPoint,
  ambience: Ambience,
): Piece[] {
  const pieces: Piece[] = [];
  const plain = devFlag('plain');
  const bare = devFlag('bare');

  const place = (point: WorldPoint): ScreenPoint =>
    toView(point, heightAt(scene.map, point));

  /**
   * Мелочь ставится готовой картинкой из атласа: собирать её из сотни
   * заливок на каждый кадр — то, на чём телефон и вставал. В атлас
   * помещается не всё, и не попавшее рисуется как прежде.
   */
  const stamp = (id: string, at: ScreenPoint): void => {
    if (plain) {
      // Навес выше столбика: у заглушки высота — единственное, чем
      // отличается зонт от люка.
      paintPlainProp(painter, at, id, id.endsWith('|t') ? PLAIN_TALL : PLAIN_LOW);
      return;
    }
    const frame = params.props?.frameOf(id);
    if (frame && params.props) {
      painter.stamp(at.x - PROP_ANCHOR.x, at.y - PROP_ANCHOR.y, params.props.textureKey, frame);
      return;
    }
    paintProp(painter, ambience, id, at);
  };

  for (const item of scene.decor) {
    const at = place(item);
    const ground = propId(item);
    pieces.push({ depth: item.x + item.y, draw: () => stamp(ground, at) });

    if (!ISO_OVERHEAD[item.kind]) continue;
    const roof = propId(item, true);
    pieces.push({ depth: item.x + item.y, over: true, draw: () => stamp(roof, at) });
  }

  const person = (
    point: WorldPoint,
    look: number,
    pose: { pose: ActorPose; flipX: boolean; lift: number },
    nameKey?: string,
    mood?: Mood | null,
  ): void => {
    const at = place(point);
    // Тень остаётся на земле: подскакивает человек, а не его след.
    drawShadow(painter, at.x, at.y, ACTOR_SPRITE.width * 0.7, ambience);
    if (plain) {
      paintPlainPerson(painter, at, plainColor(look), pose, ACTOR_SPRITE.height * 0.8);
    } else {
      painter.sprite(at.x, at.y - pose.lift, ACTOR_TEXTURE, pose.flipX, actorTexture(look, pose.pose));
    }
    // Съёмка для разбора идёт без единой буквы: имя и пузырь — это
    // интерфейс, а он закрывает ровно то, что разбираем, — расстановку.
    if (nameKey && !bare) drawNamePlate(painter, at, nameKey);
    if (mood && !bare) drawBubble(painter, at, mood, nameKey !== undefined);
  };

  for (const actor of params.crowd) {
    const look = lookIndex(actor.look);
    // Названный, у которого висит пузырь и который стоит, — говорит.
    // Позы разговора есть только у него: прохожему их не собирают.
    const talking = actor.mood !== null && !actor.moving && ACT_LOOKS.has(actor.member.look);
    const idle = lookFor(actor.facing, actor.walked, actor.moving);
    pieces.push({
      depth: actor.position.x + actor.position.y,
      draw: () =>
        person(
          actor.position,
          look,
          talking ? talkLook(actor.mood!.age) : actor.moving ? idle : idleBreath(idle, params.clock),
          actor.member.nameKey,
          actor.mood,
        ),
    });
  }

  // Проверка «персонаж виден везде»: восемь копий разом дороже одного
  // обхода локации и честнее — тёмный ковёр под ногами видно сразу.
  for (const spot of devFlag('cast') ? castSpots(scene) : []) {
    pieces.push({
      depth: spot.x + spot.y,
      draw: () => person(spot, PLAYER_LOOK, lookFor('se', 0, false)),
    });
  }

  pieces.push({
    depth: params.position.x + params.position.y,
    draw: () => person(params.position, PLAYER_LOOK, playerLook(params)),
  });

  return pieces;
}

/**
 * Табличка с именем над головой. Только у названных: игрок должен уметь
 * найти нужного человека, не обходя всю улицу по одному.
 */
function drawNamePlate(painter: Painter, at: ScreenPoint, nameKey: string): void {
  const text = t(nameKey);
  // Табличка висит над головой, а не поперёк груди: высота кадра —
  // единственное, откуда известно, где у человека макушка.
  const plate = { x: Math.round(at.x) - 40, y: Math.round(at.y) - ACTOR_SPRITE.height - 10, w: 80, h: 11 };
  // Подложка идёт первой: порядок вызовов — это порядок слоёв, и
  // нарисованная после текста плашка просто закрыла бы его.
  const width = Math.ceil(painter.measure(text)) + 5;
  painter.fill(
    { x: Math.round(at.x) - Math.round(width / 2), y: plate.y, w: width, h: plate.h },
    0x14161c,
    0.72,
  );
  painter.label(plate, text, { align: 'center', color: COLORS.text });
}

/**
 * Размеры пузыря. Он висит справа над головой: по центру его место
 * занимает табличка с именем, а спорить с ней пузырь не должен.
 */
const BUBBLE = {
  padX: 2,
  padY: 1,
  /** Насколько пузырь всплывает за жизнь, px. */
  rise: 4,
  /** Появление и уход, мс. */
  fadeIn: 160,
  fadeOut: 480,
  life: 2400,
  /** Подъём над макушкой; с табличкой имени — выше неё. */
  lift: 8,
  liftNamed: 22,
  fill: 0xf2eff5,
  border: 0x14161c,
} as const;

function drawBubble(painter: Painter, at: ScreenPoint, mood: Mood, named: boolean): void {
  const width = BUBBLE_CELL.width + BUBBLE.padX * 2;
  const height = BUBBLE_CELL.height + BUBBLE.padY * 2;
  // Всплытие затухает: рывок вверх в начале читается как «подумал»,
  // равномерный подъём — как улетающий шарик.
  const rise = BUBBLE.rise * Math.min(1, mood.age / (BUBBLE.life / 4));
  const alpha = Math.min(
    1,
    mood.age / BUBBLE.fadeIn,
    Math.max(0, BUBBLE.life - mood.age) / BUBBLE.fadeOut,
  );
  if (alpha <= 0) return;

  const x = Math.round(at.x) + 3;
  const y = Math.round(at.y) - ACTOR_SPRITE.height - (named ? BUBBLE.liftNamed : BUBBLE.lift) - Math.round(rise);

  // Скошенные углы набираются крестом из двух прямоугольников: прямой
  // угол делает из облачка вывеску.
  const bevel = (
    left: number,
    top: number,
    w: number,
    h: number,
    color: number,
    a: number,
  ): void => {
    painter.fill({ x: left + 1, y: top, w: w - 2, h }, color, a);
    painter.fill({ x: left, y: top + 1, w, h: h - 2 }, color, a);
  };

  bevel(x - 1, y - 1, width + 2, height + 2, BUBBLE.border, alpha * 0.85);
  bevel(x, y, width, height, BUBBLE.fill, alpha);
  // Хвостик ступеньками вниз-влево, к голове: без него пузырь ничей.
  painter.fill({ x: x + 2, y: y + height - 1, w: 3, h: 2 }, BUBBLE.fill, alpha);
  painter.fill({ x, y: y + height + 1, w: 2, h: 2 }, BUBBLE.fill, alpha);
  painter.stamp(x + BUBBLE.padX, y + BUBBLE.padY, BUBBLE_TEXTURE, bubbleFrame(mood.icon), alpha);
}

/** Высота столбика заглушки: под навесом и без него. */
const PLAIN_TALL = 24;
const PLAIN_LOW = 12;

/**
 * Цвет капсулы заглушки — цвет одежды этого человека. Один цвет на всех
 * превратил бы толпу в стадо одинаковых столбиков, а именно по толпе и
 * проверяют, что каждый идёт своим маршрутом.
 */
function plainColor(look: number): number {
  const colors = LOOKS[look]?.colors;
  return colors ? Number.parseInt(colors.cloth.slice(1), 16) : 0x888888;
}

/**
 * Кадр игрока. Идёт — шаг; стоит с севшим голосом — сутулость и рука у
 * горла; просто стоит — дыхание.
 */
function playerLook(params: Inhabitants): { pose: ActorPose; flipX: boolean; lift: number } {
  const step = lookFor(params.facing, params.walked, params.moving);
  if (params.moving) return step;
  if (params.vocalHealth < BALANCE.vocal.tiers.fatigue) return wornLook(params.clock);
  return idleBreath(step, params.clock);
}

/**
 * Восемь точек, разнесённых по локации: четверти и их середины. Точная
 * решётка тут важнее случайности — снимок обязан повторяться от запуска
 * к запуску, иначе по нему нельзя сравнивать «было и стало».
 */
function castSpots(scene: IsoScene): WorldPoint[] {
  const spots: WorldPoint[] = [];
  for (const fy of [0.25, 0.5, 0.75, 0.9]) {
    for (const fx of [0.25, 0.75]) {
      spots.push({
        x: Math.floor(scene.map.width * fx) + 0.5,
        y: Math.floor(scene.map.depth * fy) + 0.5,
      });
    }
  }
  return spots;
}
