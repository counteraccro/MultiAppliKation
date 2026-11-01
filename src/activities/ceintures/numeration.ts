// Ceintures de numération : les ceintures du classeur, de la blanche à l'or
// (voir .ai/analyse/18-ceintures-numeration.md). Les questions se tirent au hasard sur le modèle des
// fiches Charivari (« entrainements numération.pdf ») ; les astuces viennent des leçons N1 à N10 de la classe.
// Une question se répond au pavé, au clavier de lettres (un nombre en lettres) ou en touchant un bouton.

import { numberToWords, numberToWordsTraditional } from '../../core/number-words';
import { groupDigits, shuffle, type NumberLineFigure, type QuizQuestion } from '../../core/quiz';
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

/** 57 842 : les classes séparées par une espace, comme en classe (leçon N10). */
const spaced = (n: number) => groupDigits(String(n));

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
  const shown = (start >= 10000 ? [0, 1, 2] : [0, 1, 2, 3]).map((i) => start + i * step);
  const last = shown.at(-1)!;
  const next = last + step;
  const how = step > 0 ? `On ajoute ${spaced(step)}` : `On enlève ${spaced(-step)}`;
  const text = shown.map(spaced).join(', ');
  return question({
    context: 'Continue la suite',
    prompt: `${text},`,
    suffix: '',
    answer: next,
    solved: `${text}, ${spaced(next)}`,
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
    solved: `Sur la droite graduée de ${spaced(step)} en ${spaced(step)}, le repère A est ${spaced(answer)}.`,
    explain: `De ${spaced(label)} à ${spaced(second)}, il y a ${labelEvery} graduation${labelEvery > 1 ? 's' : ''} : chacune vaut ${spaced(step)}. A est ${Math.abs(jumps)} graduation${Math.abs(jumps) > 1 ? 's' : ''} ${jumps > 0 ? 'après' : 'avant'} ${spaced(startValue)} : ${spaced(startValue)} ${jumps > 0 ? '+' : '−'} ${spaced(Math.abs(jumps * step))} = ${spaced(answer)}.`,
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
];

/** Les questions d'une série : les sortes de la ceinture à tour de rôle, en commençant au hasard. */
export function pickNumeration(belt: NumerationBelt, count: number, seen: readonly string[] = [], random = Math.random): NumerationQuestion[] {
  const offset = Math.floor(random() * belt.kinds.length);
  return pickCalcs((r, index) => belt.kinds[(index + offset) % belt.kinds.length]!(r), count, seen, random);
}
