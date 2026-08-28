import type { DecorDef, WorldPoint } from '@core/types';
import { t } from '@ui/i18n';
import { COLORS, CONTENT } from '@ui/theme';
import type { Painter } from '@ui/widgets/Painter';
import { PLAYER_LOOK, actorTexture, lookIndex } from '../art';
import type { ActorPose } from '../art';
import type { Ambience } from './ambience';
import { drawShadow } from './backdrop';
import { drawDecor, shadowWidth } from './decor';
import type { Layer } from './layers';
import { lookFor } from './actorSprite';
import type { CrowdActor } from './Crowd';
import type { Facing } from './actorSprite';

export interface Inhabitants {
  readonly position: WorldPoint;
  readonly facing: Facing;
  readonly walked: number;
  readonly moving: boolean;
  readonly crowd: readonly CrowdActor[];
}

/**
 * Живность и обстановка рисуются одним списком по возрастанию Y: тот,
 * кто ниже, заслоняет того, кто дальше. Иначе прохожие протыкают пальмы,
 * а машины наезжают на людей.
 */
export function drawInhabitants(
  painter: Painter,
  params: Inhabitants,
  layer: Layer,
  camera: WorldPoint,
  ambience: Ambience,
): void {
  type Piece = { y: number; draw: () => void };
  const pieces: Piece[] = [];

  const screen = (point: WorldPoint): WorldPoint => ({
    x: point.x - camera.x,
    y: CONTENT.y + point.y - camera.y,
  });

  for (const item of layer.decor) {
    const at = screen(item);
    pieces.push({
      y: item.y,
      draw: () => {
        const width = shadowWidth(item.kind);
        if (width > 0) drawShadow(painter, at.x, at.y, width, ambience);
        drawDecor(painter, item as DecorDef, at.x, at.y, ambience);
      },
    });
  }

  const person = (
    at: WorldPoint,
    look: number,
    pose: { pose: ActorPose; flipX: boolean },
    nameKey?: string,
  ): void => {
    const point = screen(at);
    drawShadow(painter, point.x, point.y, 8, ambience);
    painter.sprite(point.x, point.y, actorTexture(look, pose.pose), pose.flipX);
    if (nameKey) drawNamePlate(painter, point, nameKey);
  };

  for (const actor of params.crowd) {
    pieces.push({
      y: actor.position.y,
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
    y: params.position.y,
    draw: () =>
      person(
        params.position,
        PLAYER_LOOK,
        lookFor(params.facing, params.walked, params.moving),
      ),
  });

  pieces.sort((a, b) => a.y - b.y);
  for (const piece of pieces) piece.draw();
}

/**
 * Табличка с именем над головой. Только у названных: игрок должен уметь
 * найти нужного человека, не обходя всю улицу по одному.
 */
function drawNamePlate(painter: Painter, at: WorldPoint, nameKey: string): void {
  const plate = { x: Math.round(at.x) - 40, y: Math.round(at.y) - 32, w: 80, h: 11 };
  const label = painter.label(plate, t(nameKey), { align: 'center', color: COLORS.text });
  const width = Math.ceil(label.width) + 5;
  painter.fill(
    { x: Math.round(at.x) - Math.round(width / 2), y: plate.y, w: width, h: plate.h },
    0x14161c,
    0.72,
  );
}

