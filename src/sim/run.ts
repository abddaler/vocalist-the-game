import { GENRE_IDS } from '@core/types';
import type { GenreId } from '@core/types';
import { hasActivity, getActivity } from '@data/activities';
import { hasVenue, getVenue } from '@data/venues';
import { t } from '@ui/i18n';
import { bold, cyan, dim, green, money, pad, red, rule, yellow } from './format';
import { dominance, mean, median, sample, share } from './report';
import type { RunSample } from './report';
import { playSlice } from './runner';
import { STRATEGIES } from './strategies';
import type { Strategy } from './strategies';

/**
 * Headless-симулятор баланса (раздел 10).
 *
 *   npm run sim -- --runs=1000 --genre=pop
 *
 * Правило, ради которого он существует: если «берёт все концерты»
 * обыгрывает «сначала опора», неверны цифры, а не стратегия.
 */
const arg = (name: string, fallback: string): string => {
  const found = process.argv.find((item) => item.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : fallback;
};

const runs = Number.parseInt(arg('runs', '1000'), 10);
const genre = arg('genre', 'pop') as GenreId;
if (!GENRE_IDS.includes(genre)) throw new Error(`Неизвестный жанр "${genre}"`);

function labelOf(id: string): string {
  if (hasActivity(id)) return t(getActivity(id).nameKey);
  if (hasVenue(id)) return t(getVenue(id).nameKey);
  return id;
}

interface StrategyReport {
  readonly strategy: Strategy;
  readonly samples: RunSample[];
  readonly deadlocks: number;
}

function runStrategy(strategy: Strategy): StrategyReport {
  const samples: RunSample[] = [];
  let deadlocks = 0;

  for (let i = 0; i < runs; i += 1) {
    try {
      samples.push(sample(playSlice({ seed: `sim-${i}`, genre, strategy })));
    } catch {
      deadlocks += 1;
    }
  }
  return { strategy, samples, deadlocks };
}

const percent = (value: number): string => `${(value * 100).toFixed(1)}%`;

function printStrategy(report: StrategyReport): void {
  const { strategy, samples } = report;
  if (samples.length === 0) {
    console.log(`${bold(strategy.title)} — все ${runs} партий закончились тупиком`);
    return;
  }

  const clubShare = share(samples.map((run) => run.reachedClub));
  const top = dominance(samples);

  console.log(bold(`\n${strategy.title}`) + dim(` (${strategy.id})`));
  console.log(
    `  дошли до клуба      ${paintShare(clubShare)}` +
      dim(`   партий ${samples.length}${report.deadlocks ? `, тупиков ${report.deadlocks}` : ''}`),
  );
  console.log(`  медиана денег       ${money(median(samples.map((r) => r.money)))}`);
  console.log(`  медиана славы       ${Math.round(median(samples.map((r) => r.fame)))}`);
  console.log(`  медиана фанатов     ${Math.round(median(samples.map((r) => r.fans)))}`);
  console.log(
    `  медиана связок      ${Math.round(median(samples.map((r) => r.vocalHealth)))}` +
      dim(`   опора ${Math.round(median(samples.map((r) => r.breathSupport)))}`),
  );
  console.log(
    `  травм за партию     ${mean(samples.map((r) => r.injuries)).toFixed(2)}` +
      dim(`   выступлений ${Math.round(median(samples.map((r) => r.performances)))}`),
  );
  console.log(`  ушли в долг         ${percent(share(samples.map((r) => r.failed)))}`);
  console.log(
    `  доминирует          ${labelOf(top.id)} ${paintDominance(top.share)}` +
      (top.share > 0.4 ? red('  ← одно действие съедает баланс') : ''),
  );
}

function paintShare(value: number): string {
  const text = percent(value);
  if (value >= 0.15 && value <= 0.6) return green(text);
  return value === 0 ? red(text) : yellow(text);
}

function paintDominance(value: number): string {
  const text = percent(value);
  return value > 0.4 ? red(text) : value > 0.3 ? yellow(text) : green(text);
}

console.log(bold(`\nБалансный прогон: ${runs} партий по 60 дней, жанр ${t(`genre.${genre}`)}`));
console.log(rule());

const reports = STRATEGIES.map(runStrategy);
for (const report of reports) printStrategy(report);

console.log(rule());
verdict(reports);

/** Проверка правила из раздела 10. */
function verdict(all: readonly StrategyReport[]): void {
  const support = all.find((r) => r.strategy.id === 'support');
  const gigs = all.find((r) => r.strategy.id === 'gigs');
  if (!support || !gigs || support.samples.length === 0 || gigs.samples.length === 0) return;

  const supportClub = share(support.samples.map((r) => r.reachedClub));
  const gigsClub = share(gigs.samples.map((r) => r.reachedClub));

  console.log(bold('\nПроверка правила раздела 10'));
  console.log(
    `  ${pad('«сначала опора» доходит до клуба', 38)}${paintShare(supportClub)}\n` +
      `  ${pad('«берёт все концерты» доходит до клуба', 38)}${paintShare(gigsClub)}`,
  );
  console.log(
    supportClub > gigsClub
      ? green('  Опора выигрывает — баланс в нужную сторону.')
      : red('  Концерты выигрывают у опоры — цифры неверны, крутить коэффициенты.'),
  );
  console.log(cyan(`\n  всего партий: ${runs * STRATEGIES.length}\n`));
}
