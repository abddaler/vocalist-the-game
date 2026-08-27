import type { GameEventDef } from '@core/types';
import { defineEvent } from '../define';

/** Случайные события про деньги и быт, который их съедает. */
export const RANDOM_MONEY: readonly GameEventDef[] = [
  defineEvent({
    id: 'rnd_wallet_found',
    kind: 'random',
    weight: 6,
    trigger: {},
    title: 'Кошелёк на асфальте',
    text: 'Плотный, кожаный, с паспортом внутри. Рядом никого.',
    choices: [
      {
        text: 'Вернуть по адресу из паспорта',
        effects: [
          { kind: 'mood', delta: 8 },
          { kind: 'reputation', delta: 2 },
        ],
      },
      {
        text: 'Оставить себе',
        effects: [
          { kind: 'money', delta: 4000 },
          { kind: 'mood', delta: -8 },
        ],
      },
    ],
  }),

  defineEvent({
    id: 'rnd_debt_collector',
    kind: 'random',
    weight: 20,
    trigger: { money: { lt: -3000 } },
    title: 'Звонок из банка',
    text: 'Вежливый голос перечисляет просрочки и напоминает про «дальнейшие меры».',
    choices: [
      {
        text: 'Занять у знакомых',
        effects: [
          { kind: 'money', delta: 8000 },
          { kind: 'mood', delta: -8 },
          { kind: 'reputation', delta: -3 },
        ],
      },
      {
        text: 'Пообещать закрыть с ближайшего концерта',
        effects: [{ kind: 'mood', delta: -12 }],
        risk: {
          chance: 0.4,
          text: 'Списали всё, что было на карте',
          effects: [
            { kind: 'money', delta: -2500 },
            { kind: 'mood', delta: -6 },
          ],
        },
      },
    ],
  }),

  defineEvent({
    id: 'rnd_good_sleep',
    kind: 'random',
    weight: 8,
    trigger: { vocalHealth: { lt: 70 } },
    title: 'Проспал десять часов',
    text: 'Никто не звонил, будильник не сработал, и голос утром звучит как чужой — в хорошем смысле.',
    choices: [
      {
        text: 'Отличное утро',
        effects: [
          { kind: 'vocalHealth', delta: 12 },
          { kind: 'mood', delta: 5 },
        ],
      },
    ],
  }),

  defineEvent({
    id: 'rnd_tea_recipe',
    kind: 'random',
    weight: 6,
    trigger: {},
    title: 'Бабушкин рецепт',
    text: 'Мать присылает голосовое на четыре минуты про мёд, имбирь и «не пей ледяное».',
    choices: [
      {
        text: 'Попробовать',
        effects: [
          { kind: 'vocalHealth', delta: 5 },
          { kind: 'mood', delta: 6 },
          { kind: 'money', delta: -400 },
        ],
      },
      { text: 'Дослушать и забыть', effects: [{ kind: 'mood', delta: 2 }] },
    ],
  }),

  defineEvent({
    id: 'rnd_landlord_raise',
    kind: 'random',
    weight: 7,
    trigger: { day: { gte: 25 } },
    title: 'Хозяйка квартиры',
    text: '«Все подняли, и я подниму. С месяца плюс три тысячи».',
    choices: [
      {
        text: 'Согласиться',
        effects: [
          { kind: 'money', delta: -3000 },
          { kind: 'mood', delta: -4 },
        ],
      },
      {
        text: 'Поторговаться',
        effects: [{ kind: 'mood', delta: -2 }],
        risk: {
          chance: 0.45,
          text: 'Сошлись на полутора тысячах',
          effects: [{ kind: 'money', delta: -1500 }],
        },
      },
    ],
  }),

  defineEvent({
    id: 'rnd_metro_busker',
    kind: 'random',
    weight: 9,
    trigger: { fame: { lt: 80 } },
    title: 'Тот самый парень из перехода',
    text: 'Поёт хуже тебя, а слушателей вдвое больше. Между песнями он разговаривает с людьми.',
    choices: [
      {
        text: 'Поговорить с ним о зале',
        effects: [
          { kind: 'skill', key: 'stage', delta: 3 },
          { kind: 'mood', delta: 3 },
        ],
      },
      {
        text: 'Уйти и заниматься техникой',
        effects: [{ kind: 'skill', key: 'pitch', delta: 2 }],
      },
    ],
  }),

  defineEvent({
    id: 'rnd_lost_voice_fear',
    kind: 'random',
    weight: 11,
    trigger: { injured: true },
    title: 'А если навсегда',
    text: 'Пятый день молчания. В голове крутится мысль, что голос может не вернуться таким же.',
    choices: [
      {
        text: 'Записаться к врачу и не думать',
        requires: { money: { gte: 4500 } },
        effects: [
          { kind: 'money', delta: -4500 },
          { kind: 'mood', delta: 8 },
        ],
      },
      {
        text: 'Читать форумы до трёх ночи',
        effects: [
          { kind: 'mood', delta: -10 },
          { kind: 'energy', delta: -15 },
        ],
      },
    ],
  }),
];
