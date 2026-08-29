import type { WorldPoint } from '@core/types';
import { t } from '@ui/i18n';
import { COLORS } from '@ui/theme';
import type { Painter } from '@ui/widgets/Painter';
import { ACTOR_SPRITE, ACTOR_TEXTURE, PLAYER_LOOK, actorTexture, lookIndex } from '../../art';
import type { ActorPose } from '../../art';
import type { Ambience } from '../ambience';
import { drawShadow } from '../backdrop';
import { ISO_OVERHEAD, paintProp, propId } from './props';
import { PROP_ANCHOR } from '../PropAtlas';
import type { PropAtlas } from '../PropAtlas';
import { lookFor } from '../actorSprite';
import type { CrowdActor } from '../Crowd';
import type { Facing } from '../actorSprite';
import type { ScreenPoint } from './project';
import type { IsoScene } from './scene';
import { heightAt } from './height';

export interface Inhabitants {
  /** Атлас мелочи. Без него предметы рисуются каждый кадр заново. */
  readonly props?: PropAtlas | undefined;
  readonly position: WorldPoint;
  readonly facing: Facing;
  readonly walked: number;
  readonly moving: boolean;
  readonly crowd: readonly CrowdActor[];
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

  const place = (point: WorldPoint): ScreenPoint =>
    toView(point, heightAt(scene.map, point));

  /**
   * Мелочь ставится готовой картинкой из атласа: собирать её из сотни
   * заливок на каждый кадр — то, на чём телефон и вставал. В атлас
   * помещается не всё, и не попавшее рисуется как прежде.
   */
  const stamp = (id: string, at: ScreenPoint): void => {
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
  ): void => {
    const at = place(point);
    // Тень остаётся на земле: подскакивает человек, а не его след.
    drawShadow(painter, at.x, at.y, ACTOR_SPRITE.width * 0.7, ambience);
    painter.sprite(at.x, at.y - pose.lift, ACTOR_TEXTURE, pose.flipX, actorTexture(look, pose.pose));
    if (nameKey) drawNamePlate(painter, at, nameKey);
  };

  for (const actor of params.crowd) {
    pieces.push({
      depth: actor.position.x + actor.position.y,
      draw: () =>
        person(
          actor.position,
          lookIndex(actor.member.look),
          lookFor(actor.facing, actor.walked, actor.moving),
          actor.member.nameKey,
        ),
    });
  }

  pieces.push({
    depth: params.position.x + params.position.y,
    draw: () =>
      person(params.position, PLAYER_LOOK, lookFor(params.facing, params.walked, params.moving)),
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
