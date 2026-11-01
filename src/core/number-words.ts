// Les nombres en lettres, comme dans la leçon N1 de la classe : des traits d'union entre tous les mots
// (orthographe de 1990), « et » dans 21, 31… 71 ; « cents » et « vingts » prennent un s quand ils sont
// multipliés et que rien ne les suit ; « mille » ne prend jamais de s.
// Voir .ai/analyse/18-ceintures-numeration.md.

const UNITS = [
  'zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf',
];
const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];

/** Les mots de 1 à 99 : « soixante-et-onze », « quatre-vingts » (`end` : rien ne suit). */
function belowHundred(n: number, end: boolean): string[] {
  if (n < 20) return [UNITS[n]!];
  if (n < 70) {
    const [tens, unit] = [Math.floor(n / 10), n % 10];
    if (unit === 0) return [TENS[tens]!];
    return unit === 1 ? [TENS[tens]!, 'et', 'un'] : [TENS[tens]!, UNITS[unit]!];
  }
  if (n < 80) return n === 71 ? ['soixante', 'et', 'onze'] : ['soixante', ...belowHundred(n - 60, end)];
  if (n === 80) return [end ? 'quatre-vingts' : 'quatre-vingt'];
  return ['quatre-vingt', ...belowHundred(n - 80, end)];
}

/** Les mots de 1 à 999 ; `end` : rien ne suit (« deux-cents », mais « deux-cent-mille »). */
function belowThousand(n: number, end: boolean): string[] {
  const [hundreds, rest] = [Math.floor(n / 100), n % 100];
  const words: string[] = [];
  if (hundreds === 1) words.push('cent');
  else if (hundreds > 1) words.push(UNITS[hundreds]!, rest === 0 && end ? 'cents' : 'cent');
  if (rest > 0) words.push(...belowHundred(rest, end));
  return words;
}

/** Les mots du nombre, dans l'ordre ; « quatre-vingt(s) » compte pour un mot. */
function numberWords(n: number): string[] {
  if (!Number.isInteger(n) || n < 0 || n >= 1e12) throw new Error(`Nombre hors limites : ${n}`);
  if (n === 0) return ['zéro'];
  const classes = [
    { size: 1e9, name: 'milliard' },
    { size: 1e6, name: 'million' },
  ];
  const words: string[] = [];
  let rest = n;
  for (const { size, name } of classes) {
    const count = Math.floor(rest / size);
    rest %= size;
    // Milliard et million sont des noms : « deux-cents-millions », « un-million ».
    if (count > 0) words.push(...belowThousand(count, true), count > 1 ? `${name}s` : name);
  }
  const thousands = Math.floor(rest / 1000);
  rest %= 1000;
  // Mille n'est pas un nom : « mille », « deux-cent-mille » ; jamais de s.
  if (thousands > 1) words.push(...belowThousand(thousands, false));
  if (thousands > 0) words.push('mille');
  if (rest > 0) words.push(...belowThousand(rest, true));
  return words;
}

/** « trois-cent-soixante », comme en classe (orthographe de 1990). */
export function numberToWords(n: number): string {
  return numberWords(n).join('-');
}

/**
 * L'orthographe traditionnelle, juste aussi : des traits d'union seulement entre les dizaines et
 * les unités sous cent, sans « et » (« vingt et un », « deux cent trois », « quatre-vingt-dix »).
 */
export function numberToWordsTraditional(n: number): string {
  let text = '';
  for (const word of numberWords(n)) {
    if (text === '') text = word;
    else if (word === 'et' || text.endsWith(' et')) text += ` ${word}`;
    else {
      const previous = text.split(' ').at(-1)!;
      // Sous cent : « dix-sept », « soixante-douze », « quatre-vingt-un ».
      const tens = /^(vingt|trente|quarante|cinquante|soixante|quatre-vingt|dix)$/;
      const unit = /^(un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize|dix-sept|dix-huit|dix-neuf)$/;
      text += tens.test(previous) && unit.test(word) ? `-${word}` : ` ${word}`;
    }
  }
  return text;
}

/** « demi », « tiers », « quart », puis « cinquième », « neuvième », « dixième », « centième ». */
function denominatorWord(d: number): string {
  if (d === 2) return 'demi';
  if (d === 3) return 'tiers';
  if (d === 4) return 'quart';
  const word = numberToWords(d);
  if (word.endsWith('cinq')) return `${word}uième`;
  if (word.endsWith('neuf')) return `${word.slice(0, -1)}vième`;
  return `${word.endsWith('e') ? word.slice(0, -1) : word}ième`;
}

/**
 * Une fraction en lettres, comme sur les fiches de la classe (leçon N11) : « trois quarts », « un demi »,
 * « vingt-et-un quarts ». Le nom prend un s au pluriel, sauf « tiers ».
 */
export function fractionToWords(numerator: number, denominator: number, traditional = false): string {
  const name = denominatorWord(denominator);
  const plural = numerator > 1 && !name.endsWith('s') ? `${name}s` : name;
  return `${traditional ? numberToWordsTraditional(numerator) : numberToWords(numerator)} ${plural}`;
}
