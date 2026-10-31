// Ceintures de calcul mental : les ceintures du classeur, de la blanche à la brillante
// (voir .ai/analyse/16-ceintures-calcul-mental.md ; elles arrivent une étape à la fois).
// « Je calcule rapidement (2 minutes par ceinture, maximum 1 erreur) » : pas de fiche, les calculs se
// tirent au hasard sur le modèle des exercices des leçons de la classe (Calc 14 et Calc 15).

import { shuffle, type QuizQuestion } from '../../core/quiz';
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
