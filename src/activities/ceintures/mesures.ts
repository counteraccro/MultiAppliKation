// Ceintures de mesures : les ceintures du classeur, de la blanche à la noire, et une brillante
// (voir .ai/analyse/20-ceintures-mesures.md). Les questions se tirent au hasard sur le modèle des fiches
// Charivari (« entrainement mesures.pdf ») ; les astuces viennent des leçons Mes 1 à Mes 10 de la classe.
// Une question se répond en touchant un bouton (l'unité, < > =, un mois, un prénom), au pavé, ou par un
// nombre et une unité : en classe, l'élève écrit le calcul et une phrase-réponse ; ici, le résultat et l'unité.
// Les ceintures ont la forme de celles de la Numération : elles passent par les mêmes écrans.

import { groupDigits, numberText, shuffle, type ConversionFigure } from '../../core/quiz';
import type { NumerationBelt, NumerationQuestion } from './numeration';

type Draw = (random: () => number) => NumerationQuestion;

const between = (min: number, max: number, random: () => number) => min + Math.floor(random() * (max - min + 1));
const pick = <T>(items: readonly T[], random: () => number) => items[Math.floor(random() * items.length)]!;

/** « 5 m », « 18 h 45 » : le nombre et son unité ne se séparent pas en fin de ligne. */
const glued = (text: string) => text.replace(/(\d) (?=(?:[a-zA-Z]{1,3}²?|min|€)(?![\p{L}\d]))/gu, '$1\u00a0');

function question(fields: Omit<NumerationQuestion, 'id'>): NumerationQuestion {
  const texts = { prompt: glued(fields.prompt), solved: glued(fields.solved), explain: glued(fields.explain) };
  return { ...fields, ...texts, id: texts.solved };
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
/** Les unités d'aire (leçon Mes 9), de la plus grande à la plus petite : de l'une à l'autre, × 100. */
export const AREA_TABLE = ['km²', 'hm²', 'dam²', 'm²', 'dm²', 'cm²', 'mm²'] as const;
/** Les prix des problèmes (noire, brillante) : l'euro, seul de sa famille. */
const MONEY = ['€'] as const;
type Unit = (typeof LENGTH_TABLE)[number] | (typeof MASS_TABLE)[number] | (typeof VOLUME_TABLE)[number] | (typeof AREA_TABLE)[number] | 't' | '€';

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
  'mm²': 1,
  'cm²': 100,
  'dm²': 10_000,
  'm²': 1_000_000,
  'dam²': 100_000_000,
  'hm²': 10_000_000_000,
  'km²': 1_000_000_000_000,
  '€': 1,
};

/** Les unités à toucher pour une mesure : les plus connues de sa famille, ou tout le tableau de conversion. */
const familyOf = (unit: Unit): readonly Unit[] =>
  [LENGTHS, MASSES, VOLUMES, LENGTH_TABLE, MASS_TABLE, VOLUME_TABLE, AREA_TABLE, MONEY].find((family) => (family as readonly Unit[]).includes(unit))!;

/** Longueur, masse, contenance ou aire : on ne passe pas de l'une à l'autre (20 m n'est pas 2 dm²). */
const sameKind = (a: Unit, b: Unit) =>
  [LENGTH_TABLE, [...MASS_TABLE, 't'], VOLUME_TABLE, AREA_TABLE, MONEY].some((family) => (family as readonly Unit[]).includes(a) && (family as readonly Unit[]).includes(b));

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
  const fits = (u: Unit) => u !== unit && sameKind(u, unit) && Number.isInteger(Math.round((base / FACTOR[u]) * 10 ** places * 1e6) / 1e6);
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
export function unitFor(index: number, sentences = UNIT_SENTENCES): NumerationQuestion {
  const [before, unit, after] = sentences[index % sentences.length]!;
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
  // Toujours au 0, comme on place la règle en classe ; le plus souvent avec des mm.
  const length = random() < 0.2 ? between(2, 10, random) * 10 : between(1, 9, random) * 10 + between(1, 9, random);
  return segment(length);
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
  const result = Math.round(((value * FACTOR[from]) / FACTOR[to]) * 1e6) / 1e6;
  const [big, small] = FACTOR[from] > FACTOR[to] ? [from, to] : [to, from];
  const ratio = FACTOR[big] / FACTOR[small];
  const columns = Math.round(Math.log10(ratio));
  const how =
    from === big
      ? `on multiplie par ${spaced(ratio)} : ${spaced(value)} × ${spaced(ratio)} = ${spaced(result)}`
      : `on divise par ${spaced(ratio)} : ${spaced(value)} : ${spaced(ratio)} = ${spaced(result)}`;
  return {
    ...equality(
      `${spaced(value)} ${from}`,
      `… ${to}`,
      result,
      `Dans le tableau de conversion, de ${from} à ${to}, il y a ${columns} colonne${columns > 1 ? 's' : ''} : 1 ${big} = ${spaced(ratio)} ${small}, donc ${how}.`,
    ),
    lessonFigure: conversionTable(value, from, to),
  };
}

/**
 * Le tableau rempli comme dans la leçon Mes 10 : le chiffre des unités du nombre dans la colonne de `from`, un
 * chiffre par colonne ; des 0 ajoutés jusqu'à la colonne de `to` ; la virgule dans la colonne de `to` s'il reste
 * des chiffres après. Le nombre peut déborder du tableau (99 km) : les colonnes en plus n'ont pas de nom.
 */
export function conversionTable(value: number, from: Unit, to: Unit): ConversionFigure {
  const table = ([LENGTH_TABLE, MASS_TABLE, VOLUME_TABLE] as readonly (readonly Unit[])[]).find((t) => t.includes(from) && t.includes(to))!;
  const [whole, decimals = ''] = numberText(value).split(',') as [string, string?];
  const [at, target] = [table.indexOf(from), table.indexOf(to)];
  const [first, last] = [at - whole.length + 1, at + decimals.length];
  const digits = whole + decimals;
  const [start, end] = [Math.min(first, target, 0), Math.max(last, target, table.length - 1)];
  const units: string[] = [];
  const cells: { text: string; added?: boolean }[] = [];
  for (let column = start; column <= end; column++) {
    units.push(table[column] ?? '');
    const inNumber = column >= first && column <= last;
    const added = !inNumber && column >= Math.min(first, target) && column <= Math.max(last, target);
    const text = inNumber ? digits[column - first]! : added ? '0' : '';
    cells.push({ text: column === target && last > target ? `${text},` : text, ...(added ? { added } : {}) });
  }
  return { conversion: { units, cells } };
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

// --- Verte : l'aire d'un rectangle et d'un carré (fiches n° 37, 38, 40, 42, 44, 46 ; leçon Mes 9) ---

/** Les unités à toucher pour une aire : la longueur (le piège), puis l'aire juste et ses deux voisines. */
function areaUnits(unit: Unit): readonly Unit[] {
  const i = AREA_TABLE.indexOf(`${unit}²` as (typeof AREA_TABLE)[number]);
  return [unit, AREA_TABLE[i + 1] ?? AREA_TABLE[i - 2]!, AREA_TABLE[i]!, AREA_TABLE[i - 1] ?? AREA_TABLE[i + 2]!];
}

const SURFACES = [
  { start: 'Ma chambre mesure', unit: 'm', long: [3, 6], short: [2, 4], step: 1, ask: 'Quelle est sa surface (son aire) ?', answer: 'Ma chambre a une surface de' },
  { start: 'Un champ mesure', unit: 'hm', long: [2, 6], short: [1, 4], step: 1, ask: 'Quelle est son aire ?', answer: 'L’aire du champ est de' },
  { start: 'Un champ mesure', unit: 'm', long: [1, 3], short: [2, 9], step: 0, ask: 'Quelle est son aire ?', answer: 'L’aire du champ est de' },
  { start: 'Mon foulard mesure', unit: 'dm', long: [4, 8], short: [2, 4], step: 1, ask: 'Quelle est la mesure de sa surface ?', answer: 'La surface du foulard mesure' },
  { start: 'Mon foulard mesure', unit: 'cm', long: [4, 6], short: [2, 4], step: 10, ask: 'Combien mesure sa surface ?', answer: 'La surface du foulard mesure' },
  { start: 'Le tapis de la classe mesure', unit: 'm', long: [3, 5], short: [2, 3], step: 1, ask: 'Quelle est son aire ?', answer: 'L’aire du tapis est de' },
] as const;

/** « Ma chambre mesure 4 m sur 3 m. Quelle est sa surface ? » : A = L × l, en m². */
export function rectangleArea(kind: number, long: number, short: number): NumerationQuestion {
  const { start, unit, ask, answer } = SURFACES[kind]!;
  const area = `${unit}²` as Unit;
  const a = long * short;
  return problem(
    `${start} ${spaced(long)} ${unit} sur ${spaced(short)} ${unit}. ${ask}`,
    a * FACTOR[area],
    area,
    `${answer} ${spaced(a)} ${area}.`,
    `L’aire d’un rectangle : L × l = ${spaced(long)} × ${spaced(short)} = ${spaced(a)} (jamais d’unité dans les calculs). Les côtés sont en ${unit}, l’aire est en ${area} : des carrés de 1 ${unit} de côté.`,
    areaUnits(unit as Unit),
  );
}

function drawRectangleArea(random: () => number): NumerationQuestion {
  const kind = between(0, SURFACES.length - 1, random);
  const { long, short, step } = SURFACES[kind]!;
  // Le grand champ des fiches (100 m sur 45 m) : des centaines de mètres sur des dizaines rondes à 5 près.
  if (step === 0) return rectangleArea(kind, between(long[0], long[1], random) * 100, between(short[0], short[1], random) * 5 + 5);
  return rectangleArea(kind, between(long[0], long[1], random) * step, between(short[0], short[1], random) * step);
}

const SQUARE_SURFACES = [
  { name: 'Un carreau de carrelage carré', unit: 'dm', side: [2, 6], what: 'du carreau' },
  { name: 'Un jardin carré', unit: 'm', side: [5, 12], what: 'du jardin' },
  { name: 'Une serviette carrée', unit: 'cm', side: [20, 40], what: 'de la serviette' },
  { name: 'Une table carrée', unit: 'dm', side: [6, 9], what: 'de la table' },
] as const;

/** « Un jardin carré a des côtés de 8 m. Quelle est son aire ? » (A = c × c), ou son périmètre, pour ne pas les confondre. */
export function squareArea(kind: number, side: number, perimeter: boolean): NumerationQuestion {
  const { name, unit, what } = SQUARE_SURFACES[kind]!;
  const area = `${unit}²` as Unit;
  const units = areaUnits(unit as Unit);
  const prompt = `${name} a des côtés de ${side} ${unit}. ${perimeter ? 'Quel est son périmètre ?' : 'Quelle est son aire ?'}`;
  if (perimeter) {
    return problem(
      prompt,
      4 * side * FACTOR[unit as Unit],
      unit as Unit,
      `Le périmètre ${what} est de ${spaced(4 * side)} ${unit}.`,
      `Le périmètre, c’est le tour : 4 × ${side} = ${spaced(4 * side)}. C’est une longueur, en ${unit} (l’aire serait en ${area}).`,
      units,
    );
  }
  return problem(
    prompt,
    side * side * FACTOR[area],
    area,
    `L’aire ${what} est de ${spaced(side * side)} ${area}.`,
    `L’aire d’un carré : c × c = ${side} × ${side} = ${spaced(side * side)}. C’est une surface, en ${area}.`,
    units,
  );
}

function drawSquareArea(random: () => number): NumerationQuestion {
  const kind = between(0, SQUARE_SURFACES.length - 1, random);
  const [min, max] = SQUARE_SURFACES[kind]!.side;
  return squareArea(kind, between(min, max, random), random() < 0.3);
}

// --- Verte : les durées et l'heure de fin (fiches n° 39, 41, 43, 45, 47, 48 ; leçon Mes 4) ---

/** 18 h 10, 9 h 05, 16 h : l'heure comme sur les fiches, les minutes sur deux chiffres. */
export const clockText = (minutes: number) => {
  const m = minutes % 60;
  return `${Math.floor(minutes / 60)} h${m === 0 ? '' : ` ${String(m).padStart(2, '0')}`}`;
};
/** Dans une phrase : « midi », « midi et demi », comme la fiche n° 47. */
const saidTime = (minutes: number) => (minutes === 720 ? 'midi' : minutes === 750 ? 'midi et demi' : clockText(minutes));
/** Une durée : 45 min, 1 h 15 min, 2 h. */
export const durationText = (minutes: number) =>
  minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h${minutes % 60 === 0 ? '' : ` ${minutes % 60} min`}`;

/** La réponse d'une durée : en minutes, comme les fiches (« 75 minutes »), ou en heures et minutes. */
function durationAnswer(minutes: number): Pick<NumerationQuestion, 'answer' | 'alsoAccepted' | 'clock'> {
  return { clock: 'duration', answer: `${minutes} min`, alsoAccepted: minutes >= 60 ? [durationText(minutes)] : [] };
}

/** « 75 min (1 h 15 min) » dans une phrase-réponse. */
const bothDurations = (minutes: number) => (minutes >= 60 ? `${minutes} min (${durationText(minutes)})` : `${minutes} min`);

/** Les bonds de la méthode 2 : jusqu'à l'heure pile, les heures entières, puis les minutes qui restent. */
function hops(start: number, end: number): (readonly [from: number, to: number])[] {
  const steps: (readonly [number, number])[] = [];
  let at = start;
  const nextHour = Math.ceil(at / 60) * 60;
  if (at % 60 !== 0 && nextHour <= end) steps.push([at, (at = nextHour)]);
  const lastHour = Math.floor(end / 60) * 60;
  if (lastHour > at) steps.push([at, (at = lastHour)]);
  if (end > at) steps.push([at, end]);
  return steps;
}

/** L'explication d'une durée, par bonds (leçon Mes 4, méthode 2), ou une soustraction dans la même heure. */
function durationExplain(start: number, end: number): string {
  const total = end - start;
  const steps = hops(start, end);
  if (steps.length === 1 && Math.floor(start / 60) === Math.floor(end / 60)) {
    return `Dans la même heure : ${end % 60} − ${start % 60} = ${total}. Ça dure ${total} min.`;
  }
  const said = steps.map(([a, b]) => `De ${clockText(a)} à ${clockText(b)} : ${b - a >= 60 ? `${durationText(b - a)} = ${b - a} min` : `${b - a} min`}.`);
  const sum = steps.length > 1 ? ` ${steps.map(([a, b]) => b - a).join(' + ')} = ${total}.` : '';
  return `On avance par bonds jusqu’aux heures pile. ${said.join(' ')}${sum} Ça dure ${bothDurations(total)}.`;
}

/** Les émissions des fiches, et les nôtres : le genre (« le jeu »), le nom, il ou elle. */
const SHOWS = [
  ['le jeu', 'Super Défi', 'il'],
  ['le jeu', 'Calculo', 'il'],
  ['le jeu', 'TopGénial', 'il'],
  ['la série', 'Les Héros du Sud', 'elle'],
  ['le jeu', 'Tétrofor', 'il'],
  ['le dessin animé', 'Pirouette', 'il'],
  ['le documentaire', 'Planète Océan', 'il'],
  ['la série', 'Les Petits Malins', 'elle'],
] as const;

/** « Le jeu Super Défi commence à 18 h 10 et dure 35 minutes. À quelle heure se termine-t-il ? » */
export function endTime(show: number, start: number, duration: number): NumerationQuestion {
  const [genre, name, it] = SHOWS[show]!;
  const end = start + duration;
  const toHour = 60 - (start % 60);
  const explain =
    start % 60 + duration < 60
      ? `${start % 60} + ${duration} = ${(start % 60) + duration} : ${clockText(end)}.`
      : duration === toHour
        ? `${start % 60} + ${duration} = 60, et 60 min = 1 h : ${clockText(end)} pile.`
        : `De ${clockText(start)} à ${clockText(start + toHour)}, il y a ${toHour} min. Il reste ${duration} − ${toHour} = ${duration - toHour} min${duration - toHour >= 60 ? ` = ${durationText(duration - toHour)}` : ''} : ${clockText(end)}.`;
  return question({
    context: 'Problème',
    prompt: `À la télévision, ${genre} ${name} commence à ${saidTime(start)} et dure ${duration} minutes. À quelle heure se termine-t-${it} ?`,
    clock: 'time',
    answer: clockText(end),
    solved: `${capitalized(genre)} ${name} se termine à ${clockText(end)}.`,
    explain,
  });
}

function drawEndTime(random: () => number): NumerationQuestion {
  if (random() < 0.3) return addTime(between(8, 20, random) * 60 + between(0, 11, random) * 5, between(1, 2, random) * 60 + between(1, 11, random) * 5);
  // Le plus souvent, l'émission passe l'heure pile.
  return endTime(between(0, SHOWS.length - 1, random), between(8, 20, random) * 60 + between(2, 11, random) * 5, between(3, 18, random) * 5);
}

/** « Il est 8 h 30. Quelle heure sera-t-il dans 1 h 45 min ? » : heures et minutes à part (leçon Mes 4, méthode 4). */
export function addTime(start: number, duration: number): NumerationQuestion {
  const end = start + duration;
  const [hours, minutes] = [Math.floor(start / 60) + Math.floor(duration / 60), (start % 60) + (duration % 60)];
  const carry = minutes >= 60 ? ` ${minutes} min = 1 h ${minutes - 60} min, donc ${clockText(end)}.` : ` Ça fait ${clockText(end)}.`;
  return question({
    context: 'Problème',
    prompt: `Il est ${clockText(start)}. Quelle heure sera-t-il dans ${durationText(duration)} ?`,
    clock: 'time',
    answer: clockText(end),
    solved: `Dans ${durationText(duration)}, il sera ${clockText(end)}.`,
    explain: `On additionne à part les heures et les minutes : ${Math.floor(start / 60)} + ${Math.floor(duration / 60)} = ${hours} h et ${start % 60} + ${duration % 60} = ${minutes} min.${carry}`,
  });
}

/** « Le jeu TopGénial commence à 15 h 30 et se termine à 16 h 15. Combien de temps dure-t-il ? » */
export function showDuration(show: number, start: number, end: number): NumerationQuestion {
  const [genre, name] = SHOWS[show]!;
  return question({
    context: 'Problème',
    prompt: `À la télévision, ${genre} ${name} commence à ${saidTime(start)} et se termine à ${saidTime(end)}. Combien de temps dure ${genre} ${name} ?`,
    ...durationAnswer(end - start),
    solved: `${capitalized(genre)} ${name} dure ${bothDurations(end - start)}.`,
    explain: durationExplain(start, end),
  });
}

/** « Mon train est parti à 8 h 10 et est arrivé à 11 h 35. Combien de temps a duré le voyage ? » (fiche n° 48), le film de la leçon. */
export function journey(film: boolean, start: number, end: number): NumerationQuestion {
  return question({
    context: 'Problème',
    prompt: film
      ? `Ce soir, à la télévision, le film commence à ${clockText(start)} et se termine à ${clockText(end)}. Combien de temps dure le film ?`
      : `Mon train est parti à ${clockText(start)} et est arrivé à ${clockText(end)}. Combien de temps a duré le voyage ?`,
    ...durationAnswer(end - start),
    solved: film ? `Le film dure ${bothDurations(end - start)}.` : `Le voyage a duré ${bothDurations(end - start)}.`,
    explain: durationExplain(start, end),
  });
}

function drawDuration(random: () => number): NumerationQuestion {
  const kind = between(0, 2, random);
  if (kind === 2) {
    const film = random() < 0.5;
    const start = film ? between(20, 21, random) * 60 + between(0, 11, random) * 5 : between(6, 15, random) * 60 + between(1, 11, random) * 5;
    return journey(film, start, start + (film ? between(18, 30, random) : between(25, 60, random)) * 5);
  }
  const show = between(0, SHOWS.length - 1, random);
  // Midi et demi parfois, comme le jeu Tétrofor.
  const end = random() < 0.15 ? 750 : between(9, 20, random) * 60 + between(0, 11, random) * 5;
  return showDuration(show, end - between(4, 18, random) * 5, end);
}

/** « Il est 8 h 40. Il sera 9 h dans … min. » (leçon Mes 4). */
export function untilHour(start: number): NumerationQuestion {
  const next = Math.ceil(start / 60) * 60;
  return question({
    context: 'Complète',
    prompt: `Il est ${clockText(start)}. Il sera ${clockText(next)} dans`,
    suffix: 'min.',
    answer: next - start,
    solved: `Il est ${clockText(start)}. Il sera ${clockText(next)} dans ${next - start} min.`,
    explain: `Une heure, c’est 60 min : de ${start % 60} à 60, il manque ${next - start} (${start % 60} + ${next - start} = 60).`,
  });
}

/** « 1 h 15 min, c'est … minutes » : les heures et les minutes en minutes. */
export function inMinutes(minutes: number): NumerationQuestion {
  const hours = Math.floor(minutes / 60);
  return question({
    context: 'Complète',
    prompt: `${durationText(minutes)}, c’est`,
    suffix: 'minutes.',
    answer: minutes,
    solved: `${durationText(minutes)}, c’est ${minutes} minutes.`,
    explain: `1 h = 60 min${hours > 1 ? `, donc ${hours} h = ${hours * 60} min` : ''}. Puis ${hours * 60} + ${minutes % 60} = ${minutes}.`,
  });
}

// --- Bleue : les décimaux pour mesurer et convertir (fiches n° 49 à 60 ; leçon Mes 10) ---

/** Fiche n° 50 et les nôtres : l'unité qui convient à une mesure avec une virgule. */
const DECIMAL_SENTENCES: readonly (readonly [before: string, unit: Unit, after: string])[] = [
  ['Une petite mouche mesure 0,8', 'cm', 'de long.'],
  ['Une feuille de papier mesure 0,2', 'mm', 'd’épaisseur.'],
  ['Une porte mesure 0,90', 'm', 'de large.'],
  ['Une bouteille d’eau contient 1,5', 'L', '.'],
  ['Un bébé pèse 3,2', 'kg', 'à la naissance.'],
  ['Un camion pèse 3,5', 't', '.'],
  ['Une fourmi mesure 0,5', 'cm', 'de long.'],
  ['Un marathon fait 42,195', 'km', '.'],
  ['Une règle mesure 0,3', 'm', 'de long.'],
  ['Un sac de farine pèse 1,5', 'kg', '.'],
  ['La tour Eiffel mesure 0,33', 'km', 'de haut.'],
  ['Une canette contient 0,33', 'L', 'de soda.'],
  ['Une pièce de monnaie a une épaisseur de 2,3', 'mm', '.'],
  ['Une pomme pèse 0,15', 'kg', '.'],
  ['Un verre contient 12,5', 'cl', 'd’eau.'],
  ['Une baleine bleue pèse 150,5', 't', '.'],
];

/** « 453 cm = … m », « 4,53 m = … cm » : avec le tableau de conversion, la virgule (leçon Mes 10, niveau 2). */
function drawDecimalConvert(random: () => number): NumerationQuestion {
  const [big, small] = pick(
    [
      ['m', 'cm'],
      ['m', 'mm'],
      ['km', 'm'],
      ['cm', 'mm'],
      ['m', 'dm'],
      ['kg', 'g'],
      ['L', 'cl'],
      ['L', 'ml'],
    ] as const,
    random,
  );
  const ratio = FACTOR[big] / FACTOR[small];
  // Un nombre qui ne tombe pas juste : 453 cm = 4,53 m.
  let n = between(ratio + 1, ratio * 10 - 1, random);
  if (n % ratio === 0) n++;
  return random() < 0.5 ? convert(n, small, big) : convert(n / ratio, big, small);
}

/** 2,05 m, 1,20 m : des mètres avec deux chiffres après la virgule, comme les fiches. */
const meters = (cm: number) => (cm / 100).toFixed(2).replace('.', ',');
const LENGTH_UNITS: readonly Unit[] = ['mm', 'cm', 'm', 'km'];

/** Un problème de longueur en cm, juste aussi en m ou en mm (avec la virgule). */
const cmProblem = (prompt: string, cm: number, solved: string, explain: string): NumerationQuestion =>
  question({ context: 'Problème', prompt, units: LENGTH_UNITS, ...measureAnswer(cm * 10, 'cm', LENGTH_UNITS, 3), solved, explain });

/** Le sauteur, Sandra et François, Camille et Tom, le ruban vert (fiches n° 51, 52, 54, 57). */
export function heightProblem(kind: number, big: number, small: number): NumerationQuestion {
  if (kind === 0) {
    return cmProblem(
      `Lors d’un entraînement, le meilleur sauteur réalise un saut de ${meters(big)} m. Il a ainsi amélioré son record de ${small} cm. À quelle hauteur sautait-il avant ?`,
      big - small,
      `Avant, le meilleur sauteur sautait ${big - small} cm (${meters(big - small)} m).`,
      `On écrit tout en cm : ${meters(big)} m = ${big} cm. Puis ${big} − ${small} = ${big - small}.`,
    );
  }
  if (kind === 1) {
    return cmProblem(
      `Sandra (${meters(big)} m) mesure ${small} cm de moins que François. Quelle est la taille de François ?`,
      big + small,
      `François mesure ${big + small} cm (${meters(big + small)} m).`,
      `On écrit tout en cm : ${meters(big)} m = ${big} cm. François est plus grand : ${big} + ${small} = ${big + small}.`,
    );
  }
  if (kind === 2) {
    return cmProblem(
      `Camille mesure ${meters(big)} m. C’est ${small} cm de plus que son frère Tom. Quelle est la taille de Tom ?`,
      big - small,
      `Tom mesure ${big - small} cm (${meters(big - small)} m).`,
      `On écrit tout en cm : ${meters(big)} m = ${big} cm. Tom est plus petit : ${big} − ${small} = ${big - small}.`,
    );
  }
  return cmProblem(
    `En mettant bout à bout un ruban jaune de ${small} cm et un ruban vert, Tom obtient un ruban de ${meters(big)} m. Quelle est la longueur du ruban vert ?`,
    big - small,
    `Le ruban vert mesure ${big - small} cm (${meters(big - small)} m).`,
    `On écrit tout en cm : ${meters(big)} m = ${big} cm. Puis ${big} − ${small} = ${big - small}.`,
  );
}

function drawHeightProblem(random: () => number): NumerationQuestion {
  const kind = between(0, 3, random);
  if (kind === 0) return heightProblem(0, between(180, 240, random), between(2, 15, random));
  if (kind === 1) return heightProblem(1, between(60, 140, random), between(2, 15, random));
  if (kind === 2) return heightProblem(2, between(110, 160, random), between(15, 50, random));
  const total = between(150, 400, random);
  return heightProblem(3, total, between(50, total - 20, random));
}

/** « Julie se pèse avec son chien… combien pèse Julie (en kg) ? » (fiche n° 49) : l'unité est imposée. */
export function julie(grams: number, dog: number): NumerationQuestion {
  const total = grams + dog;
  const dogText = `${Math.floor(dog / 1000)} kg ${dog % 1000} g`;
  return question({
    context: 'Problème',
    prompt: `Julie se pèse avec son chien. La balance indique ${spaced(total / 1000)} kg. Sachant que le chien pèse ${dogText}, combien pèse Julie (en kg) ?`,
    units: MASSES,
    ...measureAnswer(grams, 'kg', []),
    solved: `Julie pèse ${spaced(grams / 1000)} kg.`,
    explain: `On écrit tout en kg : ${dogText} = ${spaced(dog / 1000)} kg. Puis ${spaced(total / 1000)} − ${spaced(dog / 1000)} = ${spaced(grams / 1000)}. La question dit « en kg ».`,
  });
}

/** « Lundi, un saut de 17,30 m ; mardi, 18,04 m. De combien de centimètres… ? » (fiche n° 53) : en cm, imposé. */
export function longJump(monday: number, tuesday: number): NumerationQuestion {
  const gain = tuesday - monday;
  return question({
    context: 'Problème',
    prompt: `Un champion de saut en longueur a réalisé lundi un saut de ${meters(monday)} m. Mardi, il a sauté ${meters(tuesday)} m. De combien de centimètres a-t-il amélioré sa performance ?`,
    units: LENGTH_UNITS,
    ...measureAnswer(gain * 10, 'cm', []),
    solved: `Le champion a amélioré sa performance de ${gain} cm.`,
    explain: `${meters(tuesday)} − ${meters(monday)} = ${meters(gain)}, et ${meters(gain)} m = ${gain} cm. La question demande des centimètres.`,
  });
}

function drawImposedUnit(random: () => number): NumerationQuestion {
  if (random() < 0.5) return julie(between(250, 400, random) * 100, between(40, 200, random) * 50);
  const monday = between(1500, 1800, random);
  return longJump(monday, monday + between(15, 95, random));
}

/** « On veut partager une corde de 15,8 m en 4 morceaux de même longueur… en cm ? » (fiches n° 55, 59). */
export function shareRope(piece: number, count: number): NumerationQuestion {
  const total = piece * count;
  return question({
    context: 'Problème',
    prompt: `On veut partager une corde de ${spaced(total / 100)} m en ${count} morceaux de même longueur. Quelle sera la longueur d’un morceau, en cm ?`,
    units: LENGTH_UNITS,
    ...measureAnswer(piece * 10, 'cm', []),
    solved: `Un morceau mesurera ${spaced(piece)} cm.`,
    explain: `On écrit la corde en cm : ${spaced(total / 100)} m = ${spaced(total)} cm. Puis ${spaced(total)} : ${count} = ${spaced(piece)}.`,
  });
}

const VOLUME_UNITS: readonly Unit[] = ['ml', 'cl', 'dl', 'L'];

/** Le Megasplash de Naïma (fiche n° 56) : des contenances en L, cl, dl et ml à additionner. */
export function megasplash(liters: number, cl: number, dl: number, ml: number): NumerationQuestion {
  const total = liters * 1000 + cl * 10 + dl * 100 + ml;
  return question({
    context: 'Problème',
    prompt: `Naïma réalise un Megasplash pour sa fête d’anniversaire. Elle mélange ${spaced(liters)} L de jus d’orange, ${cl} cl de jus de banane, ${dl} dl de jus de citron vert et ${ml} ml de sirop de grenadine. Quelle quantité de Megasplash a-t-elle préparée ?`,
    units: VOLUME_UNITS,
    ...measureAnswer(total, 'L', VOLUME_UNITS, 3),
    solved: `Naïma a préparé ${spaced(total / 1000)} L de Megasplash (${spaced(total)} ml).`,
    explain: `On écrit tout en ml : ${spaced(liters)} L = ${spaced(liters * 1000)} ml, ${cl} cl = ${cl * 10} ml, ${dl} dl = ${dl * 100} ml. Puis ${spaced(liters * 1000)} + ${cl * 10} + ${dl * 100} + ${ml} = ${spaced(total)} ml = ${spaced(total / 1000)} L.`,
  });
}

/** Le cocktail Borabora (fiche n° 58) : ce qui manque pour faire 2 litres, en cl. */
export function borabora(liters: number, dl: number, cl: number, ml: number): NumerationQuestion {
  const left = liters * 100 - dl * 10 - cl - ml / 10;
  return question({
    context: 'Problème',
    prompt: `Pour préparer ${METERS_IN_WORDS[liters]} litre${liters > 1 ? 's' : ''} de cocktail Borabora, on mélange ${dl} dl de jus d’ananas, ${cl} cl de jus de fruits de la passion, ${ml} ml de jus de citron et de la grenadine. Quelle quantité de grenadine faut-il ?`,
    units: VOLUME_UNITS,
    ...measureAnswer(left * 10, 'cl', VOLUME_UNITS, 3),
    solved: `Il faut ${left} cl de grenadine.`,
    explain: `On écrit tout en cl : ${liters} L = ${liters * 100} cl, ${dl} dl = ${dl * 10} cl, ${ml} ml = ${ml / 10} cl. Puis ${liters * 100} − ${dl * 10} − ${cl} − ${ml / 10} = ${left}.`,
  });
}

function drawCocktail(random: () => number): NumerationQuestion {
  if (random() < 0.5) return megasplash(pick([1, 1.5, 2], random), between(2, 18, random) * 5, between(1, 9, random), between(11, 95, random));
  // La grenadine fait un nombre rond de cl ; on recommence s'il ne reste pas assez de jus de fruits de la passion.
  for (;;) {
    const liters = between(1, 2, random);
    const ml = pick([50, 100, 150, 200], random);
    const dl = between(2, liters * 6, random);
    const cl = liters * 100 - dl * 10 - ml / 10 - between(1, 8, random) * 5;
    if (cl >= 10) return borabora(liters, dl, cl, ml);
  }
}

// --- Marron : l'heure de début (leçon Mes 4, méthode 3) ---

/** On recule : on enlève à part les heures et les minutes ; s'il n'y a pas assez de minutes, on change 1 h en 60 min. */
function startExplain(end: number, duration: number): string {
  const [hours, minutes] = [Math.floor(duration / 60), duration % 60];
  const borrow = end % 60 < minutes;
  const [fromHours, fromMinutes] = borrow ? [Math.floor(end / 60) - 1, (end % 60) + 60] : [Math.floor(end / 60), end % 60];
  const lend = borrow ? ` Il n’y a pas assez de minutes : ${clockText(end)}, c’est ${fromHours} h ${fromMinutes} min (1 h = 60 min).` : '';
  return `On recule : on enlève à part les heures et les minutes.${lend} ${fromHours} − ${hours} = ${fromHours - hours} h et ${fromMinutes} − ${minutes} = ${fromMinutes - minutes} min. Ça fait ${clockText(end - duration)}.`;
}

/** « Le jeu Calculo se termine à 18 h 05. Il a duré 35 minutes. À quelle heure a-t-il commencé ? » */
export function startTime(show: number, end: number, duration: number): NumerationQuestion {
  const [genre, name, it] = SHOWS[show]!;
  const inHours = duration >= 60 ? `${duration} min = ${durationText(duration)}. ` : '';
  return question({
    context: 'Problème',
    prompt: `À la télévision, ${genre} ${name} se termine à ${saidTime(end)}. ${capitalized(it)} a duré ${duration} minutes. À quelle heure a-t-${it} commencé ?`,
    clock: 'time',
    answer: clockText(end - duration),
    solved: `${capitalized(genre)} ${name} a commencé à ${clockText(end - duration)}.`,
    explain: inHours + startExplain(end, duration),
  });
}

/** Le train, le film, la promenade, le gâteau : la fin et la durée, on cherche le début. */
const STARTS = [
  { prompt: 'Mon train est arrivé à {end}. Le voyage a duré {duration}. À quelle heure est-il parti ?', solved: 'Le train est parti à {start}.' },
  { prompt: 'Le film s’est terminé à {end}. Il a duré {duration}. À quelle heure a-t-il commencé ?', solved: 'Le film a commencé à {start}.' },
  { prompt: 'Léa rentre de promenade à {end}. Elle a marché pendant {duration}. À quelle heure est-elle partie ?', solved: 'Léa est partie à {start}.' },
  { prompt: 'Le gâteau sort du four à {end}. Il a cuit pendant {duration}. À quelle heure l’a-t-on mis au four ?', solved: 'On a mis le gâteau au four à {start}.' },
] as const;

export function startOf(kind: number, end: number, duration: number): NumerationQuestion {
  const { prompt, solved } = STARTS[kind]!;
  const fill = (text: string) => text.replace('{end}', clockText(end)).replace('{duration}', durationText(duration)).replace('{start}', clockText(end - duration));
  return question({ context: 'Problème', prompt: fill(prompt), clock: 'time', answer: clockText(end - duration), solved: fill(solved), explain: startExplain(end, duration) });
}

function drawStart(random: () => number): NumerationQuestion {
  if (random() < 0.4) {
    const end = random() < 0.15 ? 750 : between(9, 21, random) * 60 + between(0, 11, random) * 5;
    return startTime(between(0, SHOWS.length - 1, random), end, between(4, 18, random) * 5);
  }
  const kind = between(0, STARTS.length - 1, random);
  const end = between(10, 21, random) * 60 + between(0, 11, random) * 5;
  // Le gâteau cuit moins d'une heure ; le reste dure des heures et des minutes, souvent plus de minutes qu'à la fin.
  const duration = kind === 3 ? between(5, 11, random) * 5 : between(1, 3, random) * 60 + between(1, 11, random) * 5;
  return startOf(kind, end, duration);
}

// --- Marron : le côté d'un rectangle à partir de son aire (leçons Mes 8 et Mes 9) ---

const AREA_SIDES = [
  { start: 'Un jardin rectangulaire', of: 'du jardin', unit: 'm', long: [6, 12], short: [3, 5] },
  { start: 'Une chambre rectangulaire', of: 'de la chambre', unit: 'm', long: [4, 6], short: [2, 3] },
  { start: 'Une nappe rectangulaire', of: 'de la nappe', unit: 'dm', long: [12, 20], short: [8, 10] },
  { start: 'Une affiche rectangulaire', of: 'de l’affiche', unit: 'cm', long: [3, 6], short: [2, 3], step: 10 },
] as const;

/** « Un jardin rectangulaire a une aire de 48 m². Sa largeur mesure 6 m. Combien mesure sa longueur ? » : A : l. */
export function sideFromArea(kind: number, long: number, short: number, askLong: boolean): NumerationQuestion {
  const { start, of, unit } = AREA_SIDES[kind]!;
  const a = long * short;
  const [known, found] = askLong ? [short, long] : [long, short];
  const [knownName, foundName] = askLong ? ['largeur', 'longueur'] : ['longueur', 'largeur'];
  return problem(
    `${start} a une aire de ${spaced(a)} ${unit}². Sa ${knownName} mesure ${known} ${unit}. Combien mesure sa ${foundName} ?`,
    found * FACTOR[unit],
    unit,
    `La ${foundName} ${of} mesure ${found} ${unit}.`,
    `L’aire d’un rectangle, c’est L × l : ${known} × … = ${spaced(a)}. Pour trouver le nombre qui manque, on divise : ${spaced(a)} : ${known} = ${found}. C’est une longueur, en ${unit} (pas en ${unit}²).`,
    areaUnits(unit),
  );
}

/** « Un carré a une aire de 49 cm². Combien mesure son côté ? » : le nombre qui, multiplié par lui-même, donne l'aire. */
export function squareSideFromArea(side: number, unit: 'm' | 'cm'): NumerationQuestion {
  return problem(
    `Un carré a une aire de ${side * side} ${unit}². Combien mesure son côté ?`,
    side * FACTOR[unit],
    unit,
    `Le côté du carré mesure ${side} ${unit}.`,
    `L’aire d’un carré, c’est c × c : quel nombre multiplié par lui-même donne ${side * side} ? ${side} × ${side} = ${side * side}. Le côté mesure ${side} ${unit} (une longueur, pas des ${unit}²).`,
    areaUnits(unit),
  );
}

function drawSideFromArea(random: () => number): NumerationQuestion {
  if (random() < 0.25) return squareSideFromArea(between(3, 10, random), random() < 0.5 ? 'm' : 'cm');
  const kind = between(0, AREA_SIDES.length - 1, random);
  const shape = AREA_SIDES[kind]!;
  const step = 'step' in shape ? shape.step : 1;
  return sideFromArea(kind, between(shape.long[0], shape.long[1], random) * step, between(shape.short[0], shape.short[1], random) * step, random() < 0.5);
}

// --- Marron : des problèmes en plusieurs étapes (fiches n° 61 à 66) ---

/** Un problème dont la réponse est un nombre de choses (élèves, verres, voix) : le nombre au pavé. */
const countProblem = (prompt: string, answer: number, things: string, solved: string, explain: string): NumerationQuestion =>
  question({ context: 'Problème', prompt, suffix: things, answer, solved, explain });

/** Au saute-mouton, Julie avance de 90 cm à chaque saut et parcourt 18 m (fiche n° 61). */
export function leapfrog(step: number, count: number): NumerationQuestion {
  const total = step * count;
  return countProblem(
    `Au jeu du saute-mouton, Julie avance de ${step} cm à chaque saut. Au final, elle a parcouru ${spaced(total / 100)} m sans s’arrêter. Au-dessus de combien d’élèves est-elle passée ?`,
    count,
    'élèves',
    `Julie est passée au-dessus de ${count} élèves.`,
    `On écrit tout en cm : ${spaced(total / 100)} m = ${spaced(total)} cm. Puis ${spaced(total)} : ${step} = ${count} (jamais d’unité dans les calculs).`,
  );
}

function drawLeapfrog(random: () => number): NumerationQuestion {
  for (;;) {
    const step = pick([50, 60, 75, 80, 90, 120, 150], random);
    const count = between(6, 24, random);
    if ((step * count) % 100 === 0) return leapfrog(step, count);
  }
}

const SOME = ['', 'une', 'deux', 'trois'];

/** La balance du primeur (fiche n° 62) : les masses posées, les tomates en kg ; ce qui manque, en grammes. */
export function scales(tomatoes: number, big: number, middle: number, small: number): NumerationQuestion {
  const placed = big * 500 + middle * 200 + small * 100;
  const missing = tomatoes - placed;
  const all: readonly (readonly [count: number, grams: number])[] = [
    [big, 500],
    [middle, 200],
    [small, 100],
  ];
  const masses = all.filter(([n]) => n > 0);
  const said = masses.map(([n, g]) => `${SOME[n]} masse${n > 1 ? 's' : ''} de ${g} g`);
  const sum = masses.map(([n, g]) => (n === 1 ? `${g}` : `${n} × ${g}`)).join(' + ');
  return question({
    context: 'Problème',
    prompt: `Au marché, le primeur pèse des tomates. Sur le plateau de gauche, il y a ${spaced(tomatoes / 1000)} kg de tomates. Sur le plateau de droite, il place ${listed(said)}. Combien de grammes manque-t-il pour que les plateaux soient à l’équilibre ?`,
    units: MASSES,
    ...measureAnswer(missing, 'g', []),
    solved: `Il manque ${missing} g pour que les plateaux soient à l’équilibre.`,
    explain: `Sur le plateau de droite : ${sum} = ${spaced(placed)} g. Les tomates : ${spaced(tomatoes / 1000)} kg = ${spaced(tomatoes)} g. Puis ${spaced(tomatoes)} − ${spaced(placed)} = ${missing}. La question demande des grammes.`,
  });
}

function drawScales(random: () => number): NumerationQuestion {
  const [big, middle, small] = [between(0, 1, random), between(1, 3, random), between(0, 3, random)];
  return scales(big * 500 + middle * 200 + small * 100 + between(1, 19, random) * 10, big, middle, small);
}

/** Le camion chargé (fiche n° 63) : à vide en tonnes, des fûts, des caisses et des boîtes de 500 g. */
export function truck(empty: number, barrels: number, barrel: number, crates: number, crate: number, boxes: number): NumerationQuestion {
  const total = Math.round(empty * 1000) + barrels * barrel + crates * crate + boxes / 2;
  return question({
    context: 'Problème',
    prompt: `Un camion pèse ${spaced(empty)} tonnes à vide. On le charge de ${barrels} fûts de ${barrel} kg chacun, de ${crates} caisses de ${crate} kg chacune et de ${boxes} boîtes de 500 g chacune. Combien pèse le camion chargé ?`,
    units: MASSES,
    ...measureAnswer(total * 1000, 'kg', MASSES, 3),
    solved: `Le camion chargé pèse ${spaced(total)} kg.`,
    explain: `On écrit tout en kg : ${spaced(empty)} t = ${spaced(empty * 1000)} kg et 500 g = 0,5 kg. Puis ${spaced(empty * 1000)} + ${barrels} × ${barrel} + ${crates} × ${crate} + ${boxes} × 0,5 = ${spaced(total)}.`,
  });
}

/** Les ampoules du médecin (fiche n° 64) : 3 boîtes de 15 ampoules de 5 ml. */
export function vials(boxes: number, perBox: number, ml: number): NumerationQuestion {
  const total = boxes * perBox * ml;
  return question({
    context: 'Problème',
    prompt: `Le médecin prescrit ${boxes} boîtes de ${perBox} ampoules de ${ml} ml. Quelle quantité totale de médicament a été prescrite ?`,
    units: VOLUME_UNITS,
    ...measureAnswer(total, 'ml', VOLUME_UNITS, 3),
    solved: `${spaced(total)} ml de médicament ont été prescrits.`,
    explain: `${boxes} × ${perBox} × ${ml} = ${spaced(total)} (jamais d’unité dans les calculs).`,
  });
}

/** Le robinet qui fuit (fiche n° 65) : des cl par minute ; combien de litres, imposé. */
export function leak(cl: number, minutes: number): NumerationQuestion {
  const total = cl * minutes;
  const time = minutes === 60 ? 'Au bout d’une heure' : minutes === 30 ? 'Au bout d’une demi-heure' : `Au bout de ${durationText(minutes)}`;
  return question({
    context: 'Problème',
    prompt: `Mon robinet fuit et laisse échapper ${cl} cl à chaque minute. Je récupère l’eau dans un seau. ${time}, combien de litres d’eau aurai-je récupérés ?`,
    units: VOLUME_UNITS,
    ...measureAnswer(total * 10, 'L', []),
    solved: `${time}, j’aurai récupéré ${spaced(total / 100)} L d’eau.`,
    explain: `${durationText(minutes)} = ${minutes} min, donc ${cl} × ${minutes} = ${total} cl. Puis 1 L = 100 cl : ${total} cl = ${spaced(total / 100)} L. La question demande des litres.`,
  });
}

/** Combien de verres, de bouteilles remplir (fiche n° 66, en plus simple) : on écrit tout en cl, puis on partage. */
export function glasses(liters: number, cl: number, bottles: boolean): NumerationQuestion {
  const count = (liters * 100) / cl;
  return countProblem(
    bottles
      ? `Un viticulteur a ${liters} L de vin. Combien de bouteilles de ${cl} cl peut-il remplir ?`
      : `Pour la fête de l’école, on a ${liters} L de jus de pomme. Combien de verres de ${cl} cl peut-on remplir ?`,
    count,
    bottles ? 'bouteilles' : 'verres',
    bottles ? `Il peut remplir ${count} bouteilles de ${cl} cl.` : `On peut remplir ${count} verres de ${cl} cl.`,
    `On écrit tout en cl : ${liters} L = ${spaced(liters * 100)} cl. Puis ${spaced(liters * 100)} : ${cl} = ${count}.`,
  );
}

const MARRON_PROBLEMS: readonly Draw[] = [
  drawLeapfrog,
  drawScales,
  (random) => truck(pick([5.5, 6, 6.2, 6.5, 7, 7.4], random), between(10, 25, random), pick([40, 45, 50], random), between(20, 60, random), pick([25, 50], random), pick([200, 400, 600, 800], random)),
  (random) => vials(between(2, 5, random), pick([10, 12, 15, 20], random), pick([2, 5, 10], random)),
  (random) => leak(pick([2, 3, 4, 5, 6, 8, 10], random), pick([30, 60, 60, 120], random)),
  (random) => (random() < 0.5 ? glasses(pick([3, 6, 9, 15, 30], random), 75, true) : glasses(between(1, 5, random), pick([10, 20, 25, 50], random), false)),
];

// --- Noire : la proportionnalité (fiches n° 67 à 78, leçon Pb 13) ---

/** 8,30 € : les centimes sur deux chiffres, comme sur les fiches ; 28 € sans virgule. */
const euros = (cents: number) => (cents % 100 === 0 ? spaced(cents / 100) : groupDigits((cents / 100).toFixed(2).replace('.', ',')));

/** Un prix à trouver : le nombre au pavé (avec la virgule), puis « € » parmi des pièges. */
const moneyProblem = (prompt: string, cents: number, units: readonly Unit[], solved: string, explain: string): NumerationQuestion =>
  question({ context: 'Problème', prompt, units, answer: `${euros(cents)} €`, alsoAccepted: [], solved, explain });

const GOODS = [
  { one: 'paquet de biscuits', many: 'paquets de biscuits', units: ['€', 'g', 'kg'] },
  { one: 'kilo de viande', many: 'kilos de viande', units: ['€', 'kg', 'g'] },
  { one: 'bouteille de soda', many: 'bouteilles de soda', units: ['€', 'L', 'cl'] },
  { one: 'cahier', many: 'cahiers', units: ['€', 'cm', 'g'] },
] as const;

/** « Deux paquets de biscuits coûtent 8 €. Combien coûtent 7 paquets ? » : le prix d'un, puis de plusieurs. */
export function prices(good: number, known: number, asked: number, unitCents: number): NumerationQuestion {
  const { one, many, units } = GOODS[good]!;
  const [total, result] = [known * unitCents, asked * unitCents];
  return moneyProblem(
    `${known} ${many} coûtent ${euros(total)} €. Combien coûtent ${asked} ${many} ?`,
    result,
    units,
    `${asked} ${many} coûtent ${euros(result)} €.`,
    `On cherche d’abord le prix d’un ${one} : ${euros(total)} : ${known} = ${euros(unitCents)} €. Puis ${asked} × ${euros(unitCents)} = ${euros(result)}.`,
  );
}

function drawPrices(random: () => number, decimals: boolean): NumerationQuestion {
  const good = between(0, GOODS.length - 1, random);
  const known = between(2, 6, random);
  let asked = between(2, 10, random);
  if (asked === known) asked++;
  // Niveau 2 : un prix rond pour un ; niveau 3 : des centimes (4,15 €, 21,20 €, 4,99 €). La viande coûte plus cher.
  const meat = good === 1 ? 1000 : 0;
  if (!decimals) return prices(good, known, asked, meat + between(2, 12, random) * 100);
  const cents = between(21, 199, random) * 5 + pick([0, 0, 4], random);
  return prices(good, known, asked, meat + (cents % 100 === 0 ? cents + 50 : cents));
}

const RECIPES = [
  { cake: 'un gâteau au chocolat', what: 'sucre', unit: 'g', units: ['g', 'kg', 'cl'] },
  { cake: 'un gâteau aux pommes', what: 'farine', unit: 'g', units: ['g', 'kg', 'cl'] },
  { cake: 'un gâteau aux pommes', what: 'caramel', unit: 'g', units: ['g', 'kg', 'cl'] },
  { cake: 'des crêpes', what: 'lait', unit: 'cl', units: ['ml', 'cl', 'L', 'g'] },
  { cake: 'une mousse au chocolat', what: 'chocolat', unit: 'g', units: ['g', 'kg', 'cl'] },
] as const;

/**
 * « Pour un gâteau pour 6 personnes, il faut 150 g de sucre. Combien pour 18 personnes ? » : 3 fois plus de
 * personnes, 3 fois plus de sucre (fiche n° 68) ; ou par la moitié, 4 → 2 → 6 (fiches n° 73 et 76).
 */
export function recipe(kind: number, persons: number, target: number, quantity: number): NumerationQuestion {
  const { cake, what, unit, units } = RECIPES[kind]!;
  const result = (quantity * target) / persons;
  let explain: string;
  if (target % persons === 0) {
    const k = target / persons;
    explain = `${target} : ${persons} = ${k} : il y a ${k} fois plus de personnes, donc il faut ${k} fois plus de ${what}. ${quantity} × ${k} = ${spaced(result)}.`;
  } else if (persons % target === 0) {
    const k = persons / target;
    explain = `${persons} : ${target} = ${k} : il y a ${k} fois moins de personnes, donc il faut ${k} fois moins de ${what}. ${quantity} : ${k} = ${spaced(result)}.`;
  } else {
    // 10 personnes, c'est 4 + 4 + 2 : la quantité deux fois, et sa moitié.
    const half = persons / 2;
    const parts = [...Array<number>(Math.floor(target / persons)).fill(persons), half];
    explain = `Pour ${half} personnes, c’est la moitié : ${quantity} : 2 = ${spaced(quantity / 2)}. ${target} personnes, c’est ${parts.join(' + ')} : ${parts.map((p) => spaced((quantity * p) / persons)).join(' + ')} = ${spaced(result)}.`;
  }
  return question({
    context: 'Problème',
    prompt: `Pour faire ${cake} pour ${persons} personnes, il faut ${quantity} ${unit} de ${what}. Combien faut-il de ${what} pour ${target} personnes ?`,
    units,
    ...measureAnswer(result * FACTOR[unit], unit, units as readonly Unit[], 3),
    solved: `Pour ${target} personnes, il faut ${spaced(result)} ${unit} de ${what}.`,
    explain,
  });
}

function drawRecipe(random: () => number): NumerationQuestion {
  const kind = between(0, RECIPES.length - 1, random);
  const persons = pick([2, 4, 6], random);
  // Plus de personnes (× 2, × 3, × 4), moins (4 → 2, 6 → 3, 6 → 2), ou par la moitié (4 → 6, 4 → 10, 6 → 9).
  const way = persons === 2 ? 0 : between(0, 2, random);
  const target = way === 0 ? persons * between(2, 4, random) : way === 1 ? persons / (persons === 6 ? pick([2, 3], random) : 2) : persons * between(1, 2, random) + persons / 2;
  // Une quantité qui se partage juste, en 2 comme en 3.
  const quantity = RECIPES[kind]!.unit === 'cl' ? pick([24, 30, 36, 48, 60], random) : between(2, 10, random) * 30;
  return recipe(kind, persons, target, quantity);
}

/** « Un sac de sucre pèse 500 g. Combien pèsent 8 sacs ? » (leçon Pb 13, question A) : une mesure, plusieurs fois. */
export function severalOf(kind: number, each: number, count: number): NumerationQuestion {
  const total = each * count;
  const [prompt, solved, unit, units] = (
    [
      [`Un sac de sucre pèse ${each} g. Combien pèsent ${count} sacs de sucre ?`, `${count} sacs de sucre pèsent ${spaced(total)} g.`, 'g', MASSES],
      [`Une bouteille de jus contient ${each} cl. Combien contiennent ${count} bouteilles ?`, `${count} bouteilles contiennent ${spaced(total)} cl.`, 'cl', VOLUME_UNITS],
      [`Une planche mesure ${each} cm de long. On en met ${count} bout à bout. Quelle longueur obtient-on ?`, `On obtient ${spaced(total)} cm.`, 'cm', LENGTH_UNITS],
    ] as const
  )[kind]!;
  const [things, more] = (
    [
      ['sacs', 'plus lourd'],
      ['bouteilles', 'plus de jus'],
      ['planches', 'plus long'],
    ] as const
  )[kind]!;
  return question({
    context: 'Problème',
    prompt,
    units,
    ...measureAnswer(total * FACTOR[unit], unit, units, 3),
    solved,
    explain: `${count} fois plus de ${things}, c’est ${count} fois ${more} : ${count} × ${each} = ${spaced(total)}.`,
  });
}

const ITEMS = [
  ['chaises', 'une chaise'],
  ['tee-shirts', 'un tee-shirt'],
  ['places de cinéma', 'une place de cinéma'],
  ['livres', 'un livre'],
] as const;

/** « Si 3 chaises coûtent 75 €, combien coûte une chaise ? » (leçon Pb 13, question B) : on partage. */
export function priceOfOne(item: number, count: number, unitCents: number): NumerationQuestion {
  const [many, one] = ITEMS[item]!;
  const total = count * unitCents;
  return moneyProblem(
    `${count} ${many} coûtent ${euros(total)} €. Combien coûte ${one} ?`,
    unitCents,
    ['€', 'kg', 'g'],
    `${capitalized(one)} coûte ${euros(unitCents)} €.`,
    `Pour avoir le prix d’un seul, on partage en ${count} : ${euros(total)} : ${count} = ${euros(unitCents)}.`,
  );
}

// --- Brillante : les problèmes niveau 4 (fiches n° 79 à 84) ---

/** L'avion (fiche n° 79) : la distance parcourue, ou l'heure du décollage. */
export function plane(landing: number, speed: number, duration: number, askTakeOff: boolean): NumerationQuestion {
  const hours = Math.floor(duration / 60);
  const distance = (speed * duration) / 60;
  const start = `Un avion de transport atterrit à ${clockText(landing)} après un vol de ${durationText(duration)} à la vitesse moyenne de ${speed} kilomètres par heure.`;
  if (askTakeOff) {
    return question({
      context: 'Problème',
      prompt: `${start} À quelle heure a-t-il décollé ?`,
      clock: 'time',
      answer: clockText(landing - duration),
      solved: `L’avion a décollé à ${clockText(landing - duration)}.`,
      explain: `La vitesse ne sert pas ici. ${startExplain(landing, duration)}`,
    });
  }
  const half = duration % 60 === 30;
  return problem(
    `${start} Quelle distance a-t-il parcourue ?`,
    distance * FACTOR.km,
    'km',
    `En ${durationText(duration)}, l’avion a parcouru ${spaced(distance)} km.`,
    half
      ? `En une demi-heure, l’avion parcourt ${speed} : 2 = ${speed / 2} km. En ${durationText(duration)} : ${hours} × ${speed} + ${speed / 2} = ${spaced(distance)}.`
      : `En 1 h, l’avion parcourt ${speed} km. En ${hours} h : ${hours} × ${speed} = ${spaced(distance)}.`,
  );
}

/** Le carrelage de la cuisine (fiche n° 80) : les carreaux de 50 cm, les paquets entiers, le prix. */
export function tiles(long: number, wide: number, perPack: number, packPrice: number): NumerationQuestion {
  const [along, across] = [long * 2, wide * 2];
  const count = along * across;
  const packs = Math.ceil(count / perPack);
  const rest = count % perPack;
  const buy =
    rest === 0
      ? `${count} : ${perPack} = ${packs} paquets.`
      : `${count} = ${packs - 1} × ${perPack} + ${rest} : ${packs - 1} paquets ne suffisent pas, il faut ${packs} paquets.`;
  return moneyProblem(
    `Je veux poser du carrelage dans ma cuisine rectangulaire. Elle mesure ${spaced(long)} m sur ${spaced(wide)} m. Un carreau mesure 50 cm de côté. Les carreaux sont vendus par paquets de ${perPack}, au prix de ${packPrice} € le paquet. Combien vais-je dépenser ?`,
    packs * packPrice * 100,
    ['€', 'm²', 'm'],
    `Je vais dépenser ${spaced(packs * packPrice)} €.`,
    `Dans 1 m, il y a 2 carreaux de 50 cm : ${spaced(long)} × 2 = ${along} carreaux dans la longueur, ${spaced(wide)} × 2 = ${across} dans la largeur. ${along} × ${across} = ${count} carreaux. ${buy} Puis ${packs} × ${packPrice} = ${spaced(packs * packPrice)}.`,
  );
}

const WISHES = [
  ['Lucas', 'un naïpode', 'Sa mère'],
  ['Inès', 'un vélo', 'Son père'],
  ['Malo', 'une console', 'Sa mère'],
] as const;

/** Le naïpode (fiche n° 81) : 5 semaines par mois, le salaire d'une heure, puis le nombre d'heures. */
export function wish(kind: number, perWeek: number, hourly: number, hours: number): NumerationQuestion {
  const [child, gift, parent] = WISHES[kind]!;
  const [monthHours, salary, price] = [5 * perWeek, 5 * perWeek * hourly, hours * hourly];
  // « la mère de Lucas », « le père d'Inès ».
  const who = `${parent.toLowerCase().replace('sa ', 'la ').replace('son ', 'le ')} ${/^[AEIOUÉÈ]/.test(child) ? 'd’' : 'de '}${child}`;
  return question({
    context: 'Problème',
    prompt: `Pour son anniversaire, ${child} aimerait ${gift}, qui coûte ${price} €. ${parent} gagne ${spaced(salary)} € par mois et travaille ${perWeek} heures par semaine. Combien d’heures ${who} travaille-t-${parent === 'Sa mère' ? 'elle' : 'il'} pour gagner ce prix ? (On compte 5 semaines dans un mois.)`,
    clock: 'duration',
    answer: `${hours} h`,
    alsoAccepted: [`${hours * 60} min`],
    solved: `${capitalized(who)} travaille ${hours} heures pour gagner le prix ${gift.startsWith('une') ? 'de la' : 'du'} ${gift.split(' ')[1]}.`,
    explain: `En un mois : 5 × ${perWeek} = ${monthHours} heures. En une heure : ${spaced(salary)} : ${monthHours} = ${hourly} €. Pour ${price} € : ${price} : ${hourly} = ${hours} heures.`,
  });
}

/** La caissière (fiche n° 82) : les achats, les billets de 10 € donnés, la monnaie rendue. */
export function change(compass: number, folder: number, ink: number): NumerationQuestion {
  const total = compass + 2 * folder + ink;
  const notes = Math.ceil(total / 1000);
  const back = notes * 1000 - total;
  return moneyProblem(
    `Victor achète un compas à ${euros(compass)} €, deux pochettes de feuilles à ${euros(folder)} € pièce et une boîte de cartouches d’encre à ${euros(ink)} €. Dans son porte-monnaie, il a 4 billets de 10 €. Il donne le moins de billets possible. Combien la caissière lui rendra-t-elle ?`,
    back,
    ['€', 'g', 'cm'],
    `La caissière lui rendra ${euros(back)} €.`,
    `${euros(compass)} + 2 × ${euros(folder)} + ${euros(ink)} = ${euros(total)} : les achats coûtent ${euros(total)} €. Il donne ${notes} billet${notes > 1 ? 's' : ''} : ${notes * 10} €. Puis ${notes * 10} − ${euros(total)} = ${euros(back)}.`,
  );
}

function drawChange(random: () => number): NumerationQuestion {
  // On recommence quand les achats tombent pile sur des dizaines d'euros : la caissière n'aurait rien à rendre.
  for (;;) {
    const [compass, folder, ink] = [between(70, 179, random) * 5 + pick([0, 1, 4], random), between(30, 59, random) * 5, between(20, 50, random) * 5 - pick([0, 1, 5], random)];
    if ((compass + 2 * folder + ink) % 1000 !== 0) return change(compass, folder, ink);
  }
}

/** Le marchand de vaisselle (fiche n° 83) : le prix d'achat, les assiettes cassées, la revente à la douzaine. */
export function dishes(count: number, perThousand: number, broken: number, perDozen: number): NumerationQuestion {
  // En centimes : 1 500 assiettes à 465 € les mille coûtent 697,50 €.
  const buy = (count / 1000) * perThousand * 100;
  const dozens = (count - broken) / 12;
  const sell = dozens * perDozen * 100;
  const bought =
    count === 1000
      ? `1 000 assiettes coûtent ${perThousand} €.`
      : count === 2000
        ? `2 000 assiettes coûtent 2 × ${perThousand} = ${euros(buy)} €.`
        : `500 assiettes coûtent ${perThousand} : 2 = ${euros(perThousand * 50)} €, donc 1 500 assiettes coûtent ${perThousand} + ${euros(perThousand * 50)} = ${euros(buy)} €.`;
  return moneyProblem(
    `Un marchand de vaisselle achète ${spaced(count)} assiettes au prix de ${perThousand} € les mille. Il en casse ${broken} et revend les autres ${perDozen} € la douzaine. Calcule son bénéfice (ce qu’il gagne en plus de ce qu’il a payé).`,
    sell - buy,
    ['€', 'kg', 'g'],
    `Il fait ${euros(sell - buy)} € de bénéfice.`,
    `${bought} Il lui reste ${spaced(count)} − ${broken} = ${spaced(count - broken)} assiettes, soit ${spaced(count - broken)} : 12 = ${dozens} douzaines. Il les revend ${dozens} × ${perDozen} = ${euros(sell)} €. Bénéfice : ${euros(sell)} − ${euros(buy)} = ${euros(sell - buy)}.`,
  );
}

function drawDishes(random: () => number): NumerationQuestion {
  const count = pick([1000, 1500, 2000], random);
  // Les assiettes qui restent se rangent en douzaines : 1 500 − 12, 1 000 − 4, 2 000 − 8.
  const broken = (count % 12 || 12) + 12 * between(0, 1, random);
  return dishes(count, between(40, 60, random) * 10 + pick([0, 5], random), broken, between(20, 36, random));
}

/** Les élections de Saint-Martin (fiche n° 84, avec la correction juste : 740 voix, M. Legrand). */
export function election(voices: number): NumerationQuestion {
  const [quarter, tenth] = [voices / 4, voices / 10];
  const rest = voices - quarter - tenth;
  return countProblem(
    `Aux élections municipales de Saint-Martin, il y a eu ${spaced(voices)} voix. La liste de Mme Lejeune a obtenu le quart des voix. Celle de M. Legrand en a obtenu 10 %. Celle de M. Guillou a obtenu les autres voix. Combien de voix le gagnant a-t-il reçues ?`,
    rest,
    'voix',
    `M. Guillou gagne l’élection avec ${spaced(rest)} voix.`,
    `Le quart : ${spaced(voices)} : 4 = ${spaced(quarter)} voix pour Mme Lejeune. 10 %, c’est un dixième : ${spaced(voices)} : 10 = ${spaced(tenth)} voix pour M. Legrand. Les autres : ${spaced(voices)} − ${spaced(quarter)} − ${spaced(tenth)} = ${spaced(rest)} voix pour M. Guillou, le plus grand nombre.`,
  );
}

const MARRON_KINDS: readonly Draw[] = [
  drawStart,
  drawSideFromArea,
  (random) => pick(MARRON_PROBLEMS.slice(0, 3), random)(random),
  (random) => pick(MARRON_PROBLEMS.slice(3), random)(random),
];

const NOIRE_KINDS: readonly Draw[] = [
  (random) => drawPrices(random, false),
  drawRecipe,
  (random) => drawPrices(random, true),
  (random) => severalOf(between(0, 2, random), pick([125, 250, 500, 75, 150], random), between(3, 9, random)),
  (random) => priceOfOne(between(0, ITEMS.length - 1, random), between(2, 6, random), random() < 0.6 ? between(4, 30, random) * 100 : between(81, 599, random) * 5),
];

const BRILLANTE_KINDS: readonly Draw[] = [
  (random) => plane(between(10, 20, random) * 60 + between(0, 11, random) * 5, between(10, 20, random) * 20, between(3, 7, random) * 30, random() < 0.3),
  (random) => tiles(between(6, 12, random) / 2, between(6, 10, random) / 2, pick([8, 10, 12], random), between(15, 30, random)),
  (random) => wish(between(0, WISHES.length - 1, random), pick([20, 24, 30, 35, 40], random), between(7, 12, random), between(15, 40, random)),
  drawChange,
  drawDishes,
  (random) => election(between(50, 200, random) * 20),
];

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

const VERTE_KINDS: readonly Draw[] = [
  drawRectangleArea,
  drawSquareArea,
  drawEndTime,
  drawDuration,
  (random) => (random() < 0.5 ? untilHour(between(8, 20, random) * 60 + between(1, 11, random) * 5) : inMinutes(between(1, 3, random) * 60 + between(1, 11, random) * 5)),
];

const BLEUE_KINDS: readonly Draw[] = [
  (random) => unitFor(between(0, DECIMAL_SENTENCES.length - 1, random), DECIMAL_SENTENCES),
  drawDecimalConvert,
  drawHeightProblem,
  drawImposedUnit,
  (random) => shareRope(between(150, 500, random), between(2, 5, random)),
  drawCocktail,
];

const BELTS: readonly NumerationBelt[] = [
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
      convert(350, 'm', 'cm'),
      convert(76, 'hg', 'dag'),
      rectangleSide(0, 80, 120, true),
      timeFact(timeIndexes('rose')[0]!),
    ],
    kinds: ROSE_KINDS,
  },
  {
    belt: 'vert',
    skill: 'Je calcule l’aire d’un carré et d’un rectangle. Je calcule combien de temps dure quelque chose et à quelle heure ça se termine.',
    goal: 'CM1',
    tips: [
      'L’aire, c’est la mesure de la surface. 1 m², c’est un carré de 1 m de côté. 1 cm², un carré de 1 cm de côté.',
      'Aire d’un rectangle : A = L × l. Aire d’un carré : A = c × c. Ma chambre de 4 m sur 3 m : 4 × 3 = 12 m².',
      'Attention : le périmètre, c’est le tour, en m. L’aire, c’est la surface, en m².',
      'Pour une durée, on avance par petits bonds jusqu’aux heures pile : de 8 h 30 à 9 h, 30 min. De 9 h à 10 h, 1 h. De 10 h à 10 h 15, 15 min.',
      'On additionne à part les heures et les minutes : 8 h 30 + 1 h 45 = 9 h 75 min. Comme 75 min = 1 h 15 min, ça fait 10 h 15.',
      'Pour répondre, je tape un nombre puis je touche h ou min : 1 h 15 min, ou 75 min.',
    ],
    examples: () => [rectangleArea(0, 4, 3), endTime(0, 18 * 60 + 10, 35), showDuration(2, 15 * 60 + 30, 16 * 60 + 15), journey(false, 8 * 60 + 10, 11 * 60 + 35)],
    kinds: VERTE_KINDS,
  },
  {
    belt: 'bleu',
    skill: 'J’utilise les nombres à virgule pour mesurer et pour convertir : 2,05 m = 205 cm.',
    decimal: true,
    tips: [
      'Dans 2,05 m, le chiffre des unités (2) est dans la colonne des m, 0 dans celle des dm et 5 dans celle des cm : 2,05 m = 205 cm.',
      'Pour convertir, je place le nombre dans le tableau, son chiffre des unités dans la colonne de son unité. Puis je mets la virgule dans la colonne de la nouvelle unité : 453 cm = 4,53 m.',
      'Avant de calculer, j’écris toutes les mesures dans la même unité : 1,5 L = 150 cl.',
      'Si la question dit « en cm » ou « en kg », je réponds dans cette unité.',
      'La touche virgule du pavé sert à écrire 1,99 m.',
    ],
    examples: () => [julie(33_500, 12_650), convert(453, 'cm', 'm'), heightProblem(0, 205, 6), megasplash(1.5, 55, 4, 22)],
    kinds: BLEUE_KINDS,
  },
  {
    belt: 'marron',
    skill: 'Je trouve à quelle heure quelque chose a commencé. Je trouve le côté d’un rectangle quand je connais son aire. Je résous des problèmes en plusieurs étapes.',
    decimal: true,
    tips: [
      'Pour trouver l’heure de début, je recule : j’enlève la durée à l’heure de fin.',
      'J’enlève à part les heures et les minutes. S’il n’y a pas assez de minutes, je change 1 h en 60 min : 10 h 15, c’est 9 h 75 min. Puis 9 h 75 − 1 h 45 = 8 h 30.',
      'Aire d’un rectangle = L × l. Si je connais l’aire et un côté, je divise : 48 m² et un côté de 6 m, 48 : 6 = 8. L’autre côté mesure 8 m.',
      'Le côté est une longueur : il s’écrit en m, pas en m².',
      'Dans un problème en plusieurs étapes, j’écris un calcul et une phrase pour chaque étape. Avant de calculer, je mets toutes les mesures dans la même unité.',
    ],
    examples: () => [startTime(1, 18 * 60 + 5, 35), startOf(0, 10 * 60 + 15, 105), sideFromArea(0, 8, 6, true), leapfrog(90, 20)],
    kinds: MARRON_KINDS,
  },
  {
    belt: 'noire',
    skill: 'Je résous des problèmes de proportionnalité : si 2 paquets coûtent 8 €, je trouve le prix de 7 paquets.',
    goal: 'CM2',
    decimal: true,
    tips: [
      'C’est de la proportionnalité quand, si j’achète 2 fois plus, je paie 2 fois plus. 1 kg de viande coûte 8 €, donc 3 kg coûtent 3 × 8 = 24 €.',
      'Je cherche d’abord le prix d’un seul : 2 paquets coûtent 8 €, donc 1 paquet coûte 8 : 2 = 4 €. Puis 7 paquets coûtent 7 × 4 = 28 €.',
      'Pour une recette : 18 personnes, c’est 3 fois 6 personnes. Il faut 3 fois plus de sucre : 150 × 3 = 450 g.',
      'Je peux passer par la moitié : pour 4 personnes, 200 g de farine. Pour 2 personnes, 100 g. Pour 6 personnes, 200 + 100 = 300 g.',
      'Pour écrire un prix avec des centimes, je touche la virgule : 4,15 €.',
    ],
    examples: () => [prices(0, 2, 7, 400), recipe(0, 6, 18, 150), recipe(1, 4, 6, 200), prices(1, 3, 4, 2120)],
    kinds: NOIRE_KINDS,
  },
  {
    belt: 'brillante',
    skill: 'Je résous des problèmes difficiles en plusieurs étapes, avec des durées, des aires et des prix.',
    decimal: true,
    tips: [
      'Je lis le problème deux fois. Je cherche ce qu’on me demande, puis ce que je dois trouver avant.',
      'J’écris une étape à la fois : un calcul, puis une phrase.',
      '280 km par heure, c’est 280 km en 1 h, et 280 : 2 = 140 km en une demi-heure.',
      'On ne peut pas acheter un morceau de paquet : s’il manque 2 carreaux, on achète un paquet de plus.',
      'Le bénéfice, c’est ce que le marchand gagne : ce qu’il a vendu moins ce qu’il a payé.',
    ],
    examples: () => [plane(14 * 60 + 10, 280, 150, false), tiles(4.5, 5, 8, 23), wish(0, 35, 7, 30), election(2960)],
    kinds: BRILLANTE_KINDS,
  },
];

/** Les astuces et les compétences aussi : « 205 cm » ne se coupe pas en fin de ligne. */
export const MESURES: readonly NumerationBelt[] = BELTS.map((belt) => ({ ...belt, skill: glued(belt.skill), tips: belt.tips.map(glued) }));
