// Une opération posée en colonnes, comme sur le cahier (voir .ai/analyse/15-ceintures-calcul-pose.md) :
// l'enfant écrit un chiffre à la fois, en commençant par les unités, et les retenues dans les ronds.
// Chaque étape est jugée d'après ce qui est déjà écrit : en conditions réelles, une retenue fausse
// ne compte qu'une fois, la suite se calcule avec elle (comme un maître qui corrige).

export interface PosedStep {
  /**
   * Un chiffre du résultat, ou une retenue (dans le rond en haut de la colonne).
   * Division : le nombre pris d'abord, le nombre de chiffres du quotient, puis pour chaque nombre en cours
   * un chiffre du quotient, le produit écrit dessous et le reste de la soustraction.
   */
  kind: 'digit' | 'carry' | 'first' | 'size' | 'quotient' | 'product' | 'remainder';
  /** 0 pour les unités, 1 pour les dizaines… Division : le rang du chiffre du quotient, ou du reste. */
  column: number;
  expected: number;
  /** Ce qu'on demande, au-dessus de l'opération. */
  ask: string;
  /** L'explication, après une erreur ou dans la leçon. */
  explain: string;
  /**
   * Multiplication à 2 ou 3 chiffres : 0, 1 (et 2) pour les lignes, une par chiffre du multiplicateur,
   * puis la ligne de leur somme (`sumLine`). Absent : une seule ligne.
   */
  line?: number;
  /** Chiffres qu'on peut taper (1 par défaut) : le nombre pris d'abord dans une division, un produit, un reste. */
  digits?: number;
  /** Division : le nombre en cours (34, puis 68 pour 348 : 7). */
  partial?: number;
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
  /** Le résultat juste et le résultat écrit, pour les listes et la correction (« 147, reste 3 »). */
  readonly resultText: string;
  writtenText(): string;
}

export const COLUMN_NAMES = ['unités', 'dizaines', 'centaines', 'milliers', 'dizaines de milliers'];
/** « 1 dizaine », « 1 centaine »… : ce que vaut 1 dans une colonne. */
const UNIT_NAMES = ['unité', 'dizaine', 'centaine', 'millier', 'dizaine de milliers'];

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

  get resultText(): string {
    return String(this.result);
  }

  writtenText(): string {
    return String(this.written());
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
          ? `${parts.length > 1 ? `${parts.join(' + ')} = ` : 'Il n’y a que '}${sum} : on écrit ${sum}.`
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
      // En phrases, comme la leçon de la classe : « 6 est plus petit que 8, je ne peux pas calculer 6 − 8… ».
      const counted = carryIn > 0 ? `En bas, j’ai ${b} + ${carryIn} = ${under}. ` : '';
      const one = `1 ${UNIT_NAMES[column + 1]}`;
      const explain = borrow
        ? `${counted}${a} est plus petit que ${under} : je ne peux pas calculer ${a} − ${under}. ` +
          `J’ajoute ${one} en haut : ${a} devient ${up}. Pour compenser, j’ajoute aussitôt ${one} en bas, dans le rond. ` +
          `Je calcule ${up} − ${under} = ${up - under}.`
        : a === under
          ? `${counted}${a} − ${under} = 0.`
          : `${counted}${a} est plus grand que ${under} : je calcule ${a} − ${under} = ${a - under}.`;
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
 * Multiplication par un nombre à 2 ou 3 chiffres, comme sur la fiche : la ligne des unités, puis celle
 * des dizaines (qui commence par un 0 sous les unités), celle des centaines (deux 0), puis leur somme.
 * Les retenues des lignes s'écrivent en petit au-dessus du nombre ; celles de la somme dans des ronds,
 * au-dessus des lignes.
 */
export class PosedLongMultiplication extends ColumnBase {
  readonly sign = '×';
  readonly id: string;
  readonly text: string;
  readonly result: number;
  readonly terms: readonly [number, number];
  readonly columns: number;
  /** La ligne de la somme, après une ligne par chiffre du multiplicateur. */
  readonly sumLine: number;

  constructor(top: number, factor: number) {
    super();
    this.terms = [top, factor];
    this.id = `${top}x${factor}`;
    this.text = `${top} × ${factor}`;
    this.result = top * factor;
    this.columns = length(this.result);
    this.sumLine = length(factor);
  }

  protected override get resultLine(): number {
    return this.sumLine;
  }

  /** Le nombre écrit sur une des lignes (pour l'addition). */
  lineValue(line: number): number {
    return lineValue(this.steps(), this.values, line);
  }

  steps(): PosedStep[] {
    const [top, factor] = this.terms;
    const walk: Walk = { steps: [], values: this.values, i: 0 };
    for (let line = 0; line < this.sumLine; line++) {
      const digit = digitAt(factor, line);
      const prefix = `× ${digit}${'0'.repeat(line)} : `;
      // On multiplie par des dizaines (ou des centaines) : d'abord un 0 (ou deux) à droite.
      const zeros = line === 1 ? '0 aux unités' : '0 aux unités et aux dizaines';
      const explain = `On multiplie par ${digit} ${COLUMN_NAMES[line]} : on écrit d’abord ${zeros}.`;
      for (let column = 0; column < line; column++) {
        const zero = { kind: 'digit' as const, column, expected: 0, ask: `${prefix}les ${COLUMN_NAMES[column]}`, explain, line };
        if (!push(walk, zero)) return walk.steps;
      }
      if (!multiplyLine(walk, top, digit, line, line, prefix)) return walk.steps;
    }
    // L'addition des lignes, telles qu'elles sont écrites ; ses retenues dans des ronds.
    const sum = this.sumLine;
    const lines = Array.from({ length: sum }, (_, line) => lineValue(walk.steps, walk.values, line));
    const columns = Math.max(...lines.map(length));
    let carryIn = 0;
    for (let column = 0; column < columns; column++) {
      const parts = [...(carryIn > 0 ? [carryIn] : []), ...lines.filter((n) => length(n) > column).map((n) => digitAt(n, column))];
      const total = parts.reduce((a, b) => a + b, 0);
      const carry = Math.floor(total / 10);
      const last = column === columns - 1;
      const explain =
        carry === 0
          ? `${parts.length > 1 ? `${parts.join(' + ')} = ` : 'Il n’y a que '}${total} : on écrit ${total}.`
          : last
            ? `${parts.join(' + ')} = ${total} : c’est la dernière colonne, on écrit ${total}.`
            : `${parts.join(' + ')} = ${total} : on écrit ${total % 10} et on retient ${carry}.`;
      const ask = `L’addition : les ${COLUMN_NAMES[column]}`;
      if (!push(walk, { kind: 'digit', column, expected: total % 10, ask, explain, line: sum })) return walk.steps;
      if (carry === 0) {
        carryIn = 0;
        continue;
      }
      if (last) {
        push(walk, { kind: 'digit', column: column + 1, expected: carry, ask: 'L’addition : on écrit le nombre en entier', explain, line: sum });
        return walk.steps;
      }
      const askCarry = `L’addition : la retenue, en haut des ${COLUMN_NAMES[column + 1]}`;
      if (!push(walk, { kind: 'carry', column: column + 1, expected: carry, ask: askCarry, explain, line: sum })) return walk.steps;
      carryIn = walk.values[walk.i - 1]!;
    }
    return walk.steps;
  }
}

/** Une opération posée en colonnes (pas la division). */
export type ColumnOperation = PosedAddition | PosedSubtraction | PosedMultiplication | PosedLongMultiplication;

/**
 * Division par un nombre à 1 chiffre, en potence, comme la leçon de la classe (Calc 8) : on prend d'abord
 * assez de chiffres et on compte les chiffres du quotient, puis pour chaque nombre en cours le chiffre
 * du quotient, le produit écrit dessous, le reste de la soustraction, et on abaisse le chiffre suivant.
 */
export class PosedDivision implements PosedOperation {
  readonly id: string;
  readonly text: string;
  readonly result: number;
  readonly remainder: number;
  readonly digits: readonly number[];
  /** Chiffres du dividende pris d'abord : 1 pour 738 : 5 (7), 2 pour 348 : 7 (34). */
  readonly firstLength: number;
  private readonly values: number[] = [];

  constructor(
    readonly dividend: number,
    readonly divisor: number,
  ) {
    this.id = `${dividend}:${divisor}`;
    this.text = `${dividend} : ${divisor}`;
    this.result = Math.floor(dividend / divisor);
    this.remainder = dividend % divisor;
    this.digits = [...String(dividend)].map(Number);
    const length = this.digits.findIndex((_, i) => Number(String(dividend).slice(0, i + 1)) >= divisor) + 1;
    this.firstLength = length > 0 ? length : this.digits.length;
  }

  get placed(): readonly number[] {
    return this.values;
  }

  steps(): PosedStep[] {
    const { divisor: d, digits, firstLength } = this;
    const walk: Walk = { steps: [], values: this.values, i: 0 };
    const first = Number(digits.slice(0, firstLength).join(''));
    const explainFirst =
      firstLength > 1
        ? `${digits.slice(0, firstLength - 1).join('')} est plus petit que ${d} : on prend ${first}.`
        : `On peut diviser ${first} par ${d} : on commence par ${first}.`;
    const ask = `Quel nombre prends-tu d’abord pour diviser par ${d} ?`;
    if (!push(walk, { kind: 'first', column: 0, expected: first, ask, explain: explainFirst, digits: digits.length })) return walk.steps;
    const count = digits.length - firstLength + 1;
    const lowered = digits.slice(firstLength);
    const explainSize =
      lowered.length === 0
        ? `On ne prend que ${first} : le quotient aura 1 chiffre.`
        : `Un chiffre au quotient pour ${first}, puis un pour chaque chiffre qu’on abaisse (${lowered.join(' et ')}) : ` +
          `le quotient aura ${count} chiffres.`;
    const size = { kind: 'size' as const, column: 0, expected: count, ask: 'Combien de chiffres aura le quotient ?', explain: explainSize };
    if (!push(walk, size)) return walk.steps;
    let partial = first;
    for (let k = 0; k < count; k++) {
      const q = Math.floor(partial / d);
      const explainQ =
        q === 0
          ? `${partial} est plus petit que ${d} : on écrit 0 au quotient.`
          : `${d} × ${q} = ${d * q}${q < 9 ? ` et ${d} × ${q + 1} = ${d * (q + 1)}, c’est trop` : ''} : on écrit ${q}.`;
      const askQ = `Dans ${partial}, combien de fois ${d} ?`;
      if (!push(walk, { kind: 'quotient', column: k, expected: q, ask: askQ, explain: explainQ, partial })) return walk.steps;
      const written = walk.values[walk.i - 1]!;
      // Le produit s'écrit sous le nombre en cours (pas pour un 0 au quotient : il ne s'enlève rien).
      let product = 0;
      if (written > 0) {
        const explainP = `${written} fois ${d} font ${d * written} : on l’écrit sous ${partial}.`;
        const step = { kind: 'product' as const, column: k, expected: d * written, ask: `${written} fois ${d}, ça fait ?`, explain: explainP, digits: 2, partial };
        if (!push(walk, step)) return walk.steps;
        product = walk.values[walk.i - 1]!;
      }
      const r = partial - product;
      const next = digits[firstLength + k];
      const explainR =
        (product > 0 ? `${partial} − ${product} = ${r} : il reste ${r}.` : `Il reste ${r}.`) +
        (next === undefined ? ' C’est le reste de la division.' : ` On abaisse le ${next} : ${r}${next}.`);
      const askR = product > 0 ? `La soustraction : ${partial} − ${product}` : 'Combien reste-t-il ?';
      const remainder = { kind: 'remainder' as const, column: k, expected: r, ask: askR, explain: explainR, digits: 2, partial };
      if (!push(walk, remainder)) {
        return walk.steps;
      }
      if (next !== undefined) partial = walk.values[walk.i - 1]! * 10 + next;
    }
    return walk.steps;
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

  /** Le quotient écrit. */
  written(): number {
    const steps = this.steps();
    return Number(this.values.filter((_, i) => steps[i]?.kind === 'quotient').join('') || 0);
  }

  /** Le dernier reste écrit. */
  writtenRemainder(): number | undefined {
    const steps = this.steps();
    const remainders = this.values.filter((_, i) => steps[i]?.kind === 'remainder');
    return remainders.at(-1);
  }

  get resultText(): string {
    return `${this.result}, reste ${this.remainder}`;
  }

  writtenText(): string {
    return `${this.written()}, reste ${this.writtenRemainder() ?? '?'}`;
  }

  /** « 147 × 5 + 3 = 738 », la vérification de la fiche. */
  get check(): string {
    return `${this.result} × ${this.divisor} + ${this.remainder} = ${this.dividend}`;
  }
}

/** Pose l'opération en entier, juste : pour l'exemple de la leçon. */
export function solve(operation: PosedOperation): PosedOperation {
  for (let step = operation.current(); step; step = operation.current()) operation.place(step.expected);
  return operation;
}
