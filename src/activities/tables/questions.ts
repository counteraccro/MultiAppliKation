import type { QuizQuestion } from '../../core/quiz';

export const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/**
 * Ce qui change d'une activité à l'autre (« Les Tables », « Les Additions ») :
 * les modes, les boîtes et l'album sont les mêmes, seul le calcul diffère.
 */
export interface Operation {
  /** « × » ou « + ». */
  symbol: string;
  compute(a: number, b: number): number;
  /** « multiplication », « addition » : toutes deux féminines, les phrases restent justes. */
  noun: string;
  /** Au-delà, l'enfant calcule au lieu de savoir (3ᵉ étoile, boîtes). À régler en la regardant jouer. */
  fastMs: number;
  /** Titre de l'accueil et texte des boutons retour. */
  title: string;
  backLabel: string;
  /** Ordre conseillé (voir .ai/analyse/03-pedagogie.md) ; aucune table n'est bloquée. */
  suggestedOrder: readonly number[];
  /** Calculs du nombre caché : ceux où le trou n'est pas trivial. */
  hiddenPairs: readonly string[];
  /** Exemple sous le bouton « Nombre caché ». */
  hiddenExample: string;
  /** Un autocollant par table, dans l'ordre des tables. */
  tableEmojis: readonly string[];
}

export interface Calculation extends QuizQuestion {
  a: number;
  b: number;
  answer: number;
}

export function calculation(op: Operation, a: number, b: number): Calculation {
  return { a, b, prompt: `${a} ${op.symbol} ${b}`, answer: op.compute(a, b) };
}

/** Les 10 calculs d'une table : 7 × 1 … 7 × 10. */
export function tableQuestions(op: Operation, table: number): Calculation[] {
  return TABLES.map((k) => calculation(op, table, k));
}

/** 3 × 7 et 7 × 3 sont la même chose à retenir : même clé, « 3x7 » (même format pour les additions). */
export function pairKey(a: number, b: number): string {
  return `${Math.min(a, b)}x${Math.max(a, b)}`;
}

/** Les 55 calculs à retenir (a ≤ b). */
export const ALL_PAIRS: readonly string[] = TABLES.flatMap((a) =>
  TABLES.filter((b) => b >= a).map((b) => pairKey(a, b)),
);

/** Clés dont les deux nombres sont entre `min` et `max`. */
const pairsBetween = (min: number, max: number) =>
  ALL_PAIRS.filter((key) => key.split('x').every((n) => Number(n) >= min && Number(n) <= max));

export const MULTIPLICATION: Operation = {
  symbol: '×',
  compute: (a, b) => a * b,
  noun: 'multiplication',
  fastMs: 5000,
  title: 'Les Tables',
  backLabel: 'Les tables',
  suggestedOrder: [1, 10, 2, 5, 3, 4, 9, 6, 7, 8],
  // Les 36 de 2 à 9 : avec 1 ou 10, « 1 × ? = 7 » est trivial. Ce sont aussi celles à vraiment mémoriser.
  hiddenPairs: pairsBetween(2, 9),
  hiddenExample: '7 × ? = 56',
  tableEmojis: ['🐣', '🐰', '🐱', '🐶', '🦊', '🐼', '🐨', '🐯', '🦁', '🐲'],
};

export const ADDITION: Operation = {
  symbol: '+',
  compute: (a, b) => a + b,
  noun: 'addition',
  // Plus long qu'aux multiplications : les additions s'adressent aussi aux plus petits (CP).
  fastMs: 8000,
  title: 'Les Additions',
  backLabel: 'Les additions',
  // + 1 et + 2 d'abord (compter), + 10 (la dizaine), puis + 5, et le reste.
  suggestedOrder: [1, 2, 10, 5, 3, 4, 9, 6, 7, 8],
  // Les 45 de 1 à 9 : avec 10, « 10 + ? = 13 » se lit directement.
  hiddenPairs: pairsBetween(1, 9),
  hiddenExample: '3 + ? = 7',
  tableEmojis: ['🍓', '🍒', '🍋', '🍊', '🍎', '🍐', '🍑', '🍇', '🍉', '🍍'],
};

/** Question tirée d'une clé, dans un sens au hasard (3 × 7 ou 7 × 3). */
export function questionFromKey(op: Operation, key: string, random: () => number = Math.random): Calculation {
  const [a, b] = key.split('x').map(Number) as [number, number];
  return random() < 0.5 ? calculation(op, a, b) : calculation(op, b, a);
}
