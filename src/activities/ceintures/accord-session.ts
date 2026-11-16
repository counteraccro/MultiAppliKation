// Une série d'accords : les phrases l'une après l'autre, leurs cases dans l'ordre. Chaque case compte
// une fois : à l'entraînement, une case ratée est corrigée tout de suite, sans deuxième essai ; en
// conditions réelles, rien n'est dit avant la fin (réussi à 90 % des cases justes).

import { boxesOf, isRight, sentenceOf, type AccordExercise, type Box } from './accords';
import { isPassing } from './test-session';

export interface AccordMistake {
  exercise: AccordExercise;
  /** Ce qui a été tapé dans chaque case de la phrase, dans l'ordre. */
  typed: string[];
}

export interface AccordResult {
  /** Cases justes. */
  correct: number;
  total: number;
  passed: boolean;
  /** Phrases avec au moins une case fausse, pour la correction. */
  mistakes: AccordMistake[];
  /** Ces phrases corrigées, à retravailler. */
  toPractice: string[];
}

export class AccordSession {
  private readonly boxes: { exercise: AccordExercise; box: Box }[];
  private readonly typed: string[] = [];

  constructor(readonly exercises: readonly AccordExercise[]) {
    this.boxes = exercises.flatMap((exercise) => boxesOf(exercise.text).map((box) => ({ exercise, box })));
  }

  /** Nombre de cases de la série. */
  get total(): number {
    return this.boxes.length;
  }

  /** Cases déjà remplies. */
  get attempted(): number {
    return this.typed.length;
  }

  /** La phrase en cours et sa case à remplir (son rang dans la phrase), ou undefined à la fin. */
  current(): { exercise: AccordExercise; index: number } | undefined {
    const item = this.boxes[this.typed.length];
    if (!item) return undefined;
    return { exercise: item.exercise, index: this.typedIn(item.exercise).length };
  }

  /** Ce qui a été tapé dans les cases d'une phrase, dans l'ordre. */
  typedIn(exercise: AccordExercise): string[] {
    return this.typed.filter((_, i) => this.boxes[i]!.exercise === exercise);
  }

  /** Renvoie true si c'est juste. */
  answer(typed: string): boolean {
    const item = this.boxes[this.typed.length];
    if (!item) throw new Error('La série est finie');
    this.typed.push(typed);
    return isRight(item.box, typed);
  }

  /** Conditions réelles : revient à la case d'avant pour la corriger ; renvoie ce qui avait été tapé. */
  undo(): string | undefined {
    return this.typed.pop();
  }

  result(): AccordResult {
    const wrong = new Set(this.boxes.filter((item, i) => i < this.typed.length && !isRight(item.box, this.typed[i]!)).map((item) => item.exercise));
    const correct = this.boxes.filter((item, i) => i < this.typed.length && isRight(item.box, this.typed[i]!)).length;
    const mistakes = this.exercises.filter((e) => wrong.has(e)).map((exercise) => ({ exercise, typed: this.typedIn(exercise) }));
    return {
      correct,
      total: this.total,
      passed: isPassing(correct, this.total),
      mistakes,
      toPractice: mistakes.map(({ exercise }) => sentenceOf(exercise.text, 'answer')),
    };
  }
}
