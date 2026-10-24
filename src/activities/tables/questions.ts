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

/** 3 × 7 et 7 × 3 sont la même chose à retenir : même clé, « 3x7 ». */
export function pairKey(a: number, b: number): string {
  return `${Math.min(a, b)}x${Math.max(a, b)}`;
}

/** Les 55 multiplications à retenir (a ≤ b). */
export const ALL_PAIRS: readonly string[] = TABLES.flatMap((a) =>
  TABLES.filter((b) => b >= a).map((b) => pairKey(a, b)),
);

/** Question tirée d'une clé, dans un sens au hasard (3 × 7 ou 7 × 3). */
export function questionFromKey(key: string, random: () => number = Math.random): Multiplication {
  const [a, b] = key.split('x').map(Number) as [number, number];
  return random() < 0.5 ? multiplication(a, b) : multiplication(b, a);
}
