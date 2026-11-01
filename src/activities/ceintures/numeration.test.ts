import { describe, expect, it } from 'vitest';
import { answerText, isCorrect } from '../../core/quiz';
import {
  compare,
  complementTo,
  complementTo100,
  decompose,
  decomposeTimes,
  digitOf,
  digitsToWords,
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
    expect(question.figure).toMatchObject({ from: 45, step: 5, labels: [1, 3], marker: 6 });
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

  it('tire des questions justes, dans les nombres de la ceinture', () => {
    const max = { blanche: 99, jaune: 9999, vert: 999999, bleu: 9999999999 } as Record<string, number>;
    for (const belt of NUMERATION) {
      for (let seed = 1; seed < 300; seed++) {
        for (const question of pickNumeration(belt, 10, [], seeded(seed))) {
          // La réponse attendue est juste, et elle se tape (ou se touche).
          expect(isCorrect(question, question.choices ? String(question.answer) : answerText(question))).toBe(true);
          if (question.choices) expect(question.choices.some((c) => c.value === question.answer)).toBe(true);
          if (typeof question.answer === 'number') {
            expect(Number.isInteger(question.answer)).toBe(true);
            // Ça tient au pavé.
            expect(String(question.answer).length).toBeLessThanOrEqual(10);
            expect(question.answer).toBeGreaterThanOrEqual(0);
            expect(question.answer).toBeLessThanOrEqual(max[belt.belt]!);
          }
          if (question.figure) {
            const { from, step, count, labels, marker } = question.figure;
            expect(from).toBeGreaterThanOrEqual(0);
            expect(from + (count - 1) * step).toBeLessThanOrEqual(max[belt.belt]!);
            expect(labels).not.toContain(marker);
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
