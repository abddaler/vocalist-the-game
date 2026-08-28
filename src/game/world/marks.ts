import { t } from '@ui/i18n';
import { COLORS } from '@ui/theme';
import type { Rect } from '@ui/widgets/Hotspots';
import type { Painter } from '@ui/widgets/Painter';
import { mix, scale } from './ambience';
import type { Ambience } from './ambience';
import type { Layer } from './layers';
import { drawProp } from './props';
import type { WorldTarget } from './targets';

/**
 * Как нарисованы цели на улице и в комнате: дверь, створ в соседний
 * район, площадка с предметом и подпись под ними.
 *
 * Вынесено из WorldView, потому что это чистое рисование одной штуки:
 * сцена решает, что показать, а здесь решается, как оно выглядит.
 */
const DOOR_SHUT = 0x181c26;
const DOOR_OPEN = 0xffd98f;

export function drawTarget(
  painter: Painter,
  target: WorldTarget,
  rect: Rect,
  active: boolean,
  layer: Layer,
  ambience: Ambience,
): void {
  if (target.kind === 'gate') {
    drawGate(painter, rect, active, ambience);
    return;
  }

  const color = layer.pointColors.get(target.id);
  if (target.prop && color !== undefined) {
    drawProp(painter, target.prop, rect, color, active);
    if (active) painter.stroke(rect, COLORS.borderFocus);
  } else {
    drawDoor(painter, rect, active, target.locked === true, ambience);
  }

  // Подпись только у того, к которому подошли: узнаваемая мебель в
  // подписи не нуждается, а лес ярлыков забивает комнату.
  if (target.kind === 'point' && active && rect.w >= 20) {
    const caption = { x: rect.x - 40, y: rect.y - 13, w: rect.w + 80, h: 12 };
    const label = painter.label(caption, t(target.nameKey), {
      align: 'center',
      color: COLORS.accent,
    });
    const width = Math.ceil(label.width) + 6;
    painter.fill(
      { x: rect.x + rect.w / 2 - width / 2, y: caption.y, w: width, h: caption.h },
      COLORS.bg,
      0.78,
    );
  }
}

/**
 * Вход в дом: рама, створки со стеклом, ручка и порог. Раньше это был
 * тёмный прямоугольник с рамкой — на светлом фасаде он читался дырой в
 * текстуре, а не дверью, в которую можно войти.
 */
function drawDoor(
  painter: Painter,
  rect: Rect,
  active: boolean,
  locked: boolean,
  ambience: Ambience,
): void {
  const frame = scale(0x6b5a48, ambience.light);
  const leaf = scale(locked ? 0x4a4038 : 0x7a5f42, ambience.light);
  const glass = locked
    ? scale(0x2a2f3a, ambience.light)
    : mix(scale(0x8fc0d8, ambience.light), ambience.skyLow, 0.3);

  // Проём и рама.
  painter.fill(rect, DOOR_SHUT);
  painter.fill({ x: rect.x, y: rect.y, w: rect.w, h: 2 }, scale(frame, 1.25));
  painter.fill({ x: rect.x, y: rect.y, w: 2, h: rect.h }, frame);
  painter.fill({ x: rect.x + rect.w - 2, y: rect.y, w: 2, h: rect.h }, frame);

  // Две створки со стеклом сверху и филёнкой снизу.
  const half = Math.floor((rect.w - 5) / 2);
  const top = rect.y + 3;
  const height = rect.h - 5;
  for (const [i, x] of [rect.x + 2, rect.x + rect.w - 2 - half].entries()) {
    painter.fill({ x, y: top, w: half, h: height }, leaf);
    painter.fill({ x, y: top, w: half, h: 1 }, scale(leaf, 1.3));
    painter.fill(
      { x: x + 2, y: top + 2, w: half - 4, h: Math.max(2, Math.round(height * 0.45)) },
      glass,
    );
    // Ручка на внутренней кромке створки.
    const handle = i === 0 ? x + half - 3 : x + 2;
    painter.fill({ x: handle, y: top + height - 5, w: 2, h: 2 }, scale(0xd8c078, ambience.light));
  }

  // Порог и свет из окна над дверью.
  painter.fill({ x: rect.x - 1, y: rect.y + rect.h - 2, w: rect.w + 2, h: 2 }, scale(frame, 1.4));
  if (locked) {
    // Опущенная решётка: закрытая дверь должна быть видна закрытой.
    for (let y = top; y < top + height; y += 3) {
      painter.fill({ x: rect.x + 2, y, w: rect.w - 4, h: 1 }, scale(leaf, 0.6));
    }
  } else if (ambience.lampsOn) {
    painter.fill({ x: rect.x - 4, y: rect.y - 3, w: rect.w + 8, h: rect.h + 6 }, DOOR_OPEN, 0.16);
    painter.fill({ x: rect.x + 2, y: rect.y - 3, w: rect.w - 4, h: 3 }, DOOR_OPEN, 0.7);
  }
  if (active) painter.stroke(rect, COLORS.borderFocus);
}

/** Створ в соседний район: арка со стрелкой, а не невидимая грань экрана. */
function drawGate(painter: Painter, rect: Rect, active: boolean, ambience: Ambience): void {
  const stone = scale(0x8f94a8, ambience.light);
  painter.fill(rect, mix(stone, ambience.skyLow, 0.35));
  painter.fill({ x: rect.x, y: rect.y, w: rect.w, h: 3 }, scale(stone, 1.3));
  painter.fill(
    { x: rect.x + 2, y: rect.y + 5, w: rect.w - 4, h: rect.h - 9 },
    mix(ambience.asphalt, ambience.skyMid, 0.3),
  );
  painter.stroke(rect, active ? COLORS.borderFocus : scale(stone, 0.6));
}

/** У выхода и створа собственная подпись, у двери и точки — глагол перед названием. */
export function promptFor(target: WorldTarget): string {
  if (target.kind === 'exit') return t(target.nameKey);
  if (target.kind === 'gate') return `${t('ui.goTo')}: ${t(target.nameKey)}`;
  if (target.locked) return `${t(target.nameKey)} — ${t('ui.closedNow')}`;
  return `${t(target.kind === 'door' ? 'ui.enter' : 'ui.open')}: ${t(target.nameKey)}`;
}
