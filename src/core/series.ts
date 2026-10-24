import { isCorrect, type QuizQuestion, type QuizSession } from './quiz';

/** Une question ratée revient après ce nombre d'autres questions. */
const RETRY_GAP = 3;

export interface Attempt<Q> {
  question: Q;
  correct: boolean;
  elapsedMs: number;
}

export interface SeriesOptions<Q> {
  /** Appelé au premier essai de chaque question (ex. ranger dans les boîtes). */
  onFirstAttempt?: (attempt: Attempt<Q>) => void;
  /** Une question ratée revient plus tard (par défaut). Pas en défi : la pénalité suffit. */
  retryWrong?: boolean;
}

/**
 * Série de questions où seul le premier essai compte ; une question ratée
 * revient un peu plus tard, jusqu'à être trouvée.
 */
export class Series<Q extends QuizQuestion> implements QuizSession<Q> {
  readonly total: number;
  private readonly queue: Q[];
  private readonly firstAttempts = new Map<Q, Attempt<Q>>();
  private readonly onFirstAttempt?: (attempt: Attempt<Q>) => void;
  private readonly retryWrong: boolean;

  constructor(questions: readonly Q[], { onFirstAttempt, retryWrong = true }: SeriesOptions<Q> = {}) {
    this.queue = [...questions];
    this.total = this.queue.length;
    this.onFirstAttempt = onFirstAttempt;
    this.retryWrong = retryWrong;
  }

  get attempted(): number {
    return this.firstAttempts.size;
  }

  current(): Q | undefined {
    return this.queue[0];
  }

  /** `value` : ce qui a été tapé (un nombre est accepté pour les tests). */
  answer(value: string | number, elapsedMs: number): boolean {
    const question = this.queue.shift();
    if (!question) throw new Error('La série est finie');
    const correct = isCorrect(question, String(value));
    if (!this.firstAttempts.has(question)) {
      const attempt = { question, correct, elapsedMs };
      this.firstAttempts.set(question, attempt);
      this.onFirstAttempt?.(attempt);
    }
    if (!correct && this.retryWrong) this.queue.splice(RETRY_GAP, 0, question);
    return correct;
  }

  /** Premiers essais, dans l'ordre où ils ont eu lieu. */
  attempts(): Attempt<Q>[] {
    return [...this.firstAttempts.values()];
  }
}
