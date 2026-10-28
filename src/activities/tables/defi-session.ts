import { shuffle } from '../../core/quiz';
import { Series, type Attempt } from '../../core/series';
import { ALL_PAIRS, MULTIPLICATION, questionFromKey, type Calculation, type Operation } from './questions';

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
  toPractice: Calculation[];
}

export interface DefiOptions {
  op?: Operation;
  random?: () => number;
  onFirstAttempt?: (attempt: Attempt<Calculation>) => void;
}

/** Défi chronométré : 20 calculs de toutes les tables ; une erreur coûte 5 s. */
export class DefiSession extends Series<Calculation> {
  constructor({ op = MULTIPLICATION, random = Math.random, onFirstAttempt }: DefiOptions = {}) {
    const keys = shuffle(ALL_PAIRS, random).slice(0, DEFI_SIZE);
    super(
      keys.map((key) => questionFromKey(op, key, random)),
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
