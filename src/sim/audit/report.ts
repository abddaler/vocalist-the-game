import type { Finding } from './rules';

/**
 * Отчёт разбора. Находка называет место, величину и норму: «многовато»
 * нельзя ни подтвердить, ни оспорить, а «0.71 при норме до 0.6» можно.
 */
const COLUMNS = ['локация', 'правило', 'объект', 'значение', 'норма', 'критичность'] as const;

const cell = (finding: Finding): readonly string[] => [
  finding.location,
  finding.rule,
  finding.subject,
  finding.value,
  finding.norm,
  finding.blocker ? 'блокер' : 'мелочь',
];

export function table(findings: readonly Finding[]): string {
  if (findings.length === 0) return 'Чисто: ни одной находки.';

  // Блокеры вперёд: с ними локация не принимается, и читать отчёт с
  // конца никто не станет.
  const rows = [...findings]
    .sort((a, b) => Number(b.blocker) - Number(a.blocker) || a.location.localeCompare(b.location))
    .map(cell);

  const width = COLUMNS.map((name, i) =>
    Math.max(name.length, ...rows.map((row) => (row[i] ?? '').length)),
  );
  const line = (row: readonly string[]): string =>
    row.map((value, i) => value.padEnd(width[i] ?? 0)).join('  ').trimEnd();

  return [line(COLUMNS), line(width.map((w) => '-'.repeat(w))), ...rows.map(line)].join('\n');
}

/** Сводка по правилам: где чинить в первую очередь. */
export function summary(findings: readonly Finding[]): string {
  const byRule = new Map<string, { all: number; blockers: number }>();
  for (const finding of findings) {
    const seen = byRule.get(finding.rule) ?? { all: 0, blockers: 0 };
    seen.all += 1;
    if (finding.blocker) seen.blockers += 1;
    byRule.set(finding.rule, seen);
  }
  const lines = [...byRule.entries()]
    .sort((a, b) => b[1].blockers - a[1].blockers || b[1].all - a[1].all)
    .map(([rule, seen]) => `  ${rule}: ${seen.all}${seen.blockers ? ` (блокеров ${seen.blockers})` : ''}`);
  return lines.join('\n');
}
