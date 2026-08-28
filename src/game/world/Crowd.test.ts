import { describe, expect, it } from 'vitest';
import { spawnCrowd, updateCrowd } from './Crowd';

describe('живность локации', () => {
  it('появляется в каждой обжитой локации', () => {
    expect(spawnCrowd('boulevard').length).toBeGreaterThan(0);
    expect(spawnCrowd('club_vertigo').length).toBeGreaterThan(0);
    expect(spawnCrowd('нет-такой-локации')).toHaveLength(0);
  });

  it('стартует с первой точки маршрута', () => {
    const [actor] = spawnCrowd('boulevard');
    expect(actor!.position).toEqual(actor!.member.path[0]);
  });

  it('разводит паузы, чтобы локация не шагала в ногу', () => {
    const waits = spawnCrowd('boulevard').map((a) => a.wait);
    expect(new Set(waits).size).toBeGreaterThan(1);
  });

  it('идёт к следующей точке и разворачивается по ходу', () => {
    const actors = spawnCrowd('boulevard').filter((a) => a.member.path.length > 1);
    const actor = actors[0]!;
    actor.wait = 0;
    const start = { ...actor.position };

    updateCrowd([actor], 200);
    expect(actor.position).not.toEqual(start);
    expect(actor.moving).toBe(true);
  });

  it('дойдя до точки, встаёт на паузу и берёт следующую', () => {
    const actor = spawnCrowd('boulevard').find((a) => a.member.path.length > 1)!;
    actor.wait = 0;
    const wasNext = actor.next;

    for (let i = 0; i < 400 && actor.next === wasNext; i += 1) updateCrowd([actor], 100);

    expect(actor.next).not.toBe(wasNext);
    expect(actor.wait).toBe(actor.member.dwell);
    expect(actor.moving).toBe(false);
  });

  it('стоящий на месте никуда не уходит', () => {
    const actor = spawnCrowd('phoniatrist').find((a) => a.member.path.length === 1)!;
    const start = { ...actor.position };
    for (let i = 0; i < 50; i += 1) updateCrowd([actor], 100);
    expect(actor.position).toEqual(start);
    expect(actor.moving).toBe(false);
  });

  it('маршруты не уводят людей за пределы карты', () => {
    for (const actor of spawnCrowd('boulevard')) {
      for (const point of actor.member.path) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
