import type { GameEventDef } from '@core/types';
import { defineEvent } from '../define';

/** Второй акт: от первого блогера до платного концерта в клубе. */
export const STORY_ACT_2: readonly GameEventDef[] = [
  defineEvent({
    id: 'story_blogger',
    kind: 'story',
    trigger: { fans: { gte: 60 }, day: { gte: 16 } },
    title: 'Даша Лайв пишет в личку',
    text:
      'Музыкальный блогер, двадцать тысяч подписчиков, снимает рубрику про ' +
      'уличных музыкантов. Хочет снять тебя. Бесплатно, но с условием: ' +
      'снимаем как есть, без второго дубля.',
    choices: [
      {
        text: 'Соглашаться, конечно',
        effects: [
          { kind: 'relation', npc: 'blogger', delta: 20 },
          { kind: 'fans', delta: 40 },
          { kind: 'fame', delta: 8 },
        ],
        risk: {
          chance: 0.3,
          text: 'В кадр попал момент, где ты киксанул на верхней ноте',
          effects: [
            { kind: 'fans', delta: 15 },
            { kind: 'fame', delta: 4 },
            { kind: 'mood', delta: -8 },
            { kind: 'relation', npc: 'blogger', delta: 10 },
          ],
        },
      },
      {
        text: 'Попросить снять позже, когда буду готов',
        effects: [
          { kind: 'relation', npc: 'blogger', delta: 4 },
          { kind: 'mood', delta: -2 },
        ],
      },
    ],
  }),

  defineEvent({
    id: 'story_promoter_bar',
    kind: 'story',
    trigger: { fame: { gte: 55 }, day: { gte: 20 } },
    title: 'Открытый микрофон в «Vertigo»',
    text:
      'Рустам держит вечера открытого микрофона в баре при клубе. ' +
      '«Три песни, гонорар символический, зал пьяный и честный. Понравишься им — ' +
      'я тебя запомню. Не понравишься — тоже запомню».',
    choices: [
      {
        text: 'Записаться на ближайший вечер',
        effects: [
          { kind: 'tier', tier: 'bar' },
          { kind: 'relation', npc: 'promoter', delta: 15 },
        ],
      },
      {
        text: 'Взять неделю на подготовку',
        effects: [
          { kind: 'tier', tier: 'bar' },
          { kind: 'relation', npc: 'promoter', delta: 5 },
          { kind: 'skill', key: 'stage', delta: 3 },
        ],
      },
    ],
  }),

  defineEvent({
    id: 'story_bar_night',
    kind: 'story',
    trigger: { tier: 'bar', performances: { gte: 3 }, day: { gte: 24 } },
    title: 'После открытого микрофона',
    text:
      'Зал не замолчал, но и не заглушил. Кто-то у стойки подпевал припев, ' +
      'хотя слышал песню впервые. Рустам курил на улице и, когда ты выходил, ' +
      'сказал: «Ещё сыровато. Но приходи ещё».',
    choices: [
      {
        text: 'Спросить прямо, что именно сыро',
        effects: [
          { kind: 'relation', npc: 'promoter', delta: 12 },
          { kind: 'skill', key: 'stage', delta: 2 },
          { kind: 'skill', key: 'registers', delta: 2 },
        ],
      },
      {
        text: 'Кивнуть и уйти думать самому',
        effects: [
          { kind: 'mood', delta: -3 },
          { kind: 'skill', key: 'breathSupport', delta: 2 },
        ],
      },
    ],
  }),

  defineEvent({
    id: 'story_single',
    kind: 'story',
    trigger: { fame: { gte: 80 }, day: { gte: 28 } },
    title: 'Костя зовёт в студию',
    text:
      'Звукорежиссёр с «Vertigo» держит подвальную студию на два помещения. ' +
      '«Один сингл. Сведу нормально, за полцены. Только приходи со здоровым ' +
      'горлом, я не волшебник, я звукач».',
    choices: [
      {
        text: 'Записываться',
        effects: [
          { kind: 'relation', npc: 'engineer', delta: 18 },
          { kind: 'flag', key: 'studioAccess', value: 1 },
        ],
      },
      {
        text: 'Отложить, пока голос не окрепнет',
        requires: { vocalHealth: { lt: 60 } },
        effects: [
          { kind: 'relation', npc: 'engineer', delta: 6 },
          { kind: 'flag', key: 'studioAccess', value: 1 },
          { kind: 'vocalHealth', delta: 6 },
        ],
      },
    ],
  }),

  defineEvent({
    id: 'story_club_invite',
    kind: 'story',
    trigger: { fame: { gte: 140 }, day: { gte: 34 } },
    title: 'Разогрев на главной сцене',
    text:
      'Рустам звонит сам. Разогрев в субботу, главная сцена «Vertigo», ' +
      'настоящий гонорар и настоящий зал, который пришёл за музыкой. ' +
      '«Сорок минут. Если сдуешься на середине — второго раза не будет».',
    choices: [
      {
        text: 'Брать',
        effects: [
          { kind: 'relation', npc: 'promoter', delta: 15 },
          { kind: 'flag', key: 'clubBooked', value: 1 },
          { kind: 'mood', delta: 10 },
        ],
      },
      {
        text: 'Брать и неделю не открывать рот',
        effects: [
          { kind: 'relation', npc: 'promoter', delta: 10 },
          { kind: 'flag', key: 'clubBooked', value: 1 },
          { kind: 'vocalHealth', delta: 15 },
          { kind: 'mood', delta: 4 },
        ],
      },
    ],
  }),

  defineEvent({
    id: 'story_club_night',
    kind: 'story',
    trigger: { tier: 'club' },
    title: 'Первый платный концерт в клубе',
    text:
      'Гримёрка размером с ванную, но она твоя. За стеной гудит зал, который ' +
      'купил билеты. Полтора года назад ты пел в переходе, и мимо шли люди. ' +
      'Сегодня они стоят лицом к сцене.',
    choices: [
      {
        text: 'Выйти и спеть',
        effects: [
          { kind: 'mood', delta: 20 },
          { kind: 'fame', delta: 15 },
          { kind: 'reputation', delta: 6 },
          { kind: 'flag', key: 'sliceComplete', value: 1 },
        ],
      },
    ],
  }),
];
