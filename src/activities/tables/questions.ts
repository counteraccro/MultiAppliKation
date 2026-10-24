import type { QuizQuestion } from '../../core/quiz';

export const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/** Ordre conseillé (voir .ai/analyse/03-pedagogie.md) ; aucune table n'est bloquée. */
export const SUGGESTED_ORDER = [1, 10, 2, 5, 3, 4, 9, 6, 7, 8] as const;

/** Au-delà, l'enfant calcule au lieu de savoir. À régler en la regardant jouer. */
export const FAST_MS = 5000;

export interface Multiplication extends QuizQuestion {
  a: number;
  b: number;
}

export function multiplication(a: number, b: number): Multiplication {
  return { a, b, prompt: `${a} × ${b}`, answer: a * b };
}

/** Les 10 multiplications d'une table : 7 × 1 … 7 × 10. */
export function tableQuestions(table: number): Multiplication[] {
  return TABLES.map((k) => multiplication(table, k));
}
