import { describe, expect, it } from 'vitest';
import { NPC_IDS } from '@core/types';
import { crowdIn } from '@data/world';
import { ACT_LOOKS, LOOKS, PLAYER_LOOK } from '../art';
import { ACT_POSES, POSES } from '../art';
import { POSE } from '../art/figure/pose';
import { CYCLE } from '@ui/screens/ActivityScene';
import { facingFrom, lookFor, talkLook } from './actorSprite';

describe('поворот персонажа', () => {
  it('следует за преобладающей осью движения', () => {
    expect(facingFrom({ x: 0, y: 0 }, { x: 5, y: 1 }, 'down')).toBe('right');
    expect(facingFrom({ x: 0, y: 0 }, { x: -5, y: 1 }, 'down')).toBe('left');
    expect(facingFrom({ x: 0, y: 0 }, { x: 1, y: 5 }, 'up')).toBe('down');
    expect(facingFrom({ x: 0, y: 0 }, { x: 1, y: -5 }, 'down')).toBe('up');
  });

  it('стоящий сохраняет поворот, а не разворачивается к зрителю', () => {
    expect(facingFrom({ x: 3, y: 3 }, { x: 3, y: 3 }, 'left')).toBe('left');
    expect(facingFrom({ x: 3, y: 3 }, { x: 3.01, y: 3 }, 'up')).toBe('up');
  });
});

describe('кадр анимации', () => {
  /** Шаг меряется в плитках, и одна фаза — заметно меньше плитки. */
  const PHASE = 0.55;
  const walk = (facing: 'down' | 'left', phases: number[]): string[] =>
    phases.map((n) => lookFor(facing, n * PHASE + PHASE / 2, true).pose);

  it('в покое всегда первый кадр', () => {
    expect(lookFor('down', 999, false).pose).toBe('downA');
    expect(lookFor('down', 999, false).lift).toBe(0);
  });

  it('шаг укладывается в плитку, а не в семь', () => {
    // На семи плитках кадр менялся раз в две с половиной секунды.
    expect(lookFor('down', 0, true).pose).not.toBe(lookFor('down', 1, true).pose);
  });

  it('анфас кадры чередуются: касание и пронос', () => {
    expect(walk('down', [0, 1, 2, 3, 4])).toEqual([
      'downB', 'downA', 'downB', 'downA', 'downB',
    ]);
  });

  it('в профиль вперёд выносится то одна нога, то другая', () => {
    expect(walk('left', [0, 1, 2, 3, 4])).toEqual([
      'sideB', 'sideA', 'sideC', 'sideA', 'sideB',
    ]);
  });

  it('на проносе корпус выше, чем в момент касания', () => {
    expect(lookFor('down', PHASE / 2, true).lift).toBe(0);
    expect(lookFor('down', PHASE * 1.5, true).lift).toBe(1);
  });

  it('профиль отзеркаливается, а не дублируется отдельными кадрами', () => {
    expect(lookFor('left', 0, true).flipX).toBe(true);
    expect(lookFor('right', 0, true).flipX).toBe(false);
  });
});

describe('позы дела', () => {
  it('собираются игроку и каждому названному', () => {
    expect(ACT_LOOKS.has(LOOKS[PLAYER_LOOK]!.id)).toBe(true);
    for (const npc of NPC_IDS) expect(ACT_LOOKS.has(npc)).toBe(true);
  });

  it('у каждого, кому их обещали, есть такая внешность', () => {
    for (const id of ACT_LOOKS) {
      expect(LOOKS.some((look) => look.id === id)).toBe(true);
    }
  });

  it('каждая поза цикла занятия действительно нарисована', () => {
    for (const { frames } of Object.values(CYCLE)) {
      for (const frame of frames) expect(POSE[frame]).toBeDefined();
    }
  });

  it('разговор берёт только позы дела', () => {
    for (const age of [0, 200, 300, 519, 520, 900]) {
      expect(ACT_POSES).toContain(talkLook(age).pose);
    }
  });

  it('ходовые и деловые позы не пересекаются', () => {
    for (const pose of ACT_POSES) expect(POSES).not.toContain(pose);
  });

  it('говорить может только тот, кому позы собрали', () => {
    // Толпа берётся из данных: заведи прохожего с именем — и он
    // попросит кадр, которого для него не собирали.
    const districts = ['hills', 'downtown', 'boulevard', 'pier'];
    for (const district of districts) {
      for (const member of crowdIn(district)) {
        if (member.nameKey === undefined) continue;
        expect(ACT_LOOKS.has(member.look)).toBe(true);
      }
    }
  });
});
