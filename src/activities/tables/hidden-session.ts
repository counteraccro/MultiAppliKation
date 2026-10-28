import { shuffle, type QuizQuestion } from '../../core/quiz';
import { Series, type Attempt } from '../../core/series';
import { MULTIPLICATION, questionFromKey, type Operation } from './questions';

/** Questions par série. À régler en la regardant jouer. */
export const HIDDEN_SIZE = 15;

/** « 7 × ? = 56 » (b caché) ou « ? × 8 = 56 » (a caché) : la réponse est le nombre caché. */
export interface HiddenQuestion extends QuizQuestion {
  a: number;
  b: number;
  hidden: 'a' | 'b';
  answer: number;
}

export function hiddenQuestion(a: number, b: number, hidden: 'a' | 'b', op: Operation = MULTIPLICATION): HiddenQuestion {
  const result = op.compute(a, b);
  return hidden === 'a'
    ? { a, b, hidden, prompt: '', suffix: `${op.symbol} ${b} = ${result}`, answer: a }
    : { a, b, hidden, prompt: `${a} ${op.symbol}`, suffix: `= ${result}`, answer: b };
}

export interface HiddenResult {
  correct: number;
  total: number;
  toPractice: HiddenQuestion[];
}

export interface HiddenOptions {
  op?: Operation;
  random?: () => number;
  onFirstAttempt?: (attempt: Attempt<HiddenQuestion>) => void;
}

/**
 * Mode « Nombre caché » : on donne le résultat, il manque un nombre.
 * Plus difficile, il ne range rien dans les boîtes : la grille des progrès reste celle des autres modes.
 */
export class HiddenSession extends Series<HiddenQuestion> {
  constructor({ op = MULTIPLICATION, random = Math.random, onFirstAttempt }: HiddenOptions = {}) {
    const questions = shuffle(op.hiddenPairs, random)
      .slice(0, HIDDEN_SIZE)
      .map((key) => {
        const { a, b } = questionFromKey(op, key, random);
        return hiddenQuestion(a, b, random() < 0.5 ? 'a' : 'b', op);
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
