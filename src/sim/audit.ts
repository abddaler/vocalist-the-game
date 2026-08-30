import { RULES, unusedKinds } from './audit/rules';
import type { Finding } from './audit/rules';
import { table, summary } from './audit/report';
import { locations } from './audit/scenes';

/**
 * Разбор локаций без графики: `npm run audit:locations`.
 *
 * Всё, что можно посчитать машиной, машиной и считается. Глаза дороги, и
 * тратить их на подсчёт одинаковых стульев нельзя — им остаётся то, что
 * машине недоступно: понятен ли предмет, есть ли у сцены смысловой
 * центр, читается ли место с первого взгляда.
 *
 * Код возврата ненулевой при блокерах: разбор годится для pre-commit.
 *
 * Чего разбор НЕ покрывает и почему — чтобы отчёт не обещал больше, чем
 * проверяет:
 *
 *   — оправданность предмета (Б.4). Требует пометки «декор» или
 *     «композиция» у каждого предмета, а в данных её нет. Ставить
 *     пометки задним числом по догадке — значит узаконить нынешнюю
 *     расстановку, а не проверить её;
 *   — масштаб против таблицы Б.3. Наши предметы рисуются процедурно, и
 *     высоты в пикселях у них нет в данных: её надо мерить с готового
 *     кадра, то есть на этапе съёмки, а не здесь;
 *   — неиспользуемые кадры атласа. Атласа именованных спрайтов у нас
 *     нет; ближайшее осмысленное — виды предметов, которые нигде не
 *     стоят, и это здесь проверяется.
 */
function main(): void {
  const places = locations();
  const findings: Finding[] = [];
  for (const place of places) for (const rule of RULES) findings.push(...rule(place));
  findings.push(...unusedKinds(places));

  process.stdout.write(`Локаций: ${places.length}\n\n`);
  process.stdout.write(`${table(findings)}\n`);

  const blockers = findings.filter((finding) => finding.blocker);
  process.stdout.write(`\nПо правилам:\n${summary(findings)}\n`);
  process.stdout.write(`\nВсего находок: ${findings.length}, блокеров: ${blockers.length}\n`);
  process.exitCode = blockers.length > 0 ? 1 : 0;
}

main();
