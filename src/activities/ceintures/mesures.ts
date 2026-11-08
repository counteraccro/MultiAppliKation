// Ceintures de mesures : les ceintures du classeur, de la blanche à la noire, et une brillante
// (voir .ai/analyse/20-ceintures-mesures.md). Les questions se tirent au hasard sur le modèle des fiches
// Charivari (« entrainement mesures.pdf ») ; les astuces viennent des leçons Mes 1 à Mes 10 de la classe.
// Une question se répond en touchant un bouton (l'unité, < > =, un mois, un prénom), au pavé, ou par un
// nombre et une unité : en classe, l'élève écrit le calcul et une phrase-réponse ; ici, le résultat et l'unité.
// Les ceintures ont la forme de celles de la Numération : elles passent par les mêmes écrans.

import { groupDigits, numberText, shuffle } from '../../core/quiz';
import type { NumerationBelt, NumerationQuestion } from './numeration';

type Draw = (random: () => number) => NumerationQuestion;

const between = (min: number, max: number, random: () => number) => min + Math.floor(random() * (max - min + 1));
const pick = <T>(items: readonly T[], random: () => number) => items[Math.floor(random() * items.length)]!;

function question(fields: Omit<NumerationQuestion, 'id'>): NumerationQuestion {
  return { ...fields, id: fields.solved };
}

/** 4 810, 1,4 : les classes séparées, la virgule. */
const spaced = (n: number) => groupDigits(numberText(Math.round(n * 1e6) / 1e6));

// --- Les unités ---

export const LENGTHS = ['mm', 'cm', 'm', 'km'] as const;
export const MASSES = ['g', 'kg', 't'] as const;
export const VOLUMES = ['ml', 'cl', 'L'] as const;
/** Les colonnes des tableaux de conversion (leçon Mes 10), de la plus grande unité à la plus petite. */
export const LENGTH_TABLE = ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'] as const;
export const MASS_TABLE = ['kg', 'hg', 'dag', 'g'] as const;
export const VOLUME_TABLE = ['L', 'dl', 'cl', 'ml'] as const;
type Unit = (typeof LENGTH_TABLE)[number] | (typeof MASS_TABLE)[number] | (typeof VOLUME_TABLE)[number] | 't';

/** Chaque unité dans la plus petite de sa famille : 1 m = 1 000 mm, 1 t = 1 000 000 g, 1 L = 1 000 ml. */
const FACTOR: Readonly<Record<Unit, number>> = {
  mm: 1,
  cm: 10,
  dm: 100,
  m: 1000,
  dam: 10_000,
  hm: 100_000,
  km: 1_000_000,
  g: 1,
  dag: 10,
  hg: 100,
  kg: 1000,
  t: 1_000_000,
  ml: 1,
  cl: 10,
  dl: 100,
  L: 1000,
};

/** Les unités à toucher pour une mesure : les plus connues de sa famille, ou tout le tableau de conversion. */
const familyOf = (unit: Unit): readonly Unit[] =>
  [LENGTHS, MASSES, VOLUMES, LENGTH_TABLE, MASS_TABLE, VOLUME_TABLE].find((family) => (family as readonly Unit[]).includes(unit))!;

/** Une mesure : un nombre et son unité, « 120 cm ». */
type Measure = readonly [value: number, unit: Unit];

const measureText = ([value, unit]: Measure) => `${spaced(value)}\u00a0${unit}`;
const inSmallest = ([value, unit]: Measure) => value * FACTOR[unit];

/**
 * La réponse « 170 cm », et la même mesure dans les autres unités de sa famille quand elle s'écrit avec au plus
 * `places` chiffres après la virgule (sans virgule tant que le pavé n'en a pas : 1 700 mm oui, 1,7 m non).
 */
function measureAnswer(base: number, unit: Unit, others: readonly Unit[] = familyOf(unit), places = 0): Pick<NumerationQuestion, 'answer' | 'alsoAccepted'> {
  const text = (u: Unit) => `${spaced(base / FACTOR[u])} ${u}`;
  const fits = (u: Unit) => u !== unit && Number.isInteger(Math.round((base / FACTOR[u]) * 10 ** places * 1e6) / 1e6);
  return { answer: text(unit), alsoAccepted: others.filter(fits).map(text) };
}

// --- L'unité qui convient (fiches n° 1, 3, 5, 7, 9) ---

const UNIT_HINTS: Readonly<Partial<Record<Unit, string>>> = {
  mm: 'Le millimètre, c’est tout petit : l’épaisseur d’une pièce de monnaie.',
  cm: 'Le centimètre, c’est la largeur d’un doigt : on mesure un crayon, un pied en cm.',
  m: 'Le mètre, c’est un grand pas : on mesure un mur, un arbre, une montagne en m.',
  km: 'Le kilomètre, c’est 1\u00a0000 m : on mesure les grandes distances en km.',
  g: 'Le gramme, c’est très léger : on pèse un fromage, une pomme en g.',
  kg: 'Le kilogramme, c’est 1\u00a0000 g : on pèse une personne, un sac de pommes de terre en kg.',
  t: 'La tonne (t), c’est 1\u00a0000 kg : on pèse les choses très lourdes, comme un éléphant ou un camion.',
  ml: 'Le millilitre, c’est une toute petite quantité : une cuillère de sirop.',
  cl: 'Le centilitre, c’est pour un verre, une canette (33 cl), une recette.',
  L: 'Le litre, c’est une bouteille d’eau ou une brique de lait.',
};

/** Le début de la phrase, l'unité attendue, la fin ; les fiches, puis les nôtres. */
const UNIT_SENTENCES: readonly (readonly [before: string, unit: Unit, after: string])[] = [
  ['Le mur de la classe peut mesurer 3', 'm', 'de hauteur.'],
  ['Une pièce de monnaie a une épaisseur de 2', 'mm', '.'],
  ['Du nord au sud, la France mesure environ 1\u00a0000', 'km', '.'],
  ['Un arbre peut mesurer 30', 'm', 'de haut.'],
  ['Un crayon peut mesurer 15', 'cm', '.'],
  ['Une brique de lait contient 1', 'L', 'de lait.'],
  ['Une vitre peut avoir 4', 'mm', 'd’épaisseur.'],
  ['Une roue de vélo peut avoir 30', 'cm', 'de rayon.'],
  ['Un piéton peut parcourir 5', 'km', 'en une heure.'],
  ['Ton pied mesure environ 25', 'cm', 'de long.'],
  ['Un éléphant pèse 4', 't', '.'],
  ['Une canette de soda contient 33', 'cl', '.'],
  ['Une baignoire contient 200', 'L', 'd’eau.'],
  ['Le mont Blanc culmine à 4\u00a0810', 'm', '.'],
  ['Un camembert pèse 250', 'g', '.'],
  ['Un enfant de CM1 pèse environ 30', 'kg', '.'],
  ['Une fourmi mesure environ 5', 'mm', 'de long.'],
  ['Une voiture pèse environ 1', 't', '.'],
  ['Un verre d’eau contient 20', 'cl', '.'],
  ['Une pomme pèse environ 150', 'g', '.'],
  ['La porte de la classe mesure 2', 'm', 'de haut.'],
  ['De Paris à Marseille, il y a environ 800', 'km', '.'],
  ['Une cuillère à café contient 5', 'ml', 'de sirop.'],
  ['Un sac de pommes de terre pèse 5', 'kg', '.'],
  ['Une gomme mesure environ 4', 'cm', 'de long.'],
  ['Un seau contient 10', 'L', 'd’eau.'],
];

/** « Une canette de soda contient 33 … » : l'unité se touche parmi celles de sa famille. */
export function unitFor(index: number): NumerationQuestion {
  const [before, unit, after] = UNIT_SENTENCES[index % UNIT_SENTENCES.length]!;
  const end = after === '.' ? '.' : ` ${after}`;
  return question({
    context: 'Complète avec l’unité qui convient',
    prompt: before,
    suffix: after,
    choices: familyOf(unit).map((u) => ({ label: u, value: u })),
    answer: unit,
    solved: `${before} ${unit}${end}`,
    explain: UNIT_HINTS[unit] ?? '',
  });
}

// --- < > = (fiches n° 2, 6, 10, 14, 17) ---

const SYMBOLS = [
  { label: '<', value: '<' },
  { label: '>', value: '>' },
  { label: '=', value: '=' },
];

const sideText = (side: readonly Measure[]) => side.map(measureText).join(' + ');

/** « 120 cm … 1 m », « 300 mm + 200 cm … 2 m + 30 cm » : on écrit tout dans la plus petite unité. */
export function compareMeasures(left: readonly Measure[], right: readonly Measure[]): NumerationQuestion {
  const all = [...left, ...right];
  const unit = all.map(([, u]) => u).reduce((a, b) => (FACTOR[b] < FACTOR[a] ? b : a));
  const total = (side: readonly Measure[]) => side.reduce((sum, m) => sum + inSmallest(m), 0) / FACTOR[unit];
  const [a, b] = [total(left), total(right)];
  const symbol = a < b ? '<' : a > b ? '>' : '=';
  const converted = [left, right]
    .filter((side) => side.length > 1 || side[0]![1] !== unit)
    .map((side) => `${sideText(side)} = ${spaced(total(side))}\u00a0${unit}`);
  return question({
    context: 'Complète avec <, > ou =',
    prompt: sideText(left),
    suffix: sideText(right),
    choices: SYMBOLS,
    answer: symbol,
    solved: `${sideText(left)} ${symbol} ${sideText(right)}`,
    explain: `On écrit tout en ${unit} : ${converted.join(' et ')}. Puis ${spaced(a)}\u00a0${unit} ${symbol} ${spaced(b)}\u00a0${unit}.`,
  });
}

/** La blanche : une mesure ronde (1 m, 1 cm, 10 cm, 1 km), l'autre dans une unité plus petite. */
function drawSimpleCompare(random: () => number): NumerationQuestion {
  const pairs: readonly (readonly [Measure, readonly Measure[]])[] = [
    [[1, 'm'], [[50, 'cm'], [90, 'cm'], [99, 'cm'], [100, 'cm'], [110, 'cm'], [120, 'cm'], [500, 'mm'], [1000, 'mm'], [1100, 'mm']]],
    [[1, 'cm'], [[5, 'mm'], [9, 'mm'], [10, 'mm'], [12, 'mm'], [90, 'mm']]],
    [[10, 'cm'], [[90, 'mm'], [100, 'mm'], [110, 'mm'], [1000, 'mm']]],
    [[1, 'km'], [[900, 'm'], [1000, 'm'], [1100, 'm'], [1500, 'm']]],
  ];
  const [reference, others] = pick(pairs, random);
  const other = pick(others, random);
  return random() < 0.5 ? compareMeasures([other], [reference]) : compareMeasures([reference], [other]);
}

/** La jaune : deux unités différentes et des mesures proches (1 m … 1 050 mm), ou des sommes. */
function drawMixedCompare(random: () => number): NumerationQuestion {
  if (random() < 0.5) {
    // Une mesure en cm (ou en m quand elle tombe juste), l'autre en mm, à quelques millimètres près.
    const first = between(5, 25, random) * 100;
    const second = Math.max(10, first + pick([-200, -50, -5, 0, 5, 50, 200], random));
    const written: Measure = first % 1000 === 0 && random() < 0.5 ? [first / 1000, 'm'] : [first / 10, 'cm'];
    const sides: [Measure[], Measure[]] = [[written], [[second, 'mm']]];
    return random() < 0.5 ? compareMeasures(...sides) : compareMeasures(sides[1], sides[0]);
  }
  // « 20 m + 3 mm … 2 cm + 30 mm » : les mêmes nombres, d'autres unités.
  const [u1, u2] = shuffle(['mm', 'cm', 'm'] as const, random);
  const values = [2, 3, 20, 30, 200, 300];
  const [x, y] = [pick(values, random), pick(values, random)];
  return compareMeasures(
    [
      [x, u1!],
      [y, u2!],
    ],
    [
      [pick(values, random), u2!],
      [pick(values, random), u1!],
    ],
  );
}

// --- Égalités à compléter (fiches n° 4, 8, 12) ---

/** « 10 × 10 mm = … cm », « 1 m − … cm = 50 cm » : un nombre au pavé, à la place des « … » (à gauche ou à droite). */
export function equality(left: string, right: string, answer: number, explain: string): NumerationQuestion {
  const holeLeft = left.includes('…');
  const [before, after] = (holeLeft ? left : right).split('…').map((part) => part.trim()) as [string, string];
  return question({
    context: 'Complète',
    prompt: holeLeft ? before : `${left} = ${before}`.trimEnd(),
    suffix: holeLeft ? `${after} = ${right}` : after,
    answer,
    solved: `${left.replace('…', spaced(answer))} = ${right.replace('…', spaced(answer))}`,
    explain,
  });
}

const RELATIONS = '1 cm = 10 mm, 1 m = 100 cm, 1 km = 1\u00a0000 m.';

/** Une conversion simple : « 3 m = … cm », « 2 km = … m », « 7 cm = … mm ». */
function drawConversion(random: () => number): NumerationQuestion {
  const [big, small] = pick(
    [
      ['cm', 'mm'],
      ['m', 'cm'],
      ['km', 'm'],
      ['m', 'mm'],
    ] as const,
    random,
  );
  const n = between(1, 9, random);
  const ratio = FACTOR[big] / FACTOR[small];
  return equality(`${n} ${big}`, `… ${small}`, n * ratio, `1 ${big} = ${spaced(ratio)} ${small}, donc ${n} ${big} = ${n} × ${spaced(ratio)} = ${spaced(n * ratio)} ${small}.`);
}

/** Les calculs des fiches : « 10 × 10 mm = … cm », « 50 cm + 50 cm = … m », « 1 m − … cm = 50 cm ». */
function drawCalcEquality(random: () => number): NumerationQuestion {
  const kind = between(0, 2, random);
  if (kind === 0) {
    const [times, each, small, big] = pick(
      [
        [10, 10, 'mm', 'cm'],
        [10, 10, 'cm', 'm'],
        [100, 1, 'mm', 'cm'],
        [10, 1, 'mm', 'cm'],
        [2, 50, 'cm', 'm'],
        [4, 25, 'cm', 'm'],
        [5, 20, 'cm', 'm'],
        [2, 5, 'mm', 'cm'],
        [2, 500, 'm', 'km'],
        [10, 100, 'm', 'km'],
      ] as const,
      random,
    );
    const total = times * each;
    const answer = (total * FACTOR[small]) / FACTOR[big];
    return equality(`${times} × ${each} ${small}`, `… ${big}`, answer, `${times} × ${each} ${small} = ${spaced(total)} ${small}. ${RELATIONS}`);
  }
  if (kind === 1) {
    const [a, b, small, big] = pick(
      [
        [50, 50, 'mm', 'cm'],
        [50, 50, 'cm', 'm'],
        [5, 5, 'mm', 'cm'],
        [60, 40, 'cm', 'm'],
        [500, 500, 'm', 'km'],
        [70, 30, 'cm', 'm'],
        [250, 750, 'm', 'km'],
      ] as const,
      random,
    );
    const answer = ((a + b) * FACTOR[small]) / FACTOR[big];
    return equality(`${a} ${small} + ${b} ${small}`, `… ${big}`, answer, `${a} + ${b} = ${spaced(a + b)} ${small}. ${RELATIONS}`);
  }
  const [big, small, rest] = pick(
    [
      ['m', 'cm', 50],
      ['m', 'cm', 30],
      ['m', 'cm', 75],
      ['cm', 'mm', 4],
      ['km', 'm', 300],
      ['km', 'm', 500],
    ] as const,
    random,
  );
  const whole = FACTOR[big] / FACTOR[small];
  return equality(`1 ${big} − … ${small}`, `${rest} ${small}`, whole - rest, `1 ${big} = ${spaced(whole)} ${small}, et ${spaced(whole)} − ${rest} = ${spaced(whole - rest)}.`);
}

/** « 50 cm + 50 cm = 1 … » : l'unité se touche (fiches n° 4 et 12). */
export function unitOfSum(left: string, value: number, unit: Unit, explain: string): NumerationQuestion {
  return question({
    context: 'Complète avec l’unité qui convient',
    prompt: `${left} = ${spaced(value)}`,
    suffix: '',
    choices: familyOf(unit).map((u) => ({ label: u, value: u })),
    answer: unit,
    solved: `${left} = ${spaced(value)} ${unit}`,
    explain,
  });
}

function drawUnitOfSum(random: () => number): NumerationQuestion {
  const [left, value, unit] = pick(
    [
      ['50 cm + 50 cm', 1, 'm'],
      ['2 × 50 cm', 1, 'm'],
      ['10 × 1 mm', 1, 'cm'],
      ['100 × 1 mm', 10, 'cm'],
      ['500 m + 500 m', 1, 'km'],
      ['10 × 10 cm', 1, 'm'],
      ['5 mm + 5 mm', 1, 'cm'],
    ] as const,
    random,
  );
  return unitOfSum(left, value, unit, RELATIONS);
}

// --- Le temps : mois, heures, minutes, secondes (fiche n° 11, classeur) ---

export const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'] as const;

/** « Le mois juste avant septembre, c'est le mois de … » : quatre mois à toucher. */
export function neighbourMonth(month: number, after: boolean, random: () => number = Math.random): NumerationQuestion {
  const at = (i: number) => MONTHS[(i + 12) % 12]!;
  const answer = at(month + (after ? 1 : -1));
  const others = [at(month + (after ? -1 : 1)), at(month + (after ? 2 : -2)), at(month)];
  const choices = shuffle([answer, ...others], random).map((m) => ({ label: m, value: m }));
  const which = after ? 'après' : 'avant';
  return question({
    context: 'Complète',
    prompt: `Le mois juste ${which} ${at(month)}, c’est`,
    suffix: '',
    choices,
    answer,
    solved: `Le mois juste ${which} ${at(month)}, c’est ${answer}.`,
    explain: `Les 12 mois dans l’ordre : ${MONTHS.join(', ')}.`,
  });
}

/** Heures et minutes (blanche), puis jours, heures, minutes, secondes (jaune) : un nombre au pavé. */
type TimeLevel = 'blanche' | 'jaune' | 'orange' | 'rose';

/**
 * Heures et minutes (blanche) ; jours, heures, minutes, secondes (jaune) ; semaines, mois (orange) ;
 * mois, semaines, jours, et des calculs plus longs (rose, fiches n° 26, 30, 33). Un nombre au pavé ; sans
 * niveau, c'est la blanche.
 */
const TIME_FACTS: readonly (readonly [left: string, right: string, answer: number, explain: string, level?: TimeLevel])[] = [
  ['Dans une heure, il y a', 'minutes.', 60, '1 heure = 60 minutes : la grande aiguille fait un tour complet.'],
  ['Une demi-heure, c’est', 'minutes.', 30, 'Une demi-heure, c’est la moitié d’une heure : la moitié de 60, c’est 30.'],
  ['Un quart d’heure, c’est', 'minutes.', 15, 'Un quart d’heure, c’est 15 minutes : 60 partagé en 4.'],
  ['Trois quarts d’heure, c’est', 'minutes.', 45, 'Un quart d’heure = 15 minutes, donc trois quarts d’heure = 15 + 15 + 15 = 45 minutes.'],
  ['2 heures, c’est', 'minutes.', 120, '1 heure = 60 minutes, donc 2 heures = 60 + 60 = 120 minutes.'],
  ['Une heure et demie, c’est', 'minutes.', 90, '1 heure = 60 minutes, une demi-heure = 30 minutes : 60 + 30 = 90 minutes.'],
  ['Dans une journée, il y a', 'heures.', 24, 'Une journée dure 24 heures : la petite aiguille fait deux fois le tour.'],
  ['Dans une minute, il y a', 'secondes.', 60, '1 minute = 60 secondes.', 'jaune'],
  ['2 minutes, c’est', 'secondes.', 120, '1 minute = 60 secondes, donc 2 minutes = 60 + 60 = 120 secondes.', 'jaune'],
  ['2 jours, c’est', 'heures.', 48, '1 jour = 24 heures, donc 2 jours = 24 + 24 = 48 heures.', 'jaune'],
  ['48 heures, c’est', 'jours.', 2, '1 jour = 24 heures, et 24 + 24 = 48 : 48 heures, c’est 2 jours.', 'jaune'],
  ['120 minutes, c’est', 'heures.', 2, '1 heure = 60 minutes, et 60 + 60 = 120 : 120 minutes, c’est 2 heures.', 'jaune'],
  ['Dans une semaine, il y a', 'jours.', 7, 'Une semaine compte 7 jours, du lundi au dimanche.', 'jaune'],
  ['3 semaines, c’est', 'jours.', 21, 'Une semaine = 7 jours, donc 3 semaines = 3 × 7 = 21 jours.', 'jaune'],
  ['Dans une année, il y a', 'mois.', 12, 'Une année compte 12 mois, 52 semaines et 365 jours.', 'jaune'],
  ['Une demi-minute, c’est', 'secondes.', 30, '1 minute = 60 secondes ; la moitié de 60, c’est 30.', 'jaune'],
  ['2 semaines, c’est', 'jours.', 14, 'Une semaine = 7 jours, donc 2 semaines = 7 + 7 = 14 jours.', 'orange'],
  ['Un mois, c’est environ', 'semaines.', 4, 'Un mois compte 30 ou 31 jours (28 ou 29 en février) : environ 4 semaines, car 4 × 7 = 28.', 'orange'],
  ['4 semaines, c’est', 'jours.', 28, 'Une semaine = 7 jours, donc 4 semaines = 4 × 7 = 28 jours.', 'orange'],
  ['Dans une année, il y a', 'semaines.', 52, 'Une année compte 12 mois, 52 semaines et 365 jours.', 'orange'],
  ['Dans une année, il y a', 'jours.', 365, 'Une année compte 365 jours, et 366 les années bissextiles (une fois tous les quatre ans).', 'orange'],
  ['36 mois, c’est', 'ans.', 3, '1 an = 12 mois, et 36 : 12 = 3 (on accepte aussi 3 × 12 = 36).', 'rose'],
  ['48 mois, c’est', 'ans.', 4, '1 an = 12 mois, et 4 × 12 = 48.', 'rose'],
  ['2 ans, c’est', 'mois.', 24, '1 an = 12 mois, donc 2 ans = 2 × 12 = 24 mois.', 'rose'],
  ['Dans une journée, il y a', 'minutes.', 1440, '1 jour = 24 heures et 1 heure = 60 minutes : 24 × 60 = 1\u00a0440 minutes.', 'rose'],
  ['Dans une heure, il y a', 'secondes.', 3600, '1 heure = 60 minutes et 1 minute = 60 secondes : 60 × 60 = 3\u00a0600 secondes.', 'rose'],
  ['3 semaines et 2 jours, c’est', 'jours.', 23, '3 semaines = 3 × 7 = 21 jours, et 21 + 2 = 23 jours.', 'rose'],
  ['Une semaine, c’est', 'heures.', 168, '1 semaine = 7 jours et 1 jour = 24 heures : 7 × 24 = 168 heures.', 'rose'],
  ['2 heures, c’est', 'secondes.', 7200, '1 heure = 3\u00a0600 secondes, donc 2 heures = 3\u00a0600 + 3\u00a0600 = 7\u00a0200 secondes.', 'rose'],
  ['1 an et 6 mois, c’est', 'mois.', 18, '1 an = 12 mois, et 12 + 6 = 18 mois.', 'rose'],
];

export function timeFact(index: number): NumerationQuestion {
  const [left, right, answer, explain] = TIME_FACTS[index]!;
  return question({
    context: 'Complète',
    prompt: left,
    suffix: right,
    answer,
    solved: `${left} ${spaced(answer)} ${right}`,
    explain,
  });
}

const timeIndexes = (level: TimeLevel) => TIME_FACTS.flatMap((fact, i) => ((fact[4] ?? 'blanche') === level ? [i] : []));

// --- Mesurer un segment (classeur, blanche ; leçons Mes 1 et Géom 2) ---

/** Un segment de `length` mm sur la règle, son bout gauche au 0 ou plus loin (`start`, en mm). */
export function segment(length: number, start = 0): NumerationQuestion {
  const [cm, mm] = [Math.floor(length / 10), length % 10];
  const end = start + length;
  const read =
    start === 0
      ? `Le segment part du 0 et s’arrête ${mm === 0 ? `sur le ${cm}` : `${mm} mm après le ${cm}`}`
      : `Le segment part du ${start / 10} et s’arrête ${end % 10 === 0 ? `sur le ${end / 10}` : `${end % 10} mm après le ${Math.floor(end / 10)}`} : on compte les graduations entre les deux`;
  const size = mm === 0 ? `${cm} cm` : `${cm} cm et ${mm} mm, soit ${length} mm`;
  return question({
    context: 'Mesure le segment avec la règle',
    figure: { ruler: { start, length } },
    prompt: 'Le segment mesure',
    units: ['mm', 'cm', 'm'],
    ...measureAnswer(length, mm === 0 ? 'cm' : 'mm', ['mm', 'cm']),
    solved: `Le segment mesure ${size}.`,
    explain: `${read} : ${size}. 1 cm = 10 mm.`,
  });
}

function drawSegment(random: () => number): NumerationQuestion {
  const length = random() < 0.4 ? between(2, 10, random) * 10 : between(15, 99, random);
  // Le plus souvent au 0, comme il faut placer la règle ; parfois plus loin, pour compter les graduations.
  const start = random() < 0.7 || length > 80 ? 0 : between(1, 2, random) * 10;
  return segment(length, start);
}

// --- Jaune : comparer et calculer des longueurs (fiches n° 13, 15, 16, 18) ---

const CHILDREN = ['Ernest', 'Fleur', 'Gudule', 'Honoré', 'Isidore', 'Jeannot', 'Kim', 'Ludo', 'Léa', 'Noé', 'Inès', 'Malo'] as const;

/** « Voici la taille de quatre enfants, quel est le plus petit ? » : les tailles en cm, `written` dit comment les écrire. */
export function tallest(names: readonly string[], heights: readonly Measure[], smallest: boolean): NumerationQuestion {
  const cm = heights.map((m) => inSmallest(m) / 10);
  const best = cm.indexOf(smallest ? Math.min(...cm) : Math.max(...cm));
  const which = smallest ? 'le plus petit' : 'le plus grand';
  const listed = names.map((name, i) => `${name} mesure ${measureText(heights[i]!)}`);
  return question({
    context: `Voici la taille de quatre enfants. Qui est ${which} ?`,
    prompt: `${listed.slice(0, -1).join(', ')} et ${listed.at(-1)}.`,
    choices: names.map((name) => ({ label: name, value: name })),
    answer: names[best]!,
    solved: `${names[best]} est ${which} : ${measureText(heights[best]!)}.`,
    explain: `On écrit toutes les tailles en cm : ${names.map((name, i) => `${name} ${spaced(cm[i]!)} cm`).join(', ')}.`,
  });
}

function drawTallest(random: () => number): NumerationQuestion {
  const names = shuffle(CHILDREN, random).slice(0, 4);
  const cms = shuffle([85, 89, 92, 95, 98, 100, 105, 110, 115, 120, 125, 130], random).slice(0, 4);
  const heights = cms.map((cm): Measure => (cm === 100 ? [1, 'm'] : random() < 0.5 ? [cm * 10, 'mm'] : [cm, 'cm']));
  return tallest(names, heights, random() < 0.5);
}

const STRINGS = [
  { name: 'ruban', a: 'un', my: 'mon', it: 'il' },
  { name: 'ficelle', a: 'une', my: 'ma', it: 'elle' },
  { name: 'corde', a: 'une', my: 'ma', it: 'elle' },
] as const;
const METERS_IN_WORDS = ['', 'un', 'deux', 'trois', 'quatre', 'cinq'];

/** « J'ai un ruban de deux mètres, mais 30 cm sont abîmés… » : la réponse en cm (ou en mm, en m). */
export function ribbon(kind: number, meters: number, cut: number): NumerationQuestion {
  const { name, a, my, it } = STRINGS[kind]!;
  const left = meters * 100 - cut;
  return question({
    context: 'Problème',
    prompt: `J’ai ${a} ${name} de ${METERS_IN_WORDS[meters]} mètre${meters > 1 ? 's' : ''}, mais ${cut} cm sont abîmés. Je coupe le morceau abîmé. Combien ${my} ${name} mesure-t-${it} maintenant ?`,
    units: ['mm', 'cm', 'm'],
    ...measureAnswer(left * 10, 'cm', ['mm', 'cm', 'm']),
    solved: `Maintenant, ${my} ${name} mesure ${spaced(left)} cm.`,
    explain: `${meters} m = ${meters * 100} cm, et ${meters * 100} − ${cut} = ${spaced(left)}. Sur le cahier : le calcul, puis la phrase-réponse avec l’unité.`,
  });
}

/** « 2 m + 30 cm = … cm », « 3 cm + 4 mm = … mm » : additionner, soustraire dans des unités différentes. */
function drawMixedCalc(random: () => number): NumerationQuestion {
  const [big, small] = pick(
    [
      ['m', 'cm'],
      ['cm', 'mm'],
      ['km', 'm'],
    ] as const,
    random,
  );
  const ratio = FACTOR[big] / FACTOR[small];
  const n = between(1, 4, random);
  const part = between(1, 9, random) * (ratio / 10) + (ratio >= 100 && random() < 0.5 ? between(1, 9, random) : 0);
  const plus = random() < 0.5;
  const answer = n * ratio + (plus ? part : -part);
  return equality(
    `${n} ${big} ${plus ? '+' : '−'} ${part} ${small}`,
    `… ${small}`,
    answer,
    `${n} ${big} = ${spaced(n * ratio)} ${small}, et ${spaced(n * ratio)} ${plus ? '+' : '−'} ${part} = ${spaced(answer)}.`,
  );
}

// --- Orange : le périmètre (fiches n° 19 à 23, leçon Mes 8) ---

/** Les unités à toucher pour une longueur : les plus connues, ou autour des hm d'un champ. */
const lengthUnits = (unit: Unit): readonly Unit[] => (unit === 'hm' || unit === 'dam' ? ['m', 'dam', 'hm', 'km'] : LENGTHS);

/** Un problème : la mesure à trouver en nombre + unité, la phrase-réponse dans la correction. */
function problem(prompt: string, base: number, unit: Unit, solved: string, explain: string, units: readonly Unit[] = lengthUnits(unit)): NumerationQuestion {
  return question({ context: 'Problème', prompt, units, ...measureAnswer(base, unit, units), solved, explain });
}

/** Les rectangles des fiches : le début de la phrase, l'unité, les longueurs possibles, la question et la phrase-réponse. */
const RECTANGLES = [
  { start: 'Ma chambre mesure', unit: 'm', long: [4, 7], short: [2, 4], ask: 'Quel est son périmètre ?', answer: 'Le périmètre de ma chambre est de' },
  { start: 'Un agriculteur a un champ de', unit: 'hm', long: [3, 6], short: [1, 3], ask: 'Quel est son périmètre ?', answer: 'Le périmètre du champ est de' },
  { start: 'Un fermier veut clôturer son champ qui mesure', unit: 'm', long: [5, 15], short: [2, 4], step: 10, ask: 'De quelle longueur de clôture a-t-il besoin ?', answer: 'Il a besoin de', after: ' de clôture' },
  { start: 'Le cadre de ma photo mesure', unit: 'cm', long: [15, 30], short: [10, 14], ask: 'Quel est son périmètre ?', answer: 'Le périmètre du cadre est de' },
  { start: 'Le jardin de mamie mesure', unit: 'm', long: [12, 25], short: [6, 11], ask: 'Quelle longueur de grillage faut-il pour en faire le tour ?', answer: 'Il faut', after: ' de grillage' },
] as const;

/** « Ma chambre mesure 4 m sur 3 m. Quel est son périmètre ? » : P = 2 × L + 2 × l. */
export function rectanglePerimeter(kind: number, long: number, short: number): NumerationQuestion {
  const rectangle = RECTANGLES[kind]!;
  const unit = rectangle.unit as Unit;
  const p = 2 * long + 2 * short;
  const after = 'after' in rectangle ? rectangle.after : '';
  return problem(
    `${rectangle.start} ${spaced(long)} ${unit} sur ${spaced(short)} ${unit}. ${rectangle.ask}`,
    p * FACTOR[unit],
    unit,
    `${rectangle.answer} ${spaced(p)} ${unit}${after}.`,
    `Le périmètre, c’est le tour : 2 × ${spaced(long)} + 2 × ${spaced(short)} = ${spaced(p)} (jamais d’unité dans les calculs).`,
  );
}

function drawRectanglePerimeter(random: () => number): NumerationQuestion {
  const kind = between(0, RECTANGLES.length - 1, random);
  const rectangle = RECTANGLES[kind]!;
  const step = 'step' in rectangle ? rectangle.step : 1;
  return rectanglePerimeter(kind, between(rectangle.long[0], rectangle.long[1], random) * step, between(rectangle.short[0], rectangle.short[1], random) * step);
}

const SQUARES = [
  { start: 'Mon mouchoir a une forme carrée de', unit: 'cm', side: [20, 45], ask: 'Je veux coudre un ruban tout autour. De quelle longueur de ruban ai-je besoin ?', answer: 'J’ai besoin de', after: ' de ruban' },
  { start: 'Un jardin carré a des côtés de', unit: 'm', side: [5, 30], ask: 'Quel est son périmètre ?', answer: 'Le périmètre du jardin est de', after: '' },
  { start: 'Une table carrée mesure', unit: 'cm', side: [60, 99], ask: 'Quelle longueur de galon faut-il pour en faire le tour ?', answer: 'Il faut', after: ' de galon' },
] as const;

/** « Mon mouchoir a une forme carrée de 35 cm de côté… » : P = 4 × c (fiche n° 20). */
export function squarePerimeter(kind: number, side: number): NumerationQuestion {
  const square = SQUARES[kind]!;
  const unit = square.unit as Unit;
  return problem(
    `${square.start} ${side} ${unit} de côté. ${square.ask}`,
    4 * side * FACTOR[unit],
    unit,
    `${square.answer} ${spaced(4 * side)} ${unit}${square.after}.`,
    `Un carré a 4 côtés égaux : 4 × ${side} = ${spaced(4 * side)}.`,
  );
}

/** « Le tour de ma chambre mesure 20 m. Sachant que ma chambre est carrée, combien mesure un côté ? » (fiche n° 23). */
export function squareSide(perimeter: number, room: boolean): NumerationQuestion {
  const unit: Unit = room ? 'm' : 'cm';
  const side = perimeter / 4;
  return problem(
    room
      ? `Le tour de ma chambre mesure ${perimeter} m. Sachant que ma chambre est carrée, combien mesure un côté ?`
      : `Un carré a un périmètre de ${perimeter} cm. Combien mesure un côté ?`,
    side * FACTOR[unit],
    unit,
    room ? `Un côté de ma chambre mesure ${side} m.` : `Un côté du carré mesure ${side} cm.`,
    `Les 4 côtés d’un carré sont égaux : on partage le périmètre en 4. ${perimeter} : 4 = ${side}.`,
  );
}

function drawSquare(random: () => number): NumerationQuestion {
  if (random() < 0.4) {
    const room = random() < 0.5;
    return squareSide((room ? between(3, 9, random) : between(3, 25, random)) * 4, room);
  }
  const kind = between(0, SQUARES.length - 1, random);
  const [min, max] = SQUARES[kind]!.side;
  return squarePerimeter(kind, between(min, max, random));
}

// --- Orange : les longueurs et les masses en deux unités (leçons Mes 1 et Mes 5) ---

/** Les paires d'unités, et jusqu'où va le nombre de petites unités. */
const PAIRS = [
  ['m', 'cm', 99],
  ['cm', 'mm', 9],
  ['km', 'm', 999],
  ['kg', 'g', 999],
  ['t', 'kg', 999],
] as const;

/** « 2 m 50 cm = … cm », « 345 cm = 3 m … cm », « 1 kg 500 g = … g ». */
export function twoUnits(pair: number, big: number, small: number, hole: 'total' | 'big' | 'small'): NumerationQuestion {
  const [bigUnit, smallUnit] = PAIRS[pair]!;
  const ratio = FACTOR[bigUnit] / FACTOR[smallUnit];
  const total = big * ratio + small;
  const both = `${big} ${bigUnit} ${small} ${smallUnit}`;
  const times = big > 1 ? `, donc ${big} ${bigUnit} = ${spaced(big * ratio)} ${smallUnit}` : '';
  const explain = `1 ${bigUnit} = ${spaced(ratio)} ${smallUnit}${times}. Puis ${spaced(big * ratio)} + ${small} = ${spaced(total)}.`;
  if (hole === 'total') return equality(both, `… ${smallUnit}`, total, explain);
  return equality(
    `${spaced(total)} ${smallUnit}`,
    hole === 'big' ? `… ${bigUnit} ${small} ${smallUnit}` : `${big} ${bigUnit} … ${smallUnit}`,
    hole === 'big' ? big : small,
    explain,
  );
}

function drawTwoUnits(random: () => number, pairs: readonly number[]): NumerationQuestion {
  const pair = pick(pairs, random);
  const max = PAIRS[pair]![2];
  // Parfois un petit nombre : 1 m 5 cm = 105 cm, le piège du 0.
  const small = random() < 0.25 ? between(1, 9, random) : between(1, max, random);
  return twoUnits(pair, between(1, 9, random), small, pick(['total', 'total', 'big', 'small'] as const, random));
}

/** « 3 kg = … g », « 4 000 kg = … t » : les masses (leçon Mes 5). */
function drawMassConversion(random: () => number): NumerationQuestion {
  const [big, small] = pick(
    [
      ['kg', 'g'],
      ['t', 'kg'],
    ] as const,
    random,
  );
  const n = between(1, 12, random);
  const ratio = FACTOR[big] / FACTOR[small];
  const why = `1 ${big} = ${spaced(ratio)} ${small}`;
  return random() < 0.5
    ? equality(`${n} ${big}`, `… ${small}`, n * ratio, `${why}, donc ${n} ${big} = ${n} × ${spaced(ratio)} = ${spaced(n * ratio)} ${small}.`)
    : equality(`${spaced(n * ratio)} ${small}`, `… ${big}`, n, `${why}, et ${n} × ${spaced(ratio)} = ${spaced(n * ratio)}.`);
}

/** « En avril, il y a … jours » : la technique des poings fermés (leçon Mes 3). Février est laissé de côté. */
export function monthDays(month: number): NumerationQuestion {
  const name = MONTHS[month]!;
  const days = [3, 5, 8, 10].includes(month) ? 30 : 31;
  return question({
    context: 'Complète',
    prompt: `En ${name}, il y a`,
    suffix: 'jours.',
    answer: days,
    solved: `En ${name}, il y a ${days} jours.`,
    explain: 'Avec les poings fermés : les mois sur les bosses ont 31 jours (janvier, mars, mai, juillet, août, octobre, décembre), ceux dans les creux 30, sauf février (28 ou 29).',
  });
}

// --- Le plus long, le plus lourd : comparer des mesures dans des unités différentes ---

/**
 * « Il y a trois orques au parc animalier… Quelle est l'orque la plus lourde ? » : on écrit toutes les mesures
 * dans la plus petite unité. Les boutons sont les `names`, ou les mesures elles-mêmes (les morceaux de corde).
 */
export function mostOf(ask: string, prompt: string, measures: readonly Measure[], names: readonly string[] | undefined, solve: (name: string, measure: string) => string): NumerationQuestion {
  const unit = measures.map(([, u]) => u).reduce((a, b) => (FACTOR[b] < FACTOR[a] ? b : a));
  const values = measures.map((m) => inSmallest(m) / FACTOR[unit]);
  const best = values.indexOf(Math.max(...values));
  const labels = names ?? measures.map(measureText);
  const converted = measures.map((m, i) => (m[1] === unit ? measureText(m) : `${measureText(m)} = ${spaced(values[i]!)} ${unit}`));
  const ordered = [...values].sort((a, b) => b - a).map((v) => `${spaced(v)} ${unit}`);
  return question({
    context: ask,
    prompt,
    choices: labels.map((label) => ({ label, value: label })),
    answer: labels[best]!,
    solved: solve(labels[best]!, measureText(measures[best]!)),
    explain: `On écrit tout en ${unit} : ${converted.join(', ')}. Puis ${ordered.join(' > ')}.`,
  });
}

const listed = (items: readonly string[]) => `${items.slice(0, -1).join(', ')} et ${items.at(-1)}`;
const capitalized = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Des mesures au hasard, une par unité, toutes différentes : chaque unité dit de combien à combien. */
function drawMeasures(random: () => number, ranges: readonly (readonly [unit: Unit, min: number, max: number, step?: number])[]): Measure[] {
  for (;;) {
    const measures = ranges.map(([unit, min, max, step = 1]): Measure => [between(min / step, max / step, random) * step, unit]);
    const totals = measures.map(inSmallest);
    if (new Set(totals).size === totals.length) return measures;
  }
}

const ORCAS = [
  ['Zorba', 'Wago', 'Yakari'],
  ['Orka', 'Nala', 'Tiko'],
] as const;

/** Les orques du parc (fiche n° 24) : deux en kg, une en tonnes. */
export function heaviestOrca(names: readonly string[], measures: readonly Measure[]): NumerationQuestion {
  const weighs = names.map((name, i) => `${name} pèse ${measureText(measures[i]!)}`);
  return mostOf('Quelle est l’orque la plus lourde ?', `Il y a trois orques au parc animalier. ${listed(weighs)}.`, measures, names, (name, m) => `${name} est l’orque la plus lourde : ${m}.`);
}

function drawHeaviestOrca(random: () => number): NumerationQuestion {
  const tons = between(0, 2, random);
  const measures = drawMeasures(
    random,
    [0, 1, 2].map((i) => (i === tons ? (['t', 6, 12] as const) : (['kg', 6000, 12000, 100] as const))),
  );
  return heaviestOrca(pick(ORCAS, random), measures);
}

/** Les cordes, les sauts, les animaux, les colis, les bouteilles (fiches n° 25, 28, 29, 31, 34, 35). */
const CONTESTS: readonly ((random: () => number) => NumerationQuestion)[] = [
  (random) => {
    const measures = drawMeasures(random, shuffle([['dm', 20, 60], ['cm', 200, 600, 10], ['m', 2, 6]] as const, random));
    const [a, b, c] = measures.map(measureText);
    return mostOf('Quel est le morceau le plus long ?', `J’ai trois morceaux de corde. Le premier mesure ${a}, le deuxième ${b} et le dernier ${c}.`, measures, undefined, (m) => `Le morceau le plus long est celui qui mesure ${m}.`);
  },
  (random) => {
    const names = shuffle(['Leïla', 'Maria', 'Jenny', 'Sacha', 'Yanis', 'Zoé'], random).slice(0, 3);
    const measures = drawMeasures(random, shuffle([['cm', 150, 400, 5], ['dm', 15, 40], ['mm', 1500, 4000, 50]] as const, random));
    const jumps = names.map((name, i) => `${name} a sauté ${measureText(measures[i]!)}`);
    return mostOf('Qui a gagné l’épreuve ?', `${listed(names)} sautent en longueur. ${listed(jumps)}.`, measures, names, (name, m) => `${name} a gagné l’épreuve en sautant ${m}.`);
  },
  (random) => {
    const animals = pick(
      [
        [['une hirondelle', 'l’hirondelle', 'voler sur une distance de'], ['un espadon', 'l’espadon', 'nager'], ['un chevreuil', 'le chevreuil', 'courir']],
        [['une oie', 'l’oie', 'voler sur une distance de'], ['un dauphin', 'le dauphin', 'nager'], ['un chameau', 'le chameau', 'courir']],
      ] as const,
      random,
    );
    const measures = drawMeasures(random, shuffle([['km', 5, 30], ['dam', 500, 3000, 10], ['m', 5000, 30000, 100]] as const, random));
    const runs = animals.map(([a, , verb], i) => `${a} peut ${verb} ${measureText(measures[i]!)}`);
    return mostOf(
      'Quel animal parcourt la plus longue distance en un quart d’heure ?',
      `En un quart d’heure, ${listed(runs)}.`,
      measures,
      animals.map(([, name]) => name),
      (name, m) => `${capitalized(name)} parcourt la plus longue distance : ${m}.`,
    );
  },
  (random) => {
    const colors = ['bleu', 'vert', 'jaune', 'rouge'];
    const measures = drawMeasures(random, shuffle([['hg', 5, 90], ['g', 500, 990, 10], ['dag', 50, 900, 10], ['kg', 1, 9]] as const, random));
    const weighs = colors.map((color, i) => `le ${color} pèse ${measureText(measures[i]!)}`);
    return mostOf('Quel est le colis le plus lourd ?', `J’ai pesé 4 colis : ${listed(weighs)}.`, measures, colors, (color, m) => `Le colis ${color} est le plus lourd : ${m}.`);
  },
  (random) => {
    const colors = ['rose', 'verte', 'mauve'];
    const measures = drawMeasures(random, shuffle([['dl', 1, 9], ['cl', 5, 95, 5], ['ml', 50, 950, 10]] as const, random));
    const holds = colors.map((color, i) => `la ${color} contient ${measureText(measures[i]!)}`);
    return mostOf('Quelle bouteille contient le plus ?', `J’ai trois petites bouteilles : ${listed(holds)}.`, measures, colors, (color, m) => `C’est la bouteille ${color} qui contient le plus : ${m}.`);
  },
];

// --- Rose : le tableau de conversion (leçon Mes 10), le côté d'un rectangle (fiches n° 27, 32, 36) ---

/** « 76 hg = … dag », « 2 700 dam = … m » : d'une colonne du tableau à une autre, avec des nombres entiers. */
export function convert(value: number, from: Unit, to: Unit): NumerationQuestion {
  const result = (value * FACTOR[from]) / FACTOR[to];
  const [big, small] = FACTOR[from] > FACTOR[to] ? [from, to] : [to, from];
  const ratio = FACTOR[big] / FACTOR[small];
  const columns = Math.round(Math.log10(ratio));
  const how =
    from === big
      ? `on multiplie par ${spaced(ratio)} : ${spaced(value)} × ${spaced(ratio)} = ${spaced(result)}`
      : `on divise par ${spaced(ratio)} : ${spaced(value)} : ${spaced(ratio)} = ${spaced(result)}`;
  return equality(
    `${spaced(value)} ${from}`,
    `… ${to}`,
    result,
    `Dans le tableau de conversion, de ${from} à ${to}, il y a ${columns} colonne${columns > 1 ? 's' : ''} : 1 ${big} = ${spaced(ratio)} ${small}, donc ${how}.`,
  );
}

function drawConvert(random: () => number, tables: readonly (readonly Unit[])[]): NumerationQuestion {
  const table = pick(tables, random);
  const i = between(0, table.length - 2, random);
  const j = between(i + 1, Math.min(table.length - 1, i + 3), random);
  const [big, small] = [table[i]!, table[j]!];
  const ratio = FACTOR[big] / FACTOR[small];
  // Vers une plus petite unité, un nombre ; vers une plus grande, un nombre qui tombe juste.
  return random() < 0.6 ? convert(between(2, 99, random), big, small) : convert(between(2, 99, random) * ratio, small, big);
}

const FIELDS = [
  { start: 'Un champ rectangulaire', unit: 'm', short: [20, 90], extra: [10, 100], step: 5 },
  { start: 'Une piscine rectangulaire', unit: 'm', short: [5, 12], extra: [3, 25], step: 1 },
  { start: 'Un cadre rectangulaire', unit: 'cm', short: [10, 30], extra: [5, 20], step: 1 },
] as const;

/** « Un champ rectangulaire a un périmètre de 400 m. Son petit côté mesure 80 m. Combien mesure le grand côté ? » */
export function rectangleSide(kind: number, short: number, long: number, askLong: boolean): NumerationQuestion {
  const { start, unit } = FIELDS[kind]!;
  const p = 2 * (short + long);
  const [known, found] = askLong ? [short, long] : [long, short];
  const [knownName, foundName] = askLong ? ['petit', 'grand'] : ['grand', 'petit'];
  return problem(
    `${start} a un périmètre de ${spaced(p)} ${unit}. Son ${knownName} côté mesure ${known} ${unit}. Combien mesure le ${foundName} côté ?`,
    found * FACTOR[unit as Unit],
    unit as Unit,
    `Le ${foundName} côté mesure ${found} ${unit}.`,
    `${spaced(p)} − 2 × ${known} = ${spaced(2 * found)} : les deux ${foundName}s côtés mesurent ${spaced(2 * found)} ${unit} ensemble. Puis ${spaced(2 * found)} : 2 = ${found}.`,
  );
}

function drawRectangleSide(random: () => number): NumerationQuestion {
  const kind = between(0, FIELDS.length - 1, random);
  const { short, extra, step } = FIELDS[kind]!;
  const s = between(short[0] / step, short[1] / step, random) * step;
  const l = s + between(extra[0] / step, extra[1] / step, random) * step;
  return rectangleSide(kind, s, l, random() < 0.5);
}

/** « Un triangle a des côtés de 2 m, 150 cm et 1 500 mm » : on convertit avant d'additionner (leçon Mes 8). */
export function mixedPerimeter(sides: readonly Measure[]): NumerationQuestion {
  const total = sides.reduce((sum, m) => sum + inSmallest(m), 0);
  const inCm = sides.map((m) => spaced(inSmallest(m) / 10));
  const converted = sides.filter(([, u]) => u !== 'cm').map((m) => `${measureText(m)} = ${spaced(inSmallest(m) / 10)}\u00a0cm`);
  return problem(
    `Un triangle a des côtés de ${listed(sides.map(measureText))}. Quel est son périmètre ?`,
    total,
    'cm',
    `Le périmètre du triangle est de ${spaced(total / 10)} cm.`,
    `On écrit tout dans la même unité avant d’additionner : ${converted.join(', ')}. Puis ${inCm.join(' + ')} = ${spaced(total / 10)}.`,
  );
}

function drawMixedPerimeter(random: () => number): NumerationQuestion {
  return mixedPerimeter(shuffle(drawMeasures(random, [['m', 1, 3], ['cm', 50, 250, 10], ['mm', 500, 2500, 100]]), random));
}

// --- Les ceintures ---

const BLANCHE_KINDS: readonly Draw[] = [
  (random) => unitFor(between(0, UNIT_SENTENCES.length - 1, random)),
  drawSimpleCompare,
  drawConversion,
  (random) => (random() < 0.7 ? drawCalcEquality(random) : drawUnitOfSum(random)),
  (random) => neighbourMonth(between(0, 11, random), random() < 0.5, random),
  (random) => timeFact(pick(timeIndexes('blanche'), random)),
  drawSegment,
];

const JAUNE_KINDS: readonly Draw[] = [
  drawTallest,
  drawMixedCompare,
  (random) => ribbon(between(0, STRINGS.length - 1, random), between(1, 5, random), between(1, 9, random) * 10),
  (random) => timeFact(pick(timeIndexes('jaune'), random)),
  drawMixedCalc,
  drawConversion,
];

const ORANGE_KINDS: readonly Draw[] = [
  drawRectanglePerimeter,
  drawSquare,
  (random) => drawTwoUnits(random, [0, 1, 2]),
  (random) => (random() < 0.5 ? drawMassConversion(random) : drawTwoUnits(random, [3, 4])),
  drawHeaviestOrca,
  (random) => (random() < 0.5 ? monthDays(pick([0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], random)) : timeFact(pick(timeIndexes('orange'), random))),
];

const ROSE_KINDS: readonly Draw[] = [
  (random) => pick(CONTESTS, random)(random),
  drawRectangleSide,
  (random) => drawConvert(random, [LENGTH_TABLE]),
  (random) => drawConvert(random, [MASS_TABLE, VOLUME_TABLE]),
  (random) => timeFact(pick(timeIndexes('rose'), random)),
  drawMixedPerimeter,
];

export const MESURES: readonly NumerationBelt[] = [
  {
    belt: 'blanche',
    skill: 'Je mesure un segment avec la règle. Je choisis la bonne unité : mm, cm, m ou km. Je connais les heures, les minutes et les mois de l’année.',
    tips: [
      'Pour mesurer un segment, on place le 0 de la règle au bout du segment, puis on lit où il s’arrête.',
      '1 cm = 10 mm, 1 m = 100 cm, 1 km = 1\u00a0000 m. Le mètre est l’unité de mesure internationale.',
      'On mesure les longueurs en mm, cm, m, km ; les masses en g, kg et t (tonne) ; les contenances en cl et en L.',
      'Pour comparer deux longueurs, on les écrit dans la même unité : 1 m = 100 cm, donc 120 cm > 1 m.',
      '1 heure = 60 minutes, une demi-heure = 30 minutes, un quart d’heure = 15 minutes.',
      'Les 12 mois : janvier, février, mars, avril, mai, juin, juillet, août, septembre, octobre, novembre, décembre.',
    ],
    examples: () => [segment(47), unitFor(11), compareMeasures([[120, 'cm']], [[1, 'm']]), equality('10 × 10 mm', '… cm', 10, `10 × 10 mm = 100 mm. ${RELATIONS}`)],
    kinds: BLANCHE_KINDS,
  },
  {
    belt: 'jaune',
    skill: 'Je compare et je calcule des longueurs écrites avec des unités différentes. Je connais les jours, les heures, les minutes et les secondes.',
    tips: [
      'Pour comparer ou calculer des longueurs, on commence par les écrire toutes dans la même unité (cm ou mm).',
      '1 m = 100 cm = 1\u00a0000 mm : 950 mm = 95 cm, et 1\u00a0100 mm = 110 cm.',
      'Dans un problème, on écrit le calcul, puis une phrase-réponse, sans oublier l’unité.',
      '1 jour = 24 heures, 1 heure = 60 minutes, 1 minute = 60 secondes, 1 semaine = 7 jours.',
    ],
    examples: () => [
      tallest(['Ernest', 'Fleur', 'Gudule', 'Honoré'], [[1, 'm'], [950, 'mm'], [89, 'cm'], [1100, 'mm']], true),
      compareMeasures([[20, 'm'], [3, 'mm']], [[2, 'cm'], [30, 'mm']]),
      ribbon(0, 2, 30),
      timeFact(9),
    ],
    kinds: JAUNE_KINDS,
  },
  {
    belt: 'orange',
    skill: 'Je calcule le tour d’une figure (son périmètre) et le côté d’un carré. Je comprends 2 m 50 cm. Je connais les g, les kg et les tonnes, et les jours de chaque mois.',
    goal: 'CE2',
    tips: [
      'Le périmètre, c’est la longueur du tour : on additionne les côtés. Rectangle : P = 2 × L + 2 × l. Carré : P = 4 × c.',
      'Pour trouver le côté d’un carré, on partage son périmètre en 4 : 20 : 4 = 5.',
      'Jamais d’unité dans les calculs, mais toujours dans la phrase-réponse : « Le périmètre de ma chambre est de 14 m. »',
      '2 m 50 cm = 200 cm + 50 cm = 250 cm. Attention : 1 m 5 cm = 105 cm.',
      '1 kg = 1\u00a0000 g et 1 t = 1\u00a0000 kg : pour comparer 9 t et 8\u00a0500 kg, on écrit 9 t = 9\u00a0000 kg.',
      'Avec les poings fermés, les mois sur les bosses ont 31 jours, ceux dans les creux 30, sauf février (28 ou 29). Une semaine = 7 jours.',
    ],
    examples: () => [rectanglePerimeter(0, 4, 3), squareSide(20, true), twoUnits(0, 2, 50, 'total'), heaviestOrca(['Zorba', 'Wago', 'Yakari'], [[8500, 'kg'], [9, 't'], [9100, 'kg']])],
    kinds: ORANGE_KINDS,
  },
  {
    belt: 'rose',
    skill: 'J’utilise le tableau de conversion. Je trouve le côté qui manque d’un rectangle quand je connais son tour. Je connais les mois, les semaines et les jours.',
    tips: [
      'Le tableau de conversion des longueurs : km, hm, dam, m, dm, cm, mm. D’une colonne à celle de droite, on multiplie par 10 : 1 m = 10 dm = 100 cm.',
      'Pour convertir, on écrit le nombre avec son chiffre des unités dans la colonne de l’unité, puis on ajoute des 0 jusqu’à la nouvelle unité : 76 hg = 760 dag.',
      'Pareil pour les masses (kg, hg, dag, g) et les contenances (L, dl, cl, ml).',
      'Pour comparer des mesures, on les convertit toutes dans la même unité.',
      'Côté d’un rectangle : on enlève au périmètre les deux côtés connus (400 − 2 × 80 = 240), puis on partage en 2 (240 : 2 = 120).',
      '1 an = 12 mois = 52 semaines = 365 jours ; 1 jour = 24 h ; 1 h = 60 min = 3\u00a0600 s.',
    ],
    examples: () => [
      mostOf('Quel est le morceau le plus long ?', 'J’ai trois morceaux de corde. Le premier mesure 50\u00a0dm, le deuxième 400\u00a0cm et le dernier 3\u00a0m.', [[50, 'dm'], [400, 'cm'], [3, 'm']], undefined, (m) => `Le morceau le plus long est celui qui mesure ${m}.`),
      convert(76, 'hg', 'dag'),
      rectangleSide(0, 80, 120, true),
      timeFact(timeIndexes('rose')[0]!),
    ],
    kinds: ROSE_KINDS,
  },
];
