// Ceintures de calcul posé : les ceintures du classeur (« Je pose… »), de la blanche à la noire
// (voir .ai/analyse/15-ceintures-calcul-pose.md ; elles arrivent une étape à la fois).
// Les opérations se tirent au hasard, sur le modèle des fiches d'entraînement de la classe.

import { shuffle } from '../../core/quiz';
import type { BeltId } from './belts';
import { PosedAddition, PosedDivision, PosedLongMultiplication, PosedMultiplication, PosedSubtraction, type PosedOperation } from './posed';

export interface PosedBelt {
  belt: BeltId;
  /** Ce que demande la ceinture, comme dans le classeur. */
  skill: string;
  /** « Objectif de fin de CE2 » dans le classeur. */
  goal?: 'CE2' | 'CM1' | 'CM2';
  operation: 'addition' | 'soustraction' | 'multiplication' | 'division';
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

/** Une retenue dans la soustraction : un chiffre du haut plus petit que celui du bas. */
const hasBorrow = (top: number, bottom: number) => {
  for (let unit = 1; unit <= 100; unit *= 10) {
    if (Math.floor(top / unit) % 10 < Math.floor(bottom / unit) % 10) return true;
  }
  return false;
};

/**
 * Jaune : un nombre de 3 chiffres moins un de 2 ou 3 chiffres (fiche p. 2 : 405 − 206, 563 − 78),
 * avec au moins une retenue, le résultat a encore 3 chiffres.
 */
export function drawSubtraction(bottomDigits: number, random: () => number): [number, number] {
  for (;;) {
    const top = between(200, 999, random);
    const bottom = bottomDigits === 2 ? between(10, 99, random) : between(100, top - 100, random);
    if (top - bottom >= 100 && hasBorrow(top, bottom)) return [top, bottom];
  }
}

/** Orange : un nombre de 3 chiffres par un nombre de 2 à 9 (fiche p. 3 : 723 × 8), avec au moins une retenue. */
export function drawMultiplication(random: () => number): [number, number] {
  for (;;) {
    const top = between(100, 999, random);
    const factor = between(2, 9, random);
    if ([...String(top)].some((d) => Number(d) * factor >= 10)) return [top, factor];
  }
}

/** Rose : un nombre de 3 chiffres par un nombre de 2 chiffres sans 0 ni 1 (fiche p. 4 : 549 × 43, 701 × 49). */
export function drawLongMultiplication(random: () => number): [number, number] {
  return [between(100, 999, random), between(2, 9, random) * 10 + between(2, 9, random)];
}

/**
 * Vert clair : un nombre de 3 chiffres divisé par un nombre de 2 à 9 (fiche p. 5 : 738 : 5, 348 : 7).
 * Pour varier : `kind` 0, on prend d'abord 2 chiffres (34 pour 348 : 7) ; 1, un 0 au quotient (618 : 3 = 206) ;
 * 2, au hasard.
 */
export function drawDivision(kind: number, random: () => number): [number, number] {
  for (;;) {
    const dividend = between(100, 999, random);
    const divisor = between(2, 9, random);
    const division = new PosedDivision(dividend, divisor);
    if (kind === 0 && division.firstLength !== 2) continue;
    if (kind === 1 && !String(division.result).includes('0')) continue;
    return [dividend, divisor];
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
  {
    belt: 'jaune',
    skill: 'Soustractions',
    operation: 'soustraction',
    tips: [
      'La soustraction calcule l’écart entre deux nombres. Pose le plus grand nombre en haut, les unités sous les unités.',
      'Commence par soustraire les unités, à droite.',
      'Si le chiffre du haut est plus petit que celui du bas, tu ne peux pas calculer. Alors ajoute 1 dizaine en haut : un petit 1 devant le chiffre, 6 devient 16.',
      'Pour compenser, ajoute aussitôt 1 dizaine en bas : écris 1 dans le rond, sous la colonne des dizaines. C’est la retenue.',
      'Continue avec les dizaines, avec la même méthode. N’oublie pas d’ajouter la retenue au chiffre du bas : 2 + 1 = 3.',
    ],
    // L'exemple de la leçon de la classe.
    example: () => new PosedSubtraction(56, 28),
    draw: (random, index) => new PosedSubtraction(...drawSubtraction(index % 2 === 0 ? 3 : 2, random)),
  },
  {
    belt: 'orange',
    skill: 'Multiplications à 1 chiffre',
    operation: 'multiplication',
    tips: [
      'Écris le nombre à 1 chiffre sous les unités, et commence par les unités.',
      'Multiplie chaque chiffre du haut par ce nombre : tes tables te servent ici !',
      'Si le résultat fait 10 ou plus, écris les unités en bas et la retenue en petit au-dessus du chiffre suivant.',
      'Multiplie d’abord, puis ajoute la retenue. À la dernière colonne, écris le nombre en entier.',
    ],
    example: () => new PosedMultiplication(723, 8),
    draw: (random) => new PosedMultiplication(...drawMultiplication(random)),
  },
  {
    belt: 'rose',
    skill: 'Multiplications à 2 chiffres',
    goal: 'CE2',
    operation: 'multiplication',
    tips: [
      'Commence par multiplier par le chiffre des unités : c’est la première ligne.',
      'Pour le chiffre des dizaines, écris d’abord un 0 aux unités de la deuxième ligne : tu multiplies par des dizaines.',
      'Puis multiplie par ce chiffre, comme pour la première ligne. Barre les retenues d’avant pour ne pas te tromper.',
      'Additionne les deux lignes : c’est le résultat.',
    ],
    example: () => new PosedLongMultiplication(549, 43),
    draw: (random) => new PosedLongMultiplication(...drawLongMultiplication(random)),
  },
  {
    belt: 'vert-clair',
    skill: 'Division par un nombre à 1 chiffre',
    operation: 'division',
    tips: [
      'Prends d’abord assez de chiffres du dividende pour pouvoir diviser : 348 : 7, 3 est trop petit, on prend 34.',
      'Cherche dans tes tables combien de fois le diviseur va dans ce nombre, sans dépasser : écris-le au quotient.',
      'Calcule le reste (sans l’écrire, la soustraction se fait de tête) : il doit être plus petit que le diviseur.',
      'Abaisse le chiffre suivant à côté du reste, et recommence jusqu’au dernier chiffre.',
      'Vérifie : quotient × diviseur + reste doit redonner le dividende.',
    ],
    example: () => new PosedDivision(738, 5),
    draw: (random, index) => new PosedDivision(...drawDivision(index % 3, random)),
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
