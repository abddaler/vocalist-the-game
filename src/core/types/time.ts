/** День делится на 4 слота, раздел 4. */
export const SLOTS = ['morning', 'day', 'evening', 'night'] as const;
export type Slot = (typeof SLOTS)[number];

export const SLOTS_PER_DAY = SLOTS.length;
