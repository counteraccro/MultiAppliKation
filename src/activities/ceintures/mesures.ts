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
type Unit = (typeof LENGTHS)[number] | (typeof MASSES)[number] | (typeof VOLUMES)[number];

/** Chaque unité dans la plus petite de sa famille : 1 m = 1 000 mm, 1 t = 1 000 000 g, 1 L = 1 000 ml. */
const FACTOR: Readonly<Record<Unit, number>> = { mm: 1, cm: 10, m: 1000, km: 1_000_000, g: 1, kg: 1000, t: 1_000_000, ml: 1, cl: 10, L: 1000 };

const familyOf = (unit: Unit): readonly Unit[] =>
  (LENGTHS as readonly Unit[]).includes(unit) ? LENGTHS : (MASSES as readonly Unit[]).includes(unit) ? MASSES : VOLUMES;

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

const UNIT_HINTS: Readonly<Record<Unit, string>> = {
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
    explain: UNIT_HINTS[unit],
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
const TIME_FACTS: readonly (readonly [left: string, right: string, answer: number, explain: string, yellow?: true])[] = [
  ['Dans une heure, il y a', 'minutes.', 60, '1 heure = 60 minutes : la grande aiguille fait un tour complet.'],
  ['Une demi-heure, c’est', 'minutes.', 30, 'Une demi-heure, c’est la moitié d’une heure : la moitié de 60, c’est 30.'],
  ['Un quart d’heure, c’est', 'minutes.', 15, 'Un quart d’heure, c’est 15 minutes : 60 partagé en 4.'],
  ['Trois quarts d’heure, c’est', 'minutes.', 45, 'Un quart d’heure = 15 minutes, donc trois quarts d’heure = 15 + 15 + 15 = 45 minutes.'],
  ['2 heures, c’est', 'minutes.', 120, '1 heure = 60 minutes, donc 2 heures = 60 + 60 = 120 minutes.'],
  ['Une heure et demie, c’est', 'minutes.', 90, '1 heure = 60 minutes, une demi-heure = 30 minutes : 60 + 30 = 90 minutes.'],
  ['Dans une journée, il y a', 'heures.', 24, 'Une journée dure 24 heures : la petite aiguille fait deux fois le tour.'],
  ['Dans une minute, il y a', 'secondes.', 60, '1 minute = 60 secondes.', true],
  ['2 minutes, c’est', 'secondes.', 120, '1 minute = 60 secondes, donc 2 minutes = 60 + 60 = 120 secondes.', true],
  ['2 jours, c’est', 'heures.', 48, '1 jour = 24 heures, donc 2 jours = 24 + 24 = 48 heures.', true],
  ['48 heures, c’est', 'jours.', 2, '1 jour = 24 heures, et 24 + 24 = 48 : 48 heures, c’est 2 jours.', true],
  ['120 minutes, c’est', 'heures.', 2, '1 heure = 60 minutes, et 60 + 60 = 120 : 120 minutes, c’est 2 heures.', true],
  ['Dans une semaine, il y a', 'jours.', 7, 'Une semaine compte 7 jours, du lundi au dimanche.', true],
  ['3 semaines, c’est', 'jours.', 21, 'Une semaine = 7 jours, donc 3 semaines = 3 × 7 = 21 jours.', true],
  ['Dans une année, il y a', 'mois.', 12, 'Une année compte 12 mois, 52 semaines et 365 jours.', true],
  ['Une demi-minute, c’est', 'secondes.', 30, '1 minute = 60 secondes ; la moitié de 60, c’est 30.', true],
];

export function timeFact(index: number): NumerationQuestion {
  const [left, right, answer, explain] = TIME_FACTS[index]!;
  return question({
    context: 'Complète',
    prompt: left,
    suffix: right,
    answer,
    solved: `${left} ${answer} ${right}`,
    explain,
  });
}

const timeIndexes = (yellow: boolean) => TIME_FACTS.flatMap((fact, i) => (Boolean(fact[4]) === yellow ? [i] : []));

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

// --- Les ceintures ---

const BLANCHE_KINDS: readonly Draw[] = [
  (random) => unitFor(between(0, UNIT_SENTENCES.length - 1, random)),
  drawSimpleCompare,
  drawConversion,
  (random) => (random() < 0.7 ? drawCalcEquality(random) : drawUnitOfSum(random)),
  (random) => neighbourMonth(between(0, 11, random), random() < 0.5, random),
  (random) => timeFact(pick(timeIndexes(false), random)),
  drawSegment,
];

const JAUNE_KINDS: readonly Draw[] = [
  drawTallest,
  drawMixedCompare,
  (random) => ribbon(between(0, STRINGS.length - 1, random), between(1, 5, random), between(1, 9, random) * 10),
  (random) => timeFact(pick(timeIndexes(true), random)),
  drawMixedCalc,
  drawConversion,
];

export const MESURES: readonly NumerationBelt[] = [
  {
    belt: 'blanche',
    skill: 'Mesurer un segment ; les relations entre mm, cm, m et km, entre heures et minutes ; à quoi servent les mesures ; les mois de l’année',
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
    skill: 'Comparer et calculer des longueurs exprimées dans différentes unités ; les relations entre jours, heures, minutes et secondes',
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
];
