// Ceintures de calcul mental : les ceintures du classeur, de la blanche à la brillante
// (voir .ai/analyse/16-ceintures-calcul-mental.md ; elles arrivent une étape à la fois).
// « Je calcule rapidement (2 minutes par ceinture, maximum 1 erreur) » : pas de fiche, les calculs se
// tirent au hasard sur le modèle des exercices des leçons de la classe (Calc 14 et Calc 15).

import { numberText as fr, shuffle, type QuizQuestion } from '../../core/quiz';
import type { BeltId } from './belts';

/** Un calcul de tête, avec l'astuce de la leçon pour le trouver. */
export interface MentalQuestion extends QuizQuestion {
  answer: number;
  explain: string;
  /** « 37+63=100 », pour ne pas redonner les mêmes au prochain entraînement. */
  id: string;
}

export interface MentalBelt {
  belt: BeltId;
  /** Ce que demande la ceinture, comme dans le classeur. */
  skill: string;
  /** Nombres décimaux : la touche virgule au pavé. */
  decimal?: boolean;
  /** « Objectif de fin de CE2 » dans le classeur. */
  goal?: 'CE2' | 'CM1' | 'CM2';
  /** Les astuces de la leçon. */
  tips: readonly string[];
  /** Les calculs expliqués dans la leçon (un par sorte de calcul). */
  examples: () => MentalQuestion[];
  /** Un calcul de la ceinture ; `index` dans la série, pour alterner les sortes de calculs. */
  drawCalc(random: () => number, index: number): MentalQuestion;
}

/** Calculs d'un entraînement, et de l'entraînement en conditions réelles (en 2 minutes). */
export const MENTAL_PRACTICE_SIZE = 10;
export const MENTAL_TEST_SIZE = 20;
export const MENTAL_TEST_TIME_MS = 120_000;
/** « Maximum 1 erreur » : 19 justes sur 20. */
export const MENTAL_MAX_ERRORS = 1;

export const passesMental = (correct: number, total: number) => total > 0 && total - correct <= MENTAL_MAX_ERRORS;

const between = (min: number, max: number, random: () => number) => min + Math.floor(random() * (max - min + 1));
const pick = <T>(items: readonly T[], random: () => number) => items[Math.floor(random() * items.length)]!;

/** « a + b » ou « a − b », la réponse et l'astuce. */
function calc(prompt: string, answer: number, explain: string, suffix?: string): MentalQuestion {
  const id = (suffix === undefined ? `${prompt}=${answer}` : `${prompt}${answer}${suffix}`).replace(/\s/g, '');
  return suffix === undefined ? { prompt, answer, explain, id } : { prompt, suffix, answer, explain, id };
}

/** 3 dizaines, 2 centaines… : les noms des rangs. */
const RANKS = ['unités', 'dizaines', 'centaines', 'milliers', 'dizaines de milliers'];
const ZEROS = ['', 'un 0', 'deux 0', 'trois 0', 'quatre 0'];
/** Les rangs après la virgule, et combien de chiffres il y a. */
const PLACES = ['unités', 'dixièmes', 'centièmes', 'millièmes'];
const DIGITS = ['', '1 chiffre', '2 chiffres', '3 chiffres'];
const shifts = (z: number) => `${z} rang${z > 1 ? 's' : ''}`;

// --- Blanche : additionner et soustraire des petits nombres ---

export function smallAddition(a: number, b: number): MentalQuestion {
  const sum = a + b;
  const [low, high] = [Math.min(a, b), Math.max(a, b)];
  const explain =
    high - low === 1
      ? `C’est presque un double : ${low} + ${low} = ${low * 2}, plus 1 : ${sum}.`
      : a === b
        ? `C’est un double : ${a} + ${a} = ${sum}.`
        : sum > 10
          ? `On passe par 10 : ${high} + ${10 - high} = 10, puis 10 + ${sum - 10} = ${sum}.`
          : sum === 10
            ? `${a} et ${b} font 10 : ce sont des compléments à 10.`
            : `${a} + ${b} = ${sum}.`;
  return calc(`${a} + ${b}`, sum, explain);
}

export function smallSubtraction(a: number, b: number): MentalQuestion {
  const result = a - b;
  const units = a - 10;
  const explain =
    a > 10 && b > units
      ? `On passe par 10 : ${a} − ${units} = 10, puis 10 − ${b - units} = ${result}.`
      : `${a} − ${b} = ${result} : vérifie, ${result} + ${b} = ${a}.`;
  return calc(`${a} − ${b}`, result, explain);
}

/** 40 + 30, 90 − 20 : on calcule avec les chiffres des dizaines (leçon Calc 15). */
export function tensCalc(a: number, b: number, minus: boolean): MentalQuestion {
  const result = minus ? a - b : a + b;
  const sign = minus ? '−' : '+';
  const explain = `On regarde les chiffres des dizaines : ${a / 10} ${sign} ${b / 10} = ${result / 10}, donc ${a} ${sign} ${b} = ${result}.`;
  return calc(`${a} ${sign} ${b}`, result, explain);
}

function drawSmall(random: () => number, index: number): MentalQuestion {
  if (index % 3 === 0) return smallAddition(between(2, 9, random), between(2, 9, random));
  if (index % 3 === 1) {
    const a = between(11, 18, random);
    return smallSubtraction(a, between(Math.max(2, a - 9), 9, random));
  }
  const minus = random() < 0.5;
  const a = between(minus ? 3 : 1, minus ? 9 : 8, random);
  const b = minus ? between(1, a - 1, random) : between(1, 9 - a, random);
  return tensCalc(a * 10, b * 10, minus);
}

// --- Beige : ajouter et soustraire 10, 100, 1000 ---

export function plusPower(n: number, power: number, minus: boolean): MentalQuestion {
  const result = minus ? n - power : n + power;
  const rank = RANKS[String(power).length - 1]!;
  const sign = minus ? '−' : '+';
  const digit = (x: number) => Math.floor(x / power) % 10;
  // 395 + 10 : le chiffre des dizaines passe de 9 à 0, celui des centaines augmente.
  const carry = minus ? digit(n) === 0 : digit(n) === 9;
  const explain = carry
    ? `${sign} ${power}, c’est ${minus ? 'enlever' : 'ajouter'} 1 aux ${rank} : ${Math.floor(n / power)} ${sign} 1 = ${Math.floor(result / power)} ${rank}, donc ${result}.`
    : `${sign} ${power}, c’est ${minus ? 'enlever' : 'ajouter'} 1 aux ${rank} : le chiffre des ${rank} passe de ${digit(n)} à ${digit(result)}, ${result}.`;
  return calc(`${n} ${sign} ${power}`, result, explain);
}

function drawPower(random: () => number, index: number): MentalQuestion {
  const power = [10, 100, 1000][index % 3]!;
  const minus = random() < 0.5;
  // Assez grand pour qu'on voie le rang changer, sans résultat négatif ni plus de 4 chiffres.
  const n = power === 10 ? between(minus ? 11 : 10, 999, random) : between(minus ? power + 1 : power / 10, 9999 - power, random);
  return plusPower(n, power, minus);
}

// --- Jaune : complément à 100 ---

/** « 1 dizaine », « 7 dizaines ». */
const tens = (k: number) => `${k} dizaine${k > 1 ? 's' : ''}`;

/** « 37 + … = 100 » : jusqu'à la dizaine supérieure, puis jusqu'à 100 (leçon Calc 14). */
export function complementTo100(n: number): MentalQuestion {
  const answer = 100 - n;
  const up = (10 - (n % 10)) % 10;
  const explain =
    up === 0
      ? `On compte en dizaines : ${tens(n / 10)} + ${tens(answer / 10)} = 10 dizaines, donc ${n} + ${answer} = 100.`
      : `On va d’abord à la dizaine : ${n} + ${up} = ${n + up}, puis ${n + up} + ${100 - n - up} = 100. ${up} + ${100 - n - up} = ${answer}.`;
  return calc(`${n} +`, answer, explain, '= 100');
}

function drawComplement(random: () => number, index: number): MentalQuestion {
  return complementTo100(index % 3 === 2 ? between(1, 9, random) * 10 : between(1, 98, random));
}

// --- Orange : ajouter et soustraire 9 et 11 ---

export function plusNineEleven(n: number, k: 9 | 11, minus: boolean): MentalQuestion {
  const result = minus ? n - k : n + k;
  const sign = minus ? '−' : '+';
  const ten = minus ? n - 10 : n + 10;
  const fix = k === 9 ? (minus ? '+' : '−') : sign;
  const explain = `${sign} ${k}, c’est ${sign} 10 ${fix} 1 : ${n} ${sign} 10 = ${ten}, puis ${ten} ${fix} 1 = ${result}.`;
  return calc(`${n} ${sign} ${k}`, result, explain);
}

function drawNineEleven(random: () => number, index: number): MentalQuestion {
  const k = index % 2 === 0 ? 9 : 11;
  const minus = random() < 0.5;
  const n = index % 4 < 2 ? between(minus ? 20 : 12, 99, random) : between(100, 999, random);
  return plusNineEleven(n, k, minus);
}

// --- Rouge : multiplier et diviser par 10, 100, 1000 ---

export function timesPower(n: number, power: number): MentalQuestion {
  const zeros = String(power).length - 1;
  const explain = `× ${power} : chaque chiffre devient ${power} fois plus grand, on écrit ${ZEROS[zeros]} à droite : ${n * power}.`;
  return calc(`${n} × ${power}`, n * power, explain);
}

export function dividedByPower(n: number, power: number): MentalQuestion {
  const zeros = String(power).length - 1;
  const explain = `: ${power} : chaque chiffre devient ${power} fois plus petit, on enlève ${ZEROS[zeros]} à droite : ${n / power}.`;
  return calc(`${n} : ${power}`, n / power, explain);
}

function drawTimesPower(random: () => number, index: number): MentalQuestion {
  const power = pick([10, 100, 1000], random);
  // Un nombre qui finit souvent par des 0 lui-même (40 × 100), pour ne pas compter les 0 de travers.
  const n = power === 1000 ? between(2, 99, random) : between(2, 999, random);
  return index % 2 === 0 ? timesPower(n, power) : dividedByPower(n * power, power);
}

// --- Rose : double, triple, quadruple ---

const MULTIPLES = { 2: 'double', 3: 'triple', 4: 'quadruple' } as const;

export function multiple(n: number, k: 2 | 3 | 4): MentalQuestion {
  const name = MULTIPLES[k];
  const tens = n - (n % 10);
  const units = n % 10;
  const explain =
    k === 4
      ? `Le quadruple, c’est le double du double : ${n} → ${n * 2} → ${n * 4}.`
      : units === 0 || tens === 0
        ? `Le ${name}, c’est ${n} × ${k} = ${n * k}.`
        : `Le ${name} de ${tens} est ${tens * k}, le ${name} de ${units} est ${units * k} : ${tens * k} + ${units * k} = ${n * k}.`;
  return calc(`Le ${name} de ${n}`, n * k, explain);
}

function drawMultiple(random: () => number, index: number): MentalQuestion {
  const k = ([2, 3, 4] as const)[index % 3]!;
  const n = k === 2 ? between(11, 99, random) : k === 3 ? between(11, 40, random) : between(11, 30, random);
  return multiple(n, k);
}

// --- Violette : multiplier par 20, 300, 4000… ---

/** 6 × 30 : on multiplie par le chiffre (6 × 3) et on ajoute le nombre de zéros (leçon Calc 15). */
export function timesRound(n: number, round: number): MentalQuestion {
  const digit = Number(String(round)[0]);
  const zeros = String(round).length - 1;
  const explain = `On multiplie ${n} × ${digit} = ${n * digit}, et on ajoute ${ZEROS[zeros]} : ${n * round}.`;
  return calc(`${n} × ${round}`, n * round, explain);
}

function drawTimesRound(random: () => number, index: number): MentalQuestion {
  const zeros = (index % 3) + 1;
  return timesRound(between(2, 9, random), between(2, 9, random) * 10 ** zeros);
}

// --- Les décimaux : chaque nombre est compté dans son plus petit rang, pour calculer juste ---

/** Chiffres après la virgule : 2 pour 8,37. */
const placesOf = (x: number) => (String(x).split('.')[1] ?? '').length;
/** 8,37 en centièmes : 837 (`places` = 2). */
const unitsOf = (x: number, places: number) => Math.round(x * 10 ** places);
/** Un nombre qui ne finit pas par 0 : sa fraction décimale est unique (8,37 et pas 8,370). */
function noTrailingZero(min: number, max: number, random: () => number): number {
  for (;;) {
    const n = between(min, max, random);
    if (n % 10 !== 0) return n;
  }
}

// --- Bleu clair : écriture décimale et fraction décimale (leçon N19) ---

/** « 8,37 = ?/100 » : 2 chiffres après la virgule, 100 au dénominateur. */
export function decimalToFraction(numerator: number, places: 1 | 2 | 3): MentalQuestion {
  const n = numerator / 10 ** places;
  const denominator = 10 ** places;
  const explain = `${fr(n)} a ${DIGITS[places]} après la virgule, il s’arrête aux ${PLACES[places]}. On l’écrit sans la virgule, ${numerator}, et on met ${denominator} au dénominateur : ${numerator}/${denominator}.`;
  return calc(`${fr(n)} =`, numerator, explain, `/${denominator}`);
}

/** « 12/10 = ? » : 10 a un 0, il y aura 1 chiffre après la virgule. */
export function fractionToDecimal(numerator: number, places: 1 | 2 | 3): MentalQuestion {
  const denominator = 10 ** places;
  const answer = numerator / denominator;
  const start = `${denominator} a ${ZEROS[places]} : il y aura ${DIGITS[places]} après la virgule.`;
  const end =
    String(numerator).length <= places
      ? `On complète par des 0 devant ${numerator} : ${fr(answer)}.`
      : `On place la virgule dans ${numerator} : ${fr(answer)}.`;
  return calc(`${numerator}/${denominator}`, answer, `${start} ${end}`);
}

function drawDecimalFraction(random: () => number, index: number): MentalQuestion {
  const places = ((Math.floor(index / 2) % 3) + 1) as 1 | 2 | 3;
  // Des nombres de 1 chiffre (0,7) jusqu'à 4 chiffres (99,99 ou 9,999).
  const digits = between(1, Math.min(places + 2, 4), random);
  const numerator = noTrailingZero(10 ** (digits - 1), 10 ** digits - 1, random);
  return index % 2 === 0 ? decimalToFraction(numerator, places) : fractionToDecimal(numerator, places);
}

// --- Bleu foncé et vert clair : ajouter et soustraire deux décimaux (leçon Calc 13) ---

/** « 0,5 = 0,50 » : on complète par des 0 pour avoir autant de chiffres après la virgule. */
function padded(numbers: number[], places: number): string {
  const pads = numbers.filter((x) => placesOf(x) > 0 && placesOf(x) < places);
  if (pads.length === 0) return '';
  const zeros = (x: number) => '0'.repeat(places - placesOf(x));
  return `On complète par des 0 : ${pads.map((x) => `${fr(x)} = ${fr(x)}${zeros(x)}`).join(', ')}. `;
}

export function addDecimals(a: number, b: number): MentalQuestion {
  const places = Math.max(placesOf(a), placesOf(b));
  const unit = 10 ** places;
  const [x, y] = [unitsOf(a, places), unitsOf(b, places)];
  const answer = (x + y) / unit;
  const [ai, bi, ad, bd] = [Math.floor(x / unit), Math.floor(y / unit), x % unit, y % unit];
  const name = PLACES[places]!;
  const carry =
    ad + bd >= unit
      ? `, c’est 1 unité et ${ad + bd - unit} ${name}. ${ai + bi} + 1 = ${ai + bi + 1} unités`
      : '';
  const explain = `${padded([a, b], places)}Les unités : ${ai} + ${bi} = ${ai + bi}. Les ${name} : ${ad} + ${bd} = ${ad + bd}${carry}. Donc ${fr(answer)}.`;
  return calc(`${fr(a)} + ${fr(b)}`, answer, explain);
}

export function subtractDecimals(a: number, b: number): MentalQuestion {
  const places = Math.max(placesOf(a), placesOf(b));
  const unit = 10 ** places;
  const [x, y] = [unitsOf(a, places), unitsOf(b, places)];
  const answer = (x - y) / unit;
  const [ai, bi, ad, bd] = [Math.floor(x / unit), Math.floor(y / unit), x % unit, y % unit];
  const name = PLACES[places]!;
  // 3 − 0,4 : l'entier s'écrit 3,0.
  const whole = placesOf(a) === 0 ? `${fr(a)} = ${fr(a)},${'0'.repeat(places)}. ` : '';
  const steps =
    ad >= bd
      ? `Les unités : ${ai} − ${bi} = ${ai - bi}. Les ${name} : ${ad} − ${bd} = ${ad - bd}.`
      : `Les ${name} : ${ad} − ${bd}, pas possible : on prend 1 unité, ${ad + unit} − ${bd} = ${ad + unit - bd}. Les unités : ${ai} − 1 − ${bi} = ${ai - 1 - bi}.`;
  return calc(`${fr(a)} − ${fr(b)}`, answer, `${whole}${padded([a, b], places)}${steps} Donc ${fr(answer)}.`);
}

/** Les deux nombres d'une série : en dixièmes, avec ou sans retenue, puis avec des centièmes. */
function drawAddition(random: () => number, index: number): MentalQuestion {
  const tenths = (i: number, d: number) => (i * 10 + d) / 10;
  if (index % 3 === 0) {
    const ad = between(1, 8, random);
    return addDecimals(tenths(between(1, 9, random), ad), tenths(between(0, 9, random), between(1, 9 - ad, random)));
  }
  if (index % 3 === 1) {
    const ad = between(2, 9, random);
    return addDecimals(tenths(between(0, 9, random), ad), tenths(between(0, 9, random), between(10 - ad, 9, random)));
  }
  const a = noTrailingZero(1, 999, random) / 100;
  const b = random() < 0.3 ? between(1, 9, random) : tenths(between(0, 9, random), between(1, 9, random));
  return random() < 0.5 ? addDecimals(a, b) : addDecimals(b, a);
}

function drawSubtraction(random: () => number, index: number): MentalQuestion {
  const tenths = (i: number, d: number) => (i * 10 + d) / 10;
  const ai = between(2, 9, random);
  const bi = between(0, ai - 1, random);
  if (index % 3 === 0) {
    const ad = between(2, 9, random);
    return subtractDecimals(tenths(ai, ad), tenths(bi, between(1, ad - 1, random)));
  }
  if (index % 3 === 1) {
    // Pas assez de dixièmes ; 0 dixième : on enlève un décimal à un entier (3 − 0,4).
    const ad = between(0, 8, random);
    return subtractDecimals(tenths(ai, ad), tenths(bi, between(ad + 1, 9, random)));
  }
  return subtractDecimals(tenths(ai, between(1, 9, random)), (bi * 100 + noTrailingZero(1, 99, random)) / 100);
}

// --- Vert foncé : le complément jusqu'à l'entier supérieur ---

/** « 7,25 + ? = 8 » : d'abord jusqu'au dixième, puis jusqu'à l'entier (comme le complément à 100). */
export function complementToUnit(x: number): MentalQuestion {
  const places = placesOf(x);
  const unit = 10 ** places;
  const n = unitsOf(x, places);
  const target = Math.ceil(n / unit);
  const answer = (target * unit - n) / unit;
  let explain: string;
  if (places === 1) {
    explain = `${fr(x)}, c’est ${n % 10} dixièmes après ${Math.floor(x)} : il en manque ${10 - (n % 10)} pour faire 1 unité. ${fr(x)} + ${fr(answer)} = ${target}.`;
  } else {
    const up = (10 - (n % 10)) / 100;
    const tenth = (n + 10 - (n % 10)) / 100;
    explain =
      tenth === target
        ? `On va jusqu’au dixième : ${fr(x)} + ${fr(up)} = ${target}. C’est déjà l’entier : ${fr(answer)}.`
        : `On va d’abord au dixième : ${fr(x)} + ${fr(up)} = ${fr(tenth)}, puis ${fr(tenth)} + ${fr((target * 10 - tenth * 10) / 10)} = ${target}. ${fr(up)} + ${fr((target * 10 - tenth * 10) / 10)} = ${fr(answer)}.`;
  }
  return calc(`${fr(x)} +`, answer, explain, `= ${target}`);
}

function drawComplementToUnit(random: () => number, index: number): MentalQuestion {
  const whole = between(0, 19, random);
  // Construit depuis des entiers : 3 + 0,6 ne tombe pas toujours juste avec les nombres de l'ordinateur.
  return complementToUnit(index % 2 === 0 ? (whole * 10 + between(1, 9, random)) / 10 : (whole * 100 + noTrailingZero(1, 99, random)) / 100);
}

// --- Marron : multiplier et diviser un décimal par 10, 100, 1000 (leçon Calc 12) ---

/** « 5,447 × 100 » : on décale la virgule de 2 rangs vers la droite ; plus de virgule, on ajoute des 0. */
export function shiftTimes(x: number, power: number): MentalQuestion {
  const zeros = String(power).length - 1;
  const places = placesOf(x);
  const answer = (unitsOf(x, places) * power) / 10 ** places;
  const added = zeros > places ? `, on ne peut plus la décaler, on ajoute ${ZEROS[zeros - places]}` : '';
  const explain = `× ${power} : on décale la virgule de ${shifts(zeros)} vers la droite${added} : ${fr(answer)}.`;
  return calc(`${fr(x)} × ${power}`, answer, explain);
}

/** « 651 : 100 » : on décale la virgule de 2 rangs vers la gauche ; s'il manque des chiffres, des 0 devant. */
export function shiftDivided(x: number, power: number): MentalQuestion {
  const zeros = String(power).length - 1;
  const places = placesOf(x);
  const n = unitsOf(x, places);
  const answer = n / 10 ** (places + zeros);
  const added = String(n).length <= places + zeros ? ', on ajoute des 0 devant' : '';
  const explain = `: ${power} : on décale la virgule de ${shifts(zeros)} vers la gauche${added} : ${fr(answer)}.`;
  return calc(`${fr(x)} : ${power}`, answer, explain);
}

function drawShift(random: () => number, index: number): MentalQuestion {
  const zeros = between(1, 3, random);
  if (index % 2 === 0) {
    // Jusqu'à 3 chiffres après la virgule (0,273 × 1000), le résultat reste court.
    const places = between(1, 3, random);
    return shiftTimes(noTrailingZero(2, zeros === 3 ? 999 : 9999, random) / 10 ** places, 10 ** zeros);
  }
  // Un entier ou un décimal, et pas plus que des millièmes au résultat.
  const places = between(0, 3 - zeros, random);
  return shiftDivided(noTrailingZero(2, 9999, random) / 10 ** places, 10 ** zeros);
}

export const CALCUL_MENTAL: readonly MentalBelt[] = [
  {
    belt: 'blanche',
    skill: 'Additionner et soustraire des petits nombres',
    tips: [
      'Connais tes compléments à 10 sur les doigts : 6 + 4, 7 + 3, 8 + 2, 9 + 1.',
      'Presque un double : 6 + 7, c’est 6 + 6 + 1 = 13.',
      'Pour dépasser 10, passe par 10 : 8 + 5, c’est 8 + 2 = 10, puis 10 + 3 = 13.',
      'Avec des dizaines entières, regarde les chiffres des dizaines : 20 + 30, c’est 2 + 3 = 5 dizaines, 50.',
    ],
    examples: () => [smallAddition(6, 7), smallSubtraction(13, 5), tensCalc(40, 30, false)],
    drawCalc: drawSmall,
  },
  {
    belt: 'beige',
    skill: 'Ajouter et soustraire 10, 100, 1000 à un entier',
    tips: [
      '+ 10, c’est 1 dizaine de plus : seul le chiffre des dizaines change. 345 + 10 = 355.',
      '+ 100, c’est 1 centaine de plus ; + 1000, 1 millier de plus.',
      'Attention au 9 : 395 + 10, 39 dizaines + 1 = 40 dizaines, donc 405.',
      'Pour soustraire, c’est pareil, avec 1 de moins : 2045 − 100 = 1945.',
    ],
    examples: () => [plusPower(345, 10, false), plusPower(395, 10, false), plusPower(2045, 100, true)],
    drawCalc: drawPower,
  },
  {
    belt: 'jaune',
    skill: 'Complément à 100 d’un nombre entier',
    tips: [
      'Avec des dizaines entières, pense à 10 : 70 + 30 = 100 comme 7 + 3 = 10.',
      'Sinon, va d’abord à la dizaine supérieure : 37 + 3 = 40.',
      'Puis de cette dizaine jusqu’à 100 : 40 + 60 = 100.',
      'La réponse, c’est les deux ensemble : 3 + 60 = 63.',
    ],
    examples: () => [complementTo100(70), complementTo100(37)],
    drawCalc: drawComplement,
  },
  {
    belt: 'orange',
    skill: 'Ajouter et soustraire 11 et 9 à un nombre entier',
    goal: 'CE2',
    tips: [
      '+ 9, c’est + 10 − 1 : 36 + 10 = 46, puis 46 − 1 = 45.',
      '− 9, c’est − 10 + 1 : 73 − 10 = 63, puis 63 + 1 = 64.',
      '+ 11, c’est + 10 + 1 ; − 11, c’est − 10 − 1.',
    ],
    examples: () => [plusNineEleven(36, 9, false), plusNineEleven(73, 9, true), plusNineEleven(58, 11, false)],
    drawCalc: drawNineEleven,
  },
  {
    belt: 'rouge',
    skill: 'Multiplier et diviser un entier par 10, 100, 1000',
    tips: [
      '× 10 : chaque chiffre devient 10 fois plus grand, on écrit un 0 à droite. 45 × 10 = 450.',
      '× 100 : deux 0 ; × 1000 : trois 0.',
      ': 10 : chaque chiffre devient 10 fois plus petit, on enlève un 0. 4500 : 100 = 45.',
    ],
    examples: () => [timesPower(45, 100), dividedByPower(4500, 100)],
    drawCalc: drawTimesPower,
  },
  {
    belt: 'rose',
    skill: 'Double, triple, quadruple d’un entier',
    tips: [
      'Le double, c’est × 2 ; le triple, × 3 ; le quadruple, × 4.',
      'Coupe le nombre en dizaines et unités : le double de 34, c’est le double de 30 (60) et le double de 4 (8), 68.',
      'Le quadruple, c’est le double du double : 23 → 46 → 92.',
    ],
    examples: () => [multiple(34, 2), multiple(25, 3), multiple(23, 4)],
    drawCalc: drawMultiple,
  },
  {
    belt: 'violette',
    skill: 'Multiplier un entier par 20, 300, 4000…',
    tips: [
      'On multiplie le nombre par le chiffre des dizaines (ou des centaines…) : 6 × 30, c’est 6 × 3 = 18.',
      'Puis on ajoute le nombre de zéros : 6 × 30 = 180.',
      '2 × 300 : 2 × 3 = 6, et deux 0 : 600.',
    ],
    examples: () => [timesRound(6, 30), timesRound(2, 300)],
    drawCalc: drawTimesRound,
  },
  {
    belt: 'bleu-clair',
    skill: 'Passer d’une écriture décimale à une fraction décimale et inversement',
    decimal: true,
    tips: [
      'Une fraction décimale a 10, 100 ou 1000 au dénominateur.',
      'Autant de 0 au dénominateur que de chiffres après la virgule : 10 → 1 chiffre, 100 → 2, 1000 → 3.',
      'Du nombre à la fraction : 8,37 a 2 chiffres après la virgule. On l’écrit sans la virgule, 837, et on met 100 au dénominateur : 837/100.',
      'De la fraction au nombre : 12/10, 10 a un 0, il y aura 1 chiffre après la virgule : 1,2.',
      'S’il manque des chiffres, on complète par des 0 devant : 3/1000 = 0,003.',
    ],
    examples: () => [decimalToFraction(837, 2), fractionToDecimal(12, 1), fractionToDecimal(3, 3)],
    drawCalc: drawDecimalFraction,
  },
  {
    belt: 'bleu-fonce',
    skill: 'Ajouter deux nombres décimaux',
    decimal: true,
    tips: [
      'On ajoute les unités avec les unités, les dixièmes avec les dixièmes : 7,2 + 2,5 = 9,7.',
      '10 dixièmes font 1 unité : 3,7 + 0,6, c’est 13 dixièmes, donc 1 unité et 3 dixièmes : 4,3.',
      'Pas autant de chiffres après la virgule ? On complète par des 0 : 1,25 + 0,5, c’est 1,25 + 0,50 = 1,75.',
      'N’oublie pas la virgule au résultat !',
    ],
    examples: () => [addDecimals(7.2, 2.5), addDecimals(3.7, 0.6), addDecimals(1.25, 0.5)],
    drawCalc: drawAddition,
  },
  {
    belt: 'vert-clair',
    skill: 'Soustraire deux nombres décimaux',
    goal: 'CM1',
    decimal: true,
    tips: [
      'On soustrait les unités des unités, les dixièmes des dixièmes : 6,4 − 3,1 = 3,3.',
      'Pas assez de dixièmes ? On prend 1 unité, qui fait 10 dixièmes : 4,2 − 0,5, c’est 12 − 5 = 7 dixièmes et 3 unités : 3,7.',
      'Un entier est aussi un décimal : 3 = 3,0, donc 3 − 0,4 = 2,6.',
      'On complète par des 0 : 2,5 − 1,25, c’est 2,50 − 1,25 = 1,25.',
    ],
    examples: () => [subtractDecimals(6.4, 3.1), subtractDecimals(4.2, 0.5), subtractDecimals(2.5, 1.25)],
    drawCalc: drawSubtraction,
  },
  {
    belt: 'vert-fonce',
    skill: 'Calculer le complément d’un décimal pour aller vers l’entier supérieur',
    decimal: true,
    tips: [
      'Il faut 10 dixièmes pour faire 1 unité : 3,6, c’est 6 dixièmes, il en manque 4. 3,6 + 0,4 = 4.',
      'Avec des centièmes, va d’abord au dixième : 7,25 + 0,05 = 7,3.',
      'Puis du dixième jusqu’à l’entier : 7,3 + 0,7 = 8.',
      'La réponse, c’est les deux ensemble : 0,05 + 0,7 = 0,75.',
    ],
    examples: () => [complementToUnit(3.6), complementToUnit(7.25)],
    drawCalc: drawComplementToUnit,
  },
  {
    belt: 'marron',
    skill: 'Multiplier et diviser un nombre décimal par 10, 100, 1000…',
    decimal: true,
    tips: [
      '× 10, 100, 1000 : on décale la virgule de 1, 2 ou 3 rangs vers la droite. 12,3 × 10 = 123.',
      'Si on ne peut plus décaler la virgule, on ajoute des 0 : 4,2 × 100 = 420.',
      ': 10, 100, 1000 : on décale la virgule de 1, 2 ou 3 rangs vers la gauche. 12,3 : 10 = 1,23.',
      'S’il n’y a plus de chiffre, on ajoute des 0 devant : 7 : 100 = 0,07.',
    ],
    examples: () => [shiftTimes(5.447, 100), shiftTimes(4.2, 100), shiftDivided(651, 100), shiftDivided(7, 100)],
    drawCalc: drawShift,
  },
];

/** Les calculs d'une série, tous différents et pas ceux de la dernière fois (`seen`) si possible. */
export function pickCalcs(belt: MentalBelt, count: number, seen: readonly string[] = [], random = Math.random): MentalQuestion[] {
  const picked: MentalQuestion[] = [];
  for (let tries = 0; picked.length < count; tries++) {
    const question = belt.drawCalc(random, picked.length);
    const known = (tries < 1000 && picked.some((p) => p.id === question.id)) || (tries < 100 && seen.includes(question.id));
    if (!known) picked.push(question);
  }
  return shuffle(picked, random);
}
