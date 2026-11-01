// Ce que l'écran de question attend d'une série, quelle que soit l'activité.

export interface QuizQuestion {
  /** Texte affiché, ex. « 7 × 8 ». */
  prompt: string;
  /** Texte après la case réponse, ex. « = 56 » pour « 7 × ? = 56 » ; sinon « = » suit le texte. */
  suffix?: string;
  /** En petit au-dessus de la question, ex. « manger · futur ». */
  context?: string;
  /** Réponse attendue : un nombre (pavé, avec la virgule pour un décimal) ou des mots (clavier de lettres). */
  answer: number | string;
  /** Autres réponses justes, ex. « allée » quand le genre ne se voit pas. */
  alsoAccepted?: readonly string[];
  /** L'astuce, montrée après une erreur (« + 9, c'est + 10 − 1 : … »). */
  explain?: string;
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

/** Un nombre écrit à la française : 1,2 et non 1.2. */
export const numberText = (n: number) => String(n).replace('.', ',');

/** La réponse attendue telle qu'on l'écrit : « 1,2 », « mangerons ». */
export const answerText = (question: QuizQuestion) =>
  typeof question.answer === 'number' ? numberText(question.answer) : question.answer;

/** Toutes les réponses justes, l'attendue en premier. */
export function acceptedAnswers(question: QuizQuestion): string[] {
  return [answerText(question), ...(question.alsoAccepted ?? [])];
}

export function isCorrect(question: QuizQuestion, typed: string): boolean {
  // Un décimal se tape avec la virgule ; 3,50 est le même nombre que 3,5.
  if (typeof question.answer === 'number') return typed.trim() !== '' && Number(typed.replace(',', '.')) === question.answer;
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
