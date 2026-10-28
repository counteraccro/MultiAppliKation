// Une opération posée en colonnes, comme sur le cahier (voir .ai/analyse/15-ceintures-calcul-pose.md) :
// l'enfant écrit un chiffre à la fois, en commençant par les unités, et les retenues dans les ronds.
// Chaque étape est jugée d'après ce qui est déjà écrit : en conditions réelles, une retenue fausse
// ne compte qu'une fois, la suite se calcule avec elle (comme un maître qui corrige).

export interface PosedStep {
  /** Un chiffre du résultat, ou une retenue (dans le rond en haut de la colonne). */
  kind: 'digit' | 'carry';
  /** 0 pour les unités, 1 pour les dizaines… */
  column: number;
  expected: number;
  /** Ce qu'on demande, au-dessus de l'opération. */
  ask: string;
  /** L'explication, après une erreur ou dans la leçon. */
  explain: string;
}

export interface PosedOperation {
  /** « 437+76+209 », pour ne pas redonner les mêmes au prochain entraînement. */
  readonly id: string;
  /** « 437 + 76 + 209 ». */
  readonly text: string;
  readonly result: number;
  /** Les valeurs écrites, une par étape. */
  readonly placed: readonly number[];
  /** Les étapes déjà faites, puis celle en cours. */
  steps(): PosedStep[];
  current(): PosedStep | undefined;
  readonly done: boolean;
  place(value: number): void;
  /** Efface la dernière valeur écrite et la renvoie (undefined s'il n'y a rien). */
  undo(): number | undefined;
  /** Le résultat tel qu'il est écrit. */
  written(): number;
}

export const COLUMN_NAMES = ['unités', 'dizaines', 'centaines', 'milliers', 'dizaines de milliers'];

export const digitAt = (n: number, column: number) => Math.floor(n / 10 ** column) % 10;
const length = (n: number) => String(n).length;

/** Ce qui est commun aux opérations en colonnes : les valeurs écrites, une par étape. */
abstract class ColumnBase implements PosedOperation {
  abstract readonly id: string;
  abstract readonly text: string;
  abstract readonly result: number;
  protected readonly values: number[] = [];

  /** Les étapes déjà faites, puis celle en cours, d'après ce qui est écrit. */
  abstract steps(): PosedStep[];

  get placed(): readonly number[] {
    return this.values;
  }

  current(): PosedStep | undefined {
    return this.steps()[this.values.length];
  }

  get done(): boolean {
    return this.current() === undefined;
  }

  place(value: number): void {
    if (this.done) throw new Error('L’opération est finie');
    this.values.push(value);
  }

  undo(): number | undefined {
    return this.values.pop();
  }

  written(): number {
    const steps = this.steps();
    return this.values.reduce((sum, value, i) => (steps[i]!.kind === 'digit' ? sum + value * 10 ** steps[i]!.column : sum), 0);
  }
}

export class PosedAddition extends ColumnBase {
  readonly sign = '+';
  readonly id: string;
  readonly text: string;
  readonly result: number;
  /** Colonnes des nombres à additionner (le résultat peut en avoir une de plus). */
  readonly columns: number;

  constructor(readonly terms: readonly number[]) {
    super();
    this.id = terms.join('+');
    this.text = terms.join(' + ');
    this.result = terms.reduce((a, b) => a + b, 0);
    this.columns = Math.max(...terms.map(length));
  }

  steps(): PosedStep[] {
    const steps: PosedStep[] = [];
    let i = 0;
    let carryIn = 0;
    for (let column = 0; column < this.columns; column++) {
      const parts = [...(carryIn > 0 ? [carryIn] : []), ...this.terms.filter((t) => length(t) > column).map((t) => digitAt(t, column))];
      const sum = parts.reduce((a, b) => a + b, 0);
      const carry = Math.floor(sum / 10);
      const last = column === this.columns - 1;
      const name = COLUMN_NAMES[column]!;
      const explain =
        carry === 0
          ? `${parts.join(' + ')} = ${sum} : on écrit ${sum}.`
          : last
            ? `${parts.join(' + ')} = ${sum} : c’est la dernière colonne, on écrit ${sum}.`
            : `${parts.join(' + ')} = ${sum} : on écrit ${sum % 10} et on retient ${carry}.`;
      steps.push({ kind: 'digit', column, expected: sum % 10, ask: `Les ${name}`, explain });
      if (i++ >= this.values.length) return steps;
      if (carry === 0) {
        carryIn = 0;
        continue;
      }
      if (last) {
        steps.push({ kind: 'digit', column: column + 1, expected: carry, ask: 'On écrit le nombre en entier', explain });
        return steps;
      }
      steps.push({ kind: 'carry', column: column + 1, expected: carry, ask: `La retenue, en haut des ${COLUMN_NAMES[column + 1]}`, explain });
      if (i >= this.values.length) return steps;
      carryIn = this.values[i++]!;
    }
    return steps;
  }

}

/**
 * Soustraction par compensation, comme en classe : si le chiffre du haut est trop petit, on ajoute
 * 10 en haut et 1 en bas de la colonne suivante (la retenue, dans un rond sous le nombre du bas).
 */
export class PosedSubtraction extends ColumnBase {
  readonly sign = '−';
  readonly id: string;
  readonly text: string;
  readonly result: number;
  readonly terms: readonly [number, number];
  readonly columns: number;

  constructor(top: number, bottom: number) {
    super();
    this.terms = [top, bottom];
    this.id = `${top}-${bottom}`;
    this.text = `${top} − ${bottom}`;
    this.result = top - bottom;
    this.columns = length(top);
  }

  steps(): PosedStep[] {
    const [top, bottom] = this.terms;
    const steps: PosedStep[] = [];
    let i = 0;
    let carryIn = 0;
    for (let column = 0; column < this.columns; column++) {
      const a = digitAt(top, column);
      const b = length(bottom) > column ? digitAt(bottom, column) : 0;
      const under = b + carryIn;
      const last = column === this.columns - 1;
      const borrow = a < under && !last;
      const up = borrow ? a + 10 : a;
      const counted = carryIn > 0 ? `${b} + ${carryIn} = ${under} ; ` : '';
      const explain = borrow
        ? `${counted}${a} < ${under} : on ajoute 10 en haut (${up}) et 1 en bas des ${COLUMN_NAMES[column + 1]}. ${up} − ${under} = ${up - under} : on écrit ${up - under}.`
        : `${counted}${a} − ${under} = ${a - under} : on écrit ${a - under}.`;
      steps.push({ kind: 'digit', column, expected: up - under, ask: `Les ${COLUMN_NAMES[column]}`, explain });
      if (i++ >= this.values.length) return steps;
      if (!borrow) {
        carryIn = 0;
        continue;
      }
      steps.push({ kind: 'carry', column: column + 1, expected: 1, ask: `La retenue, en bas des ${COLUMN_NAMES[column + 1]}`, explain });
      if (i >= this.values.length) return steps;
      carryIn = this.values[i++]!;
    }
    return steps;
  }

}

/** Une opération posée en colonnes (pas la division). */
export type ColumnOperation = PosedAddition | PosedSubtraction;

/** Pose l'opération en entier, juste : pour l'exemple de la leçon. */
export function solve(operation: PosedOperation): PosedOperation {
  for (let step = operation.current(); step; step = operation.current()) operation.place(step.expected);
  return operation;
}
