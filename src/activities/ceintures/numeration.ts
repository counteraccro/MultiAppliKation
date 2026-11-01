// Ceintures de numération : les ceintures du classeur, de la blanche à l'or
// (voir .ai/analyse/18-ceintures-numeration.md). Les questions se tirent au hasard sur le modèle des
// fiches Charivari (« entrainements numération.pdf ») ; les astuces viennent des leçons N1 à N9 de la classe.
// Une question se répond au pavé, au clavier de lettres (un nombre en lettres) ou en touchant un bouton.

import { numberToWords, numberToWordsTraditional } from '../../core/number-words';
import { shuffle, type NumberLineFigure, type QuizQuestion } from '../../core/quiz';
import type { BeltId } from './belts';
import { pickCalcs } from './calcul-mental';

/** Une question, résolue pour les listes (`solved`), avec l'astuce de la leçon. */
export interface NumerationQuestion extends QuizQuestion {
  solved: string;
  explain: string;
  /** Pour ne pas redonner les mêmes au prochain entraînement. */
  id: string;
}

type Draw = (random: () => number) => NumerationQuestion;

export interface NumerationBelt {
  belt: BeltId;
  /** Ce que demande la ceinture, comme dans le classeur. */
  skill: string;
  /** « Objectif de fin de CE2 » dans le classeur. */
  goal?: 'CE2' | 'CM1' | 'CM2';
  /** Les astuces des leçons de la classe. */
  tips: readonly string[];
  /** Les questions expliquées dans la leçon. */
  examples: () => NumerationQuestion[];
  /** Les sortes de questions de la ceinture, posées à tour de rôle. */
  kinds: readonly Draw[];
}

/** Questions d'un entraînement, et de l'entraînement en conditions réelles (réussi à 9 justes). */
export const NUMERATION_PRACTICE_SIZE = 10;
export const NUMERATION_TEST_SIZE = 10;
/** Le plus long nombre en lettres de la jaune : « sept-cent-soixante-dix-sept » ; la marge pour la suite. */
export const NUMERATION_MAX_LETTERS = 60;

const between = (min: number, max: number, random: () => number) => min + Math.floor(random() * (max - min + 1));
const pick = <T>(items: readonly T[], random: () => number) => items[Math.floor(random() * items.length)]!;

function question(fields: Omit<NumerationQuestion, 'id'>): NumerationQuestion {
  return { ...fields, id: fields.solved };
}

const RANKS = ['unités', 'dizaines', 'centaines', 'unités de mille'] as const;

// --- Le chiffre d'un rang : toucher le chiffre dans le nombre ---

/** « Touche le chiffre des dizaines » dans 54 ; `rank` : 0 les unités, 1 les dizaines… */
export function digitOf(n: number, rank: number): NumerationQuestion {
  const digits = [...String(n)];
  const at = digits.length - 1 - rank;
  const digit = digits[at]!;
  const name = RANKS[rank]!;
  return question({
    context: `Touche le chiffre des ${name}`,
    prompt: String(n),
    choices: digits.map((d, i) => ({ label: d, value: String(i) })),
    choiceLayout: 'number',
    answer: String(at),
    solved: `Dans ${n}, le chiffre des ${name} est ${digit}.`,
    explain: `${n} = ${digits.map((d, i) => `${d} ${RANKS[digits.length - 1 - i]}`).join(', ').replace(/, ([^,]*)$/, ' et $1')}.`,
  });
}

/** « Dans 258, combien y a-t-il de dizaines ? » : 25 (leçon N5, on cache les unités). */
export function numberOf(n: number, rank: 1 | 2): NumerationQuestion {
  const name = RANKS[rank]!;
  const count = Math.floor(n / 10 ** rank);
  const hidden = rank === 1 ? 'le chiffre des unités' : 'les chiffres des dizaines et des unités';
  return question({
    context: `Dans ${n}, combien y a-t-il de ${name} ?`,
    prompt: '',
    suffix: name,
    answer: count,
    solved: `Dans ${n}, il y a ${count} ${name}.`,
    explain: `On cache ${hidden} : on peut faire ${count} paquets de ${10 ** rank}. Le chiffre des ${name}, lui, est ${String(n).at(-1 - rank)}.`,
  });
}

// --- Les nombres en lettres ---

/** soixante-seize = 60 + 16 : les morceaux qu'on entend, de 1 à 999. */
function heard(n: number): number[] {
  const parts: number[] = [];
  if (n >= 100) parts.push(Math.floor(n / 100) * 100);
  const rest = n % 100;
  const base = rest >= 80 ? 80 : rest >= 60 ? 60 : rest >= 20 ? Math.floor(rest / 10) * 10 : 0;
  if (base > 0) parts.push(base);
  if (rest - base > 0) parts.push(rest - base);
  return parts;
}

/** « soixante-seize » → 76, au pavé. */
export function wordsToDigits(n: number): NumerationQuestion {
  const words = numberToWords(n);
  const parts = heard(n);
  return question({
    context: 'Écris en chiffres',
    prompt: words,
    answer: n,
    solved: `${words} = ${n}`,
    explain: parts.length > 1 ? `${words}, c’est ${parts.join(' + ')} = ${n}.` : `${words}, c’est ${n}.`,
  });
}

/** 76 → « soixante-seize », au clavier de lettres ; l'orthographe traditionnelle est juste aussi. */
export function digitsToWords(n: number): NumerationQuestion {
  const words = numberToWords(n);
  const traditional = numberToWordsTraditional(n);
  const rule = /cents|vingts/.test(words)
    ? '« cent » et « vingt » prennent un s quand ils sont multipliés et que rien ne les suit.'
    : words.includes('-et-')
      ? 'On ajoute « et » dans 21, 31, 41, 51, 61 et 71.'
      : 'On met des traits d’union entre tous les mots.';
  return question({
    context: 'Écris en lettres',
    prompt: String(n),
    input: 'letters',
    answer: words,
    ...(traditional !== words ? { alsoAccepted: [traditional] } : {}),
    solved: `${n} : ${words}`,
    explain: rule,
  });
}

const WRONG_TENS = ['vingt', 'trente', 'quarante', 'cinquante'];
const TEENS = ['onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];

/** « Ce nombre existe-t-il ? » : soixante-seize oui, cinquante-douze non (fiches n° 2 et 3). */
export function exists(words: string, n?: number): NumerationQuestion {
  const yes = n !== undefined;
  return question({
    context: 'Ce nombre existe-t-il ?',
    prompt: words,
    choices: [
      { label: 'Oui', value: 'oui' },
      { label: 'Non', value: 'non' },
    ],
    answer: yes ? 'oui' : 'non',
    solved: yes ? `${words} existe : ${n}.` : `${words} n’existe pas.`,
    explain: yes
      ? `${words}, c’est ${n}.`
      : `Après ${words.split('-')[0]}, on compte de un à neuf. Onze, douze… dix-neuf ne viennent qu’après dix, soixante et quatre-vingt.`,
  });
}

function drawExists(random: () => number, max: number): NumerationQuestion {
  if (random() < 0.5) {
    const n = between(20, max, random);
    return exists(numberToWords(n), n);
  }
  const tens = pick(WRONG_TENS, random);
  const teen = pick(TEENS, random);
  // « cinquante-et-onze » : comme vingt-et-un, mais ça n'existe pas non plus.
  return exists(teen === 'onze' && random() < 0.5 ? `${tens}-et-onze` : `${tens}-${teen}`);
}

// --- Suites, comparaisons, calculs ---

/** « 41, 39, 37, 35, … » : le nombre suivant. */
export function sequence(start: number, step: number): NumerationQuestion {
  const shown = [0, 1, 2, 3].map((i) => start + i * step);
  const next = start + 4 * step;
  const how = step > 0 ? `On ajoute ${step}` : `On enlève ${-step}`;
  return question({
    context: 'Continue la suite',
    prompt: `${shown.join(', ')},`,
    suffix: '',
    answer: next,
    solved: `${shown.join(', ')}, ${next}`,
    explain: `${how} à chaque fois : ${shown[3]} ${step > 0 ? '+' : '−'} ${Math.abs(step)} = ${next}.`,
  });
}

function drawSequence(random: () => number, steps: readonly number[], min: number, max: number): NumerationQuestion {
  const step = pick(steps, random) * (random() < 0.5 ? 1 : -1);
  const span = 4 * Math.abs(step);
  const first = between(min, max - span, random);
  return sequence(step > 0 ? first : first + span, step);
}

const SYMBOLS = [
  { label: '<', value: '<' },
  { label: '>', value: '>' },
  { label: '=', value: '=' },
];

/** « 92 … 29 », « 7 + 40 … 47 » : <, > ou = (fiches n° 8 et 9) ; un côté peut être un calcul. */
export function compare(left: string, right: string): NumerationQuestion {
  const value = (side: string) => side.split(' + ').reduce((sum, n) => sum + Number(n), 0);
  const [a, b] = [value(left), value(right)];
  const symbol = a < b ? '<' : a > b ? '>' : '=';
  const sums = [left, right].filter((side) => side.includes('+')).map((side) => `${side} = ${value(side)}`);
  const [big, small] = a >= b ? [a, b] : [b, a];
  const why =
    a === b
      ? 'Il y en a autant des deux côtés.'
      : String(big).length > String(small).length
        ? `${big} a plus de chiffres que ${small}.`
        : 'On compare les chiffres en commençant par la gauche.';
  return question({
    context: 'Complète avec <, > ou =',
    prompt: left,
    suffix: right,
    choices: SYMBOLS,
    answer: symbol,
    solved: `${left} ${symbol} ${right}`,
    explain: `${sums.length > 0 ? `${sums.join(', ')}. ` : ''}${why} Le crocodile mange le plus grand.`,
  });
}

function drawCompare(random: () => number, max: number): NumerationQuestion {
  const digits = String(max).length;
  // Des unités : 40 et 40 seraient trop faciles à comparer.
  let n = between(10 ** (digits - 1), max, random);
  if (n % 10 === 0) n += 1;
  // Les mêmes chiffres dans un autre ordre (92 et 29, 435 et 453), sinon le nombre d'à côté.
  let other = Number(shuffle([...String(n)], random).join(''));
  if (other === n || String(other).length < digits) other = n + 1 > max ? n - 1 : n + 1;
  // Le nombre, ou une décomposition : 7 + 40 (le même), 20 + 8 (l'autre).
  const kind = between(0, 2, random);
  const right = kind === 0 ? String(other) : shuffle(parts(kind === 1 ? n : other), random).join(' + ');
  return random() < 0.5 ? compare(String(n), right) : compare(right, String(n));
}

/** 345 = 300 + 40 + 5 : les centaines, dizaines et unités (sans les zéros). */
function parts(n: number): number[] {
  return [...String(n)].map((d, i, all) => Number(d) * 10 ** (all.length - 1 - i)).filter((p) => p > 0);
}

/** « 41 + … = 100 » (fiches n° 6 et 7). */
export function complementTo100(n: number): NumerationQuestion {
  const up = Math.ceil(n / 10) * 10;
  const answer = 100 - n;
  return question({
    context: 'Complète',
    prompt: `${n} +`,
    suffix: '= 100',
    answer,
    solved: `${n} + ${answer} = 100`,
    explain:
      up === n
        ? `${n / 10} dizaines + ${answer / 10} dizaines = 10 dizaines.`
        : `${n} + ${up - n} = ${up}, ${up} + ${100 - up} = 100 : ${up - n} + ${100 - up} = ${answer}.`,
  });
}

/** « 3 dizaines », « 1 centaine ». */
const named = (count: number, rank: number) => `${count} ${count > 1 ? RANKS[rank] : RANKS[rank]!.slice(0, -1)}`;

/** « 12 unités + 3 dizaines = » (fiches n° 10, 11, 29 à 31) : des nombres d'unités, de dizaines, de centaines. */
export function groups(counts: readonly (readonly [count: number, rank: number])[]): NumerationQuestion {
  const text = counts.map(([count, rank]) => named(count, rank)).join(' + ');
  const values = counts.map(([count, rank]) => count * 10 ** rank);
  const answer = values.reduce((a, b) => a + b, 0);
  const converted = counts.filter(([, rank]) => rank > 0).map(([count, rank]) => `${named(count, rank)} = ${count * 10 ** rank}`);
  return question({
    prompt: text,
    answer,
    solved: `${text} = ${answer}`,
    explain: values.length > 1 ? `${converted.join(', ')} ; ${values.join(' + ')} = ${answer}.` : `${converted[0]} : 10 dizaines font 1 centaine.`,
  });
}

/** Le double ou la moitié (fiches n° 15 et 16). */
export function doubleOrHalf(n: number, half: boolean): NumerationQuestion {
  const answer = half ? n / 2 : n * 2;
  const name = half ? 'La moitié' : 'Le double';
  return question({
    prompt: `${name} de ${n}`,
    answer,
    solved: `${name} de ${n} = ${answer}`,
    explain: half ? `${answer} + ${answer} = ${n} : la moitié, c’est partager en 2.` : `Le double, c’est deux fois plus : ${n} + ${n} = ${answer}.`,
  });
}

/** Les petits problèmes des fiches n° 13 et 14 : des dizaines d'images. */
export function imagesProblem(start: number, tens: number, gained: boolean): NumerationQuestion {
  const [text, answer, calc] = gained
    ? [
        `J’ai ${start} images. Lila me donne ${tens} dizaines d’images. Combien ai-je d’images maintenant ?`,
        start + tens * 10,
        `${tens} dizaines, c’est ${tens * 10} : ${start} + ${tens * 10} = ${start + tens * 10}.`,
      ]
    : [
        `J’avais ${tens} dizaines d’images mais j’ai perdu ${start} images. Combien ai-je d’images maintenant ?`,
        tens * 10 - start,
        `${tens} dizaines d’images, c’est ${tens * 10} images : ${tens * 10} − ${start} = ${tens * 10 - start}.`,
      ];
  return question({ context: text, prompt: '', suffix: 'images', answer, solved: `${text} ${answer} images.`, explain: calc });
}

// --- La droite graduée (leçon N9) ---

/**
 * « À quel nombre correspond le repère A ? » : 11 graduations de `step`, deux nombres écrits
 * (`label`, sur la graduation `labelAt`, et `labelEvery` graduations plus loin), le repère sur `marker`.
 */
export function numberLine(label: number, labelAt: number, step: number, labelEvery: number, marker: number): NumerationQuestion {
  const from = label - labelAt * step;
  const figure: NumberLineFigure = {
    from,
    step,
    count: 11,
    labels: [labelAt, labelAt + labelEvery],
    marker,
    markerName: 'A',
  };
  const answer = from + marker * step;
  // On part du nombre écrit le plus proche.
  const start = Math.abs(marker - labelAt) <= Math.abs(marker - labelAt - labelEvery) ? labelAt : labelAt + labelEvery;
  const startValue = from + start * step;
  const jumps = marker - start;
  const second = label + labelEvery * step;
  return question({
    context: 'À quel nombre correspond le repère A ?',
    prompt: 'A',
    figure,
    answer,
    solved: `Sur la droite graduée de ${step} en ${step}, le repère A est ${answer}.`,
    explain: `De ${label} à ${second}, il y a ${labelEvery} graduation${labelEvery > 1 ? 's' : ''} : chacune vaut ${step}. A est ${Math.abs(jumps)} graduation${Math.abs(jumps) > 1 ? 's' : ''} ${jumps > 0 ? 'après' : 'avant'} ${startValue} : ${startValue} ${jumps > 0 ? '+' : '−'} ${Math.abs(jumps * step)} = ${answer}.`,
  });
}

/** `scales` : le pas d'une graduation, et tous les combien un nombre est écrit. */
function drawNumberLine(random: () => number, scales: readonly (readonly [number, number])[], max: number): NumerationQuestion {
  const [step, every] = pick(scales, random);
  const labelAt = between(0, 1, random);
  // Le premier nombre écrit tombe juste (60, 300) ; la droite ne dépasse pas `max`.
  const unit = step * every;
  const highest = Math.floor((max - (10 - labelAt) * step) / unit) * unit;
  const lowest = Math.ceil((labelAt * step) / unit) * unit;
  const label = between(Math.max(1, lowest / unit), highest / unit, random) * unit;
  const free = Array.from({ length: 11 }, (_, i) => i).filter((i) => i !== labelAt && i !== labelAt + every);
  return numberLine(label, labelAt, step, every, pick(free, random));
}

// --- Les ceintures ---

/** La blanche : les nombres jusqu'à 99 (fiches n° 1 à 18). */
const BLANCHE_KINDS: readonly Draw[] = [
  (random) => {
    const n = between(10, 99, random);
    return digitOf(n, between(0, 1, random));
  },
  (random) => drawExists(random, 99),
  (random) => wordsToDigits(between(17, 99, random)),
  (random) => digitsToWords(between(11, 99, random)),
  (random) => drawSequence(random, [1, 2, 5, 10], 0, 99),
  (random) => drawCompare(random, 99),
  (random) => complementTo100(between(1, 99, random)),
  (random) =>
    random() < 0.5
      ? groups([
          [between(10, 29, random), 0],
          [between(1, 6, random), 1],
        ])
      : groups([
          [between(1, 8, random), 1],
          [10, 0],
        ]),
  (random) => (random() < 0.5 ? doubleOrHalf(between(3, 45, random), false) : doubleOrHalf(between(2, 40, random) * 2, true)),
  (random) => (random() < 0.5 ? imagesProblem(between(11, 69, random), between(1, 3, random), true) : imagesProblem(between(1, 9, random), between(3, 9, random), false)),
  (random) =>
    drawNumberLine(
      random,
      [
        [1, 10],
        [2, 5],
        [5, 2],
        [10, 1],
      ],
      99,
    ),
];

/** La jaune : les nombres jusqu'à 999 (fiches n° 19 à 35). */
const JAUNE_KINDS: readonly Draw[] = [
  (random) => (random() < 0.7 ? numberOf(between(100, 999, random), 1) : numberOf(between(1000, 9999, random), random() < 0.5 ? 1 : 2)),
  (random) => {
    const n = between(100, random() < 0.8 ? 999 : 9999, random);
    return digitOf(n, between(0, Math.min(2, String(n).length - 1), random));
  },
  (random) => wordsToDigits(between(100, 999, random)),
  (random) => digitsToWords(between(100, 999, random)),
  (random) => drawSequence(random, [1, 5, 10, 20, 100], 100, 999),
  (random) => drawCompare(random, 999),
  (random) => {
    const kind = between(0, 3, random);
    if (kind === 0) return groups([[between(2, 9, random), 2]]);
    if (kind === 1) return groups([[between(2, 9, random) * 10, 1]]);
    if (kind === 2) return groups([[between(2, 9, random) * 10, 1], [between(1, 4, random) * 10, 0]]);
    return groups([[between(1, 8, random), 2], [10, 1]]);
  },
  (random) =>
    drawNumberLine(
      random,
      [
        [10, 10],
        [20, 5],
        [5, 2],
      ],
      999,
    ),
];

export const NUMERATION: readonly NumerationBelt[] = [
  {
    belt: 'blanche',
    skill: 'Lire, écrire, représenter et comparer les nombres jusqu’à 99',
    tips: [
      'Dans 54, il y a 5 dizaines et 4 unités : le chiffre des dizaines est 5, le chiffre des unités est 4.',
      'Pour comparer, on regarde d’abord les dizaines : 35 > 28, car 3 dizaines, c’est plus que 2 dizaines. Si elles sont pareilles, on compare les unités : 42 < 48. Le crocodile mange toujours le plus grand nombre.',
      'En lettres, on met des traits d’union entre tous les mots, et « et » dans 21, 31, 41, 51, 61 et 71 : vingt-et-un, soixante-et-onze.',
      'Après soixante et après quatre-vingt, on compte jusqu’à dix-neuf : soixante-douze, quatre-vingt-quinze. Mais on ne dit jamais cinquante-douze.',
      'Sur une droite graduée, cherche d’abord combien vaut une graduation, puis avance de graduation en graduation.',
    ],
    examples: () => [digitOf(54, 1), compare('82', '20 + 8'), wordsToDigits(76), numberLine(50, 1, 5, 2, 6)],
    kinds: BLANCHE_KINDS,
  },
  {
    belt: 'jaune',
    skill: 'Lire, écrire, représenter et comparer les nombres jusqu’à 999',
    tips: [
      'Dans 345, le chiffre des dizaines est 4, mais le nombre de dizaines est 34 : on cache les unités, on peut faire 34 paquets de 10.',
      '10 dizaines font 1 centaine : 20 dizaines = 200, et 6 centaines + 10 dizaines = 700.',
      'Pour comparer, on regarde les chiffres en commençant par la gauche : 453 > 435.',
      'En lettres : « cent » et « vingt » prennent un s quand ils sont multipliés et que rien ne les suit (trois-cents, quatre-vingts), mais pas dans trois-cent-deux. Mille ne prend jamais de s.',
      'Sur une droite graduée : entre 800 et 900, il y a 10 graduations, chacune vaut 10.',
    ],
    examples: () => [numberOf(345, 1), groups([[6, 2], [10, 1]]), digitsToWords(380), numberLine(200, 1, 10, 10, 6)],
    kinds: JAUNE_KINDS,
  },
];

/** Les questions d'une série : les sortes de la ceinture à tour de rôle, en commençant au hasard. */
export function pickNumeration(belt: NumerationBelt, count: number, seen: readonly string[] = [], random = Math.random): NumerationQuestion[] {
  const offset = Math.floor(random() * belt.kinds.length);
  return pickCalcs((r, index) => belt.kinds[(index + offset) % belt.kinds.length]!(r), count, seen, random);
}
