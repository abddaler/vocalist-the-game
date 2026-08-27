/**
 * Все коэффициенты симуляции. В системах магических чисел быть не должно
 * (раздел 12). Каждое число снабжено комментарием, на что влияет.
 *
 * Цифры выставлены «по здравому смыслу» и будут перекручены на вехе 3,
 * когда headless-симулятор покажет реальные кривые (раздел 10).
 */
export const BALANCE = {
  time: {
    /** Длина среза в днях (раздел 1). */
    sliceDays: 60,
    daysPerWeek: 7,
    daysPerMonth: 30,
  },

  energy: {
    max: 100,
    start: 100,
    /** Сколько возвращает ночной сон. */
    sleepRestore: 70,
    /** Ниже этого порога всё делается вполсилы. */
    lowThreshold: 20,
    /** Множитель эффективности при энергии ниже порога. */
    lowEfficiency: 0.5,
    /** Цена бессонной ночи (раздел 4: «ночь без сна — штраф»). */
    noSleepPenalty: { energy: -20, mood: -12, vocalHealth: -6 },
  },

  vocal: {
    max: 100,
    start: 100,

    /**
     * load = baseLoad * (loadAtZeroSupport - breathSupport/100)
     *        * genreMultiplier * (1 - warmupBonus)
     * При опоре 100 множитель 0.8, при 0 — 1.8 (раздел 6).
     */
    loadAtZeroSupport: 1.8,
    /** Скидка к износу за распевку в том же дне. */
    warmupBonus: 0.35,

    /** Пороги здоровья связок, раздел 6. */
    tiers: { normal: 70, fatigue: 40, hoarse: 20 },
    /** Множитель к оценке выступления на каждом пороге. */
    tierScore: { normal: 1, fatigue: 0.9, hoarse: 0.7, critical: 0.5 },
    /** Шанс травмы за одно вокальное действие на каждом пороге. */
    tierInjuryChance: { normal: 0, fatigue: 0, hoarse: 0.15, critical: 0.45 },

    /** Длительность травмы, дней (раздел 6). */
    injuryDays: { min: 5, max: 12 },
    /** Лечение у фониатра сокращает оставшийся срок вдвое. */
    injuryHealDivisor: 2,

    /**
     * Восстановление связок. Раздел 6 задаёт «полный день молчания +25»:
     * это три бодрствующих слота по silenceSlot плюс fullSilenceDayBonus
     * за то, что игрок промолчал весь день целиком (3*6 + 7 = 25).
     */
    recovery: {
      sleep: 8,
      silenceSlot: 6,
      fullSilenceDayBonus: 7,
      doctor: 40,
      tea: 3,
    },
    /** Сколько бодрствующих слотов в сутках (день без ночного слота). */
    wakingSlots: 3,

    /** Экстрим-техники закрыты, пока опора ниже этого значения (5.1). */
    extremeUnlockSupport: 45,
  },

  skills: {
    max: 100,
    /**
     * Затухание роста у потолка: gain *= 1 - (current/max)^exponent.
     * Чем выше exponent, тем дольше держится быстрый рост в начале.
     */
    diminishingExponent: 1.6,
    /** Опора — множитель к эффективности всех остальных статов (5.1). */
    supportFloor: 0.6,
    supportSpan: 0.4,
    /** Влияние настроения на скорость роста. */
    moodFloor: 0.7,
    moodSpan: 0.3,
    /** Стартовые значения самоучки. */
    start: {
      breathSupport: 8,
      range: 12,
      registers: 5,
      timbre: 10,
      diction: 15,
      pitch: 20,
      stamina: 10,
      extreme: 0,
      stage: 5,
    },
  },

  money: {
    start: 8000,
    /** Ниже этого долга приходит коллектор (раздел 5.2). */
    debtLimit: -3000,
    /** Списывается в конце каждой недели. */
    weeklyFood: 2800,
    /** Списывается в конце каждого месяца. */
    monthlyRent: 15000,
    monthlyBills: 2500,
  },

  mood: { max: 100, start: 70 },

  fans: {
    /** Доля фанатов, уходящая за месяц без единого выступления (раздел 4). */
    monthlyDecayIdle: 0.18,
    /** Доля, уходящая за месяц даже при активности. */
    monthlyDecayActive: 0.04,
    /** Доля фанбазы, теряемая при смене жанра (раздел 7). */
    genreSwitchLoss: 0.5,
  },

  reputation: { min: -100, max: 100, start: 0 },

  log: {
    /** Сколько последних записей держим в состоянии. */
    maxEntries: 400,
  },
} as const;
