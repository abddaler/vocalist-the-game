/**
 * Тело персонажа, 12x20. Точка — прозрачно, остальные символы — индексы
 * палитры (см. palettes.ts): 1 контур, 2 кожа, 3 тень кожи, 6 одежда,
 * 7 тень одежды, 9 брюки, A обувь, D глаза.
 *
 * Голова нарисована лысой: причёска накладывается отдельным слоем. Так
 * из одного тела и шести причёсок получается шесть разных людей, а не
 * шесть раскладок, которые надо править по одной.
 *
 * Два кадра ходьбы на направление: ноги вместе и ноги врозь. Этого
 * хватает, чтобы шаг читался.
 */
export type Frame = readonly string[];

/** Голова и торс общие для всех кадров, различаются только ноги. */
const FRONT_HEAD: Frame = [
  '....1111....',
  '...122221...',
  '..12222221..',
  '..12222221..',
  '..12D22D21..',
  '..12222221..',
  '..13222231..',
  '...122221...',
  '....1221....',
];

const BACK_HEAD: Frame = [
  '....1111....',
  '...122221...',
  '..12222221..',
  '..12222221..',
  '..12222221..',
  '..12222221..',
  '..12222221..',
  '...122221...',
  '....1221....',
];

/** Профиль: нос выступает вправо, виден один глаз. */
const SIDE_HEAD: Frame = [
  '....1111....',
  '...122221...',
  '..12222221..',
  '..12222221..',
  '..122222D121',
  '..12222221..',
  '..13222221..',
  '...122221...',
  '....1221....',
];

const FRONT_TORSO: Frame = [
  '..16666661..',
  '.1666666661.',
  '.1666666661.',
  '.1666666661.',
  '.2166666612.',
  '..17777771..',
];

/** В профиль плечи уже, а одна рука вынесена вперёд. */
const SIDE_TORSO: Frame = [
  '...16666661.',
  '..166666661.',
  '..166666661.',
  '..1666666612',
  '..1666666661',
  '...17777771.',
];

const LEGS_TOGETHER: Frame = [
  '..19911991..',
  '..19911991..',
  '..19911991..',
  '..1AA11AA1..',
  '..1AA11AA1..',
];

const LEGS_APART: Frame = [
  '.199....991.',
  '.199....991.',
  '.199....991.',
  '.1AA....AA1.',
  '.1AA....AA1.',
];

/** В профиль ноги идут одна за другой, а не в стороны. */
const SIDE_LEGS_TOGETHER: Frame = [
  '...199991...',
  '...199991...',
  '...199991...',
  '...1AAAA1...',
  '...1AAAA1...',
];

const SIDE_LEGS_APART: Frame = [
  '..19911991..',
  '.199....991.',
  '.199....991.',
  '.1AA....AA1.',
  '.1AA....AA1.',
];

const frame = (head: Frame, torso: Frame, legs: Frame): Frame => [...head, ...torso, ...legs];

export const BODY = {
  downA: frame(FRONT_HEAD, FRONT_TORSO, LEGS_TOGETHER),
  downB: frame(FRONT_HEAD, FRONT_TORSO, LEGS_APART),
  upA: frame(BACK_HEAD, FRONT_TORSO, LEGS_TOGETHER),
  upB: frame(BACK_HEAD, FRONT_TORSO, LEGS_APART),
  sideA: frame(SIDE_HEAD, SIDE_TORSO, SIDE_LEGS_TOGETHER),
  sideB: frame(SIDE_HEAD, SIDE_TORSO, SIDE_LEGS_APART),
} as const;

export type ActorPose = keyof typeof BODY;
export const POSES = Object.keys(BODY) as readonly ActorPose[];

/** Размер кадра. Спрайт ставится ногами в точку, отсюда origin (0.5, 1). */
export const ACTOR_SPRITE = { width: 12, height: 20 } as const;

/** Куда смотрит поза: причёска и аксессуар зависят от этого, а не от кадра. */
export const FACING_OF: Readonly<Record<ActorPose, 'front' | 'back' | 'side'>> = {
  downA: 'front',
  downB: 'front',
  upA: 'back',
  upB: 'back',
  sideA: 'side',
  sideB: 'side',
};
