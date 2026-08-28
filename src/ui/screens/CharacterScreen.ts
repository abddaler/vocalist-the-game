import { BALANCE } from '@data/balance';
import { NPC_IDS, SKILL_KEYS } from '@core/types';
import type { SkillKey } from '@core/types';
import { isExtremeUnlocked } from '@core/systems/skills';
import { imageLevel } from '@core/systems/outfit';
import { t } from '../i18n';
import { COLORS, CONTENT, LAYOUT } from '../theme';
import type { RenderContext } from './types';

const STAT_W = 268;
const ROW_H = 17;

/**
 * Экран персонажа (9.6): статы с полосками и подсказка, что даёт каждый.
 * Подсказка показывается по тапу на стат — на 480x270 постоянные
 * пояснения ко всем девяти статам не помещаются.
 */
export function renderCharacter(ctx: RenderContext): void {
  renderSkills(ctx);
  renderHint(ctx);
  renderSide(ctx);
}

function renderSkills(ctx: RenderContext): void {
  const { painter, hotspots, state, ui } = ctx;
  const top = CONTENT.y + 4;

  painter.label({ x: LAYOUT.padding, y: top, w: STAT_W, h: 12 }, t('ui.skills'), {
    color: COLORS.textDim,
  });

  SKILL_KEYS.forEach((key, index) => {
    const rect = {
      x: LAYOUT.padding,
      y: top + 14 + index * ROW_H,
      w: STAT_W,
      h: LAYOUT.minTap,
    };
    const hotspot = {
      rect,
      label: key,
      enabled: true,
      onActivate: () => ctx.go({ skill: ui.skill === key ? null : (key as SkillKey) }),
    };
    hotspots.add(hotspot);

    const value = state.skills[key];
    const locked = key === 'extreme' && !isExtremeUnlocked(state);
    const selected = ui.skill === key;

    if (selected || hotspots.isFocused(hotspot)) {
      painter.fill(rect, COLORS.panelAlt);
    }
    painter.label({ x: rect.x + 3, y: rect.y, w: 110, h: rect.h }, t(`skill.${key}`), {
      color: locked ? COLORS.textMuted : COLORS.text,
    });
    painter.bar(
      { x: rect.x + 116, y: rect.y + 4, w: 118, h: 8 },
      value,
      BALANCE.skills.max,
      locked ? COLORS.disabled : COLORS.accent,
    );
    painter.label({ x: rect.x + 238, y: rect.y, w: 26, h: rect.h }, String(Math.round(value)), {
      align: 'right',
      color: COLORS.textDim,
    });
  });
}

function renderHint(ctx: RenderContext): void {
  const { painter, ui } = ctx;
  const rect = { x: LAYOUT.padding, y: CONTENT.y + CONTENT.height - 30, w: STAT_W, h: 26 };
  painter.panel(rect);
  painter.label(
    { x: rect.x + 4, y: rect.y + 2, w: rect.w - 8, h: rect.h - 4 },
    ui.skill ? t(`skill.${ui.skill}.hint`) : 'Нажмите на стат, чтобы узнать, что он даёт',
    { color: ui.skill ? COLORS.text : COLORS.textMuted, wrapWidth: rect.w - 8 },
  );
}

function renderSide(ctx: RenderContext): void {
  const { painter, state } = ctx;
  const x = LAYOUT.padding * 2 + STAT_W;
  const w = CONTENT.width - x - LAYOUT.padding;

  painter.panel({ x, y: CONTENT.y + 4, w, h: 78 });
  painter.label({ x: x + 4, y: CONTENT.y + 8, w: w - 8, h: 12 },
    t('ui.career', { tier: t(`tier.${state.career.tier}`) }), { color: COLORS.accent });
  line(ctx, x, CONTENT.y + 23, w, 'выступлений', String(state.career.performances));
  line(ctx, x, CONTENT.y + 36, w, 'синглов', String(state.career.singles));
  line(ctx, x, CONTENT.y + 49, w, 'репутация', String(Math.round(state.resources.reputation)));
  line(ctx, x, CONTENT.y + 62, w, 'имидж', String(imageLevel(state)));

  painter.label({ x: x + 4, y: CONTENT.y + 88, w: w - 8, h: 12 }, t('ui.relations'), {
    color: COLORS.textDim,
  });
  NPC_IDS.forEach((id, index) => {
    const npc = state.npcs[id];
    const y = CONTENT.y + 104 + index * 16;
    painter.label({ x: x + 4, y, w: w - 60, h: 12 }, t(`npc.${id}`), {
      color: npc.met ? COLORS.text : COLORS.textMuted,
    });
    if (npc.met) {
      painter.bar({ x: x + w - 54, y: y + 3, w: 50, h: 6 }, npc.relation, 100, COLORS.mood);
    } else {
      painter.label({ x: x + w - 54, y, w: 50, h: 12 }, t('ui.notMet'), {
        align: 'right',
        color: COLORS.textMuted,
      });
    }
  });
}

function line(ctx: RenderContext, x: number, y: number, w: number, caption: string, value: string): void {
  ctx.painter.label({ x: x + 4, y, w: w - 8, h: 12 }, caption, { color: COLORS.textDim });
  ctx.painter.label({ x: x + 4, y, w: w - 8, h: 12 }, value, { align: 'right', color: COLORS.text });
}
