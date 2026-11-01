import { describe, expect, it } from 'vitest';
import { answerText, isCorrect } from '../../core/quiz';
import {
  addDecimals,
  addFractions,
  CALCUL_MENTAL,
  complementTo100,
  complementToUnit,
  decimalToFraction,
  dividedByPower,
  fractionToDecimal,
  fractionToNumber,
  MENTAL_TEST_SIZE,
  multiple,
  part,
  passesMental,
  percentOf,
  pickCalcs,
  plusNineEleven,
  plusPower,
  shiftDivided,
  shiftTimes,
  smallAddition,
  smallSubtraction,
  smartSum,
  subtractDecimals,
  tensCalc,
  timesPower,
  timesRound,
  wholeAndFraction,
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

/** « 8,37 » → 8.37, « 7/3 » → 7 / 3. */
const term = (text: string) => {
  const fraction = /^(\d+)\/(\d+)$/.exec(text);
  return fraction ? Number(fraction[1]) / Number(fraction[2]) : Number(text.replace(',', '.'));
};
const same = (x: number, y: number) => Math.abs(x - y) < 1e-9;

/** « 25 + 47 + 75 », « 2 + 1/3 » : de gauche à droite (jamais deux opérations différentes à la fois). */
function value(text: string): number {
  const tokens = text.split(' ');
  let result = term(tokens[0]!);
  for (let i = 1; i < tokens.length; i += 2) {
    const [sign, x] = [tokens[i], term(tokens[i + 1]!)];
    result = sign === '+' ? result + x : sign === '−' ? result - x : sign === '×' ? result * x : result / x;
  }
  return result;
}

/** Le calcul écrit, recalculé : « 37 + 63 = 100 », « Le triple de 25 = 75 », « 7/3 = 2 + 1/3 », « 25 % de 600 = 150 ». */
function evaluate(text: string): boolean {
  const named = /^(?:Le|La|Les) (double|triple|quadruple|moitié|tiers|quart) de (\d+) = (\d+)$/.exec(text);
  const factors = { double: 2, triple: 3, quadruple: 4, moitié: 1 / 2, tiers: 1 / 3, quart: 1 / 4 };
  if (named) return same(Number(named[2]) * factors[named[1] as 'double'], Number(named[3]));
  const percent = /^(\d+)\u00a0% de (\d+) = (\d+)$/.exec(text);
  if (percent) return same((Number(percent[1]) * Number(percent[2])) / 100, Number(percent[3]));
  const [left, right, ...rest] = text.split(' = ');
  return rest.length === 0 && same(value(left!), value(right!));
}

describe('ceintures de calcul mental', () => {
  it('suivent le classeur, de la blanche à la brillante', () => {
    expect(CALCUL_MENTAL.map((b) => b.belt)).toEqual([
      'blanche', 'beige', 'jaune', 'orange', 'rouge', 'rose', 'violette',
      'bleu-clair', 'bleu-fonce', 'vert-clair', 'vert-fonce', 'marron', 'gris', 'noire', 'brillante',
    ]);
    expect(CALCUL_MENTAL.find((b) => b.goal === 'CM2')?.belt).toBe('noire');
    expect(CALCUL_MENTAL.find((b) => b.goal === 'CE2')?.belt).toBe('orange');
    expect(CALCUL_MENTAL.find((b) => b.goal === 'CM1')?.belt).toBe('vert-clair');
    // La virgule au pavé, seulement pour les décimaux.
    expect(CALCUL_MENTAL.filter((b) => b.decimal).map((b) => b.belt)).toEqual(['bleu-clair', 'bleu-fonce', 'vert-clair', 'vert-fonce', 'marron', 'noire']);
  });

  it('tirent des calculs justes et positifs, entiers sans la virgule, jusqu’aux millièmes avec', () => {
    const random = seeded(7);
    for (const belt of CALCUL_MENTAL) {
      for (let i = 0; i < 300; i++) {
        const question = belt.drawCalc(random, i);
        const text = answerText(question);
        expect(evaluate(factText(question)), `${belt.belt} : ${factText(question)}`).toBe(true);
        expect(question.answer as number).toBeGreaterThan(belt.decimal ? 0 : -1);
        if (!belt.decimal) expect(Number.isInteger(question.answer)).toBe(true);
        expect(text, `${belt.belt} : ${factText(question)}`).toMatch(/^\d+(,\d{1,3})?$/);
        // Ce qui tient dans la case du pavé (la virgule compte).
        expect(text.length).toBeLessThanOrEqual(7);
        expect(question.explain).toContain(text);
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

  it('passe d’un décimal à sa fraction décimale et inversement', () => {
    const question = decimalToFraction(837, 2);
    expect(question).toMatchObject({ prompt: '8,37 =', suffix: '/100', answer: 837 });
    expect(factText(question)).toBe('8,37 = 837/100');
    expect(question.explain).toBe('8,37 a 2 chiffres après la virgule, il s’arrête aux centièmes. On l’écrit sans la virgule, 837, et on met 100 au dénominateur : 837/100.');
    expect(fractionToDecimal(12, 1)).toMatchObject({ prompt: '12/10', answer: 1.2 });
    expect(fractionToDecimal(12, 1).explain).toBe('10 a un 0 : il y aura 1 chiffre après la virgule. On place la virgule dans 12 : 1,2.');
    expect(fractionToDecimal(3, 3).explain).toBe('1000 a trois 0 : il y aura 3 chiffres après la virgule. On complète par des 0 devant 3 : 0,003.');
    expect(factText(fractionToDecimal(3, 3))).toBe('3/1000 = 0,003');
  });

  it('ajoute et soustrait les décimaux rang par rang (leçon Calc 13)', () => {
    expect(addDecimals(7.2, 2.5).explain).toBe('Les unités : 7 + 2 = 9. Les dixièmes : 2 + 5 = 7. Donc 9,7.');
    expect(addDecimals(3.7, 0.6).explain).toBe('Les unités : 3 + 0 = 3. Les dixièmes : 7 + 6 = 13, c’est 1 unité et 3 dixièmes. 3 + 1 = 4 unités. Donc 4,3.');
    expect(addDecimals(1.25, 0.5).explain).toBe('On complète par des 0 : 0,5 = 0,50. Les unités : 1 + 0 = 1. Les centièmes : 25 + 50 = 75. Donc 1,75.');
    // 0,1 + 0,2 ne tombe pas juste avec les nombres de l'ordinateur : on compte en dixièmes.
    expect(addDecimals(0.1, 0.2).answer).toBe(0.3);
    expect(subtractDecimals(6.4, 3.1).explain).toBe('Les unités : 6 − 3 = 3. Les dixièmes : 4 − 1 = 3. Donc 3,3.');
    expect(subtractDecimals(4.2, 0.5).explain).toBe('Les dixièmes : 2 − 5, pas possible : on prend 1 unité, 12 − 5 = 7. Les unités : 4 − 1 − 0 = 3. Donc 3,7.');
    expect(subtractDecimals(3, 0.4).explain).toBe('3 = 3,0. Les dixièmes : 0 − 4, pas possible : on prend 1 unité, 10 − 4 = 6. Les unités : 3 − 1 − 0 = 2. Donc 2,6.');
    expect(subtractDecimals(2.5, 1.25).answer).toBe(1.25);
  });

  it('complète un décimal jusqu’à l’entier supérieur', () => {
    const question = complementToUnit(7.25);
    expect(question).toMatchObject({ prompt: '7,25 +', suffix: '= 8', answer: 0.75 });
    expect(question.explain).toBe('On va d’abord au dixième : 7,25 + 0,05 = 7,3, puis 7,3 + 0,7 = 8. 0,05 + 0,7 = 0,75.');
    expect(complementToUnit(3.6).explain).toBe('3,6, c’est 6 dixièmes après 3 : il en manque 4 pour faire 1 unité. 3,6 + 0,4 = 4.');
    expect(complementToUnit(7.95).explain).toBe('On va jusqu’au dixième : 7,95 + 0,05 = 8. C’est déjà l’entier : 0,05.');
  });

  it('décale la virgule pour multiplier et diviser par 10, 100, 1000 (leçon Calc 12)', () => {
    expect(shiftTimes(5.447, 100).explain).toBe('× 100 : on décale la virgule de 2 rangs vers la droite : 544,7.');
    expect(shiftTimes(4.2, 100).explain).toBe('× 100 : on décale la virgule de 2 rangs vers la droite, on ne peut plus la décaler, on ajoute un 0 : 420.');
    expect(shiftTimes(0.273, 1000).answer).toBe(273);
    expect(shiftDivided(651, 100).explain).toBe(': 100 : on décale la virgule de 2 rangs vers la gauche : 6,51.');
    expect(shiftDivided(7, 100).explain).toBe(': 100 : on décale la virgule de 2 rangs vers la gauche, on ajoute des 0 devant : 0,07.');
    expect(shiftDivided(3.8, 10).answer).toBe(0.38);
  });

  it('prend la moitié, le tiers et le quart d’un entier (leçon Calc 4)', () => {
    expect(part(48, 2)).toMatchObject({ prompt: 'La moitié de 48', answer: 24 });
    expect(part(48, 2).explain).toBe('La moitié de 40 est 20, la moitié de 8 est 4 : 20 + 4 = 24.');
    expect(part(60, 2).explain).toBe('La moitié, c’est deux fois moins : 60 : 2 = 30.');
    expect(part(36, 3).explain).toBe('Le tiers, c’est trois fois moins : combien de fois 3 dans 36 ? 12 fois, car 3 × 12 = 36.');
    expect(part(80, 4).explain).toBe('Le quart, c’est quatre fois moins : la moitié de la moitié. 80 → 40 → 20.');
  });

  it('passe d’une fraction à un nombre décimal par une fraction décimale', () => {
    expect(fractionToNumber(3, 4)).toMatchObject({ prompt: '3/4', answer: 0.75 });
    expect(fractionToNumber(3, 4).explain).toBe('On multiplie le numérateur et le dénominateur par 25 : 3/4 = 75/100, donc 0,75.');
    expect(fractionToNumber(7, 2).explain).toBe('On multiplie le numérateur et le dénominateur par 5 : 7/2 = 35/10, donc 3,5.');
    expect(fractionToNumber(2, 5).answer).toBe(0.4);
  });

  it('calcule les quatre sortes de la brillante', () => {
    const sum = smartSum([25, 47, 75], [0, 2]);
    expect(factText(sum)).toBe('25 + 47 + 75 = 147');
    expect(sum.explain).toBe('On regroupe ce qui tombe rond : 25 + 75 = 100. Puis 100 + 47 = 147.');
    const whole = wholeAndFraction(7, 3);
    expect(whole).toMatchObject({ prompt: '7/3 = 2 +', suffix: '/3', answer: 1 });
    expect(factText(whole)).toBe('7/3 = 2 + 1/3');
    expect(whole.explain).toBe('Dans 7, combien de fois 3 ? 2 fois (2 × 3 = 6), reste 1 : 7/3 = 2 + 1/3.');
    expect(factText(addFractions(2, 1, 5))).toBe('2/5 + 1/5 = 3/5');
    expect(addFractions(2, 1, 5).explain).toBe('Même dénominateur : on additionne les numérateurs, 2 + 1 = 3, et on garde 5 : 3/5.');
    expect(percentOf(25, 600)).toMatchObject({ prompt: '25\u00a0% de 600', answer: 150 });
    expect(percentOf(25, 600).explain).toBe('25 %, c’est le quart : 600 : 4 = 150.');
    expect(percentOf(50, 30).explain).toBe('50 %, c’est la moitié : 30 : 2 = 15.');
    expect(percentOf(75, 40).explain).toBe('75 %, c’est les trois quarts : le quart de 40 est 10, et 10 × 3 = 30.');
  });

  it('accepte la réponse tapée avec la virgule, et les 0 inutiles', () => {
    const question = addDecimals(1.25, 0.5);
    expect(isCorrect(question, '1,75')).toBe(true);
    expect(isCorrect(question, '1,750')).toBe(true);
    expect(isCorrect(question, '175')).toBe(false);
    expect(isCorrect(fractionToDecimal(3, 3), '0,003')).toBe(true);
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
      const first = pickCalcs(belt.drawCalc, MENTAL_TEST_SIZE, [], seeded(3));
      expect(new Set(first.map((q) => q.id)).size).toBe(MENTAL_TEST_SIZE);
      const next = pickCalcs(belt.drawCalc, 10, first.map((q) => q.id), seeded(5));
      // Peu de dizaines entières (70 + 30 = 100) : elles peuvent revenir.
      expect(next.filter((q) => first.some((f) => f.id === q.id)).length).toBeLessThanOrEqual(2);
    }
  });

  it('se réussit avec une erreur au plus', () => {
    expect(passesMental(19, 20)).toBe(true);
    expect(passesMental(18, 20)).toBe(false);
    const questions = pickCalcs(CALCUL_MENTAL[0]!.drawCalc, 20, [], seeded(9));
    const session = new CalcTestSession(questions, passesMental);
    for (const question of questions.slice(0, 19)) session.answer(String(question.answer));
    // Le temps manque pour le dernier : il compte faux, c'est la seule erreur.
    expect(session.result()).toMatchObject({ correct: 19, total: 20, passed: true });
    expect(isCorrect(questions[0]!, String(questions[0]!.answer))).toBe(true);
  });
});
