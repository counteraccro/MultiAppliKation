import { shuffle } from '../../core/quiz';
import { Series, type Attempt } from '../../core/series';
import { ALL_PAIRS, questionFromKey, type Multiplication } from './questions';

/** Réglages du défi, à ajuster en la regardant jouer. */
export const DEFI_SIZE = 20;
export const PENALTY_MS = 5000;

export interface DefiResult {
  /** Temps de réflexion cumulé. */
  timeMs: number;
  errors: number;
  /** Temps + pénalités : c'est lui qui fait le record. */
  scoreMs: number;
  total: number;
  toPractice: Multiplication[];
}

export interface DefiOptions {
  random?: () => number;
  onFirstAttempt?: (attempt: Attempt<Multiplication>) => void;
}

/** Défi chronométré : 20 multiplications de toutes les tables ; une erreur coûte 5 s. */
export class DefiSession extends Series<Multiplication> {
  constructor({ random = Math.random, onFirstAttempt }: DefiOptions = {}) {
    const keys = shuffle(ALL_PAIRS, random).slice(0, DEFI_SIZE);
    super(
      keys.map((key) => questionFromKey(key, random)),
      { onFirstAttempt, retryWrong: false },
    );
  }

  result(): DefiResult {
    const attempts = this.attempts();
    const timeMs = attempts.reduce((sum, a) => sum + a.elapsedMs, 0);
    const wrong = attempts.filter((a) => !a.correct);
    return {
      timeMs,
      errors: wrong.length,
      scoreMs: timeMs + wrong.length * PENALTY_MS,
      total: this.total,
      toPractice: wrong.map((a) => a.question),
    };
  }
}
