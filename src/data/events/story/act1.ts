import type { GameEventDef } from '@core/types';
import { defineEvent } from '../define';

/**
 * Первый акт: от решения начать до появления конкурента.
 * Порядок объявления и есть порядок показа (9.4).
 */
export const STORY_ACT_1: readonly GameEventDef[] = [
  defineEvent({
    id: 'story_start',
    kind: 'story',
    trigger: { day: { lt: 2 } },
    title: 'С чего-то надо начинать',
    text:
      'Съёмная однушка, чайник и полтора года ютубовских уроков за плечами. ' +
      'Голос есть — что с ним делать, непонятно. В переходе у метро вечерами ' +
      'поёт парень с гитарой, и людей вокруг него больше, чем у тебя подписчиков.',
    choices: [
      {
        text: 'Завтра же встать там самому',
        effects: [
          { kind: 'mood', delta: 6 },
          { kind: 'flag', key: 'decidedToSing', value: 1 },
        ],
      },
      {
        text: 'Сначала разобраться с техникой, потом позориться',
        effects: [
          { kind: 'skill', key: 'breathSupport', delta: 2 },
          { kind: 'mood', delta: -2 },
          { kind: 'flag', key: 'decidedToLearn', value: 1 },
        ],
      },
    ],
  }),

  defineEvent({
    id: 'story_first_gig',
    kind: 'story',
    trigger: { performances: { gte: 1 }, day: { gte: 2 } },
    title: 'Первые деньги за голос',
    text:
      'В чехле лежит несколько купюр и горсть мелочи. Немного, но это первые ' +
      'деньги, которые тебе заплатили именно за то, как ты поёшь. Женщина с ' +
      'сумками остановилась дослушать до конца — и это почему-то важнее денег.',
    choices: [
      {
        text: 'Отложить всё до копейки на уроки',
        effects: [
          { kind: 'flag', key: 'savingForLessons', value: 1 },
          { kind: 'mood', delta: 3 },
        ],
      },
      {
        text: 'Купить нормальный чай и выспаться',
        effects: [
          { kind: 'money', delta: -300 },
          { kind: 'vocalHealth', delta: 8 },
          { kind: 'mood', delta: 5 },
        ],
      },
    ],
  }),

  defineEvent({
    id: 'story_throat_scare',
    kind: 'story',
    trigger: { vocalHealth: { lt: 35 } },
    title: 'Голос сел',
    text:
      'Утром вместо голоса выходит сипение. Горло не болит — оно просто не ' +
      'слушается, как будто связки обмотали ватой. К вечеру назначено петь.',
    choices: [
      {
        text: 'Отменить всё и молчать сутки',
        effects: [
          { kind: 'vocalHealth', delta: 18 },
          { kind: 'reputation', delta: -3 },
          { kind: 'mood', delta: -5 },
        ],
      },
      {
        text: 'Петь через боль — обещал же',
        effects: [
          { kind: 'reputation', delta: 2 },
          { kind: 'vocalHealth', delta: -10 },
        ],
        risk: {
          chance: 0.5,
          text: 'На третьей песне голос сорвался окончательно',
          effects: [
            { kind: 'injury', days: 7 },
            { kind: 'reputation', delta: -6 },
            { kind: 'mood', delta: -10 },
          ],
        },
      },
      {
        text: 'К фониатру, немедленно',
        requires: { money: { gte: 4500 } },
        effects: [
          { kind: 'money', delta: -4500 },
          { kind: 'vocalHealth', delta: 32 },
          { kind: 'flag', key: 'knowsPhoniatrist', value: 1 },
        ],
      },
    ],
  }),

  defineEvent({
    id: 'story_teacher_notice',
    kind: 'story',
    trigger: { skill: { breathSupport: { gte: 20 } }, day: { gte: 8 } },
    title: 'Педагог задерживает после урока',
    text:
      'Ирина закрывает крышку рояля и говорит, не оборачиваясь: «У тебя опора ' +
      'наконец появилась. Не голос — опора. Голос был всегда, он у всех есть. ' +
      'Хочешь, будем заниматься серьёзно? Только уговор: я говорю молчать — ты молчишь».',
    choices: [
      {
        text: 'Согласиться на её условия',
        effects: [
          { kind: 'relation', npc: 'teacher', delta: 25 },
          { kind: 'skill', key: 'breathSupport', delta: 3 },
          { kind: 'flag', key: 'teacherPact', value: 1 },
        ],
      },
      {
        text: 'Заниматься, но петь там, где хочу',
        effects: [
          { kind: 'relation', npc: 'teacher', delta: 8 },
          { kind: 'mood', delta: 4 },
        ],
      },
    ],
  }),

  defineEvent({
    id: 'story_restaurant_offer',
    kind: 'story',
    trigger: { fame: { gte: 12 }, day: { gte: 6 } },
    title: 'Работа в «Сонате»',
    text:
      'Администратор ресторана слышал тебя в переходе. Живой вокал по вечерам, ' +
      'фиксированная ставка, четыре часа под гул зала и звон приборов. ' +
      '«Никто вас слушать не будет, — говорит он честно. — Но платить будем стабильно».',
    choices: [
      {
        text: 'Согласиться: деньги нужны',
        effects: [
          { kind: 'tier', tier: 'restaurant' },
          { kind: 'flag', key: 'restaurantJob', value: 1 },
          { kind: 'mood', delta: -3 },
        ],
      },
      {
        text: 'Отказаться: связки дороже',
        effects: [
          { kind: 'mood', delta: 4 },
          { kind: 'flag', key: 'refusedRestaurant', value: 1 },
        ],
      },
    ],
  }),

  defineEvent({
    id: 'story_rival',
    kind: 'story',
    trigger: { fame: { gte: 30 }, day: { gte: 12 } },
    title: 'Артём Гринь',
    text:
      'Его имя всплывает третий раз за неделю. Тот же район, тот же жанр, ' +
      'на два года раньше начал. В комментариях под твоим видео кто-то пишет: ' +
      '«у Гриня чище». Обидно ровно настолько, насколько это правда.',
    choices: [
      {
        text: 'Написать ему первым, по-человечески',
        effects: [
          { kind: 'relation', npc: 'rival', delta: 12 },
          { kind: 'mood', delta: 3 },
        ],
      },
      {
        text: 'Молча уйти работать',
        effects: [
          { kind: 'skill', key: 'breathSupport', delta: 2 },
          { kind: 'skill', key: 'pitch', delta: 2 },
          { kind: 'mood', delta: -4 },
        ],
      },
    ],
  }),
];
