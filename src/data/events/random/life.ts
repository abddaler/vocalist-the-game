import type { GameEventDef } from '@core/types';
import { defineEvent } from '../define';

/** Случайные события про голос, здоровье и настроение. */
export const RANDOM_LIFE: readonly GameEventDef[] = [
  defineEvent({
    id: 'rnd_cold_draft',
    kind: 'random',
    weight: 12,
    trigger: { vocalHealth: { gte: 40 } },
    title: 'Сквозняк в маршрутке',
    text: 'Всю дорогу дуло в шею, и к вечеру горло подозрительно сухое.',
    choices: [
      {
        text: 'Шарф, чай, молчать',
        effects: [
          { kind: 'vocalHealth', delta: 4 },
          { kind: 'mood', delta: -2 },
        ],
      },
      {
        text: 'Не обращать внимания',
        effects: [{ kind: 'vocalHealth', delta: -6 }],
        risk: {
          chance: 0.35,
          text: 'К утру голос сел основательно',
          effects: [
            { kind: 'vocalHealth', delta: -18 },
            { kind: 'mood', delta: -4 },
          ],
        },
      },
    ],
  }),

  defineEvent({
    id: 'rnd_neighbour_complaint',
    kind: 'random',
    weight: 10,
    trigger: {},
    title: 'Соседка снизу',
    text: 'Стучит по батарее ровно на середине распевки. Стучит уже третий день.',
    choices: [
      {
        text: 'Извиниться и петь тише',
        effects: [
          { kind: 'mood', delta: -3 },
          { kind: 'skill', key: 'breathSupport', delta: 1 },
        ],
      },
      {
        text: 'Купить ей коробку конфет',
        requires: { money: { gte: 800 } },
        effects: [
          { kind: 'money', delta: -800 },
          { kind: 'mood', delta: 4 },
        ],
      },
    ],
  }),

  defineEvent({
    id: 'rnd_broken_boiler',
    kind: 'random',
    weight: 8,
    trigger: { day: { gte: 8 } },
    title: 'Полетел бойлер',
    text: 'Холодная вода и мастер, который называет сумму, глядя в потолок.',
    choices: [
      {
        text: 'Чинить',
        requires: { money: { gte: 5000 } },
        effects: [{ kind: 'money', delta: -5000 }],
      },
      {
        text: 'Мыться в холодной',
        effects: [
          { kind: 'vocalHealth', delta: -8 },
          { kind: 'mood', delta: -6 },
        ],
      },
    ],
  }),

  defineEvent({
    id: 'rnd_old_friend',
    kind: 'random',
    weight: 10,
    trigger: { mood: { lt: 55 } },
    title: 'Звонит старый друг',
    text: 'Зовёт посидеть, как раньше. Говорит, ты пропал совсем.',
    choices: [
      {
        text: 'Пойти',
        effects: [
          { kind: 'mood', delta: 12 },
          { kind: 'money', delta: -1200 },
          { kind: 'energy', delta: -15 },
        ],
      },
      {
        text: 'Сослаться на занятость',
        effects: [{ kind: 'mood', delta: -4 }],
      },
    ],
  }),

  defineEvent({
    id: 'rnd_burnout',
    kind: 'random',
    weight: 14,
    trigger: { mood: { lt: 25 } },
    title: 'Ничего не хочется',
    text: 'Второе утро подряд ты просто лежишь и смотришь в потолок. Голос есть. Смысла нет.',
    choices: [
      {
        text: 'Заставить себя выйти на улицу',
        effects: [
          { kind: 'mood', delta: 8 },
          { kind: 'energy', delta: -10 },
        ],
      },
      {
        text: 'Отменить всё на сегодня',
        effects: [
          { kind: 'mood', delta: 14 },
          { kind: 'vocalHealth', delta: 10 },
          { kind: 'money', delta: -600 },
        ],
      },
    ],
  }),

  defineEvent({
    id: 'rnd_allergy',
    kind: 'random',
    weight: 7,
    trigger: { day: { gte: 15 } },
    title: 'Тополиный пух',
    text: 'Нос заложен, связки отзываются с задержкой, верхи звучат чужими.',
    choices: [
      {
        text: 'Купить лекарства',
        requires: { money: { gte: 1500 } },
        effects: [
          { kind: 'money', delta: -1500 },
          { kind: 'vocalHealth', delta: 6 },
        ],
      },
      { text: 'Перетерпеть', effects: [{ kind: 'vocalHealth', delta: -10 }] },
    ],
  })
];
