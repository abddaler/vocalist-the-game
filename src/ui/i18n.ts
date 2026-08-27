/**
 * Словарь строк (раздел 9.6). Язык один, но всё идёт через t(),
 * чтобы локализация позже не превращалась в раскопки по сценам.
 *
 * Модуль обязан оставаться чистым: ни Phaser, ни DOM. Его читает и
 * headless-прогон в sim/.
 */
const ru = {
  'app.title': 'Vocalist Sim',
  'app.subtitle': 'вертикальный срез',
  'boot.hint': 'Веха 2: ядро симуляции. Игровые экраны появятся на вехе 4.',

  'slot.morning': 'утро',
  'slot.day': 'день',
  'slot.evening': 'вечер',
  'slot.night': 'ночь',

  'genre.pop': 'Поп',
  'genre.rock': 'Рок',
  'genre.metal': 'Метал',
  'genre.estrada': 'Эстрада',

  'tier.normal': 'норма',
  'tier.fatigue': 'усталость',
  'tier.hoarse': 'осиплость',
  'tier.critical': 'край',

  'activity.sleep': 'Сон',
  'activity.warmup': 'Распевка',
  'activity.vocalRest': 'Режим молчания',
  'activity.teaRegimen': 'Чай и режим',
  'activity.lessonBreath': 'Урок: опора и дыхание',
  'activity.lessonTimbre': 'Урок: тембр и резонанс',
  'activity.lessonPitch': 'Урок: интонация',
  'activity.practiceFree': 'Практика на репбазе',
  'activity.gym': 'Спортзал',
  'activity.restaurantShift': 'Смена в «Сонате»',
  'activity.doctorVisit': 'Приём у фониатра',

  'skill.breathSupport': 'Опора и дыхание',
  'skill.range': 'Диапазон',
  'skill.registers': 'Регистры',
  'skill.timbre': 'Тембр',
  'skill.diction': 'Артикуляция',
  'skill.pitch': 'Интонация',
  'skill.stamina': 'Выносливость',
  'skill.extreme': 'Экстрим-техники',
  'skill.stage': 'Сцена',

  'log.activity.done': '{activity}',
  'log.activity.blocked': '{activity} — недоступно ({reason})',
  'log.skill.up': 'прогресс: {gains}',
  'log.injury.start': 'сорвал связки на «{activity}». Петь нельзя {days} дн.',
  'log.injury.healed': 'фониатр сократил срок травмы: {from} → {to} дн.',
  'log.injury.over': 'связки восстановились, можно петь',
  'log.sleep.missed': 'ночь без сна: энергия {energy}, настроение {mood}, связки {vocalHealth}',
  'log.silence.fullDay': 'сутки молчания: связки +{vocalHealth}',
  'log.week.payday': 'расчёт за неделю: зарплата +{wages}, еда −{food}, в кармане {money}',
  'log.month.bills': 'конец месяца: аренда −{rent}, счета −{bills}, в кармане {money}',
  'log.debt.critical': 'долг перевалил за предел: {money}',
  'log.fans.left': 'фанаты расходятся: −{left}, осталось {fans}',
  'log.genre.switched': 'смена жанра: {from} → {to}, потеряно фанатов: {fansLost}',
  'log.run.over': 'срез окончен: {day} дней позади',

  'reason.runOver': 'прогон окончен',
  'reason.injured': 'травма связок',
  'reason.wrongSlot': 'не в это время суток',
  'reason.noEnergy': 'нет сил',
  'reason.noMoney': 'нет денег',
  'reason.lowSkill': 'не хватает навыка',
  'reason.wrongGenre': 'не для этого жанра',
  'reason.unknown': 'неизвестное действие',
} as const;

export type StringKey = keyof typeof ru;

const dictionary: Record<string, string> = ru;

export type TemplateParams = Readonly<Record<string, string | number>>;

/** Подстановка вида {name}. Неизвестный ключ возвращается как есть — видно сразу. */
export function t(key: StringKey | string, params?: TemplateParams): string {
  const template = dictionary[key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export function has(key: string): boolean {
  return key in dictionary;
}
