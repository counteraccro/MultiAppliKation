import { shuffle } from '../../core/quiz';
import { Series, type Attempt } from '../../core/series';
import { multiplication, pairKey, questionFromKey, TABLES, type Multiplication } from './questions';

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

/** Nombre de questions d'un mélange de ces tables : 10 par table, 20 au plus. */
export function mixSize(tables: readonly number[]): number {
  return Math.min(MIX_SIZE, 10 * new Set(tables).size);
}

/**
 * Questions du mélange : d'abord des multiplications toutes différentes.
 * S'il en manque (deux tables n'en ont que 19, car 2 × 5 est aussi 5 × 2),
 * la multiplication commune est posée dans les deux sens.
 */
export function mixQuestions(tables: readonly number[], random: () => number = Math.random): Multiplication[] {
  const chosen = new Set(tables);
  const keys = shuffle(mixKeys(tables), random);
  const questions = keys.slice(0, MIX_SIZE).map((key) => questionFromKey(key, random));
  for (const q of [...questions]) {
    if (questions.length >= MIX_SIZE) break;
    if (q.a !== q.b && chosen.has(q.a) && chosen.has(q.b)) questions.push(multiplication(q.b, q.a));
  }
  return shuffle(questions, random);
}

/** Mode « Mélange » : des questions tirées des tables choisies ; une erreur revient plus tard. */
export class MixSession extends Series<Multiplication> {
  constructor(
    readonly tables: readonly number[],
    { random = Math.random, onFirstAttempt }: MixOptions = {},
  ) {
    super(mixQuestions(tables, random), { onFirstAttempt });
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
