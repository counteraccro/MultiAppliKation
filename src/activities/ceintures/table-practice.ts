// Ceintures de tables et de calcul mental : l'entraînement (10 calculs corrigés tout de suite, un calcul
// raté revient un peu plus tard) et l'entraînement en conditions réelles (tables : 20 calculs en une
// minute, 30 à la brillante, réussi à 90 % ; calcul mental : 20 calculs en 2 minutes, une erreur au plus),
// sans correction pendant ; ceux qu'on n'a pas eu le temps de faire comptent faux.

import { isCorrect, shuffle, type QuizQuestion, type QuizSession } from '../../core/quiz';
import { Series } from '../../core/series';
import { MULTIPLICATION, questionFromKey, type Calculation } from '../tables/questions';
import { beltFacts, type TableBelt } from './tables';
import { isPassing } from './test-session';

/** Calculs d'un entraînement. */
export const PRACTICE_SIZE = 10;

/**
 * Les calculs d'une série (clés « 3x7 »), au hasard dans la ceinture : chacun une fois avant
 * qu'un autre revienne, ceux de la dernière fois (`seen`) en dernier, jamais deux fois de suite.
 */
export function pickFacts(belt: TableBelt, count: number, seen: readonly string[] = [], random = Math.random): string[] {
  const facts = beltFacts(belt);
  const picked: string[] = [];
  let round = [...shuffle(facts.filter((f) => !seen.includes(f)), random), ...shuffle(facts.filter((f) => seen.includes(f)), random)];
  while (picked.length < count) {
    if (round.length === 0) round = shuffle(facts, random);
    const i = Math.max(0, round.findIndex((f) => f !== picked.at(-1)));
    picked.push(round.splice(i, 1)[0]!);
  }
  return picked;
}

/** « 7 × 8 = 56 », « 37 + 63 = 100 » (la case au milieu), pour les listes du résultat. */
export const factText = (question: QuizQuestion) =>
  question.suffix === undefined ? `${question.prompt} = ${question.answer}` : `${question.prompt} ${question.answer} ${question.suffix}`;

export interface TablePracticeResult {
  /** Calculs justes au premier essai. */
  correct: number;
  total: number;
  /** Calculs ratés au premier essai : « 7 × 8 = 56 ». */
  toPractice: string[];
}

/** Un entraînement : les calculs corrigés tout de suite, un raté revient plus tard. */
export class CalcPracticeSession<Q extends QuizQuestion> extends Series<Q> {
  result(): TablePracticeResult {
    const missed = this.attempts().filter((a) => !a.correct).map((a) => a.question);
    return {
      correct: this.total - missed.length,
      total: this.total,
      toPractice: [...new Set(missed.map(factText))],
    };
  }
}

export class TablePracticeSession extends CalcPracticeSession<Calculation> {
  /** Chaque calcul dans un sens au hasard (3 × 7 ou 7 × 3). */
  constructor(keys: readonly string[], random: () => number = Math.random) {
    super(keys.map((key) => questionFromKey(MULTIPLICATION, key, random)));
  }
}

export interface TableMistake<Q extends QuizQuestion = QuizQuestion> {
  question: Q;
  /** Ce qui a été tapé ; absent si le temps a manqué. */
  typed?: string;
}

export interface TableTestResult<Q extends QuizQuestion = QuizQuestion> {
  correct: number;
  total: number;
  passed: boolean;
  /** Calculs faux ou pas faits, dans l'ordre du test, pour la correction. */
  mistakes: TableMistake<Q>[];
}

/**
 * Les calculs l'un après l'autre, sans deuxième essai ; le chrono est celui de l'écran.
 * `passes` : la règle de réussite (90 % par défaut ; calcul mental : une erreur au plus).
 */
export class CalcTestSession<Q extends QuizQuestion> implements QuizSession<Q> {
  readonly total: number;
  private readonly typed: string[] = [];

  constructor(
    private readonly questions: readonly Q[],
    private readonly passes: (correct: number, total: number) => boolean = isPassing,
  ) {
    this.total = questions.length;
  }

  get attempted(): number {
    return this.typed.length;
  }

  current(): Q | undefined {
    return this.questions[this.typed.length];
  }

  /** Renvoie true si c'est juste (l'écran ne le montre pas). */
  answer(typed: string): boolean {
    const question = this.current();
    if (!question) throw new Error('Le test est fini');
    this.typed.push(typed);
    return isCorrect(question, typed);
  }

  /** Revient au calcul d'avant pour le corriger ; renvoie ce qui avait été tapé (undefined au début). */
  undo(): string | undefined {
    return this.typed.pop();
  }

  /** À la fin des calculs ou du temps : ceux qui restent comptent faux. */
  result(): TableTestResult<Q> {
    const mistakes = this.questions
      .map((question, i) => ({ question, typed: this.typed[i] }))
      .filter(({ question, typed }) => typed === undefined || !isCorrect(question, typed))
      .map(({ question, typed }) => (typed === undefined ? { question } : { question, typed }));
    const correct = this.total - mistakes.length;
    return { correct, total: this.total, passed: this.passes(correct, this.total), mistakes };
  }
}

export class TableTestSession extends CalcTestSession<Calculation> {
  /** Chaque calcul dans un sens au hasard (3 × 7 ou 7 × 3). */
  constructor(keys: readonly string[], random: () => number = Math.random) {
    super(keys.map((key) => questionFromKey(MULTIPLICATION, key, random)));
  }
}
