import { describe, expect, it } from 'vitest';
import { answerText, isCorrect, isNumberLine } from '../../core/quiz';
import {
  compare,
  compareDecimals,
  compareFractions,
  completeDecimal,
  decimalAsFraction,
  decimalDigitOf,
  discount,
  equalToDecimal,
  findPercent,
  fractionAsDecimal,
  growth,
  paintPercent,
  percentMarbles,
  percentMeaning,
  percentOf,
  placeNumber,
  votes,
  whichPercent,
  compareMixed,
  decimalTimes,
  decomposeDecimal,
  fractionsToDecimal,
  frameDecimal,
  halfCalc,
  intercalate,
  isBetween,
  orderDecimals,
  wordsToDecimal,
  complementTo,
  complementTo100,
  decompose,
  decomposeTimes,
  digitOf,
  digitsToWords,
  equalFraction,
  fractionCalc,
  fractionToLetters,
  frameFraction,
  lettersToFraction,
  marblesProblem,
  paintFraction,
  placeFraction,
  readColored,
  readFractionLine,
  remainingProblem,
  whichMarker,
  wholePlusFraction,
  doubleOrHalf,
  exists,
  groups,
  imagesProblem,
  NUMERATION,
  NUMERATION_TEST_SIZE,
  numberLine,
  numberLineChoices,
  numberOf,
  pickNumeration,
  sequence,
  timesPowers,
  wellWritten,
  wordsToDigits,
} from './numeration';
import { CalcTestSession, factText } from './table-practice';

/** Générateur pseudo-aléatoire reproductible. */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe('Numération', () => {
  it('fait toucher le chiffre d’un rang dans le nombre', () => {
    const question = digitOf(54, 1);
    expect(question.choices?.map((c) => c.label)).toEqual(['5', '4']);
    expect(answerText(question)).toBe('5');
    expect(isCorrect(question, '0')).toBe(true);
    expect(isCorrect(question, '1')).toBe(false);
    expect(factText(question)).toBe('Dans 54, le chiffre des dizaines est 5.');
    // 44 : les deux chiffres sont pareils, seul le bon rang est juste.
    expect(isCorrect(digitOf(44, 0), '1')).toBe(true);
    expect(isCorrect(digitOf(44, 0), '0')).toBe(false);
    expect(answerText(digitOf(2671, 2))).toBe('6');
  });

  it('distingue le chiffre et le nombre de dizaines (leçon N5)', () => {
    // Fiches n° 19 à 21.
    expect(numberOf(258, 1).answer).toBe(25);
    expect(numberOf(2671, 1).answer).toBe(267);
    expect(numberOf(94, 1).answer).toBe(9);
    expect(numberOf(4528, 2).answer).toBe(45);
    expect(numberOf(345, 1).explain).toBe('On cache le chiffre des unités : on peut faire 34 paquets de 10. Le chiffre des dizaines, lui, est 4.');
  });

  it('passe des lettres aux chiffres et inversement', () => {
    expect(wordsToDigits(76)).toMatchObject({ prompt: 'soixante-seize', answer: 76 });
    expect(wordsToDigits(76).explain).toBe('soixante-seize, c’est 60 + 16 = 76.');
    expect(wordsToDigits(98).explain).toBe('quatre-vingt-dix-huit, c’est 80 + 18 = 98.');
    expect(wordsToDigits(345).explain).toBe('trois-cent-quarante-cinq, c’est 300 + 40 + 5 = 345.');
    const words = digitsToWords(163);
    expect(words).toMatchObject({ input: 'letters', answer: 'cent-soixante-trois' });
    expect(isCorrect(words, 'cent-soixante-trois')).toBe(true);
    expect(isCorrect(words, 'cent soixante-trois')).toBe(true);
    expect(isCorrect(words, 'cent-soixante-treize')).toBe(false);
    expect(isCorrect(digitsToWords(380), 'trois-cent-quatre-vingts')).toBe(true);
    expect(isCorrect(digitsToWords(380), 'trois-cent-quatre-vingt')).toBe(false);
    expect(digitsToWords(380).explain).toContain('prennent un s');
  });

  it('demande si un nombre en lettres existe', () => {
    expect(exists('cinquante-douze').answer).toBe('non');
    expect(exists('soixante-seize', 76).answer).toBe('oui');
    expect(factText(exists('trente-quinze'))).toBe('trente-quinze n’existe pas.');
  });

  it('continue une suite', () => {
    // Fiches n° 4 et 5.
    expect(sequence(41, -2)).toMatchObject({ prompt: '41, 39, 37, 35,', answer: 33 });
    expect(sequence(42, 5).answer).toBe(62);
    expect(sequence(42, 5).explain).toBe('On ajoute 5 à chaque fois : 57 + 5 = 62.');
  });

  it('compare avec <, > ou =, un côté pouvant être un calcul', () => {
    // Fiches n° 8 et 9.
    expect(compare('92', '29').answer).toBe('>');
    expect(compare('7 + 40', '47').answer).toBe('=');
    expect(compare('37', '73').answer).toBe('<');
    expect(compare('82', '20 + 8')).toMatchObject({ answer: '>', solved: '82 > 20 + 8' });
    expect(compare('82', '20 + 8').explain).toBe('20 + 8 = 28. On compare les chiffres en commençant par la gauche. Le crocodile mange le plus grand.');
  });

  it('calcule avec des dizaines et des centaines', () => {
    // Fiches n° 10, 29 à 31.
    expect(groups([[12, 0], [3, 1]])).toMatchObject({ prompt: '12 unités + 3 dizaines', answer: 42 });
    expect(groups([[12, 0], [3, 1]]).explain).toBe('3 dizaines = 30 ; 12 + 30 = 42.');
    expect(groups([[2, 1], [10, 0]]).answer).toBe(30);
    expect(groups([[20, 1], [20, 0]]).answer).toBe(220);
    expect(groups([[6, 2], [10, 1]]).answer).toBe(700);
    expect(groups([[1, 2]]).prompt).toBe('1 centaine');
    expect(groups([[60, 1]])).toMatchObject({ answer: 600, explain: '60 dizaines = 600 : 10 dizaines font 1 centaine.' });
  });

  it('pose les petits calculs et problèmes des fiches', () => {
    expect(complementTo100(41).answer).toBe(59);
    expect(doubleOrHalf(6, false).answer).toBe(12);
    expect(doubleOrHalf(16, true).answer).toBe(8);
    expect(imagesProblem(32, 2, true).answer).toBe(52);
    expect(imagesProblem(2, 6, false).answer).toBe(58);
  });

  it('lit une droite graduée', () => {
    // Fiche n° 17 : graduée de 5 en 5, 50 et 60 écrits, A sur 75.
    const question = numberLine(50, 1, 5, 2, 6);
    expect(question.answer).toBe(75);
    expect(question.figure).toMatchObject({ from: 45, step: 5, labels: [1, 3], markers: [{ at: 6, name: 'A' }] });
    expect(question.explain).toBe('De 50 à 60, il y a 2 graduations : chacune vaut 5. A est 3 graduations après 60 : 60 + 15 = 75.');
    // Fiche n° 34 : graduée de 10 en 10, 200 et 300 écrits.
    expect(numberLine(200, 1, 10, 10, 6).answer).toBe(250);
  });

  it('écrit les grands nombres par classes (ceinture verte)', () => {
    // Fiche n° 67 : groupés par trois en partant de la droite, sans 0 au début.
    const written = wellWritten(30300, seeded(1));
    expect(answerText(written)).toBe('30\u00a0300');
    // Deux écritures fausses parmi 303 00, 3 03 00 et 030 300.
    const labels = written.choices!.map((c) => c.label);
    expect(labels).toHaveLength(3);
    expect(labels.filter((label) => ['303\u00a000', '3\u00a003\u00a000', '030\u00a0300'].includes(label))).toHaveLength(2);
    // Fiches n° 68 et 69.
    expect(wordsToDigits(808000)).toMatchObject({ prompt: 'huit-cent-huit-mille', answer: 808000 });
    expect(wordsToDigits(100108).explain).toBe('On lit par classes : 100 mille et 108. Chaque classe s’écrit avec 3 chiffres, des 0 s’il le faut : 100\u00a0108.');
    expect(digitsToWords(4100)).toMatchObject({ prompt: '4\u00a0100', answer: 'quatre-mille-cent' });
    expect(digitsToWords(4100).explain).toContain('Mille ne prend jamais de s');
    // Les cents devant millions : avec un s (la règle), sans (les fiches n° 83 et 86).
    expect(digitsToWords(900000090).answer).toBe('neuf-cents-millions-quatre-vingt-dix');
    expect(isCorrect(digitsToWords(900000090), 'neuf-cent-millions-quatre-vingt-dix')).toBe(true);
    expect(isCorrect(digitsToWords(900000090), 'neuf cents millions quatre-vingt-dix')).toBe(true);
  });

  it('distingue le chiffre et le nombre de milliers, de millions', () => {
    // Fiches n° 72 à 74.
    expect(numberOf(45863, 3).answer).toBe(45);
    expect(numberOf(986421, 2).answer).toBe(9864);
    expect(numberOf(9476, 4)).toMatchObject({ answer: 0 });
    expect(numberOf(45863, 3).explain).toBe('On lit 45\u00a0863 jusqu’au chiffre des milliers : 45. Le chiffre des milliers, lui, est 5.');
    // Fiches n° 79 à 81.
    expect(numberOf(15824000, 4).answer).toBe(1582);
    expect(numberOf(1650762, 6).solved).toBe('Dans 1\u00a0650\u00a0762, il y a 1 million.');
    expect(numberOf(846250, 4).answer).toBe(84);
    const digit = digitOf(15824000, 4);
    expect(answerText(digit)).toBe('2');
    expect(digit.explain).toBe('La classe des mille est 824 : son chiffre des dizaines est 2.');
  });

  it('complète et décompose les grands nombres', () => {
    // Fiches n° 75 et 84.
    expect(complementTo(2300, 3000)).toMatchObject({ answer: 700, explain: '23 centaines + 7 centaines = 30 centaines.' });
    expect(complementTo(1605250, 1606000).answer).toBe(750);
    expect(complementTo(1605250, 1606000).explain).toBe(
      '1\u00a0605\u00a0250 + 50 = 1\u00a0605\u00a0300, puis + 700 = 1\u00a0606\u00a0000 : 50 + 700 = 750.',
    );
    expect(complementTo(14500000, 15000000).answer).toBe(500000);
    // Fiche n° 76.
    const parts = decompose(49200, 1);
    expect(parts).toMatchObject({ prompt: '49\u00a0200 = 40\u00a0000 +', suffix: '+ 200', answer: 9000 });
    expect(parts.solved).toBe('49\u00a0200 = 40\u00a0000 + 9\u00a0000 + 200');
    // Fiches n° 88 et 89.
    expect(timesPowers(4, 7, 6, 2).answer).toBe(40000600);
    expect(timesPowers(4, 8, 6, 4).answer).toBe(400060000);
    expect(decomposeTimes(2, 6, 5, 5, 0)).toMatchObject({ prompt: '2\u00a0500\u00a0000 = 2 ×', answer: 1000000 });
    expect(decomposeTimes(2, 9, 5, 6, 1).answer).toBe(1000000);
  });

  it('fait choisir le nombre du repère parmi quatre (fiche n° 90)', () => {
    const question = numberLineChoices(3000000, 0, 100000, 10, 2);
    expect(question.choices?.map((c) => c.label)).toEqual(['3\u00a0002\u00a0000', '3\u00a0020\u00a0000', '3\u00a0200\u00a0000', '32\u00a0000\u00a0000']);
    expect(question.answer).toBe('3200000');
    expect(question.explain).toContain('chacune vaut 100\u00a0000');
  });

  it('écrit les fractions en lettres et en chiffres (ceinture orange)', () => {
    // Fiches n° 37 à 39 et 42.
    expect(fractionToLetters(3, 4)).toMatchObject({ prompt: '3/4', input: 'letters', answer: 'trois quarts' });
    expect(fractionToLetters(5, 3).answer).toBe('cinq tiers');
    expect(fractionToLetters(8, 5).answer).toBe('huit cinquièmes');
    expect(fractionToLetters(1, 2).answer).toBe('un demi');
    const big = fractionToLetters(21, 4);
    expect(big.answer).toBe('vingt-et-un quarts');
    expect(isCorrect(big, 'vingt et un quarts')).toBe(true);
    const words = lettersToFraction(9, 3, seeded(2));
    expect(words).toMatchObject({ prompt: 'neuf tiers', answer: '9/3' });
    expect(words.choices).toHaveLength(4);
    expect(words.choices?.map((c) => c.value)).toContain('3/9');
  });

  it('lit et place les fractions sur une droite graduée', () => {
    // Fiche n° 43 : en quarts, B sur la 3e graduation.
    const read = readFractionLine(2, 4, 3);
    expect(read).toMatchObject({ prompt: 'A =', suffix: '/4', answer: 3 });
    expect(read.figure).toMatchObject({ from: 0, count: 9, labels: [0, 4, 8], markers: [{ at: 3, name: 'A' }] });
    // Fiche n° 46 : en quarts, 3/2 est sur la 6e graduation, le repère C.
    const marker = whichMarker(2, 4, [2, 3, 6], 2);
    expect(marker).toMatchObject({ prompt: '3/2', answer: 'C' });
    expect(marker.explain).toContain('3/2 = 6/4');
    // Fiche n° 94 : sur une droite en sixièmes, 2/3 = 4/6.
    const place = placeFraction(2, 6, 2, 3);
    expect(place).toMatchObject({ choiceLayout: 'line', answer: '4' });
    expect(place.choices?.map((c) => c.value)).not.toContain('6');
  });

  it('colorie et lit une fraction d’un dessin', () => {
    // Fiche n° 47 : 2/3 de 12 billes.
    const marbles = paintFraction(12, 2, 3, 'marbles');
    expect(marbles).toMatchObject({ input: 'paint', answer: 8, figure: { shape: 'marbles', count: 12, colored: 0 } });
    expect(isCorrect(marbles, '8')).toBe(true);
    expect(paintFraction(24, 5, 6, 'grid').answer).toBe(20);
    expect(paintFraction(24, 1, 24, 'grid').solved).toBe('1/24 de 24 cases, c’est 1 case.');
    // Fiche n° 54 : 13 tiers, sur 5 barres de 3.
    const bars = readColored('bars', 15, 3, 13, seeded(1));
    expect(bars.answer).toBe('13/3');
    expect(bars.choices?.map((c) => c.value)).toContain('13/3');
    expect(readColored('grid', 4, 2, 1, seeded(1)).answer).toBe('1/4');
  });

  it('calcule avec les fractions (ceinture violette)', () => {
    // Fiches n° 101 à 104.
    expect(fractionCalc(3, 4, '+', 1, 2)).toMatchObject({ prompt: '3/4 + 1/2 =', suffix: '/4', answer: 5 });
    expect(fractionCalc(3, 4, '−', 1, 2).answer).toBe(1);
    expect(fractionCalc(2, 3, '×', 1, 3)).toMatchObject({ prompt: '2 × 1/3 =', suffix: '/3', answer: 2 });
    expect(fractionCalc(3, 5, '+', 2, 5).answer).toBe(5);
    expect(wholePlusFraction(9, 4, 'part')).toMatchObject({ prompt: '9/4 = 2 +', suffix: '/4', answer: 1 });
    expect(wholePlusFraction(17, 5, 'whole')).toMatchObject({ prompt: '17/5 =', suffix: '+ 2/5', answer: 3 });
    expect(frameFraction(11, 4, 'low')).toMatchObject({ suffix: '< 11/4 < 3', answer: 2 });
    expect(frameFraction(11, 4, 'high').answer).toBe(3);
    expect(equalFraction(1, 2, 2, true)).toMatchObject({ prompt: '1/2 =', suffix: '/4', answer: 2 });
    expect(equalFraction(3, 4, 2, false)).toMatchObject({ prompt: '6/8 =', suffix: '/4', answer: 3 });
  });

  it('compare les fractions et résout les problèmes', () => {
    expect(compareFractions(3, 7, 5, 7).answer).toBe('<');
    expect(compareFractions(2, 3, 2, 5).answer).toBe('>');
    expect(compareFractions(7, 4, 1, 1)).toMatchObject({ suffix: '1', answer: '>' });
    expect(compareFractions(1, 2, 2, 4).answer).toBe('=');
    // Fiche n° 105 : 12 billes, 1/6 en bleu, 1/4 en vert, 1/3 en orange ; 3 restent blanches.
    const fractions = [
      [1, 6],
      [1, 4],
      [1, 3],
    ] as const;
    expect(marblesProblem(12, fractions, 'blanches').answer).toBe(3);
    expect(marblesProblem(12, fractions, 1).answer).toBe(3);
    expect(marblesProblem(12, fractions, 2).answer).toBe(4);
    // Leçon N16 : un quart puis deux quarts, il reste un quart.
    expect(remainingProblem('Mathilde', 1, 2, 4, false)).toMatchObject({ suffix: '/4', answer: 1 });
  });

  it('lit, écrit et décompose les nombres décimaux (ceinture rose)', () => {
    // Fiche n° 55 : le 3 de 597,4328 ; la virgule ne se touche pas.
    const digit = decimalDigitOf('597,4328', -2);
    expect(digit.choices![Number(digit.answer)]).toEqual({ label: '3', value: '5' });
    expect(digit.choices![3]).toEqual({ label: ',', value: ',' });
    expect(decimalDigitOf('4986,127', 2).choices![Number(decimalDigitOf('4986,127', 2).answer)]!.label).toBe('9');
    // Fiches n° 56, 59 et 62.
    expect(fractionsToDecimal(40, [[4, 100]]).answer).toBe(40.04);
    expect(fractionsToDecimal(0, [[57, 100]]).answer).toBe(0.57);
    expect(fractionsToDecimal(5, [[3, 10], [2, 100]])).toMatchObject({ prompt: '5 + 3/10 + 2/100', answer: 5.32 });
    // Fiches n° 57 et 61, leçon N13.
    expect(wordsToDecimal([[5, 0], [5, -2]])).toMatchObject({ prompt: 'cinq unités et cinq centièmes', answer: 5.05 });
    expect(wordsToDecimal([[1, 0], [3, -1]]).prompt).toBe('une unité et trois dixièmes');
    expect(wordsToDecimal([[34, -1]])).toMatchObject({ prompt: 'trente-quatre dixièmes', answer: 3.4 });
    // Leçon N12.
    expect(decomposeDecimal('45,37', 3)).toMatchObject({ prompt: '45,37 = 40 + 5 + 0,3 +', suffix: '', answer: 0.07 });
  });

  it('compare et range les nombres décimaux', () => {
    expect(compareDecimals('3,25', '3,5').answer).toBe('<');
    expect(compareDecimals('5,4', '5,40').answer).toBe('=');
    expect(compareDecimals('7,8', '7,08').answer).toBe('>');
    expect(compareDecimals('0,81', '0,084').explain).toContain('0,810 et 0,084');
    // Fiche n° 122 : on touche les nombres dans l'ordre.
    const order = orderDecimals(['4,3', '4,4', '4,07', '4,36'], '>');
    expect(order).toMatchObject({ order: '>', answer: '4,4 > 4,36 > 4,3 > 4,07' });
    expect(isCorrect(order, '4,4 > 4,36 > 4,3 > 4,07')).toBe(true);
    expect(isCorrect(order, '4,4 > 4,3 > 4,36 > 4,07')).toBe(false);
    expect(orderDecimals(['1,200', '1,15', '1,8', '1,21'], '<').answer).toBe('1,15 < 1,200 < 1,21 < 1,8');
    // Fiche n° 109.
    expect(isBetween('6,124', '6,12', '6,15').answer).toBe('oui');
    expect(isBetween('6,0124', '6,12', '6,15')).toMatchObject({ answer: 'non', explain: expect.stringContaining('6,0124 < 6,1200') });
    expect(isBetween('6,148', '6,12', '6,15').answer).toBe('oui');
  });

  it('manipule les nombres décimaux (ceinture marron)', () => {
    // Fiches n° 114 et 115.
    expect(decimalTimes(2, 10, 20, 0.01, 'b')).toMatchObject({ prompt: '20,2 = (2 × 10) + (', suffix: '× 0,01)', answer: 20 });
    expect(decimalTimes(3, 1, 7, 0.01, 'powerA')).toMatchObject({ prompt: '3,07 = (3 ×', suffix: ') + (7 × 0,01)', answer: 1 });
    expect(decimalTimes(3, 10, 7, 0.1, 'a').answer).toBe(3);
    // Fiches n° 123 à 126.
    expect(completeDecimal(4.6, 4.75).answer).toBe(0.15);
    expect(completeDecimal(2.05, 3).answer).toBe(0.95);
    expect(halfCalc(2.5, '×').answer).toBe(5);
    expect(halfCalc(5, '÷').answer).toBe(2.5);
    // Leçon N18 : encadrer et intercaler.
    expect(frameDecimal(8.49, 1, 'high')).toMatchObject({ prompt: '8,4 < 8,49 <', answer: 8.5 });
    expect(frameDecimal(9.746, 2, 'low')).toMatchObject({ suffix: '< 9,746 < 9,75', answer: 9.74 });
    expect(frameDecimal(6.3, 0, 'low').answer).toBe(6);
    const between = intercalate(4.6, 4.7, 4.62, [4.062, 4.58, 4.71]);
    expect(between.answer).toBe('4,62');
    expect(between.choices!.map((c) => c.label)).toEqual(['4,062', '4,58', '4,62', '4,71']);
    // Une suite qui passe le dixième (fiche n° 116).
    expect(sequence(10.07, 0.01)).toMatchObject({ prompt: '10,07 ; 10,08 ; 10,09 ; 10,1 ;', answer: 10.11 });
    // La droite graduée en millièmes (fiche n° 112).
    expect(numberLine(4.62, 0, 0.001, 10, 1).answer).toBe(4.621);
  });

  it('calcule les pourcentages comme sur les fiches (ceinture noire)', () => {
    // Fiches n° 127, 133 et 138.
    expect(percentOf(23, 300)).toMatchObject({ answer: 69, explain: expect.stringContaining('2 × 10\u00a0% + 3 × 1\u00a0%') });
    expect(percentOf(1, 40).answer).toBe(0.4);
    expect(percentOf(36, 36)).toMatchObject({ answer: 12.96, explain: expect.stringContaining('25\u00a0% + 10\u00a0% + 1\u00a0%') });
    expect(percentOf(40, 20).explain).toContain('4 × 10\u00a0%');
    // Fiches n° 130 et 136.
    expect(findPercent(35, 4000)).toMatchObject({ suffix: '% de 4\u00a0000 = 1\u00a0400', answer: 35 });
    expect(findPercent(41, 450).suffix).toBe('% de 450 = 184,5');
    // Fiches n° 128 et 137.
    expect(paintPercent(20, 40)).toMatchObject({ input: 'paint', answer: 8 });
    expect(percentMarbles(20, [25, 40, 10], 'blanches').answer).toBe(5);
    // Leçon Pb 14.
    expect(percentMeaning(75)).toMatchObject({ answer: 'les trois quarts' });
    expect(percentMeaning(35).answer).toBe(0.35);
  });

  it('passe des fractions aux décimaux (ceinture bronze)', () => {
    expect(fractionAsDecimal(3, 4).answer).toBe(0.75);
    expect(fractionAsDecimal(5, 2).answer).toBe(2.5);
    expect(decimalAsFraction(3, 4)).toMatchObject({ prompt: '0,75 =', suffix: '/4', answer: 3 });
    // Fiche n° 141 : 0,2 = 1/5, pas 1/2.
    expect(equalToDecimal(1, 5, [[1, 2], [3, 2], [2, 5]]).answer).toBe('1/5');
    expect(compareMixed(1, 4, '0,4', true).answer).toBe('<');
    expect(compareMixed(3, 5, '0,6', false).answer).toBe('=');
    // Fiches n° 139 et 140 : ranger fractions et décimaux.
    expect(orderDecimals(['1,4', '1/4', '0,8', '1/8', '0,5'], '<').answer).toBe('1/8 < 1/4 < 0,5 < 0,8 < 1,4');
    expect(orderDecimals(['0,32', '3/2', '3,2', '1/2', '1,2'], '<').answer).toBe('0,32 < 1/2 < 1,2 < 3/2 < 3,2');
    // Fiches n° 143 et 144 : toucher la graduation.
    expect(placeNumber(3, 4, '1,25').answer).toBe('5');
    expect(placeNumber(3, 4, '7/4').answer).toBe('7');
    expect(placeNumber(1, 10, '3/5').answer).toBe('6');
  });

  it('résout les problèmes de pourcentages (ceinture argent)', () => {
    // Fiche n° 145, et n° 146 corrigée : 25 % de 1 500 = 375 (la fiche dit 325).
    expect(votes(2000, 0, 0, [35, 65], 0).answer).toBe(700);
    expect(votes(1500, 1, 0, [25, 60], 0).answer).toBe(375);
    expect(votes(1500, 1, 0, [25, 60], 'blank').answer).toBe(225);
    // Fiches n° 147 à 149 (n° 149 : 58,90 €, la fiche dit 28,90 €).
    expect(discount(0, 120, 30, 'price').answer).toBe(84);
    expect(discount(1, 35, 10, 'price').answer).toBe(31.5);
    expect(discount(2, 62, 5, 'price').answer).toBe(58.9);
    expect(discount(2, 62, 5, 'reduction').answer).toBe(3.1);
    // Fiche n° 150.
    expect(growth(0, 22, 20).answer).toBe(26.4);
    expect(whichPercent('votes', 2000, 700).answer).toBe(35);
    expect(whichPercent('price', 80, 56).answer).toBe(30);
  });

  it('tire des questions justes, dans les nombres de la ceinture', () => {
    const max = { blanche: 99, jaune: 9999, orange: 99, vert: 999999, bleu: 9999999999, violette: 99, rose: 100, marron: 9999, noire: 10000, bronze: 100, argent: 10000 } as Record<string, number>;
    for (const belt of NUMERATION) {
      for (let seed = 1; seed < 300; seed++) {
        for (const question of pickNumeration(belt, 10, [], seeded(seed))) {
          // La réponse attendue est juste, et elle se tape (ou se touche).
          expect(isCorrect(question, question.choices ? String(question.answer) : answerText(question))).toBe(true);
          if (question.order) {
            // Ranger : tous les nombres, chacun une fois, dans l'ordre.
            const values = (question.answer as string).split(` ${question.order} `);
            expect([...values].sort()).toEqual(question.choices!.map((c) => c.value).sort());
            const numbers = values.map((v) => (v.includes('/') ? Number(v.split('/')[0]) / Number(v.split('/')[1]) : Number(v.replace(',', '.'))));
            for (let i = 1; i < numbers.length; i++) expect(question.order === '>' ? numbers[i - 1]! > numbers[i]! : numbers[i - 1]! < numbers[i]!).toBe(true);
          } else if (question.choices) expect(question.choices.some((c) => c.value === question.answer)).toBe(true);
          if (typeof question.answer === 'number') {
            // Des entiers, ou des décimaux jusqu'aux millièmes (rose et marron), sans 4,0699999.
            expect(String(question.answer)).toMatch(belt.decimal ? /^\d+(\.\d{1,3})?$/ : /^\d+$/);
            // Ça tient au pavé.
            expect(String(question.answer).length).toBeLessThanOrEqual(10);
            expect(question.answer).toBeGreaterThanOrEqual(0);
            expect(question.answer).toBeLessThanOrEqual(max[belt.belt]!);
          }
          if (question.figure && isNumberLine(question.figure)) {
            const { from, step, count, labels, markers } = question.figure;
            expect(from).toBeGreaterThanOrEqual(0);
            expect(from + (count - 1) * step).toBeLessThanOrEqual(max[belt.belt]!);
            for (const { at } of markers) expect(labels).not.toContain(at);
            for (const label of labels) expect(label).toBeLessThan(count);
          }
          expect(question.explain).not.toMatch(/undefined|NaN/);
          expect(question.solved).not.toMatch(/undefined|NaN/);
          if (question.input === 'letters') expect((question.answer as string).length).toBeLessThanOrEqual(60);
        }
      }
    }
  });

  it('tire des questions différentes, de toutes les sortes', () => {
    for (const belt of NUMERATION) {
      const first = pickNumeration(belt, NUMERATION_TEST_SIZE, [], seeded(3));
      expect(new Set(first.map((q) => q.id)).size).toBe(NUMERATION_TEST_SIZE);
      const next = pickNumeration(belt, 10, first.map((q) => q.id), seeded(5));
      expect(next.filter((q) => first.some((f) => f.id === q.id))).toEqual([]);
    }
  });

  it('se réussit avec 9 justes sur 10', () => {
    const questions = pickNumeration(NUMERATION[0]!, NUMERATION_TEST_SIZE, [], seeded(9));
    const session = new CalcTestSession(questions);
    for (const question of questions.slice(0, 9)) session.answer(String(question.answer));
    session.answer('mauvaise réponse');
    expect(session.result()).toMatchObject({ correct: 9, total: 10, passed: true });
  });
});
