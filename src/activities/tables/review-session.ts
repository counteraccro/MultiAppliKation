import { countAtLeast, pickReview, type LeitnerState } from '../../core/leitner';
import { KNOWN_BOX } from '../../core/mastery';
import { shuffle } from '../../core/quiz';
import { Series, type Attempt } from '../../core/series';
import { ALL_PAIRS, MULTIPLICATION, questionFromKey, type Calculation, type Operation } from './questions';

/** Questions par révision. À régler en la regardant jouer. */
export const REVIEW_SIZE = 15;
const STALE_SLOTS = 3;
const STALE_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

export interface ReviewResult {
  correct: number;
  total: number;
  toPractice: Calculation[];
}

export interface ReviewOptions {
  op?: Operation;
  now?: number;
  random?: () => number;
  onFirstAttempt?: (attempt: Attempt<Calculation>) => void;
}

/** Révision intelligente : ~15 calculs de toutes les tables, tirés dans les boîtes. */
export class ReviewSession extends Series<Calculation> {
  private readonly fastMs: number;

  constructor(
    state: LeitnerState,
    { op = MULTIPLICATION, now = Date.now(), random = Math.random, onFirstAttempt }: ReviewOptions = {},
  ) {
    const keys = pickReview(ALL_PAIRS, state, {
      size: REVIEW_SIZE,
      staleSlots: STALE_SLOTS,
      staleAfterMs: STALE_AFTER_MS,
      now,
      random,
    });
    // Les anciennes ne viennent pas toutes en tête : on mélange l'ordre de passage.
    super(
      shuffle(keys, random).map((key) => questionFromKey(op, key, random)),
      { onFirstAttempt },
    );
    this.fastMs = op.fastMs;
  }

  result(): ReviewResult {
    const attempts = this.attempts();
    return {
      correct: attempts.filter((a) => a.correct).length,
      total: this.total,
      toPractice: attempts.filter((a) => !a.correct || a.elapsedMs >= this.fastMs).map((a) => a.question),
    };
  }
}

/** Combien des 55 calculs sont sus. */
export function knownCount(state: LeitnerState): number {
  return countAtLeast(state, ALL_PAIRS, KNOWN_BOX);
}
