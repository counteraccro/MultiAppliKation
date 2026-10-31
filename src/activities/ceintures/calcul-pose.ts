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
  /** « mélange » : une série avec plusieurs sortes d'opérations (vert foncé). */
  operation: 'addition' | 'soustraction' | 'multiplication' | 'division' | 'mélange';
  /** La méthode, pour la leçon. */
  tips: readonly string[];
  /** Les opérations posées en entier dans la leçon (une par sorte d'opération). */
  examples: () => PosedOperation[];
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

/** Vert foncé : 3 nombres, dont un de 4 chiffres, un de 3 et un de 2 ou 3 (« additions à trois termes »). */
export function drawBigAdditionTerms(random: () => number): number[] {
  for (;;) {
    const terms = [between(1000, 9999, random), between(100, 999, random), between(10, 999, random)];
    if (hasCarry(terms)) return shuffle(terms, random);
  }
}

/** Une retenue qui tombe sur un 0 du haut (4005 − 1287 : aux dizaines, 0 devient 10). */
export function borrowsOnZero(top: number, bottom: number): boolean {
  let carryIn = 0;
  for (let unit = 1; unit <= top; unit *= 10) {
    const a = Math.floor(top / unit) % 10;
    const under = (Math.floor(bottom / unit) % 10) + carryIn;
    if (a === 0 && under > 0) return true;
    carryIn = a < under ? 1 : 0;
  }
  return false;
}

/**
 * Vert foncé : un nombre de 4 chiffres avec des 0 (4005, 3020…) moins un de 3 ou 4 chiffres ;
 * une retenue tombe sur un 0, le résultat a encore 4 chiffres.
 */
export function drawSubtractionWithZeros(random: () => number): [number, number] {
  for (;;) {
    const digits = [between(2, 9, random), ...Array.from({ length: 3 }, () => (random() < 0.5 ? 0 : between(1, 9, random)))];
    const top = Number(digits.join(''));
    if (!digits.slice(1).includes(0)) continue;
    const bottom = between(100, top - 1000, random);
    if (borrowsOnZero(top, bottom)) return [top, bottom];
  }
}

/** Vert foncé : 4 chiffres × 2 chiffres, ou 3 chiffres × 3 chiffres ; le multiplicateur sans 0 ni 1. */
export function drawBigMultiplication(random: () => number): [number, number] {
  const digit = () => between(2, 9, random);
  return random() < 0.5
    ? [between(1000, 9999, random), digit() * 10 + digit()]
    : [between(100, 999, random), digit() * 100 + digit() * 10 + digit()];
}

/** Vert foncé : une addition, une soustraction, une multiplication, et on recommence. */
function drawMixed(random: () => number, index: number): PosedOperation {
  if (index % 3 === 0) return new PosedAddition(drawBigAdditionTerms(random));
  if (index % 3 === 1) return new PosedSubtraction(...drawSubtractionWithZeros(random));
  return new PosedLongMultiplication(...drawBigMultiplication(random));
}

/** Un nombre de `min` à `max` (en centièmes) dont le dernier chiffre écrit n'est pas 0. */
const lastNotZero = (min: number, max: number, random: () => number) => {
  for (;;) {
    const n = between(min, max, random);
    if (n % 10 !== 0) return n;
  }
};

/**
 * Bleu clair, addition (fiche p. 6 : 60,97 + 4,3 + 22) : un nombre à 2 chiffres après la virgule, un à 1,
 * un entier, au moins une retenue. Les nombres sont comptés en centièmes ; `places` dit comment ils s'écrivent.
 */
export function drawDecimalAddition(random: () => number): { terms: number[]; places: number[] } {
  for (;;) {
    const terms = [lastNotZero(1000, 9999, random), lastNotZero(11, 99, random) * 10, between(10, 99, random) * 100];
    if (!hasCarry(terms)) continue;
    const order = shuffle([0, 1, 2], random);
    return { terms: order.map((i) => terms[i]!), places: order.map((i) => [2, 1, 0][i]!) };
  }
}

/**
 * Bleu clair, soustraction (fiche p. 6 : 137 − 53,11, 147,8 − 63,54) : un entier (`kind` 0) ou un nombre à
 * 1 chiffre après la virgule (`kind` 1), moins un nombre à 2 chiffres après la virgule. On complète le haut
 * par des 0 ; le résultat vaut au moins 1 (90 − 85,61 = 4,39, comme la fiche).
 */
export function drawDecimalSubtraction(kind: number, random: () => number): { top: number; bottom: number; places: [number, number] } {
  for (;;) {
    const top = kind === 0 ? between(30, 199, random) * 100 : lastNotZero(300, 1999, random) * 10;
    const bottom = lastNotZero(1000, top - 1, random);
    if (top - bottom >= 100) return { top, bottom, places: [kind, 2] };
  }
}

/** Bleu clair : une addition, puis les deux sortes de soustractions, et on recommence. */
function drawDecimal(random: () => number, index: number): PosedOperation {
  if (index % 3 === 0) {
    const { terms, places } = drawDecimalAddition(random);
    return new PosedAddition(terms, places);
  }
  const { top, bottom, places } = drawDecimalSubtraction((index % 3) - 1, random);
  return new PosedSubtraction(top, bottom, places);
}

/**
 * Bleu foncé (fiche p. 7) : un entier divisé par un nombre à 1 chiffre, le quotient au centième.
 * `kind` 0, un nombre de 2 chiffres (69 : 7 = 9,85) ; 1, un nombre de 3 chiffres (275 : 8 = 34,37) ;
 * 2, une division qui tombe juste après la virgule (28 : 5 = 5,60, 31 : 2 = 15,50). Il reste toujours
 * quelque chose avant la virgule : sinon, on n'aurait pas à continuer.
 */
export function drawDecimalDivision(kind: number, random: () => number): [number, number] {
  for (;;) {
    const dividend = kind === 1 ? between(100, 399, random) : between(10, 199, random);
    const divisor = kind === 2 ? [2, 4, 5][between(0, 2, random)]! : between(3, 9, random);
    if (dividend < divisor || dividend % divisor === 0) continue;
    if (kind === 0 && (dividend > 99 || dividend < 2 * divisor)) continue;
    if ((kind === 2) !== ((dividend * 100) % divisor === 0)) continue;
    return [dividend, divisor];
  }
}

/** Un nombre de `min` à `max` sans 0 : en bas d'une multiplication, un 0 donnerait une ligne de 0. */
const noZero = (min: number, max: number, random: () => number) => {
  for (;;) {
    const n = between(min, max, random);
    if (!String(n).includes('0')) return n;
  }
};

/**
 * Violette (fiche p. 8) : `kind` 0, 2 chiffres après la virgule × 1 (2,34 × 11,6) ; 1, 3 chiffres après
 * la virgule × un entier (1,123 × 25) ; 2, 1 chiffre après la virgule × 2 (11,3 × 2,73). Les nombres
 * s'écrivent sans virgule (234), `places` dit où elle est ; le nombre du bas n'a pas de 0.
 */
export function drawDecimalMultiplication(kind: number, random: () => number): { top: number; factor: number; places: [number, number] } {
  if (kind === 0) return { top: lastNotZero(101, 999, random), factor: noZero(111, 299, random), places: [2, 1] };
  if (kind === 1) return { top: lastNotZero(1001, 2999, random), factor: noZero(12, 39, random), places: [3, 0] };
  return { top: lastNotZero(111, 299, random), factor: noZero(111, 399, random), places: [1, 2] };
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
    examples: () => [new PosedAddition([437, 76, 209])],
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
    examples: () => [new PosedSubtraction(56, 28)],
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
    examples: () => [new PosedMultiplication(723, 8)],
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
    examples: () => [new PosedLongMultiplication(549, 43)],
    draw: (random) => new PosedLongMultiplication(...drawLongMultiplication(random)),
  },
  {
    belt: 'vert-clair',
    skill: 'Division par un nombre à 1 chiffre',
    operation: 'division',
    tips: [
      'Diviser, c’est partager équitablement. Le nombre qu’on partage est le dividende, le nombre de parts le diviseur, le résultat le quotient.',
      'Prends d’abord assez de chiffres du dividende pour pouvoir diviser : 348 : 7, 3 est trop petit, on prend 34.',
      'Cherche le nombre de chiffres du quotient : un pour le nombre pris, puis un pour chaque chiffre qu’on abaisse.',
      'Cherche dans tes tables combien de fois le diviseur va dans ce nombre, sans dépasser : écris-le au quotient.',
      'Écris le produit sous le nombre, et soustrais : le reste doit être plus petit que le diviseur.',
      'Abaisse le chiffre suivant à côté du reste, et recommence jusqu’au dernier chiffre.',
      'Vérifie : quotient × diviseur + reste doit redonner le dividende.',
    ],
    examples: () => [new PosedDivision(738, 5)],
    draw: (random, index) => new PosedDivision(...drawDivision(index % 3, random)),
  },
  {
    belt: 'vert-fonce',
    skill: 'Additions à trois nombres, soustractions avec des 0, multiplications à 2 ou 3 chiffres',
    operation: 'mélange',
    tips: [
      'Les trois opérations, avec de plus grands nombres : la méthode ne change pas. Colonne par colonne, en commençant par les unités.',
      'Addition de trois nombres : aligne bien les unités sous les unités, surtout sous un nombre de 4 chiffres. La retenue peut être 2.',
      'Soustraction avec des 0 : 0 est plus petit que le chiffre du bas. Alors ajoute 10 en haut (0 devient 10) et compense en bas, comme d’habitude.',
      'Multiplication par 3 chiffres : une ligne par chiffre. La 2ᵉ ligne commence par un 0, la 3ᵉ par deux 0 : tu multiplies par des centaines.',
      'Additionne toutes les lignes : c’est le résultat.',
    ],
    examples: () => [new PosedAddition([2487, 365, 79]), new PosedSubtraction(4005, 1287), new PosedLongMultiplication(427, 356)],
    draw: drawMixed,
  },
  {
    belt: 'bleu-clair',
    skill: 'Additions et soustractions de nombres décimaux',
    goal: 'CM1',
    operation: 'mélange',
    tips: [
      'On aligne les unités sous les unités, les dixièmes sous les dixièmes… : les virgules sont toutes dans la même colonne.',
      'On complète les rangs vides avec des 0 (et la virgule pour un nombre entier) : tous les nombres ont autant de chiffres après la virgule. 22 = 22,00.',
      'Puis on calcule comme avec les nombres entiers : on commence par la droite, et on n’oublie pas les retenues.',
      'Il ne faut pas oublier de mettre la virgule au résultat, dans la colonne de la virgule !',
      'Pour vérifier, cherche un ordre de grandeur : 583,76 + 233,5, c’est proche de 600 + 200 = 800.',
    ],
    // Les exemples de la leçon de la classe (Calc 13) et de la fiche.
    examples: () => [new PosedAddition([3580, 1435], [1, 2]), new PosedSubtraction(13700, 5311, [0, 2])],
    draw: drawDecimal,
  },
  {
    belt: 'bleu-fonce',
    skill: 'Divisions décimales',
    operation: 'division',
    tips: [
      'Quand une division a un reste, on peut la continuer pour avoir un résultat plus précis.',
      'On divise d’abord la partie entière, comme d’habitude.',
      'Il reste quelque chose ? On écrit la virgule et un 0 au dividende : 15 = 15,0. Puis on abaisse le 0.',
      'On écrit la virgule au quotient dès qu’on abaisse le chiffre des dixièmes.',
      'On continue chiffre par chiffre : les dixièmes, puis les centièmes. On s’arrête aux centièmes.',
      'Pour vérifier : quotient × diviseur doit redonner le dividende, ou presque.',
    ],
    // L'exemple de la leçon de la classe (Calc 17), et le premier de la fiche.
    examples: () => [new PosedDivision(15, 2, 1), new PosedDivision(100, 7, 2)],
    draw: (random, index) => new PosedDivision(...drawDecimalDivision(index % 3, random), 2),
  },
  {
    belt: 'violette',
    skill: 'Multiplications de nombres décimaux',
    operation: 'multiplication',
    tips: [
      'Quand on pose la multiplication, on ne s’occupe pas de la virgule : on calcule comme avec des nombres entiers.',
      'Une ligne par chiffre du nombre du bas : la 2ᵉ commence par un 0, la 3ᵉ par deux 0. Puis on additionne les lignes.',
      'Ensuite, on compte le nombre total de chiffres après la virgule dans les deux nombres : 2,54 × 1,3, c’est 2 + 1 = 3 chiffres.',
      'On place la virgule au résultat pour avoir autant de chiffres après la virgule : 3,302.',
      'Pour vérifier, cherche un ordre de grandeur : 7,8 × 9, c’est proche de 8 × 9 = 72.',
    ],
    // L'exemple de la leçon de la classe (Calc 16), et un nombre entier comme sur la fiche.
    examples: () => [new PosedLongMultiplication(254, 13, [2, 1]), new PosedLongMultiplication(1123, 25, [3, 0])],
    draw: (random, index) => {
      const { top, factor, places } = drawDecimalMultiplication(index % 3, random);
      return new PosedLongMultiplication(top, factor, places);
    },
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
