// Ce que l'écran de question attend d'une série, quelle que soit l'activité.

export interface QuizQuestion {
  /** Texte affiché, ex. « 7 × 8 ». */
  prompt: string;
  /** Texte après la case réponse, ex. « = 56 » pour « 7 × ? = 56 » ; sinon « = » suit le texte. */
  suffix?: string;
  answer: number;
}

export interface QuizSession<Q extends QuizQuestion = QuizQuestion> {
  /** Nombre de questions de la série (sans compter celles qui reviennent). */
  readonly total: number;
  /** Nombre de questions déjà tentées une première fois. */
  readonly attempted: number;
  /** Question à poser, ou undefined quand la série est finie. */
  current(): Q | undefined;
  /** Enregistre la réponse à la question courante ; renvoie true si elle est juste. */
  answer(value: number, elapsedMs: number): boolean;
}

/** Mélange de Fisher-Yates ; `random` est remplaçable pour les tests. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}
