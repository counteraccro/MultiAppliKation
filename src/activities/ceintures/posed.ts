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

export class PosedAddition implements PosedOperation {
  readonly id: string;
  readonly text: string;
  readonly result: number;
  /** Colonnes des nombres à additionner (le résultat peut en avoir une de plus). */
  readonly columns: number;
  private readonly values: number[] = [];

  constructor(readonly terms: readonly number[]) {
    this.id = terms.join('+');
    this.text = terms.join(' + ');
    this.result = terms.reduce((a, b) => a + b, 0);
    this.columns = Math.max(...terms.map(length));
  }

  get placed(): readonly number[] {
    return this.values;
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

/** Pose l'opération en entier, juste : pour l'exemple de la leçon. */
export function solve(operation: PosedOperation): PosedOperation {
  for (let step = operation.current(); step; step = operation.current()) operation.place(step.expected);
  return operation;
}
