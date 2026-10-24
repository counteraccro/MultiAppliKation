import { shuffle } from '../../core/quiz';
import { Series, type Attempt } from '../../core/series';
import { FAST_MS, tableQuestions, type Multiplication } from './questions';

export type Stars = 0 | 1 | 2 | 3;

export interface LearnResult {
  stars: Stars;
  correct: number;
  total: number;
  /** Ratées ou trop lentes au premier essai. */
  toPractice: Multiplication[];
}

export interface LearnOptions {
  random?: () => number;
  onFirstAttempt?: (attempt: Attempt<Multiplication>) => void;
}

/** Mode « Apprendre » : les 10 multiplications d'une table, dans le désordre. */
export class LearnSession extends Series<Multiplication> {
  constructor(
    readonly table: number,
    { random = Math.random, onFirstAttempt }: LearnOptions = {},
  ) {
    super(shuffle(tableQuestions(table), random), onFirstAttempt);
  }

  result(): LearnResult {
    const attempts = this.attempts();
    const correct = attempts.filter((a) => a.correct).length;
    const allFast = attempts.every((a) => a.correct && a.elapsedMs < FAST_MS);
    return {
      stars: starsFor(correct, this.total, allFast),
      correct,
      total: this.total,
      toPractice: attempts
        .filter((a) => !a.correct || a.elapsedMs >= FAST_MS)
        .map((a) => a.question)
        .sort((x, y) => x.b - y.b),
    };
  }
}

// ★ : au moins 8 justes ; ★★ : tout juste ; ★★★ : tout juste et rapide.
export function starsFor(correct: number, total: number, allFast: boolean): Stars {
  if (correct === total) return allFast ? 3 : 2;
  if (correct >= total - 2) return 1;
  return 0;
}
