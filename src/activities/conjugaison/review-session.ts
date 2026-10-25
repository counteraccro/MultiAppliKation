import { boxOf, pickReview, type LeitnerState } from '../../core/leitner';
import { shuffle } from '../../core/quiz';
import { Series, type Attempt } from '../../core/series';
import { isKnownConjugation } from './mastery';
import { conjugationQuestion, type ConjugationQuestion } from './questions';
import { REVIEW_SIZE } from './sizes';
import { CONJUGATIONS, conjugationKey, PERSONS, type Conjugation, type Person } from './verbs';

export { REVIEW_SIZE } from './sizes';
const STALE_SLOTS = 3;
const STALE_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

/** Les 480 clés de boîte : « aller.futur.4 ». */
const FORMS = CONJUGATIONS.flatMap((conjugation) =>
  PERSONS.map((person) => ({ key: `${conjugationKey(conjugation)}.${person}`, conjugation, person })),
);
const FORM_BY_KEY = new Map<string, { conjugation: Conjugation; person: Person }>(FORMS.map((f) => [f.key, f]));

/** Formes déjà vues (rangées dans une boîte) : la révision ne tire que celles-là. */
export function seenForms(state: LeitnerState): string[] {
  return FORMS.filter((f) => state[f.key]).map((f) => f.key);
}

export interface ReviewResult {
  correct: number;
  total: number;
  toPractice: ConjugationQuestion[];
}

export interface ReviewOptions {
  now?: number;
  random?: () => number;
  onFirstAttempt?: (attempt: Attempt<ConjugationQuestion>) => void;
}

/** Révision : ~15 formes déjà vues, tous verbes et temps mêlés, tirées surtout dans les boîtes basses. */
export class ReviewSession extends Series<ConjugationQuestion> {
  constructor(state: LeitnerState, { now = Date.now(), random = Math.random, onFirstAttempt }: ReviewOptions = {}) {
    const keys = pickReview(seenForms(state), state, {
      size: REVIEW_SIZE,
      staleSlots: STALE_SLOTS,
      staleAfterMs: STALE_AFTER_MS,
      now,
      random,
    });
    super(
      shuffle(keys, random).map((key) => {
        const { conjugation, person } = FORM_BY_KEY.get(key)!;
        return conjugationQuestion(conjugation, person, random);
      }),
      { onFirstAttempt },
    );
  }

  result(): ReviewResult {
    const attempts = this.attempts();
    return {
      correct: attempts.filter((a) => a.correct).length,
      total: this.total,
      toPractice: attempts.filter((a) => !a.correct).map((a) => a.question),
    };
  }
}

/** Combien des 80 verbe-temps sont connus : leurs 6 formes en boîte 4 ou plus. */
export function knownCount(state: LeitnerState): number {
  return CONJUGATIONS.filter((c) => isKnownConjugation(state, c)).length;
}

/** Combien de formes sont montées d'une boîte entre deux états. */
export function promotedCount(before: LeitnerState, after: LeitnerState): number {
  return FORMS.filter((f) => boxOf(after, f.key) > boxOf(before, f.key)).length;
}
