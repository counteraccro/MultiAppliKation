// Entraînement en conditions réelles d'une ceinture de conjugaison : 3 verbes (tirés comme à
// l'entraînement, voir `pickExercises`), comme une fiche de passage, sans correction pendant.
// Réussi avec au moins 90 % des formes justes ; tout est corrigé à la fin.

import { isCorrect, type QuizSession } from '../../core/quiz';
import type { Exercise } from './conjugaison';
import { isPassing } from './test-session';
import { exerciseQuestions, type VerbQuestion } from './verb-practice';

export interface VerbMistake {
  exercise: Exercise;
  question: VerbQuestion;
  typed: string;
}

export interface VerbTestResult {
  correct: number;
  total: number;
  passed: boolean;
  /** Formes fausses, dans l'ordre du test, pour la correction. */
  mistakes: VerbMistake[];
}

/** Les formes des verbes l'une après l'autre ; pas de deuxième essai. */
export class VerbTestSession implements QuizSession<VerbQuestion> {
  readonly total: number;
  private readonly items: { exercise: Exercise; question: VerbQuestion }[];
  private readonly typed: string[] = [];

  constructor(exercises: readonly Exercise[], random: () => number = Math.random) {
    this.items = exercises.flatMap((exercise) => exerciseQuestions(exercise, random).map((question) => ({ exercise, question })));
    this.total = this.items.length;
  }

  get attempted(): number {
    return this.typed.length;
  }

  current(): VerbQuestion | undefined {
    return this.items[this.typed.length]?.question;
  }

  /** Renvoie true si c'est juste (l'écran ne le montre pas). */
  answer(typed: string): boolean {
    const item = this.items[this.typed.length];
    if (!item) throw new Error('Le test est fini');
    this.typed.push(typed);
    return isCorrect(item.question, typed);
  }

  /** Revient à la forme d'avant pour la corriger ; renvoie ce qui avait été tapé (undefined au début). */
  undo(): string | undefined {
    return this.typed.pop();
  }

  result(): VerbTestResult {
    const mistakes = this.items
      .map((item, i) => ({ ...item, typed: this.typed[i] ?? '' }))
      .filter(({ question, typed }) => !isCorrect(question, typed));
    const correct = this.total - mistakes.length;
    return { correct, total: this.total, passed: isPassing(correct, this.total), mistakes };
  }
}
