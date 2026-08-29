import type { GameEventDef } from '@core/types';
import { defineEvent } from '../define';

/** Случайные события про людей вокруг: педагог, промоутер, блогер, конкурент. */
export const RANDOM_SCENE: readonly GameEventDef[] = [
  defineEvent({
    id: 'rnd_teacher_scolds',
    kind: 'random',
    weight: 12,
    trigger: { vocalHealth: { lt: 55 }, relation: { teacher: { gte: 15 } } },
    title: 'Дайан слышит по телефону',
    text: '«Ты опять пел на связках. Я по одному "алло" слышу. Неделю — молчать».',
    choices: [
      {
        text: 'Послушаться',
        effects: [
          { kind: 'relation', npc: 'teacher', delta: 10 },
          { kind: 'vocalHealth', delta: 14 },
          { kind: 'money', delta: -1500 },
        ],
      },
      {
        text: 'Пообещать и не сделать',
        effects: [{ kind: 'relation', npc: 'teacher', delta: -12 }],
        risk: {
          chance: 0.5,
          text: 'Она узнала. Разговор был короткий',
          effects: [
            { kind: 'relation', npc: 'teacher', delta: -15 },
            { kind: 'mood', delta: -8 },
          ],
        },
      },
    ],
  }),

  defineEvent({
    id: 'rnd_rival_gig',
    kind: 'random',
    weight: 14,
    trigger: { fame: { gte: 35 } },
    title: 'Беллами забрал площадку',
    text: 'Тот вечер, на который ты рассчитывал, отдали Чейзу. Промоутер разводит руками.',
    choices: [
      {
        text: 'Предложить сыграть вдвоём',
        effects: [
          { kind: 'relation', npc: 'rival', delta: 10 },
          { kind: 'relation', npc: 'promoter', delta: 6 },
          { kind: 'fame', delta: 3 },
        ],
      },
      {
        text: 'Молча забрать следующую дату',
        effects: [
          { kind: 'mood', delta: -6 },
          { kind: 'skill', key: 'stage', delta: 2 },
        ],
      },
    ],
  }),

  defineEvent({
    id: 'rnd_promoter_favor',
    kind: 'random',
    weight: 10,
    trigger: { relation: { promoter: { gte: 30 } } },
    title: 'Рустам просит подменить',
    text: 'У кого-то сорвался вечер, нужен человек на сегодня. Платят как обычно.',
    choices: [
      {
        text: 'Выручить',
        effects: [
          { kind: 'relation', npc: 'promoter', delta: 15 },
          { kind: 'money', delta: 2500 },
          { kind: 'vocalHealth', delta: -12 },
          { kind: 'energy', delta: -25 },
        ],
      },
      {
        text: 'Не сегодня, голос не готов',
        effects: [{ kind: 'relation', npc: 'promoter', delta: -5 }],
      },
    ],
  }),

  defineEvent({
    id: 'rnd_blogger_clip',
    kind: 'random',
    weight: 9,
    trigger: { relation: { blogger: { gte: 20 } }, fans: { gte: 40 } },
    title: 'Даша монтирует нарезку',
    text: 'Просит пару фраз на камеру про то, зачем ты вообще этим занимаешься.',
    choices: [
      {
        text: 'Сказать честно',
        effects: [
          { kind: 'fans', delta: 35 },
          { kind: 'relation', npc: 'blogger', delta: 10 },
          { kind: 'mood', delta: 4 },
        ],
      },
      {
        text: 'Отшутиться',
        effects: [
          { kind: 'fans', delta: 12 },
          { kind: 'relation', npc: 'blogger', delta: 3 },
        ],
      },
    ],
  }),

  defineEvent({
    id: 'rnd_engineer_demo',
    kind: 'random',
    weight: 8,
    trigger: { relation: { engineer: { gte: 25 } } },
    title: 'Костя прислал черновое сведение',
    text: 'Слушаешь в наушниках и впервые слышишь свой голос со стороны. Не всё нравится.',
    choices: [
      {
        text: 'Разобрать по косточкам вместе',
        effects: [
          { kind: 'relation', npc: 'engineer', delta: 12 },
          { kind: 'skill', key: 'timbre', delta: 2 },
          { kind: 'skill', key: 'pitch', delta: 2 },
        ],
      },
      {
        text: 'Сказать, что всё отлично',
        effects: [
          { kind: 'relation', npc: 'engineer', delta: 4 },
          { kind: 'mood', delta: -3 },
        ],
      },
    ],
  })
];
