// Ceintures de calcul posé : les ceintures du classeur (« Je pose… »), de la blanche à la noire
// (voir .ai/analyse/15-ceintures-calcul-pose.md ; elles arrivent une étape à la fois).
// Les opérations se tirent au hasard, sur le modèle des fiches d'entraînement de la classe.

import { shuffle } from '../../core/quiz';
import type { BeltId } from './belts';
import { PosedAddition, type PosedOperation } from './posed';

export interface PosedBelt {
  belt: BeltId;
  /** Ce que demande la ceinture, comme dans le classeur. */
  skill: string;
  /** « Objectif de fin de CE2 » dans le classeur. */
  goal?: 'CE2' | 'CM1' | 'CM2';
  operation: 'addition';
  /** La méthode, pour la leçon. */
  tips: readonly string[];
  /** L'opération posée en entier dans la leçon. */
  example: () => PosedOperation;
  /** Une opération de la ceinture ; `index` dans la série, pour varier (2 ou 3 nombres…). */
  draw(random: () => number, index: number): PosedOperation;
}

/** Opérations d'un entraînement, et de l'entraînement en conditions réelles. */
export const PRACTICE_SIZE = 3;
export const TEST_SIZE = 5;

const between = (min: number, max: number, random: () => number) => min + Math.floor(random() * (max - min + 1));

/** Au moins une retenue : sans retenue, il n'y a rien à poser. */
const hasCarry = (terms: readonly number[]) => {
  for (let unit = 1; unit <= 1000; unit *= 10) {
    if (terms.reduce((sum, t) => sum + (Math.floor(t / unit) % 10), 0) >= 10) return true;
  }
  return false;
};

/** Blanche : 2 ou 3 nombres de 2 ou 3 chiffres, dont au moins un de 3 chiffres (fiche p. 1). */
export function drawAdditionTerms(count: number, random: () => number): number[] {
  for (;;) {
    const terms = [between(100, 999, random), ...Array.from({ length: count - 1 }, () => between(10, 999, random))];
    if (hasCarry(terms)) return shuffle(terms, random);
  }
}

export const CALCUL_POSE: readonly PosedBelt[] = [
  {
    belt: 'blanche',
    skill: 'Additions',
    operation: 'addition',
    tips: [
      'Écris les nombres bien en colonnes : les unités sous les unités, les dizaines sous les dizaines…',
      'Commence par les unités, à droite.',
      'Si une colonne fait 10 ou plus, écris le chiffre des unités en bas et la retenue en haut de la colonne suivante.',
      'N’oublie pas d’ajouter la retenue avec les chiffres de la colonne.',
    ],
    example: () => new PosedAddition([437, 76, 209]),
    draw: (random, index) => new PosedAddition(drawAdditionTerms(index % 2 === 0 ? 2 : 3, random)),
  },
];

/** Les opérations d'une série, toutes différentes et pas celles de la dernière fois (`seen`) si possible. */
export function pickOperations(belt: PosedBelt, count: number, seen: readonly string[] = [], random = Math.random): PosedOperation[] {
  const picked: PosedOperation[] = [];
  for (let tries = 0; picked.length < count; tries++) {
    const operation = belt.draw(random, picked.length);
    const known = picked.some((p) => p.id === operation.id) || (tries < 100 && seen.includes(operation.id));
    if (!known) picked.push(operation);
  }
  return shuffle(picked, random);
}
