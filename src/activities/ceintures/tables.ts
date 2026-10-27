// Ceintures de tables de multiplication : les ceintures du classeur, de la blanche à la brillante
// (voir .ai/analyse/13-ceintures-tables.md ; les divisions, mauve, violette et marron, plus tard).
// « En une minute, je réponds à des calculs sur… » : les calculs se tirent des tables de la
// ceinture, il n'y a pas de fiche à recopier.

import { pairKey } from '../tables/questions';
import type { BeltId } from './belts';

export interface TableBelt {
  belt: BeltId;
  /** Ce que demande la ceinture, comme dans le classeur. */
  skill: string;
  /** « Objectif de fin de CE2 » dans le classeur. */
  goal?: 'CE2' | 'CM1' | 'CM2';
  /** Les tables de la ceinture : la table de 7, c'est 7 × 1 … 7 × 10. */
  tables: readonly number[];
  /** Calculs de l'entraînement en conditions réelles, en une minute. */
  testSize: number;
  /** Les astuces de la leçon. */
  tips: readonly string[];
}

/** Une table va de × 1 à × 10, comme dans l'activité Tables. */
export const MAX_FACTOR = 10;

/** Durée de l'entraînement en conditions réelles, comme en classe. */
export const TEST_TIME_MS = 60_000;

const ONE_TO_TWELVE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const TABLE_BELTS: readonly TableBelt[] = [
  {
    belt: 'blanche',
    skill: 'Tables de 2 et 10',
    tables: [2, 10],
    testSize: 20,
    tips: ['Table de 2 : c’est le double (2 × 7, c’est 7 + 7).', 'Table de 10 : on écrit un 0 à droite du nombre (10 × 7 = 70).'],
  },
  {
    belt: 'jaune',
    skill: 'Table de 5',
    tables: [5],
    testSize: 20,
    tips: ['Les résultats finissent par 0 ou par 5.', '5 fois, c’est la moitié de 10 fois : 10 × 6 = 60, donc 5 × 6 = 30.'],
  },
  {
    belt: 'orange',
    skill: 'Table de 3',
    tables: [3],
    testSize: 20,
    tips: ['Les résultats vont de 3 en 3 : 3, 6, 9, 12, 15…', '3 fois, c’est le double plus une fois : 3 × 7 = 14 + 7 = 21.'],
  },
  {
    belt: 'rose',
    skill: 'Table de 4',
    tables: [4],
    testSize: 20,
    tips: ['4 fois, c’est le double du double : 4 × 7 → 14 → 28.'],
  },
  {
    belt: 'vert-clair',
    skill: 'Table de 6',
    tables: [6],
    testSize: 20,
    tips: [
      '6 fois, c’est 5 fois plus une fois : 6 × 7 = 35 + 7 = 42.',
      'Avec 2, 4, 6 ou 8, le résultat finit par le même chiffre : 6 × 4 = 24, 6 × 8 = 48.',
    ],
  },
  {
    belt: 'vert-fonce',
    skill: 'Table de 7',
    tables: [7],
    testSize: 20,
    tips: [
      'Tu en connais déjà beaucoup : 7 × 3, c’est 3 × 7 = 21.',
      'Les plus dures à retenir : 7 × 7 = 49, 7 × 8 = 56 (5, 6, 7, 8 : 56 = 7 × 8), 7 × 9 = 63.',
    ],
  },
  {
    belt: 'bleu-clair',
    skill: 'Table de 8',
    tables: [8],
    testSize: 20,
    tips: ['8 fois, c’est le double du double du double : 8 × 6 → 12 → 24 → 48.', 'Les résultats sont toujours pairs.'],
  },
  {
    belt: 'bleu-fonce',
    skill: 'Table de 9',
    goal: 'CE2',
    tables: [9],
    testSize: 20,
    tips: [
      '9 fois, c’est 10 fois moins une fois : 9 × 6 = 60 − 6 = 54.',
      'Les chiffres du résultat font 9 ensemble : 54 → 5 + 4 = 9.',
    ],
  },
  {
    belt: 'noire',
    skill: 'Tables de 1 à 12',
    goal: 'CM2',
    tables: ONE_TO_TWELVE,
    testSize: 20,
    tips: [
      'Table de 1 : le nombre ne change pas (1 × 7 = 7).',
      'Table de 11 : jusqu’à 9, on écrit le chiffre deux fois (11 × 7 = 77) ; 11 × 10 = 110.',
      'Table de 12 : 10 fois plus 2 fois (12 × 7 = 70 + 14 = 84).',
    ],
  },
  {
    belt: 'brillante',
    skill: 'Toutes les précédentes, plus rapidement',
    tables: ONE_TO_TWELVE,
    testSize: 30,
    tips: [
      'Toutes les tables, de 1 à 12 : 30 calculs en une minute, à peine 2 secondes par calcul.',
      'Le résultat doit venir tout seul, sans calculer : pour une table qui résiste, retourne à sa ceinture.',
    ],
  },
];

/** Les multiplications de la ceinture, une fois chacune (« 3x7 » : 3 × 7 et 7 × 3 sont la même). */
export function beltFacts(belt: TableBelt): string[] {
  const keys = belt.tables.flatMap((table) => Array.from({ length: MAX_FACTOR }, (_, i) => pairKey(table, i + 1)));
  return [...new Set(keys)];
}

/** Les tables que la leçon montre en entier : celles qu'aucune ceinture d'avant n'a déjà. */
export function newTables(belt: TableBelt): number[] {
  const before = TABLE_BELTS.slice(0, TABLE_BELTS.indexOf(belt)).flatMap((b) => b.tables);
  return belt.tables.filter((table) => !before.includes(table));
}
