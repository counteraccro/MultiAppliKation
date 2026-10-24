import { shuffle, type QuizQuestion } from '../../core/quiz';
import { Series, type Attempt } from '../../core/series';
import { ALL_PAIRS, questionFromKey } from './questions';

/** Questions par série. À régler en la regardant jouer. */
export const HIDDEN_SIZE = 15;

/**
 * Les 36 multiplications de 2 à 9 : avec 1 ou 10, le nombre caché est trivial
 * (« 1 × ? = 7 »). Ce sont aussi celles à vraiment mémoriser.
 */
export const HIDDEN_PAIRS: readonly string[] = ALL_PAIRS.filter((key) =>
  key.split('x').every((n) => Number(n) >= 2 && Number(n) <= 9),
);

/** « 7 × ? = 56 » (b caché) ou « ? × 8 = 56 » (a caché) : la réponse est le facteur caché. */
export interface HiddenQuestion extends QuizQuestion {
  a: number;
  b: number;
  hidden: 'a' | 'b';
}

export function hiddenQuestion(a: number, b: number, hidden: 'a' | 'b'): HiddenQuestion {
  return hidden === 'a'
    ? { a, b, hidden, prompt: '', suffix: `× ${b} = ${a * b}`, answer: a }
    : { a, b, hidden, prompt: `${a} ×`, suffix: `= ${a * b}`, answer: b };
}

export interface HiddenResult {
  correct: number;
  total: number;
  toPractice: HiddenQuestion[];
}

export interface HiddenOptions {
  random?: () => number;
  onFirstAttempt?: (attempt: Attempt<HiddenQuestion>) => void;
}

/**
 * Mode « Nombre caché » : on donne le résultat, il manque un facteur.
 * Plus difficile, il ne range rien dans les boîtes : la grille des progrès reste celle des autres modes.
 */
export class HiddenSession extends Series<HiddenQuestion> {
  constructor({ random = Math.random, onFirstAttempt }: HiddenOptions = {}) {
    const questions = shuffle(HIDDEN_PAIRS, random)
      .slice(0, HIDDEN_SIZE)
      .map((key) => {
        const { a, b } = questionFromKey(key, random);
        return hiddenQuestion(a, b, random() < 0.5 ? 'a' : 'b');
      });
    super(questions, { onFirstAttempt });
  }

  result(): HiddenResult {
    const attempts = this.attempts();
    return {
      correct: attempts.filter((a) => a.correct).length,
      total: this.total,
      toPractice: attempts.filter((a) => !a.correct).map((a) => a.question),
    };
  }
}
