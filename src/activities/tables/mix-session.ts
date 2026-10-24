import { shuffle } from '../../core/quiz';
import { Series, type Attempt } from '../../core/series';
import { pairKey, questionFromKey, TABLES, type Multiplication } from './questions';

/** Au plus 20 questions : assez pour mélanger, pas trop pour une enfant de 9 ans. */
export const MIX_SIZE = 20;

export interface MixResult {
  correct: number;
  total: number;
  toPractice: Multiplication[];
}

export interface MixOptions {
  random?: () => number;
  onFirstAttempt?: (attempt: Attempt<Multiplication>) => void;
}

/** Multiplications des tables choisies, sans doublon (3 × 7 et 7 × 3 comptent pour une). */
export function mixKeys(tables: readonly number[]): string[] {
  return [...new Set(tables.flatMap((t) => TABLES.map((k) => pairKey(t, k))))];
}

/** Nombre de questions d'un mélange de ces tables. */
export function mixSize(tables: readonly number[]): number {
  return Math.min(MIX_SIZE, mixKeys(tables).length);
}

/** Mode « Mélange » : des questions tirées des tables choisies ; une erreur revient plus tard. */
export class MixSession extends Series<Multiplication> {
  constructor(
    readonly tables: readonly number[],
    { random = Math.random, onFirstAttempt }: MixOptions = {},
  ) {
    const keys = shuffle(mixKeys(tables), random).slice(0, MIX_SIZE);
    super(
      keys.map((key) => questionFromKey(key, random)),
      { onFirstAttempt },
    );
  }

  result(): MixResult {
    const attempts = this.attempts();
    return {
      correct: attempts.filter((a) => a.correct).length,
      total: this.total,
      toPractice: attempts.filter((a) => !a.correct).map((a) => a.question),
    };
  }
}
