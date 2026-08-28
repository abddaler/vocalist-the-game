import type { DistrictId, Slot } from '@core/types';

/**
 * Свет над городом. Время суток здесь не украшение: слот — это половина
 * всей игровой механики, и если утро от ночи отличается только цифрой в
 * панели, экран района остаётся неподвижной картинкой.
 *
 * Все значения — цвета отображения, поэтому им место здесь, а не в
 * data/balance.ts: на симуляцию они не влияют.
 */
export interface Ambience {
  /** Небо: три полосы сверху вниз, между ними Painter кладёт растяжку. */
  readonly skyHigh: number;
  readonly skyMid: number;
  readonly skyLow: number;
  /** Диск солнца или луны; null — затянуто. */
  readonly disc: number | null;
  readonly discY: number;
  /** Дальние силуэты за домами. */
  readonly far: number;
  readonly asphalt: number;
  readonly pavement: number;
  readonly kerb: number;
  /** Множитель яркости стен: полдень выбеливает, ночь гасит. */
  readonly light: number;
  /** Горит ли свет в окнах и неон на вывесках. */
  readonly lampsOn: boolean;
  /** Длина и прозрачность теней: в полдень короткие, на закате длинные. */
  readonly shadow: number;
  /**
   * Общий тон поверх всей улицы. Одного неба мало: если стены и люди
   * остаются дневными, закат выглядит обоями за окном, а не светом.
   */
  readonly wash: number;
  readonly washAlpha: number;
}

const BY_SLOT: Readonly<Record<Slot, Ambience>> = {
  morning: {
    skyHigh: 0x4f9ad6,
    skyMid: 0x9fd0ea,
    skyLow: 0xffd9a8,
    disc: 0xfff2c4,
    discY: 14,
    far: 0x9fb5cc,
    asphalt: 0x5f6472,
    pavement: 0x9a9fa8,
    kerb: 0xc2c6cc,
    light: 1.0,
    lampsOn: false,
    shadow: 0.28,
    wash: 0xffc98f,
    washAlpha: 0.1,
  },
  day: {
    skyHigh: 0x2f8ad8,
    skyMid: 0x63b4e8,
    skyLow: 0xc4e6f5,
    disc: 0xffffff,
    discY: 6,
    far: 0xa8c0d4,
    asphalt: 0x6e727e,
    pavement: 0xb0b4ba,
    kerb: 0xd8dade,
    light: 1.18,
    lampsOn: false,
    shadow: 0.2,
    wash: 0xfff4d8,
    washAlpha: 0.05,
  },
  evening: {
    // Закат — фирменный вид этого города, поэтому он самый насыщенный.
    skyHigh: 0x5a3f8f,
    skyMid: 0xd4628a,
    skyLow: 0xffa25c,
    disc: 0xffd07a,
    discY: 28,
    far: 0x6a4f7a,
    asphalt: 0x5a4f5e,
    pavement: 0x9c8a92,
    kerb: 0xc8a898,
    light: 1.02,
    lampsOn: true,
    shadow: 0.34,
    wash: 0xff7a45,
    washAlpha: 0.19,
  },
  night: {
    skyHigh: 0x101426,
    skyMid: 0x23204a,
    skyLow: 0x4a3566,
    disc: 0xdfe4f0,
    discY: 10,
    far: 0x2a2846,
    asphalt: 0x2e3040,
    pavement: 0x4a4c5c,
    kerb: 0x64667a,
    light: 0.62,
    lampsOn: true,
    shadow: 0.16,
    wash: 0x2b2f70,
    washAlpha: 0.26,
  },
};

/**
 * Поправка на район. Холмы выше и светлее, даунтаун в дымке, бульвар
 * теплее всех, причал уходит в холод и соль.
 */
const BY_DISTRICT: Readonly<Record<DistrictId, Partial<Ambience>>> = {
  hills: { light: 1.06 },
  downtown: { light: 0.94 },
  boulevard: { light: 1.04 },
  pier: { light: 0.96, wash: 0x7fb0c8, washAlpha: 0.1 },
};

export function ambienceOf(slot: Slot, district: DistrictId): Ambience {
  const base = BY_SLOT[slot];
  const patch = BY_DISTRICT[district];
  return { ...base, ...patch, light: base.light * (patch.light ?? 1) };
}

/** Цвет стены под этим светом. */
export function lit(color: number, ambience: Ambience): number {
  return scale(color, ambience.light);
}

export function scale(color: number, factor: number): number {
  const r = clamp(((color >> 16) & 0xff) * factor);
  const g = clamp(((color >> 8) & 0xff) * factor);
  const b = clamp((color & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

/** Смешение двух цветов: t=0 — первый, t=1 — второй. */
export function mix(from: number, to: number, t: number): number {
  const k = Math.max(0, Math.min(1, t));
  const r = clamp(((from >> 16) & 0xff) * (1 - k) + ((to >> 16) & 0xff) * k);
  const g = clamp(((from >> 8) & 0xff) * (1 - k) + ((to >> 8) & 0xff) * k);
  const b = clamp((from & 0xff) * (1 - k) + (to & 0xff) * k);
  return (r << 16) | (g << 8) | b;
}

const clamp = (value: number): number => Math.max(0, Math.min(255, Math.round(value)));
