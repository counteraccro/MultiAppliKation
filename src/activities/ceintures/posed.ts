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
  /** Multiplication à 2 chiffres : 0 et 1 pour les deux lignes, 2 pour leur somme (absent : une seule ligne). */
  line?: number;
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
    return lineValue(this.steps(), this.values, this.resultLine);
  }

  /** La ligne du résultat (la dernière d'une multiplication à 2 chiffres). */
  protected get resultLine(): number | undefined {
    return undefined;
  }
}

/** Le nombre écrit sur une ligne : ses chiffres déjà placés (parmi les étapes déjà connues). */
function lineValue(steps: readonly PosedStep[], values: readonly number[], line: number | undefined): number {
  return values.reduce((sum, value, i) => {
    const step = steps[i];
    return step?.kind === 'digit' && step.line === line ? sum + value * 10 ** step.column : sum;
  }, 0);
}

/** Les étapes recalculées d'après ce qui est écrit : `i` avance d'une valeur écrite à chaque étape faite. */
interface Walk {
  steps: PosedStep[];
  values: readonly number[];
  i: number;
}

/** Ajoute une étape ; renvoie false si c'est l'étape en cours (rien d'écrit encore). */
function push(walk: Walk, step: PosedStep): boolean {
  walk.steps.push(step);
  return walk.i++ < walk.values.length;
}

/**
 * Une ligne de multiplication : `top` × `factor` (un chiffre), écrite à partir de la colonne `offset`.
 * Renvoie false si la ligne n'est pas finie. `prefix` : « × 3 : » devant ce qu'on demande, s'il y a deux lignes.
 */
function multiplyLine(walk: Walk, top: number, factor: number, offset: number, line: number | undefined, prefix = ''): boolean {
  const asked = (text: string) => (prefix ? prefix + text : text[0]!.toUpperCase() + text.slice(1));
  let carryIn = 0;
  const columns = length(top);
  for (let c = 0; c < columns; c++) {
    const column = c + offset;
    const a = digitAt(top, c);
    const product = a * factor;
    const total = product + carryIn;
    const carry = Math.floor(total / 10);
    const last = c === columns - 1;
    const computed = carryIn > 0 ? `${factor} × ${a} = ${product}, + ${carryIn} = ${total}` : `${factor} × ${a} = ${total}`;
    const explain =
      carry === 0
        ? `${computed} : on écrit ${total}.`
        : last
          ? `${computed} : c’est la dernière colonne, on écrit ${total}.`
          : `${computed} : on écrit ${total % 10} et on retient ${carry}.`;
    if (!push(walk, { kind: 'digit', column, expected: total % 10, ask: asked(`les ${COLUMN_NAMES[column]}`), explain, line })) return false;
    if (carry === 0) {
      carryIn = 0;
      continue;
    }
    if (last) return push(walk, { kind: 'digit', column: column + 1, expected: carry, ask: asked('on écrit le nombre en entier'), explain, line });
    const ask = asked(`la retenue, au-dessus des ${COLUMN_NAMES[c + 1]}`);
    if (!push(walk, { kind: 'carry', column: c + 1, expected: carry, ask, explain, line })) return false;
    carryIn = walk.values[walk.i - 1]!;
  }
  return true;
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

/**
 * Multiplication par un nombre à 1 chiffre : chaque chiffre du haut multiplié, en commençant
 * par les unités ; la retenue s'écrit en petit au-dessus du chiffre suivant, et s'ajoute après.
 */
export class PosedMultiplication extends ColumnBase {
  readonly sign = '×';
  readonly id: string;
  readonly text: string;
  readonly result: number;
  readonly terms: readonly [number, number];
  readonly columns: number;

  constructor(top: number, factor: number) {
    super();
    this.terms = [top, factor];
    this.id = `${top}x${factor}`;
    this.text = `${top} × ${factor}`;
    this.result = top * factor;
    this.columns = length(top);
  }

  steps(): PosedStep[] {
    const walk: Walk = { steps: [], values: this.values, i: 0 };
    multiplyLine(walk, ...this.terms, 0, undefined);
    return walk.steps;
  }
}

/**
 * Multiplication par un nombre à 2 chiffres, comme sur la fiche : la ligne des unités, puis celle
 * des dizaines (qui commence par un 0 sous les unités), puis leur somme. Les retenues des deux lignes
 * s'écrivent en petit au-dessus du nombre ; celles de la somme se gardent en tête.
 */
export class PosedLongMultiplication extends ColumnBase {
  readonly sign = '×';
  readonly id: string;
  readonly text: string;
  readonly result: number;
  readonly terms: readonly [number, number];
  readonly columns: number;

  constructor(top: number, factor: number) {
    super();
    this.terms = [top, factor];
    this.id = `${top}x${factor}`;
    this.text = `${top} × ${factor}`;
    this.result = top * factor;
    this.columns = length(this.result);
  }

  protected override get resultLine(): number {
    return 2;
  }

  /** Le nombre écrit sur la ligne 0 ou 1 (pour l'addition). */
  lineValue(line: number): number {
    return lineValue(this.steps(), this.values, line);
  }

  steps(): PosedStep[] {
    const [top, factor] = this.terms;
    const units = factor % 10;
    const tens = Math.floor(factor / 10);
    const walk: Walk = { steps: [], values: this.values, i: 0 };
    if (!multiplyLine(walk, top, units, 0, 0, `× ${units} : `)) return walk.steps;
    const zero = {
      kind: 'digit' as const,
      column: 0,
      expected: 0,
      ask: `× ${tens}0 : les unités`,
      explain: `On multiplie par ${tens} dizaines : on écrit d’abord 0 aux unités.`,
      line: 1,
    };
    if (!push(walk, zero)) return walk.steps;
    if (!multiplyLine(walk, top, tens, 1, 1, `× ${tens}0 : `)) return walk.steps;
    // L'addition des deux lignes, telles qu'elles sont écrites ; la retenue se garde en tête.
    const lines = [lineValue(walk.steps, walk.values, 0), lineValue(walk.steps, walk.values, 1)];
    const columns = Math.max(...lines.map(length));
    let carryIn = 0;
    for (let column = 0; column < columns; column++) {
      const parts = [...(carryIn > 0 ? [carryIn] : []), ...lines.filter((n) => length(n) > column).map((n) => digitAt(n, column))];
      const sum = parts.reduce((a, b) => a + b, 0);
      const carry = Math.floor(sum / 10);
      const last = column === columns - 1;
      const explain =
        carry === 0
          ? `${parts.join(' + ')} = ${sum} : on écrit ${sum}.`
          : last
            ? `${parts.join(' + ')} = ${sum} : c’est la dernière colonne, on écrit ${sum}.`
            : `${parts.join(' + ')} = ${sum} : on écrit ${sum % 10} et on retient ${carry} dans sa tête.`;
      const ask = `L’addition : les ${COLUMN_NAMES[column]}`;
      if (!push(walk, { kind: 'digit', column, expected: sum % 10, ask, explain, line: 2 })) return walk.steps;
      if (last && carry > 0) {
        push(walk, { kind: 'digit', column: column + 1, expected: carry, ask: 'L’addition : on écrit le nombre en entier', explain, line: 2 });
      }
      carryIn = carry;
    }
    return walk.steps;
  }
}

/** Une opération posée en colonnes (pas la division). */
export type ColumnOperation = PosedAddition | PosedSubtraction | PosedMultiplication | PosedLongMultiplication;

/** Pose l'opération en entier, juste : pour l'exemple de la leçon. */
export function solve(operation: PosedOperation): PosedOperation {
  for (let step = operation.current(); step; step = operation.current()) operation.place(step.expected);
  return operation;
}
