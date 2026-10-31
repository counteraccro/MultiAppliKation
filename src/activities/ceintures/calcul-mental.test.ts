import { describe, expect, it } from 'vitest';
import { isCorrect } from '../../core/quiz';
import {
  CALCUL_MENTAL,
  complementTo100,
  dividedByPower,
  MENTAL_TEST_SIZE,
  multiple,
  passesMental,
  pickCalcs,
  plusNineEleven,
  plusPower,
  smallAddition,
  smallSubtraction,
  tensCalc,
  timesPower,
  timesRound,
} from './calcul-mental';
import { CalcTestSession, factText } from './table-practice';

/** Générateur pseudo-aléatoire reproductible. */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Le calcul écrit, recalculé : « 37 + 63 = 100 », « Le triple de 25 = 75 ». */
function evaluate(text: string): boolean {
  const named = /^Le (double|triple|quadruple) de (\d+) = (\d+)$/.exec(text);
  if (named) return Number(named[2]) * { double: 2, triple: 3, quadruple: 4 }[named[1] as 'double'] === Number(named[3]);
  const [, a, sign, b, c] = /^(\d+) ([+−×:]) (\d+) = (\d+)$/.exec(text)!;
  const [x, y] = [Number(a), Number(b)];
  const result = sign === '+' ? x + y : sign === '−' ? x - y : sign === '×' ? x * y : x / y;
  return result === Number(c);
}

describe('ceintures de calcul mental', () => {
  it('suivent le classeur, de la blanche à la violette', () => {
    expect(CALCUL_MENTAL.map((b) => b.belt)).toEqual(['blanche', 'beige', 'jaune', 'orange', 'rouge', 'rose', 'violette']);
    expect(CALCUL_MENTAL.find((b) => b.goal === 'CE2')?.belt).toBe('orange');
  });

  it('tirent des calculs justes, entiers et positifs', () => {
    const random = seeded(7);
    for (const belt of CALCUL_MENTAL) {
      for (let i = 0; i < 200; i++) {
        const question = belt.drawCalc(random, i);
        expect(evaluate(factText(question)), `${belt.belt} : ${factText(question)}`).toBe(true);
        expect(Number.isInteger(question.answer) && question.answer >= 0).toBe(true);
        expect(String(question.answer).length).toBeLessThanOrEqual(6);
        expect(question.explain).toContain(String(question.answer));
      }
    }
  });

  it('explique avec les astuces de la leçon', () => {
    expect(smallAddition(6, 7).explain).toBe('C’est presque un double : 6 + 6 = 12, plus 1 : 13.');
    expect(smallAddition(8, 5).explain).toBe('On passe par 10 : 8 + 2 = 10, puis 10 + 3 = 13.');
    expect(smallSubtraction(13, 5).explain).toBe('On passe par 10 : 13 − 3 = 10, puis 10 − 2 = 8.');
    expect(tensCalc(40, 30, false).explain).toBe('On regarde les chiffres des dizaines : 4 + 3 = 7, donc 40 + 30 = 70.');
    expect(plusPower(395, 10, false).explain).toBe('+ 10, c’est ajouter 1 aux dizaines : 39 + 1 = 40 dizaines, donc 405.');
    expect(plusPower(2045, 100, true).answer).toBe(1945);
    expect(plusPower(345, 10, false).explain).toBe('+ 10, c’est ajouter 1 aux dizaines : le chiffre des dizaines passe de 4 à 5, 355.');
    expect(plusNineEleven(73, 9, true).explain).toBe('− 9, c’est − 10 + 1 : 73 − 10 = 63, puis 63 + 1 = 64.');
    expect(plusNineEleven(58, 11, false).explain).toBe('+ 11, c’est + 10 + 1 : 58 + 10 = 68, puis 68 + 1 = 69.');
    expect(timesPower(45, 100).explain).toBe('× 100 : chaque chiffre devient 100 fois plus grand, on écrit deux 0 à droite : 4500.');
    expect(dividedByPower(4500, 100).answer).toBe(45);
    expect(multiple(34, 2).explain).toBe('Le double de 30 est 60, le double de 4 est 8 : 60 + 8 = 68.');
    expect(multiple(23, 4).explain).toBe('Le quadruple, c’est le double du double : 23 → 46 → 92.');
    expect(timesRound(6, 30).explain).toBe('On multiplie 6 × 3 = 18, et on ajoute un 0 : 180.');
  });

  it('pose le complément à 100 avec la case au milieu', () => {
    const question = complementTo100(37);
    expect(question).toMatchObject({ prompt: '37 +', suffix: '= 100', answer: 63 });
    expect(factText(question)).toBe('37 + 63 = 100');
    expect(question.explain).toBe('On va d’abord à la dizaine : 37 + 3 = 40, puis 40 + 60 = 100. 3 + 60 = 63.');
    expect(complementTo100(70).explain).toBe('On compte en dizaines : 7 dizaines + 3 dizaines = 10 dizaines, donc 70 + 30 = 100.');
  });

  it('tire des calculs différents, pas ceux de la dernière fois', () => {
    for (const belt of CALCUL_MENTAL) {
      const first = pickCalcs(belt, MENTAL_TEST_SIZE, [], seeded(3));
      expect(new Set(first.map((q) => q.id)).size).toBe(MENTAL_TEST_SIZE);
      const next = pickCalcs(belt, 10, first.map((q) => q.id), seeded(5));
      // Peu de dizaines entières (70 + 30 = 100) : elles peuvent revenir.
      expect(next.filter((q) => first.some((f) => f.id === q.id)).length).toBeLessThanOrEqual(2);
    }
  });

  it('se réussit avec une erreur au plus', () => {
    expect(passesMental(19, 20)).toBe(true);
    expect(passesMental(18, 20)).toBe(false);
    const questions = pickCalcs(CALCUL_MENTAL[0]!, 20, [], seeded(9));
    const session = new CalcTestSession(questions, passesMental);
    for (const question of questions.slice(0, 19)) session.answer(String(question.answer));
    // Le temps manque pour le dernier : il compte faux, c'est la seule erreur.
    expect(session.result()).toMatchObject({ correct: 19, total: 20, passed: true });
    expect(isCorrect(questions[0]!, String(questions[0]!.answer))).toBe(true);
  });
});
