import type { GameEventDef } from '@core/types';
import { defineEvent } from '../define';

/** Случайные события про сцену, заказы и то, как тебя слышат. */
export const RANDOM_STAGE: readonly GameEventDef[] = [
  defineEvent({
    id: 'rnd_wedding_offer',
    kind: 'random',
    weight: 12,
    trigger: { fame: { gte: 20 } },
    title: 'Свадьба у дальних знакомых',
    text: 'Четыре часа, чужой репертуар, гости с заказами. Платят вперёд и хорошо.',
    choices: [
      {
        text: 'Взять заказ',
        effects: [
          { kind: 'money', delta: 9000 },
          { kind: 'vocalHealth', delta: -20 },
          { kind: 'energy', delta: -35 },
          { kind: 'mood', delta: -6 },
        ],
      },
      {
        text: 'Отказаться',
        effects: [{ kind: 'mood', delta: 3 }],
      },
    ],
  }),

  defineEvent({
    id: 'rnd_bad_review',
    kind: 'random',
    weight: 10,
    trigger: { performances: { gte: 3 } },
    title: 'Комментарий под записью',
    text: '«Технически мимо, эмоционально пусто». Двадцать три лайка под комментарием.',
    choices: [
      {
        text: 'Разобрать, что именно мимо',
        effects: [
          { kind: 'skill', key: 'registers', delta: 2 },
          { kind: 'mood', delta: -5 },
        ],
      },
      {
        text: 'Закрыть вкладку',
        effects: [{ kind: 'mood', delta: -2 }],
      },
    ],
  }),

  defineEvent({
    id: 'rnd_open_mic_invite',
    kind: 'random',
    weight: 9,
    trigger: { fame: { gte: 15 }, tier: 'restaurant' },
    title: 'Кто-то зовёт на квартирник',
    text: 'Тридцать человек, гитара, никакого микрофона. Денег не будет.',
    choices: [
      {
        text: 'Спеть для своих',
        effects: [
          { kind: 'fans', delta: 25 },
          { kind: 'mood', delta: 10 },
          { kind: 'vocalHealth', delta: -8 },
          { kind: 'skill', key: 'stage', delta: 2 },
        ],
      },
      {
        text: 'Отказаться: бесплатно не пою',
        effects: [
          { kind: 'mood', delta: -3 },
          { kind: 'reputation', delta: -1 },
        ],
      },
    ],
  }),

  defineEvent({
    id: 'rnd_mic_failure',
    kind: 'random',
    weight: 8,
    trigger: { performances: { gte: 2 } },
    title: 'Микрофон отключился',
    text: 'На втором припеве звук пропал. Зал смотрит.',
    choices: [
      {
        text: 'Допеть без микрофона',
        effects: [
          { kind: 'skill', key: 'breathSupport', delta: 2 },
          { kind: 'vocalHealth', delta: -10 },
          { kind: 'reputation', delta: 3 },
          { kind: 'fans', delta: 15 },
        ],
      },
      {
        text: 'Ждать, пока починят',
        effects: [
          { kind: 'mood', delta: -5 },
          { kind: 'reputation', delta: -1 },
        ],
      },
    ],
  }),

  defineEvent({
    id: 'rnd_stylist_advice',
    kind: 'random',
    weight: 7,
    trigger: { fame: { gte: 40 } },
    title: 'Замечание про внешний вид',
    text: '«Голос-то есть. А выглядишь ты так, будто зашёл спросить дорогу».',
    choices: [
      {
        text: 'Принять к сведению',
        effects: [
          { kind: 'mood', delta: -4 },
          { kind: 'flag', key: 'imageAdvice', value: 1 },
        ],
      },
      {
        text: 'Ответить, что слушают ушами',
        effects: [{ kind: 'mood', delta: 2 }],
      },
    ],
  }),

  defineEvent({
    id: 'rnd_band_offer',
    kind: 'random',
    weight: 8,
    trigger: { fame: { gte: 45 }, genres: ['rock', 'metal'] },
    title: 'Зовут в группу',
    text: 'Репбаза, три человека, репертуар наполовину свой. Ищут голос.',
    choices: [
      {
        text: 'Попробовать спеться',
        effects: [
          { kind: 'skill', key: 'stage', delta: 3 },
          { kind: 'skill', key: 'stamina', delta: 2 },
          { kind: 'mood', delta: 8 },
          { kind: 'flag', key: 'bandAccess', value: 1 },
        ],
      },
      {
        text: 'Остаться сольным',
        effects: [{ kind: 'skill', key: 'breathSupport', delta: 2 }],
      },
    ],
  }),

  defineEvent({
    id: 'rnd_rival_falls',
    kind: 'random',
    weight: 6,
    trigger: { fame: { gte: 70 }, relation: { rival: { gte: 20 } } },
    title: 'У Гриня сорвался голос',
    text: 'Пишет ночью: отменил три даты, врач говорит про узелки. Просит не рассказывать.',
    choices: [
      {
        text: 'Молчать и поддержать',
        effects: [
          { kind: 'relation', npc: 'rival', delta: 20 },
          { kind: 'reputation', delta: 3 },
        ],
      },
      {
        text: 'Забрать его даты',
        effects: [
          { kind: 'fame', delta: 10 },
          { kind: 'money', delta: 5000 },
          { kind: 'relation', npc: 'rival', delta: -30 },
          { kind: 'reputation', delta: -5 },
        ],
      },
    ],
  }),
];
