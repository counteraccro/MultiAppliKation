import { shuffle } from '../../core/quiz';
import { Series, type Attempt } from '../../core/series';
import { conjugationQuestion, type ConjugationQuestion } from './questions';
import { PERSONS, type Conjugation } from './verbs';

export type Stars = 0 | 1 | 2 | 3;

/** Rapide : environ 3 s pour lire, plus 0,5 s par lettre à taper (à régler en la regardant jouer). */
export function fastMs(answer: string): number {
  return 3000 + 500 * answer.replace(/ /g, '').length;
}

export const isFast = ({ question, elapsedMs }: Attempt<ConjugationQuestion>) => elapsedMs < fastMs(question.answer);

export interface LearnResult {
  stars: Stars;
  correct: number;
  total: number;
  /** Ratées ou trop lentes au premier essai, dans l'ordre des personnes. */
  toPractice: ConjugationQuestion[];
}

export interface LearnOptions {
  random?: () => number;
  onFirstAttempt?: (attempt: Attempt<ConjugationQuestion>) => void;
}

/** Mode « Apprendre » : les 6 personnes d'un verbe à un temps, dans le désordre. */
export class LearnSession extends Series<ConjugationQuestion> {
  constructor(
    readonly conjugation: Conjugation,
    { random = Math.random, onFirstAttempt }: LearnOptions = {},
  ) {
    super(
      shuffle(PERSONS, random).map((p) => conjugationQuestion(conjugation, p, random)),
      { onFirstAttempt },
    );
  }

  result(): LearnResult {
    const attempts = this.attempts();
    const correct = attempts.filter((a) => a.correct).length;
    const allFast = attempts.every((a) => a.correct && isFast(a));
    return {
      stars: starsFor(correct, this.total, allFast),
      correct,
      total: this.total,
      toPractice: attempts
        .filter((a) => !a.correct || !isFast(a))
        .map((a) => a.question)
        .sort((x, y) => x.person - y.person),
    };
  }
}

// ★ : au moins 5 justes sur 6 ; ★★ : tout juste ; ★★★ : tout juste et rapide.
export function starsFor(correct: number, total: number, allFast: boolean): Stars {
  if (correct === total) return allFast ? 3 : 2;
  if (correct >= total - 1) return 1;
  return 0;
}
