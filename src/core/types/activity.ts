import type { SkillGains } from './skills';
import type { GenreId } from './genre';
import type { Slot } from './time';

/**
 * Теги задают, как действие взаимодействует с системами:
 * vocal    — считается вокальной нагрузкой и может привести к травме
 * warmup   — распевка, даёт скидку к износу до конца дня
 * sleep    — ночной сон, снимает штраф за бессонную ночь
 * silence  — режим молчания, лечит связки
 * work     — заработок копится до конца недели
 * medical  — визит к врачу, сокращает срок травмы
 */
export type ActivityTag =
  | 'vocal'
  | 'warmup'
  | 'sleep'
  | 'silence'
  | 'work'
  | 'medical'
  | 'training'
  | 'rest';

/**
 * Явное `| undefined` — плата за exactOptionalPropertyTypes: Zod отдаёт
 * необязательные поля именно в таком виде.
 */
export interface ActivityRequirement {
  /** В каких слотах дня действие доступно. Пусто = в любом. */
  readonly slots?: readonly Slot[] | undefined;
  readonly minEnergy?: number | undefined;
  readonly minMoney?: number | undefined;
  readonly minSkill?: Readonly<SkillGains> | undefined;
  /** Нельзя делать с травмой связок. */
  readonly notInjured?: boolean | undefined;
  readonly genres?: readonly GenreId[] | undefined;
}

export interface ActivityDef {
  readonly id: string;
  readonly nameKey: string;
  /** Сколько слотов дня съедает (раздел 4). */
  readonly slots: number;
  readonly tags: readonly ActivityTag[];
  readonly requires: ActivityRequirement;

  /** Базовая нагрузка на связки до модификаторов (раздел 6). 0 = не вокальное. */
  readonly baseLoad: number;
  /** >0 восстанавливает энергию, <0 тратит. */
  readonly energy: number;
  /** Мгновенные деньги: <0 расход, >0 доход. */
  readonly money: number;
  /** Заработок, который выплатят в конце недели. */
  readonly wages: number;
  readonly mood: number;
  /** Прямое восстановление связок (сон, чай, фониатр). */
  readonly vocalHealth: number;
  readonly skillGain: Readonly<SkillGains>;
  readonly fame: number;
  readonly fans: number;
  readonly reputation: number;
}
