// Ce que l'écran de question attend d'une série, quelle que soit l'activité.

export interface QuizQuestion {
  /** Texte affiché, ex. « 7 × 8 ». */
  prompt: string;
  /** Texte après la case réponse, ex. « = 56 » pour « 7 × ? = 56 » ; sinon « = » suit le texte. */
  suffix?: string;
  /** En petit au-dessus de la question, ex. « manger · futur ». */
  context?: string;
  /** Réponse attendue : un nombre (pavé) ou des mots (clavier de lettres). */
  answer: number | string;
  /** Autres réponses justes, ex. « allée » quand le genre ne se voit pas. */
  alsoAccepted?: readonly string[];
}

export interface QuizSession<Q extends QuizQuestion = QuizQuestion> {
  /** Nombre de questions de la série (sans compter celles qui reviennent). */
  readonly total: number;
  /** Nombre de questions déjà tentées une première fois. */
  readonly attempted: number;
  /** Question à poser, ou undefined quand la série est finie. */
  current(): Q | undefined;
  /** Enregistre la réponse tapée à la question courante ; renvoie true si elle est juste. */
  answer(typed: string, elapsedMs: number): boolean;
  /** Test (ceintures) : annule la dernière réponse et la renvoie, pour la corriger. */
  undo?(): string | undefined;
}

/** Ce qui ne compte pas dans une réponse en mots : espaces en trop, majuscules. Les accents comptent. */
export function normalizeAnswer(text: string): string {
  return text.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr');
}

/** Toutes les réponses justes, l'attendue en premier. */
export function acceptedAnswers(question: QuizQuestion): string[] {
  return [String(question.answer), ...(question.alsoAccepted ?? [])];
}

export function isCorrect(question: QuizQuestion, typed: string): boolean {
  if (typeof question.answer === 'number') return typed.trim() !== '' && Number(typed) === question.answer;
  const answer = normalizeAnswer(typed);
  return acceptedAnswers(question).some((a) => normalizeAnswer(a) === answer);
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
