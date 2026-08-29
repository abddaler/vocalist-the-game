import type { DecorDef, WorldPoint } from '@core/types';
import { t } from '@ui/i18n';
import { COLORS } from '@ui/theme';
import type { Painter } from '@ui/widgets/Painter';
import { PLAYER_LOOK, actorTexture, lookIndex } from '../../art';
import type { ActorPose } from '../../art';
import type { Ambience } from '../ambience';
import { drawShadow } from '../backdrop';
import { drawDecor, shadowWidth } from '../decor';
import { lookFor } from '../actorSprite';
import type { CrowdActor } from '../Crowd';
import type { Facing } from '../actorSprite';
import type { ScreenPoint } from './project';
import type { IsoScene } from './scene';
import { heightAt } from './height';

/** Во сколько раз спрайты и мелочь крупнее собственных пикселей. */
export const UNIT = 2;

export interface Inhabitants {
  readonly position: WorldPoint;
  readonly facing: Facing;
  readonly walked: number;
  readonly moving: boolean;
  readonly crowd: readonly CrowdActor[];
}

/**
 * Живность и обстановка рисуются одним списком по удалению от камеры:
 * тот, кто ближе, заслоняет того, кто дальше. В изометрии удаление —
 * это x + y, а не одна координата.
 */
export function drawInhabitants(
  painter: Painter,
  params: Inhabitants,
  scene: IsoScene,
  toView: (point: WorldPoint, z: number) => ScreenPoint,
  ambience: Ambience,
): void {
  type Piece = { depth: number; draw: () => void };
  const pieces: Piece[] = [];

  const place = (point: WorldPoint): ScreenPoint =>
    toView(point, heightAt(scene.map, point));

  for (const item of scene.decor) {
    const at = place(item);
    pieces.push({
      depth: item.x + item.y,
      draw: () => {
        const width = shadowWidth(item.kind) * UNIT;
        if (width > 0) drawShadow(painter, at.x, at.y, width, ambience);
        drawDecor(painter, item as DecorDef, at.x, at.y, ambience, UNIT);
      },
    });
  }

  const person = (
    point: WorldPoint,
    look: number,
    pose: { pose: ActorPose; flipX: boolean },
    nameKey?: string,
  ): void => {
    const at = place(point);
    drawShadow(painter, at.x, at.y, 9 * UNIT, ambience);
    painter.sprite(at.x, at.y, actorTexture(look, pose.pose), pose.flipX, UNIT);
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

  pieces.sort((a, b) => a.depth - b.depth);
  for (const piece of pieces) piece.draw();
}

/**
 * Табличка с именем над головой. Только у названных: игрок должен уметь
 * найти нужного человека, не обходя всю улицу по одному.
 */
function drawNamePlate(painter: Painter, at: ScreenPoint, nameKey: string): void {
  const plate = { x: Math.round(at.x) - 40, y: Math.round(at.y) - 32, w: 80, h: 11 };
  const label = painter.label(plate, t(nameKey), { align: 'center', color: COLORS.text });
  const width = Math.ceil(label.width) + 5;
  painter.fill(
    { x: Math.round(at.x) - Math.round(width / 2), y: plate.y, w: width, h: plate.h },
    0x14161c,
    0.72,
  );
}
