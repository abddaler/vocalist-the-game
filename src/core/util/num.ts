export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/** Округление до сотых: копит меньше плавающего мусора в сохранениях. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
