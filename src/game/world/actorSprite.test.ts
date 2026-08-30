import { describe, expect, it } from 'vitest';
import { NPC_IDS } from '@core/types';
import { crowdIn } from '@data/world';
import { ACT_LOOKS, LOOKS, PLAYER_LOOK } from '../art';
import { ACT_POSES, POSES } from '../art';
import { POSE } from '../art/figure/pose';
import { CYCLE } from '@ui/screens/ActivityScene';
import { BALANCE } from '@data/balance';
import { facingFrom, idleBreath, lookFor, talkLook, wornLook } from './actorSprite';
import type { Facing } from './actorSprite';

describe('поворот персонажа', () => {
  it('следует за преобладающей осью движения', () => {
    // Ось x уходит вниз-вправо по экрану, ось y — вниз-влево: это
    // прямо следует из проекции, где экранный x равен (x − y).
    expect(facingFrom({ x: 0, y: 0 }, { x: 5, y: 1 }, 'se')).toBe('se');
    expect(facingFrom({ x: 0, y: 0 }, { x: -5, y: 1 }, 'se')).toBe('nw');
    expect(facingFrom({ x: 0, y: 0 }, { x: 1, y: 5 }, 'ne')).toBe('sw');
    expect(facingFrom({ x: 0, y: 0 }, { x: 1, y: -5 }, 'se')).toBe('ne');
  });

  it('ход по экранным осям различает все четыре стороны', () => {
    // Клавиши двигают по экрану, а это диагональ сетки: обе оси меняются
    // поровну. Сравнение осей сетки отдавало ничью одной ветке, и с
    // клавиатуры человек поворачивался только в две стороны из четырёх.
    const key = (ax: number, ay: number, was: Facing = 'se'): Facing =>
      facingFrom({ x: 0, y: 0 }, { x: ax, y: ay }, was);
    // Вправо и влево по экрану — вбок, показывается лицом.
    expect(key(0.5, -0.5)).toBe('se');
    expect(key(-0.5, 0.5)).toBe('sw');
    // Вверх и вниз по экрану сторону не задают: она остаётся прежней.
    expect(key(0.5, 0.5, 'se')).toBe('se');
    expect(key(0.5, 0.5, 'sw')).toBe('sw');
    expect(key(-0.5, -0.5, 'se')).toBe('ne');
    expect(key(-0.5, -0.5, 'sw')).toBe('nw');
  });

  it('стоящий сохраняет поворот, а не разворачивается к зрителю', () => {
    expect(facingFrom({ x: 3, y: 3 }, { x: 3, y: 3 }, 'nw')).toBe('nw');
    expect(facingFrom({ x: 3, y: 3 }, { x: 3.01, y: 3 }, 'ne')).toBe('ne');
  });
});

describe('кадр анимации', () => {
  /** Шаг меряется в плитках, и одна фаза — заметно меньше плитки. */
  const PHASE = 0.55;
  const walk = (facing: Facing, phases: number[]): string[] =>
    phases.map((n) => lookFor(facing, n * PHASE + PHASE / 2, true).pose);

  it('в покое всегда первый кадр', () => {
    expect(lookFor('se', 999, false).pose).toBe('seA');
    expect(lookFor('se', 999, false).lift).toBe(0);
  });

  it('шаг укладывается в плитку, а не в семь', () => {
    // На семи плитках кадр менялся раз в две с половиной секунды.
    expect(lookFor('se', 0, true).pose).not.toBe(lookFor('se', 1, true).pose);
  });

  it('вперёд выносится то одна нога, то другая', () => {
    expect(walk('se', [0, 1, 2, 3, 4])).toEqual(['seB', 'seA', 'seC', 'seA', 'seB']);
  });

  it('спиной к камере идёт свой набор кадров', () => {
    expect(walk('ne', [0, 1, 2, 3, 4])).toEqual(['neB', 'neA', 'neC', 'neA', 'neB']);
  });

  it('на проносе корпус выше, чем в момент касания', () => {
    expect(lookFor('se', PHASE / 2, true).lift).toBe(0);
    expect(lookFor('se', PHASE * 1.5, true).lift).toBe(1);
  });

  it('левые стороны — зеркала правых, а не отдельные кадры', () => {
    // Половина кадров не рисуется вовсе: в изометрии юго-запад — это
    // юго-восток наизнанку.
    expect(lookFor('sw', 0, true).pose).toBe(lookFor('se', 0, true).pose);
    expect(lookFor('sw', 0, true).flipX).toBe(true);
    expect(lookFor('se', 0, true).flipX).toBe(false);
    expect(lookFor('nw', 0, true).pose).toBe(lookFor('ne', 0, true).pose);
    expect(lookFor('nw', 0, true).flipX).toBe(true);
    expect(lookFor('ne', 0, true).flipX).toBe(false);
  });

  it('к камере и от камеры — разные ракурсы', () => {
    for (const toward of ['se', 'sw'] as const) {
      expect(POSE[lookFor(toward, 0, false).pose]!.view).toBe('quarter');
    }
    for (const away of ['ne', 'nw'] as const) {
      expect(POSE[lookFor(away, 0, false).pose]!.view).toBe('quarterBack');
    }
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

describe('стоящий и севший голос', () => {
  const stand = lookFor('se', 0, false);

  it('стоящий дышит: корпус поднимается и опускается', () => {
    const lifts = new Set([0, 280, 560, 840].map((clock) => idleBreath(stand, clock).lift));
    expect(lifts).toEqual(new Set([0, 1]));
  });

  it('дыхание не трогает позу, только подъём', () => {
    for (const clock of [0, 300, 700]) {
      expect(idleBreath(stand, clock).pose).toBe(stand.pose);
      expect(idleBreath(stand, clock).flipX).toBe(stand.flipX);
    }
  });

  it('севший голос берёт свои два кадра', () => {
    const poses = new Set([0, 350, 700, 1050].map((clock) => wornLook(clock).pose));
    expect(poses).toEqual(new Set(['wornA', 'wornB']));
  });

  it('порог севшего голоса — усталость из баланса, а не число в рендере', () => {
    // Порог живёт в data/balance.ts вместе с остальными порогами связок.
    expect(BALANCE.vocal.tiers.fatigue).toBeGreaterThan(BALANCE.vocal.tiers.hoarse);
    expect(BALANCE.vocal.tiers.fatigue).toBeLessThan(BALANCE.vocal.tiers.normal);
  });

  it('позы севшего голоса собраны игроку', () => {
    for (const pose of ['wornA', 'wornB']) expect(ACT_POSES).toContain(pose);
  });
});
