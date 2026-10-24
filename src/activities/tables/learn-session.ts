import { shuffle, type QuizSession } from '../../core/quiz';
import { FAST_MS, tableQuestions, type Multiplication } from './questions';

export type Stars = 0 | 1 | 2 | 3;

/** Une question ratée revient après ce nombre d'autres questions. */
const RETRY_GAP = 3;

interface FirstAttempt {
  question: Multiplication;
  correct: boolean;
  elapsedMs: number;
}

export interface LearnResult {
  stars: Stars;
  correct: number;
  total: number;
  /** Ratées ou trop lentes au premier essai. */
  toPractice: Multiplication[];
}

/**
 * Mode « Apprendre » : les 10 multiplications d'une table, dans le désordre.
 * Seul le premier essai compte pour les étoiles ; une question ratée revient
 * un peu plus tard dans la série, jusqu'à être trouvée.
 */
export class LearnSession implements QuizSession<Multiplication> {
  readonly total: number;
  private readonly queue: Multiplication[];
  private readonly firstAttempts = new Map<Multiplication, FirstAttempt>();

  constructor(
    readonly table: number,
    random: () => number = Math.random,
  ) {
    this.queue = shuffle(tableQuestions(table), random);
    this.total = this.queue.length;
  }

  get attempted(): number {
    return this.firstAttempts.size;
  }

  current(): Multiplication | undefined {
    return this.queue[0];
  }

  answer(value: number, elapsedMs: number): boolean {
    const question = this.queue.shift();
    if (!question) throw new Error('La série est finie');
    const correct = value === question.answer;
    if (!this.firstAttempts.has(question)) {
      this.firstAttempts.set(question, { question, correct, elapsedMs });
    }
    if (!correct) this.queue.splice(RETRY_GAP, 0, question);
    return correct;
  }

  result(): LearnResult {
    const attempts = [...this.firstAttempts.values()];
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
