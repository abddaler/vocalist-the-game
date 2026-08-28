import type { BuildingKind } from '@core/types';
import type { Rect } from '@ui/widgets/Hotspots';
import type { Painter } from '@ui/widgets/Painter';
import { scale } from '../ambience';
import type { Ambience } from '../ambience';
import { GROUNDS } from './grounds';
import type { GroundFloorKind } from './grounds';
import { ROOFS } from './roofs';
import type { RoofKind } from './roofs';
import { WINDOWS } from './windows';
import type { WindowKind } from './windows';

export { shade } from './kit';
export type { FacadeParams } from './kit';
import type { Facade, FacadeParams } from './kit';

/**
 * Из чего сложен дом каждого рода. Три независимых слоя — окна, крыша,
 * первый этаж — дают восемнадцать узнаваемых фасадов тридцатью
 * короткими процедурами вместо восемнадцати нарисованных домов.
 */
interface Style {
  readonly windows: WindowKind;
  readonly roof: RoofKind;
  readonly ground: GroundFloorKind;
  /** Высота первого этажа: у клуба и склада он выше обычного. */
  readonly groundH?: number;
}

const STYLE: Readonly<Record<BuildingKind, Style>> = {
  apartment: { windows: 'balcony', roof: 'tanks', ground: 'stoop' },
  club: { windows: 'blank', roof: 'neon', ground: 'marquee', groundH: 32 },
  restaurant: { windows: 'warm', roof: 'chimney', ground: 'awning' },
  shop: { windows: 'grid', roof: 'ac', ground: 'display' },
  studio: { windows: 'arched', roof: 'ac', ground: 'plaque' },
  record: { windows: 'blank', roof: 'dish', ground: 'shutter', groundH: 30 },
  gym: { windows: 'strip', roof: 'ac', ground: 'display' },
  clinic: { windows: 'grid', roof: 'ac', ground: 'plaque' },
  office: { windows: 'curtain', roof: 'antenna', ground: 'revolving' },
  hotel: { windows: 'balcony', roof: 'flags', ground: 'canopy' },
  diner: { windows: 'strip', roof: 'neon', ground: 'chrome' },
  cinema: { windows: 'blank', roof: 'neon', ground: 'marquee', groundH: 30 },
  theatre: { windows: 'arched', roof: 'flags', ground: 'columns' },
  villa: { windows: 'arched', roof: 'tiles', ground: 'arches' },
  warehouse: { windows: 'high', roof: 'saw', ground: 'shutter', groundH: 30 },
  market: { windows: 'high', roof: 'ac', ground: 'stall' },
  bar: { windows: 'blinds', roof: 'neon', ground: 'awning' },
  shack: { windows: 'high', roof: 'thatch', ground: 'stall' },
};

const DEFAULT_GROUND_H = 24;

/**
 * Фасад дома. Общая часть — стена, карниз и цоколь; всё остальное
 * подбирается по роду занятий, чтобы по дому было видно, куда идёшь.
 */
export function facade(painter: Painter, params: FacadeParams): void {
  const style = STYLE[params.kind];
  const wall = scale(params.color, params.ambience.light);
  const f: Facade = {
    ...params,
    painter,
    wall,
    groundH: Math.min(params.rect.h - 14, style.groundH ?? DEFAULT_GROUND_H),
  };

  painter.fill(f.rect, wall);
  painter.fill({ x: f.rect.x, y: f.rect.y, w: f.rect.w, h: 4 }, scale(wall, 1.3));
  painter.fill({ x: f.rect.x, y: f.rect.y + 4, w: f.rect.w, h: 1 }, scale(wall, 0.6));

  // Пилястры: сплошная стена выглядит забором, а не домом.
  const bays = Math.max(2, Math.round(f.rect.w / 34));
  for (let i = 1; i < bays; i += 1) {
    painter.fill(
      { x: Math.round(f.rect.x + (i * f.rect.w) / bays), y: f.rect.y + 5, w: 1, h: f.rect.h - 9 },
      scale(wall, 0.82),
    );
  }

  ROOFS[style.roof](f);
  WINDOWS[style.windows](f);
  GROUNDS[style.ground](f);
  painter.fill(
    { x: f.rect.x, y: f.rect.y + f.rect.h - 2, w: f.rect.w, h: 2 },
    scale(wall, 0.55),
  );
}

/**
 * Вывеска. Ночью она светится и роняет отсвет на стену — это и есть
 * половина ночного города.
 */
export function sign(painter: Painter, rect: Rect, color: number, ambience: Ambience): void {
  const border = ambience.lampsOn ? scale(color, 1.9) : scale(color, ambience.light * 1.3);
  painter.plate(rect, 0x1a1030, border, ambience.lampsOn);
  if (ambience.lampsOn) {
    painter.fill({ x: rect.x + 3, y: rect.y + 1, w: rect.w - 6, h: 1 }, border, 0.7);
    painter.fill({ x: rect.x + 3, y: rect.y + rect.h - 2, w: rect.w - 6, h: 1 }, border, 0.7);
  }
}
