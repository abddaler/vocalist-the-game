import { z } from 'zod';
import type { Effect, EventChoice, EventCondition, GameEventDef } from '@core/types';

/**
 * Событие описывается одним объектом вместе с текстом: держать прозу
 * отдельно от условий — верный способ рассинхронизировать их.
 * defineEvent разбирает его на определение (ядру) и строки (словарю),
 * так что рендер всё равно идёт через t() (9.6).
 */
export interface ChoiceInput {
  readonly text: string;
  readonly requires?: EventCondition;
  readonly effects: readonly Effect[];
  /** Риск: с вероятностью chance вместо обычного исхода прилетает это. */
  readonly risk?: { readonly chance: number; readonly text: string; readonly effects: readonly Effect[] };
}

export interface EventInput {
  readonly id: string;
  readonly kind: 'story' | 'random';
  readonly trigger: EventCondition;
  readonly weight?: number;
  readonly title: string;
  readonly text: string;
  readonly choices: readonly ChoiceInput[];
}

const TEXTS: Record<string, string> = {};

/** Строки всех объявленных событий — их подхватывает data/text. */
export const EVENT_TEXTS: Readonly<Record<string, string>> = TEXTS;

const inputSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/, 'id: только строчные буквы, цифры и подчёркивание'),
  kind: z.enum(['story', 'random']),
  weight: z.number().positive().optional(),
  title: z.string().min(1),
  text: z.string().min(1),
  choices: z
    .array(
      z.object({
        text: z.string().min(1),
        risk: z.object({ chance: z.number().gt(0).lte(1) }).loose().optional(),
      }).loose(),
    )
    .min(1, 'у события должен быть хотя бы один выбор'),
});

const seen = new Set<string>();

export function defineEvent(input: EventInput): GameEventDef {
  const check = inputSchema.safeParse(input);
  if (!check.success) {
    throw new Error(`data/events: событие "${input.id}" некорректно:\n${z.prettifyError(check.error)}`);
  }
  if (seen.has(input.id)) throw new Error(`data/events: дубль id "${input.id}"`);
  seen.add(input.id);

  const titleKey = `event.${input.id}.title`;
  const textKey = `event.${input.id}.text`;
  TEXTS[titleKey] = input.title;
  TEXTS[textKey] = input.text;

  const choices: EventChoice[] = input.choices.map((choice, index) => {
    const choiceKey = `event.${input.id}.choice.${index}`;
    TEXTS[choiceKey] = choice.text;

    const base: EventChoice = {
      textKey: choiceKey,
      effects: choice.effects,
      requires: choice.requires,
      risk: undefined,
    };
    if (!choice.risk) return base;

    const riskKey = `event.${input.id}.risk.${index}`;
    TEXTS[riskKey] = choice.risk.text;
    return {
      ...base,
      risk: { chance: choice.risk.chance, effects: choice.risk.effects, textKey: riskKey },
    };
  });

  return {
    id: input.id,
    kind: input.kind,
    trigger: input.trigger,
    weight: input.weight ?? 10,
    titleKey,
    textKey,
    choices,
  };
}
