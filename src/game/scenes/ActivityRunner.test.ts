import { describe, expect, it } from 'vitest';
import { ACTIVITIES } from '@data/activities';
import { ACTIVITY_MS, CYCLE, moteOf } from '@ui/screens/ActivityScene';
import { ACT_LOOKS, ACT_POSES, LOOKS, PLAYER_LOOK, actorTexture } from '../art';
import { ActivityRunner } from './ActivityRunner';

const action = { type: 'noop' } as never;

/** Имя позы из имени кадра `внешность-поза`. */
const poseOf = (frame: string): string => frame.slice(frame.indexOf('-') + 1);

describe('кадры занятия', () => {
  it('сон берёт позы сна, а не шага', () => {
    const runner = new ActivityRunner();
    runner.start('sleep', action);
    expect(poseOf(runner.view()!.actorTexture)).toBe('restA');
    runner.tick(CYCLE.sleep.ms / 2);
    expect(poseOf(runner.view()!.actorTexture)).toBe('restB');
  });

  it('урок вокала проходит все шесть кадров фразы', () => {
    const runner = new ActivityRunner();
    runner.start('lesson_breathSupport_mid', action);
    const seen = new Set<string>();
    for (let ms = 0; ms < CYCLE.note.ms; ms += 20) {
      seen.add(poseOf(runner.view()!.actorTexture));
      runner.tick(20);
    }
    expect([...seen].sort()).toEqual([...CYCLE.note.frames].sort());
  });

  it('фраза успевает пройти хотя бы раз за сцену', () => {
    for (const cycle of Object.values(CYCLE)) {
      expect(cycle.ms).toBeLessThanOrEqual(ACTIVITY_MS);
    }
  });

  it('любое дело просит только те позы, что собраны игроку', () => {
    // Кадр, которого нет в атласе, Phaser рисует целиком — промах видно
    // сразу, но лучше поймать его здесь.
    expect(ACT_LOOKS.has(LOOKS[PLAYER_LOOK]!.id)).toBe(true);
    for (const mote of Object.keys(CYCLE)) {
      for (const frame of CYCLE[mote as keyof typeof CYCLE].frames) {
        expect(ACT_POSES).toContain(frame);
        expect(actorTexture(PLAYER_LOOK, frame)).toBe(`${PLAYER_LOOK}-${frame}`);
      }
    }
  });

  it('у каждого дела из данных есть свой цикл', () => {
    for (const activity of ACTIVITIES) {
      expect(CYCLE[moteOf(activity.id)]).toBeDefined();
    }
  });

  it('петь идут уроки, распевка, репетиция, запись и смена', () => {
    const lessons = ACTIVITIES.filter((a) => a.id.startsWith('lesson_')).map((a) => a.id);
    expect(lessons.length).toBeGreaterThan(0);
    for (const id of [...lessons, 'warmup', 'practice_free', 'band_rehearsal', 'record_single']) {
      expect(CYCLE[moteOf(id)].frames).toContain('singD');
    }
    expect(CYCLE[moteOf('restaurant_shift')].frames).toContain('singD');
  });
});
