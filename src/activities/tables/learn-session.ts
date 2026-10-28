import { shuffle } from '../../core/quiz';
import { Series, type Attempt } from '../../core/series';
import { MULTIPLICATION, tableQuestions, type Calculation, type Operation } from './questions';

export type Stars = 0 | 1 | 2 | 3;

export interface LearnResult {
  stars: Stars;
  correct: number;
  total: number;
  /** Ratées ou trop lentes au premier essai. */
  toPractice: Calculation[];
}

export interface LearnOptions {
  op?: Operation;
  random?: () => number;
  onFirstAttempt?: (attempt: Attempt<Calculation>) => void;
}

/** Mode « Apprendre » : les 10 calculs d'une table, dans le désordre. */
export class LearnSession extends Series<Calculation> {
  private readonly fastMs: number;

  constructor(
    readonly table: number,
    { op = MULTIPLICATION, random = Math.random, onFirstAttempt }: LearnOptions = {},
  ) {
    super(shuffle(tableQuestions(op, table), random), { onFirstAttempt });
    this.fastMs = op.fastMs;
  }

  result(): LearnResult {
    const attempts = this.attempts();
    const correct = attempts.filter((a) => a.correct).length;
    const allFast = attempts.every((a) => a.correct && a.elapsedMs < this.fastMs);
    return {
      stars: starsFor(correct, this.total, allFast),
      correct,
      total: this.total,
      toPractice: attempts
        .filter((a) => !a.correct || a.elapsedMs >= this.fastMs)
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
