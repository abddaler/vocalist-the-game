import { t } from '../i18n';
import { COLORS, LAYOUT, SCREEN } from '../theme';
import type { Hotspots } from '../widgets/Hotspots';
import type { Painter } from '../widgets/Painter';
import type { ScreenId, UiState } from './types';

const TABS: readonly { screen: ScreenId; key: string }[] = [
  { screen: 'world', key: 'ui.district' },
  { screen: 'map', key: 'ui.map' },
  { screen: 'character', key: 'ui.character' },
  { screen: 'journal', key: 'ui.journal' },
];

/** Нижние вкладки. Всё нажимается пальцем — ограничение 2.2. */
export function renderNav(
  painter: Painter,
  hotspots: Hotspots,
  ui: UiState,
  go: (patch: Partial<UiState>) => void,
): void {
  const y = SCREEN.height - LAYOUT.navHeight;
  painter.fill({ x: 0, y, w: SCREEN.width, h: LAYOUT.navHeight }, COLORS.panelDeep);
  painter.fill({ x: 0, y, w: SCREEN.width, h: 1 }, COLORS.border);

  const width = Math.floor(SCREEN.width / TABS.length);
  TABS.forEach((tab, index) => {
    const rect = { x: index * width + 2, y: y + 3, w: width - 4, h: LAYOUT.navHeight - 6 };
    const active = ui.screen === tab.screen || (tab.screen === 'world' && isWorldish(ui.screen));
    // «Район» возвращает туда, где игрок стоит: на улицу или в комнату.
    const destination: ScreenId =
      tab.screen === 'world' && ui.locationId ? 'room' : tab.screen;
    const hotspot = {
      rect,
      label: tab.key,
      enabled: true,
      onActivate: () => go({ screen: destination, venueId: null, pointId: null, page: 0 }),
    };
    hotspots.add(hotspot);
    painter.button(rect, t(tab.key), {
      enabled: true,
      focused: hotspots.isFocused(hotspot),
      accent: active,
    });
  });
}

const isWorldish = (screen: ScreenId): boolean =>
  screen === 'room' || screen === 'point' || screen === 'gig' || screen === 'shop';
