import { GENRES } from '@data/genres';
import { hasActivity, getActivity } from '@data/activities';
import { hasVenue, getVenue } from '@data/venues';
import { healthTier } from '@core/systems/vocal';
import { imageLevel } from '@core/systems/outfit';
import { SKILL_KEYS } from '@core/types';
import type { GameState, GenreId, SkillKey } from '@core/types';
import { formatLogEntry } from '@ui/log';
import { t } from '@ui/i18n';
import { bar, bold, cyan, dim, healthColor, money, pad, rule } from './format';
import { playSlice } from './runner';
import { getStrategy, STRATEGIES } from './strategies';

/**
 * Текстовый прогон 60 дней — деливерабл вехи 2 (раздел 11).
 * Балансный прогон на 1000 партий приедет на вехе 3 (раздел 10).
 *
 *   npm run play:text -- --strategy=gigs --seed=abc --genre=rock
 */

const arg = (name: string, fallback: string): string => {
  const found = process.argv.find((item) => item.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : fallback;
};

const seed = arg('seed', 'vocalist-01');
const genre = arg('genre', 'pop') as GenreId;
const strategy = getStrategy(arg('strategy', 'support'));

/** Заметные события: рутину «сделал действие» в дневник не тащим. */
const NOTABLE = new Set([
  'career.up',
  'event.fired',
  'performance.intercepted',
  'manager.hired',
  'injury.start',
  'injury.healed',
  'injury.over',
  'sleep.missed',
  'silence.fullDay',
  'week.payday',
  'month.bills',
  'debt.critical',
  'fans.left',
  'run.over',
]);

/** Счётчики слотов держат вперемешку действия и площадки. */
function labelOf(id: string): string {
  if (hasActivity(id)) return t(getActivity(id).nameKey);
  if (hasVenue(id)) return t(getVenue(id).nameKey);
  return id;
}

function printDay(state: GameState): void {
  const health = state.resources.vocalHealth;
  const paint = healthColor(health);
  const injured =
    state.vocal.injuryDaysLeft > 0 ? dim(`  травма ${state.vocal.injuryDaysLeft} дн.`) : '';
  console.log(
    pad(String(state.day), 6) +
      pad(`${paint(bar(health, 100))} ${paint(String(Math.round(health)).padStart(3))}`, 17) +
      pad(
        `${bar(state.resources.energy, 100, 6)} ${String(Math.round(state.resources.energy)).padStart(3)}`,
        13,
      ) +
      pad(money(state.resources.money), 13) +
      pad(String(Math.round(state.resources.mood)), 5) +
      injured,
  );
}

function printSummary(state: GameState): void {
  console.log(bold('\nИтог среза'));
  console.log(`  дней прожито      ${state.day - 1}`);
  console.log(`  деньги            ${money(state.resources.money)}`);
  console.log(
    `  связки            ${healthColor(state.resources.vocalHealth)(
      `${Math.round(state.resources.vocalHealth)} — ${t(`tier.${healthTier(state.resources.vocalHealth)}`)}`,
    )}`,
  );
  console.log(`  травм за прогон   ${state.vocal.injuryCount}`);
  console.log(`  бессонных ночей   ${state.stats.missedNights}`);
  console.log(
    `  слава / фанаты    ${Math.round(state.resources.fame)} / ${state.resources.fans}`,
  );
  console.log(`  ступень карьеры   ${t(`tier.${state.career.tier}`)}`);
  console.log(`  выступлений       ${state.career.performances}`);
  console.log(
    `  исходы            ${Object.entries(state.stats.outcomes)
      .map(([outcome, count]) => `${t(`outcome.${outcome}`)} ${count}`)
      .join(', ') || '—'}`,
  );
  console.log(`  имидж             ${imageLevel(state)}`);

  console.log(bold('\nНавыки'));
  for (const key of SKILL_KEYS) {
    const value = state.skills[key as SkillKey];
    console.log(
      `  ${pad(t(`skill.${key}`), 20)}${cyan(bar(value, 100))} ${String(Math.round(value)).padStart(3)}`,
    );
  }

  console.log(bold('\nНа что ушли слоты'));
  for (const [id, count] of Object.entries(state.stats.activityCounts).sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${pad(labelOf(id), 30)}${String(count).padStart(3)}`);
  }

  console.log(dim(`\nдругие стратегии: ${STRATEGIES.map((s) => s.id).join(', ')}\n`));
}

console.log(bold(`\n${t('app.title')} — текстовый прогон`));
console.log(
  dim(`сид ${seed} · жанр ${t(GENRES[genre].nameKey)} · стратегия «${strategy.title}»\n`),
);
console.log(
  dim(pad('день', 6) + pad('связки', 17) + pad('энергия', 13) + pad('деньги', 13) + 'настрой'),
);
console.log(rule());

let reportedDay = 0;
let reportedLogLength = 0;

const end = playSlice({
  seed,
  genre,
  strategy,
  onSlot: (_, after) => {
    if (after.day !== reportedDay) {
      reportedDay = after.day;
      if (!after.over) printDay(after);
    }
    for (const entry of after.log.slice(reportedLogLength)) {
      if (NOTABLE.has(entry.code)) {
        console.log(dim(`      ${t(`slot.${entry.slot}`)}: `) + formatLogEntry(entry));
      }
    }
    reportedLogLength = after.log.length;
  },
});

console.log(rule());
printSummary(end);
