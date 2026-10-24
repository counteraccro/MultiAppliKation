import { countAtLeast, pickReview, type LeitnerState } from '../../core/leitner';
import { shuffle } from '../../core/quiz';
import { Series, type Attempt } from '../../core/series';
import { ALL_PAIRS, FAST_MS, questionFromKey, type Multiplication } from './questions';

/** Questions par révision. À régler en la regardant jouer. */
export const REVIEW_SIZE = 15;
const STALE_SLOTS = 3;
const STALE_AFTER_MS = 3 * 24 * 60 * 60 * 1000;
/** À partir de cette boîte, une multiplication compte comme « sue ». */
export const KNOWN_BOX = 4;

export interface ReviewResult {
  correct: number;
  total: number;
  toPractice: Multiplication[];
}

export interface ReviewOptions {
  now?: number;
  random?: () => number;
  onFirstAttempt?: (attempt: Attempt<Multiplication>) => void;
}

/** Révision intelligente : ~15 multiplications de toutes les tables, tirées dans les boîtes. */
export class ReviewSession extends Series<Multiplication> {
  constructor(state: LeitnerState, { now = Date.now(), random = Math.random, onFirstAttempt }: ReviewOptions = {}) {
    const keys = pickReview(ALL_PAIRS, state, {
      size: REVIEW_SIZE,
      staleSlots: STALE_SLOTS,
      staleAfterMs: STALE_AFTER_MS,
      now,
      random,
    });
    // Les anciennes ne viennent pas toutes en tête : on mélange l'ordre de passage.
    super(
      shuffle(keys, random).map((key) => questionFromKey(key, random)),
      onFirstAttempt,
    );
  }

  result(): ReviewResult {
    const attempts = this.attempts();
    return {
      correct: attempts.filter((a) => a.correct).length,
      total: this.total,
      toPractice: attempts.filter((a) => !a.correct || a.elapsedMs >= FAST_MS).map((a) => a.question),
    };
  }
}

/** Combien des 55 multiplications sont sues. */
export function knownCount(state: LeitnerState): number {
  return countAtLeast(state, ALL_PAIRS, KNOWN_BOX);
}
