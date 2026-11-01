import { describe, expect, it } from 'vitest';
import { answerText, isCorrect } from '../../core/quiz';
import {
  compare,
  complementTo100,
  digitOf,
  digitsToWords,
  doubleOrHalf,
  exists,
  groups,
  imagesProblem,
  NUMERATION,
  NUMERATION_TEST_SIZE,
  numberLine,
  numberOf,
  pickNumeration,
  sequence,
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

  it('tire des questions justes, dans les nombres de la ceinture', () => {
    const max = { blanche: 99, jaune: 9999 } as Record<string, number>;
    for (const belt of NUMERATION) {
      for (let seed = 1; seed < 300; seed++) {
        for (const question of pickNumeration(belt, 10, [], seeded(seed))) {
          // La réponse attendue est juste, et elle se tape (ou se touche).
          expect(isCorrect(question, question.choices ? String(question.answer) : answerText(question))).toBe(true);
          if (question.choices) expect(question.choices.some((c) => c.value === question.answer)).toBe(true);
          if (typeof question.answer === 'number') {
            expect(Number.isInteger(question.answer)).toBe(true);
            expect(question.answer).toBeGreaterThanOrEqual(0);
            expect(question.answer).toBeLessThanOrEqual(max[belt.belt]!);
          }
          if (question.figure) {
            const { from, step, count, labels, marker } = question.figure;
            expect(from).toBeGreaterThanOrEqual(0);
            expect(from + (count - 1) * step).toBeLessThanOrEqual(max[belt.belt]!);
            expect(labels).not.toContain(marker);
          }
          expect(question.explain).not.toMatch(/undefined|NaN/);
          expect(question.solved).not.toMatch(/undefined|NaN/);
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
