import { shuffle } from '../../core/quiz';
import { Series, type Attempt } from '../../core/series';
import { conjugationQuestion, type ConjugationQuestion } from './questions';
import { MIX_SIZE } from './sizes';
import { CONJUGATIONS, PERSONS, TENSES, VERBS, type TenseId } from './verbs';

export { MIX_SIZE } from './sizes';

/** Ce qu'elle a coché : des temps et des verbes (identifiants). */
export interface MixChoice {
  tenses: TenseId[];
  verbs: string[];
}

/** Ne garde que ce qui existe encore, dans l'ordre de l'accueil. */
export function cleanMixChoice(choice: Partial<MixChoice> | undefined): MixChoice {
  const tenses = new Set(choice?.tenses ?? []);
  const verbs = new Set(choice?.verbs ?? []);
  return {
    tenses: TENSES.filter((t) => tenses.has(t.id)).map((t) => t.id),
    verbs: VERBS.filter((v) => verbs.has(v.id)).map((v) => v.id),
  };
}

/** Les verbe-temps cochés. */
export function mixConjugations({ tenses, verbs }: MixChoice) {
  return CONJUGATIONS.filter((c) => tenses.includes(c.tense.id) && verbs.includes(c.verb.id));
}

/** Nombre de questions : 6 par verbe-temps coché, 15 au plus. */
export function mixSize(choice: MixChoice): number {
  return Math.min(MIX_SIZE, 6 * mixConjugations(choice).length);
}

export interface MixResult {
  correct: number;
  total: number;
  toPractice: ConjugationQuestion[];
}

export interface MixOptions {
  random?: () => number;
  onFirstAttempt?: (attempt: Attempt<ConjugationQuestion>) => void;
}

/** Mode « Mélange » : des formes tirées des temps et verbes cochés ; une erreur revient plus tard. */
export class MixSession extends Series<ConjugationQuestion> {
  constructor(
    readonly choice: MixChoice,
    { random = Math.random, onFirstAttempt }: MixOptions = {},
  ) {
    const forms = mixConjugations(choice).flatMap((c) => PERSONS.map((p) => ({ c, p })));
    super(
      shuffle(forms, random)
        .slice(0, MIX_SIZE)
        .map(({ c, p }) => conjugationQuestion(c, p, random)),
      { onFirstAttempt },
    );
  }

  result(): MixResult {
    const attempts = this.attempts();
    return {
      correct: attempts.filter((a) => a.correct).length,
      total: this.total,
      toPractice: attempts.filter((a) => !a.correct).map((a) => a.question),
    };
  }
}
