import { describe, expect, it } from 'vitest';
import {
  ACTOR,
  actorRect,
  cameraOffset,
  centerOf,
  contains,
  nearest,
  overlaps,
  step,
  stepToward,
} from './movement';

const bounds = { width: 200, height: 100 };
const noSolids: never[] = [];

describe('геометрия', () => {
  it('пересечение прямоугольников считается по краям', () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    expect(overlaps(a, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
    expect(overlaps(a, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
    expect(overlaps(a, { x: -10, y: 0, w: 10, h: 10 })).toBe(false);
  });

  it('точка внутри прямоугольника: левый верхний угол считается, правый нижний — нет', () => {
    const rect = { x: 10, y: 10, w: 10, h: 10 };
    expect(contains(rect, { x: 10, y: 10 })).toBe(true);
    expect(contains(rect, { x: 20, y: 20 })).toBe(false);
  });

  it('тело персонажа стоит ногами в точке позиции', () => {
    const body = actorRect({ x: 50, y: 80 });
    expect(body).toEqual({ x: 50 - ACTOR.w / 2, y: 80 - ACTOR.h, w: ACTOR.w, h: ACTOR.h });
  });

  it('центр прямоугольника', () => {
    expect(centerOf({ x: 10, y: 20, w: 10, h: 20 })).toEqual({ x: 15, y: 30 });
  });
});

describe('ходьба', () => {
  it('двигает по обеим осям', () => {
    expect(step({ x: 50, y: 50 }, 5, -3, noSolids, bounds)).toEqual({ x: 55, y: 47 });
  });

  it('не выпускает за границы карты', () => {
    expect(step({ x: 5, y: 50 }, -100, 0, noSolids, bounds).x).toBe(ACTOR.w / 2);
    expect(step({ x: 195, y: 50 }, 100, 0, noSolids, bounds).x).toBe(bounds.width - ACTOR.w / 2);
    expect(step({ x: 50, y: 20 }, 0, -100, noSolids, bounds).y).toBe(ACTOR.h);
    expect(step({ x: 50, y: 90 }, 0, 100, noSolids, bounds).y).toBe(bounds.height);
  });

  it('не проходит сквозь стену', () => {
    const wall = [{ x: 60, y: 0, w: 10, h: 100 }];
    const moved = step({ x: 50, y: 50 }, 20, 0, wall, bounds);
    expect(moved.x).toBe(50);
  });

  it('скользит вдоль стены, а не залипает углом', () => {
    const wall = [{ x: 60, y: 0, w: 10, h: 100 }];
    const moved = step({ x: 50, y: 50 }, 20, 5, wall, bounds);
    expect(moved.x).toBe(50);
    expect(moved.y).toBe(55);
  });
});

describe('ходьба к цели тапа', () => {
  it('приближается и в конце сообщает о прибытии', () => {
    let position = { x: 10, y: 50 };
    const target = { x: 40, y: 50 };
    let arrived = false;

    for (let i = 0; i < 50 && !arrived; i += 1) {
      const result = stepToward(position, target, 4, noSolids, bounds);
      position = result.position;
      arrived = result.arrived;
    }

    expect(arrived).toBe(true);
    expect(position.x).toBeCloseTo(40, 0);
  });

  it('не перелетает цель', () => {
    const result = stepToward({ x: 38, y: 50 }, { x: 40, y: 50 }, 20, noSolids, bounds);
    expect(result.position.x).toBeCloseTo(40);
  });

  it('бросает недостижимую цель вместо того, чтобы тереться о стену', () => {
    const wall = [{ x: 60, y: 0, w: 10, h: 100 }];
    // Стоим вплотную: тело занимает 52..60, следующий шаг упрётся в стену.
    const result = stepToward({ x: 56, y: 50 }, { x: 150, y: 50 }, 4, wall, bounds);
    expect(result.arrived).toBe(true);
    expect(result.position).toEqual({ x: 56, y: 50 });
  });

  it('цель за стеной перестаёт быть целью, даже если можно ползти вбок', () => {
    // Ровно этот случай ломал вход в дверь: дверь внутри стены, персонаж
    // упирается снизу, но продолжает микродвигаться по X и «не доходит».
    const wall = [{ x: 0, y: 0, w: 200, h: 40 }];
    let position = { x: 100, y: 60 };
    let arrived = false;

    for (let i = 0; i < 200 && !arrived; i += 1) {
      const result = stepToward(position, { x: 104, y: 20 }, 2, wall, bounds);
      position = result.position;
      arrived = result.arrived;
    }

    expect(arrived).toBe(true);
  });

  it('до стены всё-таки доходит, а не встаёт заранее', () => {
    const wall = [{ x: 60, y: 0, w: 10, h: 100 }];
    const result = stepToward({ x: 50, y: 50 }, { x: 150, y: 50 }, 4, wall, bounds);
    expect(result.position.x).toBe(54);
    expect(result.arrived).toBe(false);
  });
});

describe('поиск ближайшей точки', () => {
  const items = [
    { id: 'a', rect: { x: 0, y: 0, w: 10, h: 10 } },
    { id: 'b', rect: { x: 100, y: 0, w: 10, h: 10 } },
  ];

  it('находит ту, что в пределах досягаемости', () => {
    expect(nearest({ x: 8, y: 8 }, items, 20)?.id).toBe('a');
  });

  it('молчит, когда всё далеко', () => {
    expect(nearest({ x: 55, y: 55 }, items, 10)).toBeNull();
  });
});

describe('камера', () => {
  it('держит персонажа по центру внутри большой карты', () => {
    const offset = cameraOffset({ x: 360, y: 150 }, { width: 720, height: 306 }, 480, 216);
    expect(offset.x).toBe(120);
    expect(offset.y).toBe(42);
  });

  it('не показывает пустоту за краем карты', () => {
    expect(cameraOffset({ x: 0, y: 0 }, { width: 720, height: 306 }, 480, 216).x).toBe(0);
    expect(cameraOffset({ x: 720, y: 306 }, { width: 720, height: 306 }, 480, 216).x).toBe(240);
  });

  it('карту меньше окна центрирует, а не жмёт в угол', () => {
    const offset = cameraOffset({ x: 120, y: 76 }, { width: 240, height: 152 }, 480, 216);
    expect(offset.x).toBe(-120);
    expect(offset.y).toBe(-32);
  });
});
