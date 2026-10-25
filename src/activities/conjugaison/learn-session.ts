import { shuffle } from '../../core/quiz';
import { Series, type Attempt } from '../../core/series';
import { conjugationQuestion, type ConjugationQuestion } from './questions';
import { PERSONS, type Conjugation } from './verbs';

export type Stars = 0 | 1 | 2 | 3;

export interface LearnResult {
  stars: Stars;
  correct: number;
  total: number;
  /** Ratées au premier essai, dans l'ordre des personnes. */
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
    return {
      stars: starsFor(correct, this.total),
      correct,
      total: this.total,
      toPractice: attempts
        .filter((a) => !a.correct)
        .map((a) => a.question)
        .sort((x, y) => x.person - y.person),
    };
  }
}

// En conjugaison, seul le résultat compte, pas la vitesse :
// ★ : 4 justes sur 6 au premier essai ; ★★ : 5 sur 6 ; ★★★ : tout juste.
export function starsFor(correct: number, total: number): Stars {
  const missed = total - correct;
  if (missed === 0) return 3;
  if (missed === 1) return 2;
  if (missed === 2) return 1;
  return 0;
}
