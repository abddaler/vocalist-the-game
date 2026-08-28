import type { Action } from '@core/state';
import type { GameState, SkillKey } from '@core/types';
import type { Hotspots } from '../widgets/Hotspots';
import type { Painter } from '../widgets/Painter';

export type ScreenId =
  /** Экран района: ходьба между домами (раздел 8). */
  | 'world'
  /** Комната локации: ходьба внутри. */
  | 'room'
  /** Список дел одной точки взаимодействия. */
  | 'point'
  | 'gig'
  | 'character'
  | 'journal'
  | 'shop';

/** Куда игрок смотрит и что уже выбрал. Живёт в сцене, не в GameState. */
export interface UiState {
  screen: ScreenId;
  locationId: string | null;
  /** Точка взаимодействия, чьи дела открыты. */
  pointId: string | null;
  venueId: string | null;
  /** Длина сет-листа на экране подготовки (9.1). */
  songs: number;
  /** Стат, чью подсказку показываем на экране персонажа (9.6). */
  skill: SkillKey | null;
  page: number;
}

export interface RenderContext {
  readonly painter: Painter;
  readonly hotspots: Hotspots;
  readonly state: GameState;
  readonly ui: UiState;
  readonly dispatch: (action: Action) => void;
  readonly go: (patch: Partial<UiState>) => void;
}

export const initialUiState = (): UiState => ({
  screen: 'world',
  locationId: null,
  pointId: null,
  venueId: null,
  songs: 0,
  skill: null,
  page: 0,
});
