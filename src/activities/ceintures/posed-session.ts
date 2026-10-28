// Ceintures de calcul posé : une série d'opérations posées étape par étape.
// Entraînement : chaque étape corrigée tout de suite, la bonne valeur s'écrit à la place d'une erreur.
// Conditions réelles : ce qui est tapé s'écrit tel quel, rien n'est dit avant la fin ; réussi à 90 %
// des étapes justes.

import type { PosedOperation, PosedStep } from './posed';
import { isPassing } from './test-session';

export interface PosedMistake {
  operation: PosedOperation;
  /** Le résultat écrit par l'enfant (« 146, reste 8 » pour une division). */
  written: string;
}

export interface PosedResult {
  /** Étapes justes du premier coup, sur toutes les étapes. */
  correct: number;
  total: number;
  passed: boolean;
  /** Opérations avec au moins une étape fausse : « 437 + 76 + 209 = 722 ». */
  toPractice: string[];
  mistakes: PosedMistake[];
}

export class PosedSession {
  /** Nombre d'opérations. */
  readonly total: number;
  /** Par opération, chaque étape juste ou non au premier coup. */
  private readonly marks: boolean[][];

  constructor(
    readonly operations: readonly PosedOperation[],
    readonly test = false,
  ) {
    this.total = operations.length;
    this.marks = operations.map(() => []);
  }

  /** Opérations finies. */
  get attempted(): number {
    return this.operations.filter((o) => o.done).length;
  }

  /** La première opération pas finie, et son étape en cours. */
  current(): { operation: PosedOperation; step: PosedStep } | undefined {
    const operation = this.operations.find((o) => !o.done);
    return operation && { operation, step: operation.current()! };
  }

  /** Écrit la valeur tapée ; à l'entraînement, une erreur est remplacée par la bonne valeur. */
  answer(value: number): boolean {
    const current = this.current();
    if (!current) throw new Error('La série est finie');
    const correct = value === current.step.expected;
    this.marks[this.operations.indexOf(current.operation)]!.push(correct);
    current.operation.place(this.test || correct ? value : current.step.expected);
    return correct;
  }

  /** Conditions réelles : efface la dernière valeur écrite, au besoin dans l'opération d'avant. */
  undo(): number | undefined {
    if (!this.test) return undefined;
    const started = this.operations.filter((o) => o.placed.length > 0);
    if (started.length === 0) return undefined;
    const index = this.operations.indexOf(started.at(-1)!);
    this.marks[index]!.pop();
    return this.operations[index]!.undo();
  }

  result(): PosedResult {
    const all = this.marks.flat();
    const correct = all.filter(Boolean).length;
    const missed = this.operations.filter((_, i) => this.marks[i]!.includes(false));
    return {
      correct,
      total: all.length,
      passed: isPassing(correct, all.length),
      toPractice: missed.map((o) => `${o.text} = ${o.resultText}`),
      mistakes: missed.map((operation) => ({ operation, written: operation.writtenText() })),
    };
  }
}
