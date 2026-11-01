// Ceintures de numération : les ceintures du classeur, de la blanche à l'or
// (voir .ai/analyse/18-ceintures-numeration.md). Les questions se tirent au hasard sur le modèle des
// fiches Charivari (« entrainements numération.pdf ») ; les astuces viennent des leçons N1 à N10 de la classe.
// Une question se répond au pavé, au clavier de lettres (un nombre en lettres) ou en touchant un bouton.

import { fractionToWords, numberToWords, numberToWordsTraditional } from '../../core/number-words';
import { groupDigits, numberText, shuffle, type NumberLineFigure, type PartsFigure, type QuizQuestion } from '../../core/quiz';
import type { BeltId } from './belts';
import { addDecimals, decimalToFraction, fractionToDecimal, pickCalcs, type MentalQuestion } from './calcul-mental';

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
  /** Nombres décimaux : la touche virgule au pavé. */
  decimal?: boolean;
}

/** Questions d'un entraînement, et de l'entraînement en conditions réelles (réussi à 9 justes). */
export const NUMERATION_PRACTICE_SIZE = 10;
export const NUMERATION_TEST_SIZE = 10;
/** Le plus long nombre en lettres : « cinq-cent-cinquante-millions-cinquante-mille-cinq » (bleue), et la marge. */
export const NUMERATION_MAX_LETTERS = 60;
/** Les milliards de la bleue se tapent au pavé : 2 005 000 000. */
export const NUMERATION_MAX_DIGITS = 10;
/** Les mots tirés pour écrire en lettres restent plus courts que ça. */
const WORDS_LENGTH = 52;

const between = (min: number, max: number, random: () => number) => min + Math.floor(random() * (max - min + 1));
const pick = <T>(items: readonly T[], random: () => number) => items[Math.floor(random() * items.length)]!;

function question(fields: Omit<NumerationQuestion, 'id'>): NumerationQuestion {
  return { ...fields, id: fields.solved };
}

/** 57 842 : les classes séparées par une espace, comme en classe (leçon N10) ; 4,07 avec la virgule. */
const spaced = (n: number) => groupDigits(numberText(n));
/** 3 + 0,6 ne tombe pas toujours juste avec les nombres de l'ordinateur : on arrondit au millionième. */
const round = (n: number) => (Number.isInteger(n) ? n : Math.round(n * 1e6) / 1e6);

const RANKS = [
  'unités',
  'dizaines',
  'centaines',
  'milliers',
  'dizaines de milliers',
  'centaines de milliers',
  'millions',
  'dizaines de millions',
  'centaines de millions',
  'milliards',
] as const;
/** Les classes de trois chiffres, de droite à gauche (leçon N10). */
const CLASSES = ['unités simples', 'mille', 'millions', 'milliards'] as const;

/** « dizaines de milliers » → « dizaine de milliers », « unités » → « unité ». */
const singular = (name: string) => name.replace(/s( |$)/, '$1');

// --- Le chiffre d'un rang : toucher le chiffre dans le nombre ---

/** « Touche le chiffre des dizaines » dans 54 ; `rank` : 0 les unités, 1 les dizaines… */
export function digitOf(n: number, rank: number): NumerationQuestion {
  const digits = [...String(n)];
  const at = digits.length - 1 - rank;
  const digit = digits[at]!;
  const name = RANKS[rank]!;
  // Un grand nombre se lit par classes : le chiffre des dizaines de milliers est celui des dizaines de la classe des mille.
  const group = spaced(n).split('\u00a0').at(-1 - Math.floor(rank / 3))!;
  const explain =
    n < 10000
      ? `${spaced(n)} = ${digits.map((d, i) => `${d} ${RANKS[digits.length - 1 - i]}`).join(', ').replace(/, ([^,]*)$/, ' et $1')}.`
      : `La classe des ${CLASSES[Math.floor(rank / 3)]} est ${group} : son chiffre des ${RANKS[rank % 3]} est ${digit}.`;
  return question({
    context: `Touche le chiffre des ${name}`,
    prompt: spaced(n),
    choices: digits.map((d, i) => ({ label: d, value: String(i) })),
    choiceLayout: 'number',
    answer: String(at),
    solved: `Dans ${spaced(n)}, le chiffre des ${name} est ${digit}.`,
    explain,
  });
}

/**
 * « Dans 258, combien y a-t-il de dizaines ? » : 25 (leçon N5, on cache les unités) ;
 * « dans 45 863, de milliers ? » : 45, on lit le nombre jusqu'au chiffre des milliers (fiches n° 72 à 74, 79 à 81).
 */
export function numberOf(n: number, rank: number): NumerationQuestion {
  const name = RANKS[rank]!;
  const count = Math.floor(n / 10 ** rank);
  const digit = String(n).at(-1 - rank);
  const hidden = rank === 1 ? 'le chiffre des unités' : 'les chiffres des dizaines et des unités';
  const explain =
    count === 0
      ? `${spaced(n)} n’a pas de chiffre des ${name} : il n’y a aucun paquet de ${spaced(10 ** rank)}.`
      : rank <= 2
        ? `On cache ${hidden} : on peut faire ${spaced(count)} paquets de ${10 ** rank}. Le chiffre des ${name}, lui, est ${digit}.`
        : `On lit ${spaced(n)} jusqu’au chiffre des ${name} : ${spaced(count)}. Le chiffre des ${name}, lui, est ${digit}.`;
  return question({
    context: `Dans ${spaced(n)}, combien y a-t-il de ${name} ?`,
    prompt: '',
    suffix: name,
    answer: count,
    solved: `Dans ${spaced(n)}, il y a ${spaced(count)} ${count > 1 ? name : singular(name)}.`,
    explain,
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

/** 8 800 008 : « 8 millions, 800 mille et 8 », les classes qu'on entend. */
function byClass(n: number): string {
  const said = String(n)
    .padStart(12, '0')
    .match(/\d{3}/g)!
    .map(Number)
    .map((count, i) => [count, ['milliard', 'million', 'mille', ''][i]!] as const)
    .filter(([count]) => count > 0)
    .map(([count, name]) => (name === '' ? String(count) : `${count} ${name}${count > 1 && name !== 'mille' ? 's' : ''}`));
  return said.join(', ').replace(/, ([^,]*)$/, ' et $1');
}

/** « soixante-seize » → 76, « huit-cent-huit-mille » → 808 000, au pavé. */
export function wordsToDigits(n: number): NumerationQuestion {
  const words = numberToWords(n);
  const parts = heard(n);
  const explain =
    n >= 1000
      ? `On lit par classes : ${byClass(n)}. Chaque classe s’écrit avec 3 chiffres, des 0 s’il le faut : ${spaced(n)}.`
      : parts.length > 1
        ? `${words}, c’est ${parts.join(' + ')} = ${n}.`
        : `${words}, c’est ${n}.`;
  return question({
    context: 'Écris en chiffres',
    prompt: words,
    answer: n,
    solved: `${words} = ${spaced(n)}`,
    explain,
  });
}

/** 76 → « soixante-seize », au clavier de lettres ; l'orthographe traditionnelle est juste aussi. */
export function digitsToWords(n: number): NumerationQuestion {
  const words = numberToWords(n);
  // Les fiches écrivent « neuf-cent-millions » sans s (fiches n° 83, 86) : juste aussi.
  const accepted = [numberToWordsTraditional(n), words.replace(/cents-(millions|milliards)/g, 'cent-$1')].filter(
    (text, i, all) => text !== words && all.indexOf(text) === i,
  );
  const rule = /millions|milliards/.test(words)
    ? 'Million et milliard sont des noms : ils prennent un s quand il y en a plusieurs. Mille, lui, n’en prend jamais.'
    : /cents|vingts/.test(words)
      ? '« cent » et « vingt » prennent un s quand ils sont multipliés et que rien ne les suit.'
      : words.includes('-et-')
        ? 'On ajoute « et » dans 21, 31, 41, 51, 61 et 71.'
        : n >= 2000 && words.includes('mille')
          ? 'Mille ne prend jamais de s, et on met des traits d’union entre tous les mots.'
          : 'On met des traits d’union entre tous les mots.';
  return question({
    context: 'Écris en lettres',
    prompt: spaced(n),
    input: 'letters',
    answer: words,
    ...(accepted.length > 0 ? { alsoAccepted: accepted } : {}),
    solved: `${spaced(n)} : ${words}`,
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
  // Trois nombres seulement quand ils sont grands, comme sur les fiches n° 77 et 78.
  const shown = (start >= 10000 ? [0, 1, 2] : [0, 1, 2, 3]).map((i) => round(start + i * step));
  const last = shown.at(-1)!;
  const next = round(last + step);
  const how = step > 0 ? `On ajoute ${spaced(step)}` : `On enlève ${spaced(-step)}`;
  // Des décimaux : « 1,5 ; 1,4 ; 1,3 » : la virgule est déjà dans les nombres.
  const separator = Number.isInteger(step) && Number.isInteger(start) ? ',' : ' ;';
  const text = shown.map(spaced).join(`${separator} `);
  return question({
    context: 'Continue la suite',
    prompt: `${text}${separator}`,
    suffix: '',
    answer: next,
    solved: `${text}${separator} ${spaced(next)}`,
    explain: `${how} à chaque fois : ${spaced(last)} ${step > 0 ? '+' : '−'} ${spaced(Math.abs(step))} = ${spaced(next)}.`,
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
  const value = (side: string) => side.split(' + ').reduce((sum, n) => sum + Number(n.replace(/\s/g, '')), 0);
  const [a, b] = [value(left), value(right)];
  const symbol = a < b ? '<' : a > b ? '>' : '=';
  const sums = [left, right].filter((side) => side.includes('+')).map((side) => `${side} = ${spaced(value(side))}`);
  const [big, small] = a >= b ? [a, b] : [b, a];
  const why =
    a === b
      ? 'Il y en a autant des deux côtés.'
      : String(big).length > String(small).length
        ? `${spaced(big)} a plus de chiffres que ${spaced(small)}.`
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

// --- Les grands nombres (leçon N10) ---

/** 57 842 groupé autrement, ou avec un 0 au début : les écritures fausses de la fiche n° 67. */
function badlyWritten(n: number): string[] {
  const digits = String(n);
  const fromLeft = digits.match(/\d{1,3}/g)!.join('\u00a0');
  const byTwo = digits.replace(/\B(?=(\d{2})+$)/g, '\u00a0');
  const leadingZero = groupDigits(`0${digits}`);
  return [fromLeft, byTwo, leadingZero].filter((text, i, all) => text !== spaced(n) && all.indexOf(text) === i);
}

/** « Touche le nombre bien écrit » : 30 300, et non 303 00 ni 030 300 (fiche n° 67). */
export function wellWritten(n: number, random: () => number = Math.random): NumerationQuestion {
  const right = spaced(n);
  const wrong = shuffle(badlyWritten(n), random).slice(0, 2);
  return question({
    context: 'Touche le nombre bien écrit',
    prompt: '',
    choices: shuffle([right, ...wrong], random).map((text) => ({ label: text, value: text })),
    answer: right,
    solved: `${right} est bien écrit.`,
    explain: 'Les chiffres sont groupés par trois en partant de la droite, et il n’y a pas de 0 au début du nombre.',
  });
}

/** Le nom de 10, 100, 1 000… pour dire « 23 centaines ». */
const rankOf = (n: number) => {
  let rank = 0;
  while (n % 10 ** (rank + 1) === 0) rank++;
  return rank;
};

/** « 2 300 + … = 3 000 », « 1 605 250 + … = 1 606 000 » (fiches n° 75 et 84). */
export function complementTo(n: number, target: number): NumerationQuestion {
  const answer = target - n;
  // De dizaine en centaine, en millier… : 1 605 250 + 50 = 1 605 300, + 700 = 1 606 000.
  const jumps: number[] = [];
  for (let size = 10, at = n; at < target; size *= 10) {
    const next = Math.ceil(at / size) * size;
    if (next > at) jumps.push(next - at);
    at = next;
  }
  const unit = Math.min(rankOf(n), rankOf(answer));
  const name = RANKS[unit]!;
  const count = (value: number) => `${spaced(value / 10 ** unit)} ${name}`;
  let at = n;
  const steps = jumps.map((jump, i) => `${i === 0 ? `${spaced(n)} ` : 'puis '}+ ${spaced(jump)} = ${spaced((at += jump))}`);
  const explain =
    jumps.length > 1
      ? `${steps.join(', ')} : ${jumps.map(spaced).join(' + ')} = ${spaced(answer)}.`
      : `${count(n)} + ${count(answer)} = ${count(target)}.`;
  return question({
    context: 'Complète',
    prompt: `${spaced(n)} +`,
    suffix: `= ${spaced(target)}`,
    answer,
    solved: `${spaced(n)} + ${spaced(answer)} = ${spaced(target)}`,
    explain,
  });
}

/** « 49 200 = 40 000 + … + 200 » : la décomposition, avec un morceau à trouver (fiche n° 76). */
export function decompose(n: number, hole: number): NumerationQuestion {
  const all = parts(n);
  const missing = all[hole]!;
  const rank = String(missing).length - 1;
  const before = all.slice(0, hole).map(spaced);
  const after = all.slice(hole + 1).map(spaced);
  return question({
    context: 'Complète la décomposition',
    prompt: [`${spaced(n)} =`, ...before.map((part) => `${part} +`)].join(' '),
    suffix: after.map((part) => `+ ${part}`).join(' '),
    answer: missing,
    solved: `${spaced(n)} = ${all.map(spaced).join(' + ')}`,
    explain: `Dans ${spaced(n)}, ${String(missing)[0]} est le chiffre des ${RANKS[rank]} : il vaut ${spaced(missing)}.`,
  });
}

/** « 4 × 10 000 000 + 6 × 100 » (fiche n° 88). */
export function timesPowers(a: number, rankA: number, b: number, rankB: number): NumerationQuestion {
  const [x, y] = [a * 10 ** rankA, b * 10 ** rankB];
  const text = `${a} × ${spaced(10 ** rankA)} + ${b} × ${spaced(10 ** rankB)}`;
  return question({
    prompt: text,
    answer: x + y,
    solved: `${text} = ${spaced(x + y)}`,
    explain: `${a} × ${spaced(10 ** rankA)} = ${spaced(x)} et ${b} × ${spaced(10 ** rankB)} = ${spaced(y)} : ${spaced(x)} + ${spaced(y)} = ${spaced(x + y)}.`,
  });
}

/** « 2 500 000 = 2 × … + 5 × 100 000 » : décomposer avec des multiplications (fiche n° 89). */
export function decomposeTimes(a: number, rankA: number, b: number, rankB: number, hole: 0 | 1): NumerationQuestion {
  const n = a * 10 ** rankA + b * 10 ** rankB;
  const [digit, rank] = hole === 0 ? [a, rankA] : [b, rankB];
  const full = `${a} × ${spaced(10 ** rankA)} + ${b} × ${spaced(10 ** rankB)}`;
  return question({
    context: 'Complète la décomposition',
    prompt: hole === 0 ? `${spaced(n)} = ${a} ×` : `${spaced(n)} = ${a} × ${spaced(10 ** rankA)} + ${b} ×`,
    suffix: hole === 0 ? `+ ${b} × ${spaced(10 ** rankB)}` : '',
    answer: 10 ** rank,
    solved: `${spaced(n)} = ${full}`,
    explain: `Dans ${spaced(n)}, ${digit} est le chiffre des ${RANKS[rank]} : il vaut ${digit} × ${spaced(10 ** rank)}.`,
  });
}

/** Un nombre de `digits` chiffres avec beaucoup de 0, comme ceux des fiches (303 030 000, 107 007). */
function sparse(digits: number, random: () => number): number {
  let text = String(between(1, 9, random));
  for (let i = 1; i < digits; i++) text += random() < 0.6 ? '0' : String(between(1, 9, random));
  return Number(text);
}

/** Un nombre de `min` à `max` chiffres qui ne s'écrit pas en trop de lettres. */
function sayable(min: number, max: number, random: () => number): number {
  for (;;) {
    const n = sparse(between(min, max, random), random);
    if (numberToWords(n).length <= WORDS_LENGTH) return n;
  }
}

/** Comparer deux grands nombres : les mêmes chiffres dans un autre ordre, ou un chiffre de moins. */
function drawBigCompare(random: () => number, minDigits: number, maxDigits: number): NumerationQuestion {
  const n = sparse(between(minDigits, maxDigits, random), random) + between(1, 9, random);
  let other = Number(shuffle([...String(n)], random).join(''));
  if (random() < 0.4 || other === n || String(other).length < String(n).length) {
    // 45 863 et 4 586 : celui qui a le plus de chiffres est le plus grand.
    other = Number(String(n).slice(0, -1)) || n + 1;
  }
  return random() < 0.5 ? compare(spaced(n), spaced(other)) : compare(spaced(other), spaced(n));
}

// --- La droite graduée (leçons N9 et N10) ---

/**
 * « À quel nombre correspond le repère A ? » : 11 graduations de `step`, deux nombres écrits
 * (`label`, sur la graduation `labelAt`, et `labelEvery` graduations plus loin), le repère sur `marker`.
 */
export function numberLine(label: number, labelAt: number, step: number, labelEvery: number, marker: number): NumerationQuestion {
  const from = round(label - labelAt * step);
  const figure: NumberLineFigure = {
    from,
    step,
    count: 11,
    labels: [labelAt, labelAt + labelEvery],
    markers: [{ at: marker, name: 'A' }],
  };
  const answer = round(from + marker * step);
  // On part du nombre écrit le plus proche.
  const start = Math.abs(marker - labelAt) <= Math.abs(marker - labelAt - labelEvery) ? labelAt : labelAt + labelEvery;
  const startValue = round(from + start * step);
  const jumps = marker - start;
  const second = round(label + labelEvery * step);
  return question({
    context: 'À quel nombre correspond le repère A ?',
    prompt: 'A',
    figure,
    answer,
    solved: `Sur la droite graduée de ${spaced(step)} en ${spaced(step)}, le repère A est ${spaced(answer)}.`,
    explain: `De ${spaced(label)} à ${spaced(second)}, il y a ${labelEvery} graduation${labelEvery > 1 ? 's' : ''} : chacune vaut ${spaced(step)}. A est ${Math.abs(jumps)} graduation${Math.abs(jumps) > 1 ? 's' : ''} ${jumps > 0 ? 'après' : 'avant'} ${spaced(startValue)} : ${spaced(startValue)} ${jumps > 0 ? '+' : '−'} ${spaced(round(Math.abs(jumps * step)))} = ${spaced(answer)}.`,
  });
}

/**
 * La même droite, mais on choisit parmi quatre nombres (fiche n° 90) : le bon, et les chiffres
 * décalés d'un rang (3 200 000 : 3 020 000, 3 002 000, 32 000 000).
 */
export function numberLineChoices(label: number, labelAt: number, step: number, labelEvery: number, marker: number): NumerationQuestion {
  const line = numberLine(label, labelAt, step, labelEvery, marker);
  const answer = line.answer as number;
  const head = Math.floor(answer / (step * 10)) * step * 10;
  const digit = (answer - head) / step;
  const others = [head + (digit * step) / 10, head + (digit * step) / 100, (head / step + digit) * step * 10];
  return {
    ...line,
    context: 'Quel nombre correspond au repère A ?',
    // On répond avec un bouton : pas de « A = ».
    prompt: '',
    choices: [answer, ...others]
      .sort((a, b) => a - b)
      .map((n) => ({ label: spaced(n), value: String(n) })),
    answer: String(answer),
  };
}

/** `scales` : le pas d'une graduation, et tous les combien un nombre est écrit. */
function drawNumberLine(random: () => number, scales: readonly (readonly [number, number])[], max: number): NumerationQuestion {
  const [step, every] = pick(scales, random);
  // Les deux nombres écrits tiennent sur les 11 graduations : de 10 en 10, le premier est au bout.
  const labelAt = between(0, Math.min(1, 10 - every), random);
  // Le premier nombre écrit tombe juste (60, 300) ; la droite ne dépasse pas `max`.
  const unit = step * every;
  const highest = Math.floor((max - (10 - labelAt) * step) / unit) * unit;
  const lowest = Math.ceil((labelAt * step) / unit) * unit;
  const label = between(Math.max(1, lowest / unit), highest / unit, random) * unit;
  const free = Array.from({ length: 11 }, (_, i) => i).filter((i) => i !== labelAt && i !== labelAt + every);
  return numberLine(label, labelAt, step, every, pick(free, random));
}

// --- Les fractions (leçons N11, N14 à N16 et N20) ---

/** « 3/4 » : l'écran l'écrit en colonne, comme au cahier. */
const frac = (numerator: number, denominator: number) => `${numerator}/${denominator}`;
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
/** « quart », « sixième » : le nom d'une part ; « quarts », « tiers » : de plusieurs. */
const partName = (denominator: number) => fractionToWords(1, denominator).split(' ')[1]!;
const partsName = (denominator: number) => fractionToWords(2, denominator).split(' ')[1]!;

/** « 3/4 » → « trois quarts », au clavier de lettres (fiches n° 37 à 39). */
export function fractionToLetters(numerator: number, denominator: number): NumerationQuestion {
  const words = fractionToWords(numerator, denominator);
  const traditional = fractionToWords(numerator, denominator, true);
  const plural = numerator > 1 && denominator !== 3 ? ', avec un s car il y en a plusieurs' : '';
  return question({
    context: 'Écris en lettres',
    prompt: frac(numerator, denominator),
    input: 'letters',
    answer: words,
    ...(traditional !== words ? { alsoAccepted: [traditional] } : {}),
    solved: `${frac(numerator, denominator)} : ${words}`,
    explain: `On lit le numérateur, ${numberToWords(numerator)}, puis le nom des parts : l’unité partagée en ${denominator}, ce sont des ${partsName(denominator)}${plural}.`,
  });
}

/** Des fractions qui ressemblent à la bonne : retournée, tiers et quarts confondus, le numérateur d'à côté. */
function lookalikes(numerator: number, denominator: number, others: readonly [number, number][]): string[] {
  const value = numerator / denominator;
  return others
    .filter(([n, d]) => n > 0 && d >= 2 && Math.abs(n / d - value) > 1e-9)
    .map(([n, d]) => frac(n, d))
    .filter((text, i, all) => all.indexOf(text) === i);
}

/** « neuf tiers » → toucher 9/3 parmi quatre fractions (fiche n° 42). */
export function lettersToFraction(numerator: number, denominator: number, random: () => number = Math.random): NumerationQuestion {
  const right = frac(numerator, denominator);
  const confused = denominator === 3 ? 4 : denominator === 4 ? 3 : denominator + 1;
  const wrong = lookalikes(numerator, denominator, [
    [denominator, numerator],
    [numerator, confused],
    [numerator + 1, denominator],
    [numerator, denominator - 1],
  ]).slice(0, 3);
  return question({
    context: 'Touche la fraction',
    prompt: fractionToWords(numerator, denominator),
    choices: shuffle([right, ...wrong], random).map((text) => ({ label: text, value: text })),
    answer: right,
    solved: `${fractionToWords(numerator, denominator)} : ${right}`,
    explain: `Des ${partsName(denominator)} : l’unité est partagée en ${denominator}, c’est le dénominateur, en bas. On en prend ${numerator}, c’est le numérateur, en haut.`,
  });
}

/** « Le dénominateur de 3/8 est … » (fiches n° 40 et 41). */
export function fractionPart(numerator: number, denominator: number, which: 'numérateur' | 'dénominateur'): NumerationQuestion {
  const answer = which === 'numérateur' ? numerator : denominator;
  return question({
    context: 'Complète',
    prompt: `Le ${which} de ${frac(numerator, denominator)} est`,
    suffix: '',
    answer,
    solved: `Le ${which} de ${frac(numerator, denominator)} est ${answer}.`,
    explain: 'Le numérateur est en haut : combien de parts on prend. Le dénominateur est en bas : en combien de parts égales on partage l’unité.',
  });
}

/** Une droite de 0 à `units`, chaque unité partagée en `parts` ; 0, 1, 2… écrits. */
function fractionLine(units: number, parts: number, markers: NumberLineFigure['markers']): NumberLineFigure {
  return { from: 0, step: 1 / parts, count: units * parts + 1, labels: Array.from({ length: units + 1 }, (_, i) => i * parts), markers };
}

/** « À quelle fraction correspond le repère A ? » : A = ?/4 (fiches n° 43 et 44). */
export function readFractionLine(units: number, parts: number, at: number): NumerationQuestion {
  return question({
    context: 'À quelle fraction correspond le repère A ?',
    prompt: 'A =',
    suffix: `/${parts}`,
    figure: fractionLine(units, parts, [{ at, name: 'A' }]),
    answer: at,
    solved: `Sur la droite partagée en ${partsName(parts)}, A = ${frac(at, parts)}.`,
    explain: `De 0 à 1, l’unité est partagée en ${parts} parts égales : chaque graduation vaut un ${partName(parts)}. A est à ${at} graduation${at > 1 ? 's' : ''} de 0 : ${frac(at, parts)}.`,
  });
}

const NAMES = ['A', 'B', 'C'];

/** « Quel repère correspond à 3/2 ? » sur une droite en quarts (fiches n° 45 et 46) ; la fraction peut être simplifiée. */
export function whichMarker(units: number, parts: number, ats: readonly number[], asked: number): NumerationQuestion {
  const at = ats[asked]!;
  const divisor = gcd(at, parts);
  const shown = frac(at / divisor, parts / divisor);
  const name = NAMES[asked]!;
  const how =
    divisor > 1
      ? `${shown} = ${frac(at, parts)} : on avance de ${at} graduations depuis 0`
      : `${shown} : on avance de ${at} graduation${at > 1 ? 's' : ''} depuis 0`;
  return question({
    context: 'Quel repère correspond à la fraction ?',
    prompt: shown,
    figure: fractionLine(units, parts, ats.map((a, i) => ({ at: a, name: NAMES[i]! }))),
    choices: NAMES.slice(0, ats.length).map((n) => ({ label: n, value: n })),
    answer: name,
    solved: `${shown}, c’est le repère ${name}.`,
    explain: `Chaque graduation vaut un ${partName(parts)}. ${how}, c’est le repère ${name}.`,
  });
}

/** « Place 7/6 » : toucher la graduation, sur une droite dont l'unité a `parts` graduations (fiches n° 94 à 100). */
export function placeFraction(units: number, parts: number, numerator: number, denominator: number): NumerationQuestion {
  const at = (numerator * parts) / denominator;
  const line = fractionLine(units, parts, []);
  const free = Array.from({ length: line.count }, (_, i) => i).filter((i) => !line.labels.includes(i));
  const shown = frac(numerator, denominator);
  return question({
    context: 'Touche la graduation de la fraction',
    prompt: shown,
    figure: line,
    // Le nom de chaque graduation, pour la correction : « C’était 6/8 ».
    choices: free.map((i) => ({ label: frac(i, parts), value: String(i) })),
    choiceLayout: 'line',
    answer: String(at),
    solved: `${shown} est à ${at} graduation${at > 1 ? 's' : ''} de 0, sur une droite dont l’unité a ${parts} graduations.`,
    explain:
      denominator === parts
        ? `L’unité est partagée en ${parts} : on avance de ${numerator} graduation${numerator > 1 ? 's' : ''} depuis 0.`
        : `L’unité est partagée en ${parts} : ${shown} = ${frac(at, parts)}, on avance de ${at} graduations depuis 0.`,
  });
}

/** « Colorie 2/3 des 12 billes », « 1/4 du rectangle » : toucher les parts (fiches n° 47 à 52, 91 à 93). */
export function paintFraction(total: number, numerator: number, denominator: number, shape: 'marbles' | 'grid'): NumerationQuestion {
  const each = total / denominator;
  const answer = each * numerator;
  const things = shape === 'marbles' ? 'billes' : 'cases';
  const figure: PartsFigure = { shape, count: total, columns: 6, colored: 0 };
  const shown = frac(numerator, denominator);
  return question({
    context: 'Touche pour colorier',
    prompt: shape === 'marbles' ? `Colorie ${shown} des ${total} billes` : `Colorie ${shown} du rectangle`,
    input: 'paint',
    figure,
    answer,
    solved: `${shown} de ${total} ${things}, c’est ${answer} ${answer > 1 ? things : things.slice(0, -1)}.`,
    explain: `On partage les ${total} ${things} en ${denominator} parts égales : ${each} par part. ${numerator === 1 ? `On colorie 1 part : ${answer}.` : `On colorie ${numerator} parts : ${numerator} × ${each} = ${answer}.`}`,
  });
}

/** « Quelle fraction est coloriée ? » : une barre, un rectangle, ou plusieurs barres (une par unité) (fiches n° 53 et 54). */
export function readColored(shape: 'grid' | 'bars', count: number, columns: number, colored: number, random: () => number = Math.random): NumerationQuestion {
  const denominator = shape === 'bars' ? columns : count;
  const right = frac(colored, denominator);
  const wrong = lookalikes(colored, denominator, [
    [denominator - colored, denominator],
    [colored, denominator - colored],
    [denominator, colored],
    [colored, count],
    [colored, denominator + 1],
  ]).slice(0, 3);
  return question({
    context: 'Quelle fraction est coloriée ?',
    prompt: '',
    figure: { shape, count, columns, colored },
    choices: shuffle([right, ...wrong], random).map((text) => ({ label: text, value: text })),
    answer: right,
    solved: `${colored} parts coloriées sur ${denominator} : ${right}.`,
    explain:
      shape === 'bars' && count > columns
        ? `Chaque barre est une unité partagée en ${columns} parts égales : ${colored} parts sont coloriées, c’est ${right}.`
        : `La forme est partagée en ${denominator} parts égales et ${colored} sont coloriées : ${right}.`,
  });
}

/** 3/4 + 1/2 = ?/4, 3/4 − 1/2, 2 × 3/4 (fiches n° 101 et 102, leçon N16). */
export function fractionCalc(a: number, b: number, op: '+' | '−' | '×', c: number, d: number): NumerationQuestion {
  // `a/b op c/d`, avec d qui divise b ; « × » : a × c/d.
  const text = op === '×' ? `${a} × ${frac(c, d)}` : `${frac(a, b)} ${op} ${frac(c, d)}`;
  const denominator = op === '×' ? d : b;
  const k = denominator / d;
  const answer = op === '×' ? a * c : op === '+' ? a + c * k : a - c * k;
  const same = op !== '×' && k > 1 ? `On met sur le même dénominateur : ${frac(c, d)} = ${frac(c * k, denominator)}. ` : '';
  const explain =
    op === '×'
      ? `${a} × ${frac(c, d)}, c’est ${Array.from({ length: a }, () => frac(c, d)).join(' + ')} : ${a} × ${c} = ${answer}.`
      : `${same}On ${op === '+' ? 'additionne' : 'soustrait'} les numérateurs et on garde le dénominateur : ${a} ${op} ${c * k} = ${answer}.`;
  return question({
    prompt: `${text} =`,
    suffix: `/${denominator}`,
    answer,
    solved: `${text} = ${frac(answer, denominator)}`,
    explain,
  });
}

/** « 9/4 = 2 + ?/4 » ou « 9/4 = ? + 1/4 » : un entier et une fraction (fiches n° 103 et 104). */
export function wholePlusFraction(numerator: number, denominator: number, hidden: 'whole' | 'part'): NumerationQuestion {
  const whole = Math.floor(numerator / denominator);
  const rest = numerator % denominator;
  const shown = frac(numerator, denominator);
  return question({
    context: 'Écris sous la forme d’un entier + une fraction',
    prompt: hidden === 'whole' ? `${shown} =` : `${shown} = ${whole} +`,
    suffix: hidden === 'whole' ? `+ ${frac(rest, denominator)}` : `/${denominator}`,
    answer: hidden === 'whole' ? whole : rest,
    solved: `${shown} = ${whole} + ${frac(rest, denominator)}`,
    explain: `Dans la table de ${denominator} : ${numerator} = ${whole} × ${denominator} + ${rest}. ${frac(denominator, denominator)} = 1, donc ${shown} = ${whole} + ${frac(rest, denominator)}.`,
  });
}

/** « ? < 11/4 < 3 » : encadrer entre deux entiers qui se suivent (leçon N15). */
export function frameFraction(numerator: number, denominator: number, hidden: 'low' | 'high'): NumerationQuestion {
  const low = Math.floor(numerator / denominator);
  const shown = frac(numerator, denominator);
  return question({
    context: 'Encadre entre deux nombres entiers qui se suivent',
    prompt: hidden === 'low' ? '' : `${low} < ${shown} <`,
    suffix: hidden === 'low' ? `< ${shown} < ${low + 1}` : '',
    answer: hidden === 'low' ? low : low + 1,
    solved: `${low} < ${shown} < ${low + 1}`,
    explain: `Dans la table de ${denominator} : ${denominator} × ${low} = ${denominator * low} et ${denominator} × ${low + 1} = ${denominator * (low + 1)}. ${numerator} est entre les deux, donc ${shown} est entre ${low} et ${low + 1}.`,
  });
}

/** « 1/2 = ?/4 », « 6/8 = ?/4 » : les fractions égales (leçon N20). */
export function equalFraction(numerator: number, denominator: number, times: number, up: boolean): NumerationQuestion {
  const [from, to] = up
    ? [frac(numerator, denominator), [numerator * times, denominator * times] as const]
    : [frac(numerator * times, denominator * times), [numerator, denominator] as const];
  return question({
    context: 'Complète avec une fraction égale',
    prompt: `${from} =`,
    suffix: `/${to[1]}`,
    answer: to[0],
    solved: `${from} = ${frac(to[0], to[1])}`,
    explain: up
      ? `Le dénominateur est multiplié par ${times} : on multiplie aussi le numérateur, ${numerator} × ${times} = ${to[0]}.`
      : `Le dénominateur est divisé par ${times} : on divise aussi le numérateur, ${numerator * times} : ${times} = ${to[0]}.`,
  });
}

/** Comparer deux fractions, ou une fraction et 1 (leçon N14). */
export function compareFractions(a: number, b: number, c: number, d: number): NumerationQuestion {
  const [left, right] = [frac(a, b), d === 1 ? String(c) : frac(c, d)];
  const [x, y] = [a * d, c * b];
  const symbol = x < y ? '<' : x > y ? '>' : '=';
  const why =
    d === 1
      ? a > b
        ? 'Le numérateur est plus grand que le dénominateur : la fraction est plus grande que 1.'
        : a < b
          ? 'Le numérateur est plus petit que le dénominateur : la fraction est plus petite que 1.'
          : 'Le numérateur et le dénominateur sont égaux : la fraction vaut 1.'
      : b === d
        ? 'Même dénominateur : on compare les numérateurs.'
        : a === c
          ? 'Même numérateur : plus le dénominateur est grand, plus les parts sont petites.'
          : `On met sur le même dénominateur : ${b > d ? `${right} = ${frac((c * b) / d, b)}` : `${left} = ${frac((a * d) / b, d)}`}.`;
  return question({
    context: 'Complète avec <, > ou =',
    prompt: left,
    suffix: right,
    choices: SYMBOLS,
    answer: symbol,
    solved: `${left} ${symbol} ${right}`,
    explain: why,
  });
}

const COLORS = ['bleu', 'vert', 'orange'] as const;

/** « 12 billes : 1/6 en bleu, 1/4 en vert, 1/3 en orange » : combien de vertes, ou de blanches (fiches n° 105 à 108). */
export function marblesProblem(total: number, fractions: readonly (readonly [number, number])[], asked: number | 'blanches'): NumerationQuestion {
  const counts = fractions.map(([n, d]) => (total / d) * n);
  const list = fractions.map(([n, d], i) => `${frac(n, d)} en ${COLORS[i]}`).join(', ').replace(/, ([^,]*)$/, ' et $1');
  const share = (i: number) => {
    const [n, d] = fractions[i]!;
    return n === 1
      ? `${frac(n, d)} de ${total}, c’est ${total} : ${d} = ${counts[i]}`
      : `${frac(n, d)} de ${total}, c’est ${total} : ${d} = ${total / d}, puis ${n} × ${total / d} = ${counts[i]}`;
  };
  const white = total - counts.reduce((sum, n) => sum + n, 0);
  const [askedText, answer, explain] =
    asked === 'blanches'
      ? [
          'Combien de billes restent blanches ?',
          white,
          `${fractions.map((_, i) => share(i)).join(' ; ')}. ${counts.join(' + ')} = ${total - white} billes coloriées : ${total} − ${total - white} = ${white}.`,
        ]
      : [`Combien de billes en ${COLORS[asked]} ?`, counts[asked]!, `${share(asked)}.`];
  const text = `${total} billes : ${list}. ${askedText}`;
  return question({ prompt: text, suffix: 'billes', answer, solved: `${text} ${answer} billes.`, explain });
}

/** Le triathlon de la leçon N16, et le gâteau : ce qui reste, avec le même dénominateur. */
export function remainingProblem(name: string, first: number, second: number, denominator: number, cake: boolean): NumerationQuestion {
  const text = cake
    ? `${name} mange ${frac(first, denominator)} du gâteau, puis ${frac(second, denominator)}. Quelle fraction du gâteau reste-t-il ?`
    : `${name} fait ${frac(first, denominator)} de la course à la nage, puis ${frac(second, denominator)} à vélo. Quelle fraction lui reste-t-il à courir ?`;
  const answer = denominator - first - second;
  return question({
    prompt: text,
    suffix: `/${denominator}`,
    answer,
    solved: `${text} ${frac(answer, denominator)}`,
    explain: `${frac(first, denominator)} + ${frac(second, denominator)} = ${frac(first + second, denominator)}. Le tout, c’est ${frac(denominator, denominator)} : il reste ${denominator} − ${first + second} = ${answer} part${answer > 1 ? 's' : ''}, ${frac(answer, denominator)}.`,
  });
}

// --- Les nombres décimaux (leçons N12, N13, N18 et N19) ---

/** Les rangs après la virgule : le 1er chiffre est celui des dixièmes. */
const DECIMAL_RANKS = ['dixièmes', 'centièmes', 'millièmes', 'dix-millièmes'] as const;
/** Le nom d'un rang : 0 les unités, 1 les dizaines…, −1 les dixièmes, −2 les centièmes… */
const rankName = (rank: number): string => (rank >= 0 ? RANKS[rank]! : DECIMAL_RANKS[-rank - 1]!);
/** « 1 centième », « 5 centièmes ». */
const counted = (count: number, rank: number) => `${spaced(count)} ${count > 1 ? rankName(rank) : singular(rankName(rank))}`;
/** « a, b et c ». */
const listed = (items: readonly string[]) => items.join(', ').replace(/, ([^,]*)$/, ' et $1');
/** Chiffres après la virgule : 2 pour « 3,50 » (les 0 de la fin comptent dans l'écriture). */
const placesIn = (text: string) => text.split(',')[1]?.length ?? 0;
/** « 3,5 » → 3.5. */
const valueOf = (text: string) => Number(text.replace(/\s/g, '').replace(',', '.'));
/** « 3,5 » avec 3 chiffres après la virgule : « 3,500 » (des 0 à la fin, pour comparer). */
function padTo(text: string, places: number): string {
  const missing = places - placesIn(text);
  if (missing <= 0) return text;
  return `${text}${placesIn(text) === 0 ? ',' : ''}${'0'.repeat(missing)}`;
}
/** `count` chiffres au hasard, le dernier n'est pas 0 (sinon on ne l'écrirait pas). */
const digitsText = (count: number, random: () => number) =>
  Array.from({ length: count }, (_, i) => between(i === count - 1 ? 1 : 0, 9, random)).join('');

/** « Touche le chiffre des centièmes » dans 597,4328 (fiches n° 55 et 58) ; `rank` : 2 les centaines, −2 les centièmes. */
export function decimalDigitOf(text: string, rank: number): NumerationQuestion {
  const whole = text.split(',')[0]!;
  const at = rank >= 0 ? whole.length - 1 - rank : whole.length - rank;
  const digit = text[at]!;
  const name = rankName(rank);
  const nth = rank >= 0 ? rank + 1 : -rank;
  return question({
    context: `Touche le chiffre des ${name}`,
    prompt: groupDigits(text),
    // La virgule est dans le nombre, mais ne se touche pas.
    choices: [...text].map((d, i) => ({ label: d, value: d === ',' ? ',' : String(i) })),
    choiceLayout: 'number',
    answer: String(at),
    solved: `Dans ${groupDigits(text)}, le chiffre des ${name} est ${digit}.`,
    explain: `Le chiffre des ${name} est le ${nth === 1 ? '1er' : `${nth}e`} chiffre ${rank >= 0 ? 'avant' : 'après'} la virgule : ${digit}. Tu peux utiliser un tableau de numération.`,
  });
}

/** « 2 + 4/10 », « 5 + 3/10 + 2/100 », « 57/100 » : en nombre décimal (fiches n° 56, 59 et 62). */
export function fractionsToDecimal(whole: number, fractions: readonly (readonly [number, number])[]): NumerationQuestion {
  const answer = round(whole + fractions.reduce((sum, [n, d]) => sum + n / d, 0));
  const shown = [...(whole > 0 ? [spaced(whole)] : []), ...fractions.map(([n, d]) => frac(n, d))].join(' + ');
  const said = [...(whole > 0 ? [counted(whole, 0)] : []), ...fractions.map(([n, d]) => counted(n, 1 - String(d).length))];
  return question({
    context: 'Écris sous forme d’un nombre décimal',
    prompt: shown,
    answer,
    solved: `${shown} = ${spaced(answer)}`,
    explain: `${shown}, c’est ${listed(said)} : ${spaced(answer)}. Tu peux utiliser un tableau de numération.`,
  });
}

/** « cinq unités et cinq centièmes », « trente-quatre dixièmes » : en nombre décimal (fiches n° 57 et 61, leçon N13). */
export function wordsToDecimal(parts: readonly (readonly [count: number, rank: number])[]): NumerationQuestion {
  // « une unité », mais « un dixième ».
  const said = (count: number, rank: number) => (count === 1 && rank === 0 ? 'une' : numberToWords(count));
  const words = listed(parts.map(([count, rank]) => `${said(count, rank)} ${count > 1 ? rankName(rank) : singular(rankName(rank))}`));
  const answer = round(parts.reduce((sum, [count, rank]) => sum + count * 10 ** rank, 0));
  const each = parts.map(([count, rank]) => `${counted(count, rank)} = ${spaced(round(count * 10 ** rank))}`);
  return question({
    context: 'Écris sous forme d’un nombre décimal',
    prompt: words,
    answer,
    solved: `${words} = ${spaced(answer)}`,
    explain: `${each.join(', ')}${parts.length > 1 ? ` : ${spaced(answer)}` : ''}. Tu peux utiliser un tableau de numération.`,
  });
}

/** « 45,37 = 40 + 5 + 0,3 + … » : la décomposition, un morceau à trouver (leçon N12). */
export function decomposeDecimal(text: string, hole: number): NumerationQuestion {
  const whole = text.split(',')[0]!;
  const all = [...text.replace(',', '')]
    .map((digit, i) => ({ digit, rank: whole.length - 1 - i, value: round(Number(digit) * 10 ** (whole.length - 1 - i)) }))
    .filter((part) => part.value > 0);
  const missing = all[hole]!;
  const before = all.slice(0, hole).map((part) => spaced(part.value));
  const after = all.slice(hole + 1).map((part) => spaced(part.value));
  return question({
    context: 'Complète la décomposition',
    prompt: [`${text} =`, ...before.map((part) => `${part} +`)].join(' '),
    suffix: after.map((part) => `+ ${part}`).join(' '),
    answer: missing.value,
    solved: `${text} = ${all.map((part) => spaced(part.value)).join(' + ')}`,
    explain: `Dans ${text}, ${missing.digit} est le chiffre des ${rankName(missing.rank)} : il vaut ${spaced(missing.value)}.`,
  });
}

/** « 3,25 … 3,5 », « 0,81 … 0,084 » : <, > ou = (fiches n° 60, 63 et 119 à 121). */
export function compareDecimals(left: string, right: string): NumerationQuestion {
  const [a, b] = [valueOf(left), valueOf(right)];
  const symbol = a < b ? '<' : a > b ? '>' : '=';
  const places = Math.max(placesIn(left), placesIn(right));
  const [l, r] = [padTo(left, places), padTo(right, places)];
  const padded = l !== left || r !== right ? `On écrit des 0 à la fin du plus court : ${l} et ${r}. ` : '';
  const why =
    a === b
      ? 'C’est le même nombre.'
      : Math.floor(a) !== Math.floor(b)
        ? 'On compare d’abord les parties entières. Le crocodile mange le plus grand.'
        : 'Les parties entières sont pareilles : on compare les chiffres après la virgule, en commençant par les dixièmes. Le crocodile mange le plus grand.';
  return question({
    context: 'Complète avec <, > ou =',
    prompt: left,
    suffix: right,
    choices: SYMBOLS,
    answer: symbol,
    solved: `${left} ${symbol} ${right}`,
    explain: `${padded}${why}`,
  });
}

/** « 6,124 est-il compris entre 6,12 et 6,15 ? » (fiches n° 109 et 110). */
export function isBetween(text: string, low: string, high: string): NumerationQuestion {
  const [v, lo, hi] = [text, low, high].map(valueOf) as [number, number, number];
  const yes = lo < v && v < hi;
  const places = Math.max(...[text, low, high].map(placesIn));
  const [t, l, h] = [text, low, high].map((x) => padTo(x, places));
  const why = yes ? `${l} < ${t} < ${h}` : v < lo ? `${t} < ${l}` : `${t} > ${h}`;
  return question({
    context: `Ce nombre est-il compris entre ${low} et ${high} ?`,
    prompt: text,
    choices: [
      { label: 'Oui', value: 'oui' },
      { label: 'Non', value: 'non' },
    ],
    answer: yes ? 'oui' : 'non',
    solved: `${text} ${yes ? 'est' : 'n’est pas'} compris entre ${low} et ${high}.`,
    explain: `On écrit des 0 pour que tous aient ${places} chiffres après la virgule : ${why}.`,
  });
}

/** « Ordonne par ordre décroissant : 4,3 4,4 4,07 4,36 » : toucher les nombres dans l'ordre (fiche n° 122). */
export function orderDecimals(texts: readonly string[], order: '<' | '>'): NumerationQuestion {
  const sorted = [...texts].sort((x, y) => (order === '>' ? valueOf(y) - valueOf(x) : valueOf(x) - valueOf(y)));
  const answer = sorted.join(` ${order} `);
  const places = Math.max(...texts.map(placesIn));
  return question({
    context: order === '>' ? 'Range du plus grand au plus petit' : 'Range du plus petit au plus grand',
    prompt: '',
    choices: texts.map((text) => ({ label: text, value: text })),
    order,
    answer,
    solved: answer,
    explain: `On écrit des 0 pour que tous aient ${places} chiffres après la virgule : ${sorted.map((text) => padTo(text, places)).join(` ${order} `)}.`,
  });
}

/** « 50,03 = (… × 10) + (3 × 0,01) », « 3,07 = (3 × …) + (7 × 0,01) » (fiches n° 114 et 115). */
export function decimalTimes(a: number, powerA: number, b: number, powerB: number, hole: 'a' | 'b' | 'powerA' | 'powerB'): NumerationQuestion {
  const [x, y] = [round(a * powerA), round(b * powerB)];
  const n = round(x + y);
  const shown = { a: String(a), powerA: spaced(powerA), b: String(b), powerB: spaced(powerB) };
  const full = (blank?: keyof typeof shown) => {
    const part = (key: keyof typeof shown) => (key === blank ? '§' : shown[key]);
    return `(${part('a')} × ${part('powerA')}) + (${part('b')} × ${part('powerB')})`;
  };
  const [before, after] = full(hole).split('§') as [string, string];
  return question({
    context: 'Complète l’égalité',
    prompt: `${spaced(n)} = ${before}`.trim(),
    suffix: after.trim(),
    answer: { a, powerA, b, powerB }[hole],
    solved: `${spaced(n)} = ${full()}`,
    explain: `${spaced(n)} = ${spaced(x)} + ${spaced(y)} : ${spaced(x)} = ${a} × ${spaced(powerA)} et ${spaced(y)} = ${b} × ${spaced(powerB)}.`,
  });
}

/** « 4,6 + … = 4,75 », « 2,05 + … = 3 » (fiches n° 123 et 124). */
export function completeDecimal(a: number, target: number): NumerationQuestion {
  const answer = round(target - a);
  const places = Math.max(...[a, target, answer].map((x) => placesIn(numberText(x))));
  const units = (x: number) => spaced(Math.round(x * 10 ** places));
  const padded = [a, target].filter((x) => placesIn(numberText(x)) < places).map((x) => `${spaced(x)} = ${padTo(spaced(x), places)}`);
  return question({
    context: 'Complète l’égalité',
    prompt: `${spaced(a)} +`,
    suffix: `= ${spaced(target)}`,
    answer,
    solved: `${spaced(a)} + ${spaced(answer)} = ${spaced(target)}`,
    explain: `${padded.length > 0 ? `On écrit des 0 : ${padded.join(', ')}. ` : ''}De ${units(a)} à ${units(target)} ${rankName(-places)}, il y en a ${units(answer)} : ${spaced(answer)}.`,
  });
}

/** « 2 × 0,5 », « 2 × 2,5 », « 5 ÷ 2 » : des demis (fiches n° 125 et 126). */
export function halfCalc(n: number, op: '×' | '÷'): NumerationQuestion {
  const text = op === '×' ? `2 × ${spaced(n)}` : `${n} ÷ 2`;
  const answer = op === '×' ? round(2 * n) : n / 2;
  const whole = Math.floor(n);
  const explain =
    op === '÷'
      ? `${n} = ${n - 1} + 1 : ${n - 1} ÷ 2 = ${(n - 1) / 2}, et 1 ÷ 2 = 0,5 (un demi). Donc ${spaced(answer)}.`
      : whole === 0
        ? '0,5, c’est un demi : 2 demis font 1.'
        : `0,5, c’est un demi : 2 × 0,5 = 1. 2 × ${whole} = ${2 * whole}, et ${2 * whole} + 1 = ${spaced(answer)}.`;
  return question({ context: 'Calcule', prompt: text, answer, solved: `${text} = ${spaced(answer)}`, explain });
}

/** « 8,4 < 8,49 < … » : encadrer à l'unité, au dixième, au centième (leçon N18). */
export function frameDecimal(n: number, places: 0 | 1 | 2, hidden: 'low' | 'high'): NumerationQuestion {
  const unit = 10 ** places;
  const floor = Math.floor(round(n * unit));
  const [low, high] = [round(floor / unit), round((floor + 1) / unit)];
  const kept = places === 0 ? `la partie entière, ${low}` : `${places === 1 ? '1 chiffre' : '2 chiffres'} après la virgule, ${spaced(low)}`;
  return question({
    context: `Encadre ${['à l’unité', 'au dixième', 'au centième'][places]}`,
    prompt: hidden === 'low' ? '' : `${spaced(low)} < ${spaced(n)} <`,
    suffix: hidden === 'low' ? `< ${spaced(n)} < ${spaced(high)}` : '',
    answer: hidden === 'low' ? low : high,
    solved: `${spaced(low)} < ${spaced(n)} < ${spaced(high)}`,
    explain: `On garde ${kept}, puis on ajoute 1 ${singular(rankName(-places))} : ${spaced(high)}.`,
  });
}

/** « 4,6 < … < 4,7 » : toucher le nombre qu'on peut intercaler, parmi quatre (leçon N18). */
export function intercalate(low: number, high: number, answer: number, others: readonly number[]): NumerationQuestion {
  const places = placesIn(numberText(answer));
  return question({
    context: `Touche le nombre compris entre ${spaced(low)} et ${spaced(high)}`,
    prompt: `${spaced(low)} <`,
    suffix: `< ${spaced(high)}`,
    choices: [answer, ...others].sort((x, y) => x - y).map((x) => ({ label: spaced(x), value: numberText(x) })),
    answer: numberText(answer),
    solved: `${spaced(low)} < ${spaced(answer)} < ${spaced(high)}`,
    explain: `On écrit un chiffre de plus après la virgule : ${padTo(spaced(low), places)} < ${spaced(answer)} < ${padTo(spaced(high), places)}.`,
  });
}

/** Un calcul de la ceinture de calcul mental (fractions décimales, leçon N19), résolu pour les listes. */
function fromMental(calc: MentalQuestion, context: string): NumerationQuestion {
  const answer = spaced(calc.answer);
  const solved =
    calc.suffix === undefined ? `${calc.prompt} = ${answer}` : `${calc.prompt} ${answer}${calc.suffix.startsWith('/') ? '' : ' '}${calc.suffix}`;
  return { ...calc, context, solved, id: solved };
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

/** Un nombre de `digits` chiffres décomposé en 2 ou 3 morceaux : 49 200 = 40 000 + 9 000 + 200. */
function drawDecompose(random: () => number, digits: number): NumerationQuestion {
  for (;;) {
    const n = sparse(digits, random);
    const count = parts(n).length;
    if (count >= 2 && count <= 3) return decompose(n, between(0, count - 1, random));
  }
}

/** Une fraction plus petite que 1 : `numerator` de 1 à d − 1, `denominator` parmi ceux donnés. */
function properFraction(random: () => number, denominators: readonly number[]): [number, number] {
  const denominator = pick(denominators, random);
  return [between(1, denominator - 1, random), denominator];
}

/** Des graduations de la droite, hors des nombres entiers. */
function offTicks(units: number, parts: number): number[] {
  return Array.from({ length: units * parts }, (_, i) => i + 1).filter((i) => i % parts !== 0);
}

/** L'orange : les fractions simples (fiches n° 37 à 54). */
const ORANGE_KINDS: readonly Draw[] = [
  (random) =>
    random() < 0.8
      ? fractionToLetters(...properFraction(random, [2, 3, 4, 5, 6, 8, 10]))
      : fractionToLetters(between(5, 40, random), pick([2, 3, 4, 5, 7, 8], random)),
  (random) => {
    const denominator = pick([2, 3, 4, 5, 6, 8], random);
    return lettersToFraction(between(1, 10, random), denominator, random);
  },
  (random) => {
    const [n, d] = random() < 0.5 ? properFraction(random, [3, 4, 5, 7, 8, 10]) : [between(4, 9, random), pick([2, 3], random)];
    return fractionPart(n, d, random() < 0.5 ? 'numérateur' : 'dénominateur');
  },
  (random) => {
    const [units, parts] = [between(2, 3, random), pick([2, 3, 4], random)];
    return readFractionLine(units, parts, pick(offTicks(units, parts), random));
  },
  (random) => {
    const [units, parts] = [between(2, 3, random), pick([3, 4], random)];
    const ats = shuffle(offTicks(units, parts), random).slice(0, 3).sort((a, b) => a - b);
    return whichMarker(units, parts, ats, between(0, 2, random));
  },
  (random) => {
    const total = pick([10, 12], random);
    const [n, d] = properFraction(random, total === 10 ? [2, 5] : [2, 3, 4, 6]);
    return paintFraction(total, n, d, 'marbles');
  },
  (random) => {
    const [n, d] = pick(
      [
        [1, 2],
        [1, 3],
        [1, 4],
        [2, 3],
        [3, 4],
      ] as const,
      random,
    );
    return paintFraction(24, n, d, 'grid');
  },
  (random) => {
    const kind = between(0, 2, random);
    if (kind === 0) {
      const columns = between(3, 8, random);
      return readColored('bars', columns, columns, between(1, columns - 1, random), random);
    }
    if (kind === 1) {
      const [columns, rows] = pick(
        [
          [2, 2],
          [3, 2],
          [4, 2],
          [4, 3],
        ] as const,
        random,
      );
      return readColored('grid', columns * rows, columns, between(1, columns * rows - 1, random), random);
    }
    // Plusieurs barres, une par unité : 13/3 (fiche n° 54).
    const columns = pick([2, 3, 4], random);
    const wholes = between(2, 4, random);
    return readColored('bars', (wholes + 1) * columns, columns, wholes * columns + between(1, columns - 1, random), random);
  },
];

/** Les billes des fiches n° 105 à 108 : le nombre de billes, et des fractions dont le total reste plus petit que 1. */
const MARBLE_SETS = [
  [12, [[1, 6], [1, 4], [1, 3]]],
  [15, [[1, 3], [2, 5], [2, 15]]],
  [12, [[1, 3], [1, 2], [1, 12]]],
  [15, [[2, 3], [1, 5], [2, 15]]],
  [20, [[1, 4], [2, 5], [1, 10]]],
  [24, [[1, 8], [1, 3], [1, 4]]],
  [18, [[1, 6], [1, 3], [2, 9]]],
] as const;

/** La violette : manipuler les fractions (fiches n° 91 à 108, leçons N14 à N16 et N20). */
const VIOLETTE_KINDS: readonly Draw[] = [
  (random) => {
    const [n, d] = pick(
      [
        [1, 4],
        [1, 8],
        [3, 4],
        [5, 6],
        [1, 24],
        [2, 3],
        [3, 8],
        [5, 12],
        [1, 6],
      ] as const,
      random,
    );
    return paintFraction(24, n, d, 'grid');
  },
  (random) => {
    const parts = pick([4, 6, 8], random);
    // Au plus 12 graduations, assez larges pour les toucher : 2 unités de 6, une de 8, comme les fiches.
    const units = parts === 8 ? 1 : parts === 6 ? 2 : between(2, 3, random);
    const denominator = pick(
      [2, 3, 4, 6, 8].filter((d) => parts % d === 0),
      random,
    );
    // Pas un nombre entier : 7/6, 2/3, 11/4.
    const numerators = Array.from({ length: units * denominator - 1 }, (_, i) => i + 1).filter((n) => n % denominator !== 0);
    return placeFraction(units, parts, pick(numerators, random), denominator);
  },
  (random) => {
    const kind = between(0, 2, random);
    const denominator = pick([4, 5, 6, 8, 10], random);
    if (kind === 2) return fractionCalc(between(2, 4, random), denominator, '×', between(1, denominator - 1, random), denominator);
    // Le même dénominateur, ou la moitié : 3/4 + 1/2.
    const other = denominator % 2 === 0 && random() < 0.5 ? denominator / 2 : denominator;
    const k = denominator / other;
    const c = between(1, other - 1, random);
    const a = kind === 0 ? between(1, denominator - 1, random) : between(c * k + 1, c * k + denominator - 1, random);
    return fractionCalc(a, denominator, kind === 0 ? '+' : '−', c, other);
  },
  (random) => {
    const denominator = between(2, 6, random);
    const numerator = between(denominator + 1, denominator * 4, random);
    return numerator % denominator === 0
      ? wholePlusFraction(numerator + 1, denominator, random() < 0.5 ? 'whole' : 'part')
      : wholePlusFraction(numerator, denominator, random() < 0.5 ? 'whole' : 'part');
  },
  (random) => {
    const [total, fractions] = pick(MARBLE_SETS, random);
    return marblesProblem(total, fractions, random() < 0.5 ? 'blanches' : between(0, 2, random));
  },
  (random) => {
    const kind = between(0, 3, random);
    const d = between(3, 9, random);
    if (kind === 0) return compareFractions(between(1, 2 * d, random), d, 1, 1);
    if (kind === 1) {
      const [a, c] = [between(1, 2 * d, random), between(1, 2 * d, random)];
      return compareFractions(a, d, c, d);
    }
    if (kind === 2) {
      const n = between(1, 5, random);
      return compareFractions(n, d, n, between(2, 9, random));
    }
    const half = pick([2, 3, 4, 5], random);
    return random() < 0.5
      ? compareFractions(between(1, 2 * half, random), half, between(1, 4 * half, random), 2 * half)
      : compareFractions(between(1, 4 * half, random), 2 * half, between(1, 2 * half, random), half);
  },
  (random) => {
    const [n, d] = properFraction(random, [2, 3, 4, 5]);
    return equalFraction(n, d, between(2, 5, random), random() < 0.6);
  },
  (random) => {
    const denominator = between(2, 8, random);
    let numerator = between(denominator + 1, denominator * 5, random);
    if (numerator % denominator === 0) numerator += 1;
    return frameFraction(numerator, denominator, random() < 0.5 ? 'low' : 'high');
  },
  (random) => {
    const denominator = pick([4, 5, 6, 8, 10], random);
    const first = between(1, denominator - 2, random);
    const second = between(1, denominator - first - 1, random);
    return remainingProblem(pick(['Mathilde', 'Lila', 'Noé', 'Sami', 'Inès'], random), first, second, denominator, random() < 0.5);
  },
];

/** La verte : les nombres jusqu'aux millions (fiches n° 67 à 78). */
const VERT_KINDS: readonly Draw[] = [
  (random) => wellWritten(sparse(between(4, 6, random), random), random),
  (random) => wordsToDigits(sayable(4, 6, random)),
  (random) => digitsToWords(sayable(4, 6, random)),
  (random) => numberOf(between(1000, 999999, random), between(2, 4, random)),
  (random) => {
    const n = between(10000, 999999, random);
    return digitOf(n, between(0, String(n).length - 1, random));
  },
  (random) => {
    const n = between(1, 98, random) * 1000 + (random() < 0.5 ? between(1, 9, random) * 100 : between(1, 99, random) * 10);
    return complementTo(n, Math.ceil(n / 1000) * 1000);
  },
  (random) => drawDecompose(random, between(5, 6, random)),
  (random) => drawSequence(random, [1, 10, 100, 1000, 10000], 10000, 999999),
  (random) => drawBigCompare(random, 4, 6),
  (random) =>
    drawNumberLine(
      random,
      [
        [100, 10],
        [1000, 10],
        [10000, 10],
      ],
      999999,
    ),
];

/** La bleue : les nombres jusqu'aux milliards (fiches n° 79 à 90). */
const BLEU_KINDS: readonly Draw[] = [
  (random) => {
    const n = between(1000000, 99999999, random);
    return digitOf(n, between(3, String(n).length - 1, random));
  },
  (random) => numberOf(between(1, 99, random) * 1000000 + between(0, 999999, random), pick([4, 5, 6], random)),
  (random) => wordsToDigits(sayable(7, 10, random)),
  (random) => digitsToWords(sayable(7, 9, random)),
  (random) => {
    const rank = pick([3, 4, 6], random);
    const millions = between(1, 30, random) * 1000000;
    const n =
      rank === 6
        ? millions + between(1, 9, random) * 100000
        : rank === 4
          ? millions + between(0, 99, random) * 10000 + between(1, 9, random) * 1000
          : millions + between(0, 999, random) * 1000 + between(1, 99, random) * 10;
    return complementTo(n, Math.ceil(n / 10 ** rank) * 10 ** rank);
  },
  (random) => {
    const rank = between(6, 8, random);
    return timesPowers(between(1, 9, random), rank, between(1, 9, random), between(2, rank - 1, random));
  },
  (random) => {
    const rank = between(6, 9, random);
    return decomposeTimes(between(1, 9, random), rank, between(1, 9, random), between(4, rank - 1, random), random() < 0.5 ? 0 : 1);
  },
  (random) => {
    const step = random() < 0.6 ? 100000 : 1000000;
    return numberLineChoices(between(1, 98, random) * step * 10, 0, step, 10, between(1, 9, random));
  },
  (random) => drawSequence(random, [1000, 10000, 100000, 1000000], 1000000, 999999999),
  (random) => drawBigCompare(random, 7, 10),
];

/** Deux décimaux à comparer : 5,4 et 5,40, 7,8 et 7,08, ou pas le même nombre de chiffres après la virgule. */
function drawCompareDecimals(random: () => number, maxPlaces: number): NumerationQuestion {
  const whole = between(0, 9, random);
  const d = between(1, 9, random);
  const kind = between(0, 3, random);
  let [left, right] = [`${whole},${d}`, kind === 0 ? `${whole},${d}0` : `${whole},0${d}`];
  if (kind >= 2) {
    const a = between(1, maxPlaces, random);
    let b = between(1, maxPlaces - 1, random);
    if (b >= a) b++;
    // Le plus souvent, les premiers chiffres sont les mêmes : 3,184 et 3,1246.
    const common = kind === 3 ? Math.min(a, b) - 1 : 0;
    const digits = digitsText(a, random);
    left = `${whole},${digits}`;
    right = `${whole},${digits.slice(0, common)}${digitsText(b - common, random)}`;
    if (valueOf(left) === valueOf(right)) right = `${whole + 1},${digitsText(b, random)}`;
  }
  return random() < 0.5 ? compareDecimals(left, right) : compareDecimals(right, left);
}

/** La rose : les nombres décimaux (fiches n° 55 à 66, leçons N12 et N13). */
const ROSE_KINDS: readonly Draw[] = [
  (random) => {
    const [wholeDigits, places] = [between(2, 4, random), between(2, 4, random)];
    const text = `${between(10 ** (wholeDigits - 1), 10 ** wholeDigits - 1, random)},${digitsText(places, random)}`;
    // Des centaines aux millièmes.
    return decimalDigitOf(text, between(-Math.min(places, 3), Math.min(wholeDigits - 1, 2), random));
  },
  (random) => {
    const kind = between(0, 3, random);
    if (kind === 0) return fractionsToDecimal(between(1, 50, random), [[between(1, 9, random), 10]]);
    if (kind === 1) {
      const denominator = pick([10, 100], random);
      const numerator = denominator === 10 ? between(1, 9, random) : Number(digitsText(2, random));
      return fractionsToDecimal(0, [[numerator, denominator]]);
    }
    if (kind === 2) return fractionsToDecimal(between(1, 50, random), [[between(1, 9, random), 100]]);
    return fractionsToDecimal(between(1, 9, random), [
      [between(1, 9, random), 10],
      [between(1, 9, random), 100],
    ]);
  },
  (random) => {
    const [units, digit] = [between(1, 9, random), between(1, 9, random)];
    const kind = between(0, 3, random);
    if (kind === 0) return wordsToDecimal([[digit, -1]]);
    if (kind === 1) return wordsToDecimal([[units, 0], [digit, -2]]);
    if (kind === 2) return wordsToDecimal([[units, 0], [digit, -1]]);
    // « trente-quatre dixièmes », « quatorze centièmes » (leçon N13).
    return wordsToDecimal([[Number(`${between(1, 4, random)}${between(1, 9, random)}`), pick([-1, -2], random)]]);
  },
  (random) => drawCompareDecimals(random, 2),
  // L'unité partagée en 10 (fiches n° 64 et 66), le dixième partagé en 10 (fiche n° 65).
  (random) => numberLine(between(0, 15, random), 0, 0.1, 10, between(1, 9, random)),
  (random) => numberLine(between(0, 9, random) / 10, 0, 0.01, 10, between(1, 9, random)),
  (random) => {
    for (;;) {
      const text = `${between(10, 99, random)},${digitsText(2, random)}`;
      const count = [...text].filter((d) => d !== ',' && d !== '0').length;
      if (count >= 3) return decomposeDecimal(text, between(0, count - 1, random));
    }
  },
];

/** « 6,124 », « 6,0124 » : dedans ou dehors, entre deux nombres à 2 chiffres après la virgule (fiches n° 109 et 110). */
function drawIsBetween(random: () => number): NumerationQuestion {
  const whole = between(1, 9, random);
  const low = between(11, 85, random);
  const high = low + between(2, 5, random);
  const text = (hundredths: number) => `${whole},${String(hundredths).padStart(2, '0')}${digitsText(between(1, 2, random), random)}`;
  const kind = between(0, 3, random);
  const n =
    kind === 0
      ? text(between(low, high - 1, random))
      : kind === 1
        ? // Un 0 juste après la virgule : 6,0124 est plus petit que 6,12.
          `${whole},0${low}${between(1, 9, random)}`
        : kind === 2
          ? text(between(high, high + 4, random))
          : text(between(low - 5, low - 1, random));
  return isBetween(n, numberText(round(whole + low / 100)), numberText(round(whole + high / 100)));
}

/** Une suite qui passe un dixième ou une unité : 10,07 ; 10,08 ; 10,09 ; 10,1 (fiches n° 116 à 118). */
function drawDecimalSequence(random: () => number): NumerationQuestion {
  const step = pick([10, 1, 5], random);
  const whole = between(1, 12, random);
  // En centièmes : le passage, à une unité ou à un dixième.
  const boundary = whole * 100 + (step === 1 && random() < 0.6 ? between(1, 9, random) * 10 : 0);
  const k = between(1, 4, random);
  const up = random() < 0.7;
  return sequence((up ? boundary - k * step : boundary + k * step) / 100, (up ? step : -step) / 100);
}

/** « 4,3 4,4 4,07 4,36 » : quatre nombres proches, pas le même nombre de chiffres après la virgule (fiche n° 122). */
function drawOrder(random: () => number): NumerationQuestion {
  const whole = between(0, 9, random);
  const d = between(1, 8, random);
  const texts: string[] = [];
  while (texts.length < 4) {
    const first = pick([0, d, d + 1], random);
    const rest = digitsText(between(0, 2, random), random);
    if (first === 0 && rest === '') continue;
    const text = `${whole},${first}${rest}`;
    if (!texts.some((t) => valueOf(t) === valueOf(text))) texts.push(text);
  }
  // Parfois un 0 à la fin, comme 1,200 sur la fiche.
  if (random() < 0.25) texts[0] = padTo(texts[0]!, 3);
  return orderDecimals(texts, random() < 0.75 ? '>' : '<');
}

/** « 4,6 < … < 4,7 » : le bon nombre, et trois qui n'y sont pas. */
function drawIntercalate(random: () => number): NumerationQuestion {
  const places = between(0, 1, random);
  const unit = 10 ** places;
  const lowUnits = places === 0 ? between(1, 9, random) : between(1, 9, random) * 10 + between(1, 8, random);
  const [low, high] = [lowUnits / unit, (lowUnits + 1) / unit];
  const fine = (k: number) => round((lowUnits * 10 + k) / (unit * 10));
  const answer = fine(between(1, 9, random));
  // Juste avant, juste après, et le piège du 0 après la virgule (4,062 < 4,6).
  const candidates = [fine(-between(1, 9, random)), fine(10 + between(1, 9, random)), fine(20 + between(1, 9, random))];
  if (places === 1) candidates.push(valueOf(numberText(answer).replace(',', ',0')));
  const others = shuffle([...new Set(candidates)], random).slice(0, 3);
  return intercalate(low, high, answer, others);
}

/** La marron : manipuler les nombres décimaux (fiches n° 109 à 126, leçons N18 et N19). */
const MARRON_KINDS: readonly Draw[] = [
  drawIsBetween,
  // Le dixième partagé en centièmes (fiche n° 111), le centième en millièmes (fiches n° 112 et 113).
  (random) =>
    random() < 0.5
      ? numberLine(between(10, 99, random) / 10, 0, 0.01, 10, between(1, 9, random))
      : numberLine(between(100, 999, random) / 100, 0, 0.001, 10, between(1, 9, random)),
  (random) => {
    const powers = [100, 10, 1, 0.1, 0.01, 0.001];
    const i = between(0, powers.length - 2, random);
    const j = between(i + 1, powers.length - 1, random);
    const hole = pick(['a', 'b', 'powerA', 'powerB'] as const, random);
    // « 20,2 = (2 × 10) + (… × 0,01) » : il faut 20 centièmes pour faire 2 dixièmes.
    const b = hole === 'b' && j - i >= 2 && random() < 0.5 ? between(1, 4, random) * 10 : between(1, 9, random);
    return decimalTimes(between(1, 9, random), powers[i]!, b, powers[j]!, hole);
  },
  drawDecimalSequence,
  (random) => drawCompareDecimals(random, 4),
  drawOrder,
  (random) => {
    const whole = between(1, 9, random);
    const start = whole * 100 + (random() < 0.5 ? between(1, 9, random) * 10 : between(1, 95, random));
    const kind = between(0, 2, random);
    const target = kind === 0 ? (whole + 1) * 100 : kind === 1 ? start + between(1, 9, random) * 10 : start + between(1, 30, random);
    return completeDecimal(start / 100, target / 100);
  },
  (random) => {
    const kind = between(0, 2, random);
    if (kind === 0) return halfCalc(between(0, 9, random) + 0.5, '×');
    if (kind === 1) return halfCalc(between(1, 9, random) * 2 + 1, '÷');
    // 2,8 + 2,02 : des dixièmes et des centièmes.
    const a = (between(1, 9, random) * 10 + between(1, 9, random)) / 10;
    const b = (between(1, 9, random) * 100 + Number(digitsText(2, random))) / 100;
    return fromMental(random() < 0.5 ? addDecimals(a, b) : addDecimals(b, a), 'Calcule');
  },
  (random) => {
    if (random() < 0.5) return drawIntercalate(random);
    const places = between(0, 2, random) as 0 | 1 | 2;
    const n = valueOf(`${between(1, 20, random)},${digitsText(places + 1, random)}`);
    return frameDecimal(n, places, random() < 0.5 ? 'low' : 'high');
  },
  (random) => {
    const places = between(1, 3, random) as 1 | 2 | 3;
    const digits = between(1, Math.min(places + 2, 4), random);
    let numerator = between(10 ** (digits - 1), 10 ** digits - 1, random);
    if (numerator % 10 === 0) numerator += 1;
    return random() < 0.5
      ? fromMental(decimalToFraction(numerator, places), 'Écris sous forme d’une fraction décimale')
      : fromMental(fractionToDecimal(numerator, places), 'Écris sous forme d’un nombre décimal');
  },
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
  {
    belt: 'orange',
    skill: 'Lire, écrire et représenter les fractions simples, les placer sur une droite graduée',
    goal: 'CE2',
    tips: [
      'Une fraction, c’est une unité partagée en parts égales. Dans 3/4, le dénominateur 4 (en bas) dit en combien de parts on partage ; le numérateur 3 (en haut) dit combien de parts on prend.',
      'On lit le numérateur puis le nom des parts : un demi, deux tiers, trois quarts, puis cinq sixièmes, sept huitièmes… avec -ième.',
      'Sur une droite graduée, regarde en combien de parts l’unité est partagée : de 0 à 1 en 4 parts, chaque graduation vaut un quart.',
      'Pour colorier 2/3 de 12 billes, on partage d’abord les billes en 3 paquets égaux de 4, puis on en colorie 2 : 8 billes.',
    ],
    examples: () => [fractionToLetters(3, 4), readFractionLine(2, 4, 3), paintFraction(12, 2, 3, 'marbles'), readColored('bars', 15, 3, 13)],
    kinds: ORANGE_KINDS,
  },
  {
    belt: 'rose',
    skill: 'Lire, écrire et comparer les nombres décimaux, passer des fractions décimales aux nombres décimaux',
    decimal: true,
    tips: [
      'Un nombre décimal a une partie entière et une partie décimale, séparées par une virgule. Dans 62,578 : 6 dizaines, 2 unités, puis 5 dixièmes, 7 centièmes et 8 millièmes.',
      'Le 1er chiffre après la virgule est celui des dixièmes, le 2e celui des centièmes, le 3e celui des millièmes. Tu peux utiliser un tableau de numération.',
      'Une fraction avec 10, 100 ou 1000 au dénominateur est une fraction décimale : 4/10, c’est 4 dixièmes, 0,4 ; 4/100, c’est 4 centièmes, 0,04.',
      'Pour comparer deux nombres décimaux, on compare d’abord les parties entières. Si elles sont pareilles, on écrit des 0 à la fin du plus court : 3,5 = 3,50, donc 3,25 < 3,5.',
      'Sur une droite graduée, quand l’unité est partagée en 10 parts égales, chaque graduation vaut un dixième (0,1) ; quand un dixième est partagé en 10, chaque graduation vaut un centième (0,01).',
    ],
    examples: () => [decimalDigitOf('597,4328', -2), fractionsToDecimal(40, [[4, 100]]), compareDecimals('3,25', '3,5'), numberLine(3, 0, 0.1, 10, 7)],
    kinds: ROSE_KINDS,
  },
  {
    belt: 'vert',
    skill: 'Lire, écrire, représenter et comparer les nombres jusqu’aux millions',
    goal: 'CM1',
    tips: [
      'Pour bien écrire un grand nombre, on groupe les chiffres par trois en partant de la droite, et il n’y a jamais de 0 au début : 30\u00a0300, pas 303\u00a000.',
      'En chiffres, le mot « mille » est remplacé par une espace : huit-cent-huit-mille, c’est 808\u00a0000.',
      'Ne confonds pas chiffre et nombre : dans 45\u00a0863, le chiffre des milliers est 5, mais le nombre de milliers est 45. On lit le nombre jusqu’au chiffre des milliers.',
      'Mille ne prend jamais de s : quatre-mille-cent.',
      'Pour comparer, on compte d’abord les chiffres : celui qui en a le plus est le plus grand. S’ils en ont autant, on compare en commençant par la gauche.',
    ],
    examples: () => [wordsToDigits(808000), numberOf(45863, 3), decompose(49200, 1), complementTo(37600, 38000)],
    kinds: VERT_KINDS,
  },
  {
    belt: 'bleu',
    skill: 'Lire, écrire, représenter et comparer les nombres jusqu’aux milliards',
    tips: [
      'Un grand nombre se découpe en classes de trois chiffres : les milliards, les millions, les mille et les unités simples. 7\u00a0024\u00a0835\u00a0960 se lit « 7 milliards 24 millions 835 mille 960 ».',
      'Ne confonds pas chiffre et nombre : dans 15\u00a0824\u00a0000, le chiffre des dizaines de milliers est 2, mais le nombre de dizaines de milliers est 1\u00a0582.',
      'Million et milliard sont des noms : ils prennent un s quand il y en a plusieurs (cinq-cent-cinq-millions). Mille, lui, n’en prend jamais.',
      'N’oublie pas les espaces entre les classes, et les 0 dans une classe vide : six-millions-six-cent-mille-six, c’est 6\u00a0600\u00a0006.',
      'Sur une droite graduée de 2\u00a0000\u00a0000 à 3\u00a0000\u00a0000 en 10 graduations, chacune vaut 100\u00a0000.',
    ],
    examples: () => [digitOf(15824000, 4), numberOf(15824000, 4), wordsToDigits(6600006), numberLineChoices(3000000, 0, 100000, 10, 2)],
    kinds: BLEU_KINDS,
  },
  {
    belt: 'violette',
    skill: 'Manipuler les fractions : comparer, encadrer, entier + fraction, droite graduée, calculs et problèmes, fractions égales',
    tips: [
      'Pour placer 7/6 sur une droite, repère l’unité et partage-la en 6 : on avance de 7 graduations. Si l’unité a 6 graduations, 2/3 = 4/6 : 4 graduations.',
      'Avec le même dénominateur, on additionne les numérateurs et on garde le dénominateur : 3/5 + 2/5 = 5/5 = 1. Sinon, on met d’abord sur le même dénominateur : 1/2 = 2/4.',
      '9/4 = 2 + 1/4 : dans la table de 4, 9 = 2 × 4 + 1. Donc 2 < 9/4 < 3.',
      'Pour comparer : avec le même dénominateur, on compare les numérateurs ; avec le même numérateur, plus le dénominateur est grand, plus la fraction est petite.',
      'Des fractions égales : on multiplie (ou on divise) le numérateur et le dénominateur par le même nombre : 1/2 = 2/4 = 3/6.',
    ],
    examples: () => [placeFraction(2, 6, 2, 3), fractionCalc(3, 4, '+', 1, 2), wholePlusFraction(9, 4, 'part'), equalFraction(1, 2, 3, true)],
    kinds: VIOLETTE_KINDS,
  },
  {
    belt: 'marron',
    skill: 'Manipuler les nombres décimaux : décomposer, comparer, ranger, encadrer, intercaler, les placer sur une droite graduée',
    decimal: true,
    tips: [
      'Pour comparer ou ranger des nombres décimaux, écris des 0 à la fin des plus courts, pour qu’ils aient tous autant de chiffres après la virgule : 4,4 = 4,40 > 4,36.',
      '62,578 = (6 × 10) + (2 × 1) + (5 × 0,1) + (7 × 0,01) + (8 × 0,001). Il faut 10 centièmes pour faire 1 dixième : 0,2 = 20 × 0,01.',
      'Encadrer, c’est écrire le nombre d’avant et celui d’après : à l’unité 6 < 6,3 < 7, au dixième 8,4 < 8,49 < 8,5. Intercaler, c’est écrire un nombre entre les deux : entre 4,6 et 4,7, il y a 4,62.',
      'Sur une droite graduée, cherche ce que vaut une graduation : entre 4,6 et 4,7, il y a 10 graduations, chacune vaut un centième (0,01).',
      '8,37 a 2 chiffres après la virgule : 8,37 = 837/100. Dans l’autre sens, 12/10 : 10 a un 0, il y aura 1 chiffre après la virgule, 1,2.',
    ],
    examples: () => [orderDecimals(['4,3', '4,4', '4,07', '4,36'], '>'), decimalTimes(2, 10, 20, 0.01, 'b'), frameDecimal(8.49, 1, 'high'), completeDecimal(4.6, 4.75)],
    kinds: MARRON_KINDS,
  },
];

/** Les questions d'une série : les sortes de la ceinture à tour de rôle, en commençant au hasard. */
export function pickNumeration(belt: NumerationBelt, count: number, seen: readonly string[] = [], random = Math.random): NumerationQuestion[] {
  const offset = Math.floor(random() * belt.kinds.length);
  return pickCalcs((r, index) => belt.kinds[(index + offset) % belt.kinds.length]!(r), count, seen, random);
}
