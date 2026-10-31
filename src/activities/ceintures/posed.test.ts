import { describe, expect, it } from 'vitest';
import {
  borrowsOnZero,
  CALCUL_POSE,
  drawAdditionTerms,
  drawBigAdditionTerms,
  drawBigMultiplication,
  drawDecimalAddition,
  drawDecimalMultiplication,
  drawDecimalSubtraction,
  drawDivision,
  drawLongMultiplication,
  drawMultiplication,
  drawSubtraction,
  drawSubtractionWithZeros,
  pickOperations,
} from './calcul-pose';
import { formatDecimal, PosedAddition, PosedDivision, PosedLongMultiplication, PosedMultiplication, PosedSubtraction, solve } from './posed';
import { PosedSession } from './posed-session';

/** Graine fixe pour des tirages reproductibles. */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2 ** 31;
    return s / 2 ** 31;
  };
}

describe('PosedAddition', () => {
  it('pose 437 + 76 + 209 comme la fiche : retenues 2 puis 1', () => {
    const op = solve(new PosedAddition([437, 76, 209]));
    expect(op.steps().map((s) => [s.kind, s.column, s.expected])).toEqual([
      ['digit', 0, 2],
      ['carry', 1, 2],
      ['digit', 1, 2],
      ['carry', 2, 1],
      ['digit', 2, 7],
    ]);
    expect(op.written()).toBe(722);
    expect(op.steps()[0]!.explain).toBe('7 + 6 + 9 = 22 : on écrit 2 et on retient 2.');
    expect(op.steps()[2]!.explain).toBe('2 + 3 + 7 + 0 = 12 : on écrit 2 et on retient 1.');
  });

  it('écrit la dernière colonne en entier : 884 + 248 + 123 = 1 255', () => {
    const op = solve(new PosedAddition([884, 248, 123]));
    expect(op.written()).toBe(1255);
    expect(op.steps().at(-1)).toMatchObject({ kind: 'digit', column: 3, expected: 1 });
  });

  it('ne demande pas de retenue quand il n’y en a pas', () => {
    const op = solve(new PosedAddition([129, 29]));
    expect(op.steps().filter((s) => s.kind === 'carry')).toHaveLength(1);
    expect(op.written()).toBe(158);
  });

  it('additionne avec la retenue écrite, même fausse', () => {
    const op = new PosedAddition([437, 76, 209]);
    op.place(2);
    op.place(1); // retenue fausse : 2
    expect(op.current()).toMatchObject({ kind: 'digit', column: 1, expected: 1 });
  });

  it('retrouve toutes les sommes tirées', () => {
    const random = seeded(7);
    for (let i = 0; i < 300; i++) {
      const terms = drawAdditionTerms(2 + (i % 2), random);
      expect(terms.some((t) => t >= 100)).toBe(true);
      const op = solve(new PosedAddition(terms));
      expect(op.written()).toBe(op.result);
      expect(op.steps().some((s) => s.kind === 'carry' || s.column >= (op as PosedAddition).columns)).toBe(true);
    }
  });
});

describe('PosedSubtraction (par compensation)', () => {
  it('pose 492 − 166 : 10 en haut des unités, 1 en bas des dizaines', () => {
    const op = solve(new PosedSubtraction(492, 166));
    expect(op.steps().map((s) => [s.kind, s.column, s.expected])).toEqual([
      ['digit', 0, 6],
      ['carry', 1, 1],
      ['digit', 1, 2],
      ['digit', 2, 3],
    ]);
    expect(op.written()).toBe(326);
    expect(op.steps()[0]!.explain).toBe(
      '2 est plus petit que 6 : je ne peux pas calculer 2 − 6. J’ajoute 1 dizaine en haut : 2 devient 12. ' +
        'Pour compenser, j’ajoute aussitôt 1 dizaine en bas, dans le rond. Je calcule 12 − 6 = 6.',
    );
    expect(op.steps()[2]!.explain).toBe('En bas, j’ai 6 + 1 = 7. 9 est plus grand que 7 : je calcule 9 − 7 = 2.');
  });

  it('enchaîne les retenues : 405 − 206 = 199', () => {
    const op = solve(new PosedSubtraction(405, 206));
    expect(op.steps().filter((s) => s.kind === 'carry')).toHaveLength(2);
    expect(op.written()).toBe(199);
  });

  it('pose un nombre de 2 chiffres sous un de 3 : 563 − 78 = 485', () => {
    expect(solve(new PosedSubtraction(563, 78)).written()).toBe(485);
  });

  it('retrouve toutes les différences tirées, avec au moins une retenue', () => {
    const random = seeded(11);
    for (let i = 0; i < 300; i++) {
      const [top, bottom] = drawSubtraction(2 + (i % 2), random);
      expect(String(bottom)).toHaveLength(2 + (i % 2));
      const op = solve(new PosedSubtraction(top, bottom));
      expect(op.written()).toBe(top - bottom);
      expect(op.result).toBeGreaterThanOrEqual(100);
      expect(op.steps().some((s) => s.kind === 'carry')).toBe(true);
    }
  });
});

describe('PosedMultiplication (à 1 chiffre)', () => {
  it('pose 723 × 8 comme la fiche : retenues 2 puis 1, la dernière colonne en entier', () => {
    const op = solve(new PosedMultiplication(723, 8));
    expect(op.steps().map((s) => [s.kind, s.column, s.expected])).toEqual([
      ['digit', 0, 4],
      ['carry', 1, 2],
      ['digit', 1, 8],
      ['carry', 2, 1],
      ['digit', 2, 7],
      ['digit', 3, 5],
    ]);
    expect(op.written()).toBe(5784);
    expect(op.steps()[0]!.explain).toBe('8 × 3 = 24 : on écrit 4 et on retient 2.');
    expect(op.steps()[2]!.explain).toBe('8 × 2 = 16, + 2 = 18 : on écrit 8 et on retient 1.');
    expect(op.steps()[4]!.explain).toBe('8 × 7 = 56, + 1 = 57 : c’est la dernière colonne, on écrit 57.');
  });

  it('garde le 0 du milieu : 409 × 6 = 2 454', () => {
    expect(solve(new PosedMultiplication(409, 6)).written()).toBe(2454);
  });

  it('retrouve tous les produits tirés', () => {
    const random = seeded(5);
    for (let i = 0; i < 300; i++) {
      const [top, factor] = drawMultiplication(random);
      expect(factor).toBeGreaterThanOrEqual(2);
      expect(solve(new PosedMultiplication(top, factor)).written()).toBe(top * factor);
    }
  });
});

describe('PosedLongMultiplication (à 2 chiffres)', () => {
  it('pose 549 × 43 comme la fiche : 1 647, puis 21 960, puis 23 607', () => {
    const op = solve(new PosedLongMultiplication(549, 43)) as PosedLongMultiplication;
    expect(op.lineValue(0)).toBe(1647);
    expect(op.lineValue(1)).toBe(21960);
    expect(op.written()).toBe(23607);
    const zero = op.steps().find((s) => s.line === 1)!;
    expect(zero).toMatchObject({ column: 0, expected: 0, explain: 'On multiplie par 4 dizaines : on écrit d’abord 0 aux unités.' });
    expect(op.steps()[0]!.ask).toBe('× 3 : les unités');
    // L'addition : 4 + 6 = 10 et 1 + 6 + 9 = 16, deux retenues dans les ronds.
    expect(op.steps().filter((s) => s.line === 2).map((s) => [s.kind, s.column, s.expected])).toEqual([
      ['digit', 0, 7],
      ['digit', 1, 0],
      ['carry', 2, 1],
      ['digit', 2, 6],
      ['carry', 3, 1],
      ['digit', 3, 3],
      ['digit', 4, 2],
    ]);
  });

  it('additionne les lignes telles qu’elles sont écrites', () => {
    const op = new PosedLongMultiplication(234, 75);
    // 234 × 5 = 1 170 écrit 1 160 (dizaines fausses) : l'addition se fait avec 1 160.
    for (let step = op.current(); step && step.line === 0; step = op.current()) {
      op.place(step.kind === 'digit' && step.column === 1 ? 6 : step.expected);
    }
    for (let step = op.current(); step && step.line === 1; step = op.current()) op.place(step.expected);
    expect(op.lineValue(0)).toBe(1160);
    solve(op);
    expect(op.written()).toBe(1160 + 16380);
  });

  it('additionne avec la retenue écrite, même fausse', () => {
    const op = new PosedLongMultiplication(549, 43);
    for (let step = op.current(); step && !(step.kind === 'carry' && step.line === 2); step = op.current()) op.place(step.expected);
    op.place(2); // 4 + 6 = 10 : retenue 1, écrite 2 ; les centaines font 2 + 6 + 9 = 17
    solve(op);
    expect(op.written()).toBe(23607 + 100);
  });

  it('retrouve tous les produits tirés', () => {
    const random = seeded(9);
    for (let i = 0; i < 300; i++) {
      const [top, factor] = drawLongMultiplication(random);
      expect(factor % 10).toBeGreaterThanOrEqual(2);
      expect(solve(new PosedLongMultiplication(top, factor)).written()).toBe(top * factor);
    }
  });
});

describe('Vert foncé : les trois opérations, plus grandes', () => {
  it('pose 427 × 356 en trois lignes, la 3ᵉ commence par deux 0', () => {
    const op = solve(new PosedLongMultiplication(427, 356)) as PosedLongMultiplication;
    expect(op.sumLine).toBe(3);
    expect([0, 1, 2].map((line) => op.lineValue(line))).toEqual([2562, 21350, 128100]);
    expect(op.written()).toBe(152012);
    const third = op.steps().filter((s) => s.line === 2);
    expect(third.slice(0, 2).map((s) => [s.column, s.expected, s.ask])).toEqual([
      [0, 0, '× 300 : les unités'],
      [1, 0, '× 300 : les dizaines'],
    ]);
    expect(third[0]!.explain).toBe('On multiplie par 3 centaines : on écrit d’abord 0 aux unités et aux dizaines.');
  });

  it('soustrait avec des 0 : 4005 − 1287 = 2718', () => {
    const op = solve(new PosedSubtraction(4005, 1287));
    expect(op.written()).toBe(2718);
    expect(op.steps().filter((s) => s.kind === 'carry')).toHaveLength(3);
    expect(op.steps()[2]!.explain).toBe(
      'En bas, j’ai 8 + 1 = 9. 0 est plus petit que 9 : je ne peux pas calculer 0 − 9. J’ajoute 1 centaine en haut : 0 devient 10. ' +
        'Pour compenser, j’ajoute aussitôt 1 centaine en bas, dans le rond. Je calcule 10 − 9 = 1.',
    );
    expect(borrowsOnZero(4005, 1287)).toBe(true);
    expect(borrowsOnZero(4095, 1083)).toBe(false); // 0 − 0 : pas de retenue sur le 0
  });

  it('additionne trois nombres avec une retenue de 2 : 2487 + 365 + 79 = 2931', () => {
    const op = solve(new PosedAddition([2487, 365, 79]));
    expect(op.written()).toBe(2931);
    expect(op.steps()[1]).toMatchObject({ kind: 'carry', expected: 2 });
  });

  it('retrouve toutes les opérations tirées', () => {
    const random = seeded(17);
    for (let i = 0; i < 300; i++) {
      const terms = drawBigAdditionTerms(random);
      expect(terms.map((t) => String(t).length).sort()).toEqual(expect.arrayContaining([3, 4]));
      expect(solve(new PosedAddition(terms)).written()).toBe(terms[0]! + terms[1]! + terms[2]!);
      const [top, bottom] = drawSubtractionWithZeros(random);
      expect(borrowsOnZero(top, bottom)).toBe(true);
      expect(top - bottom).toBeGreaterThanOrEqual(1000);
      expect(solve(new PosedSubtraction(top, bottom)).written()).toBe(top - bottom);
      const [a, b] = drawBigMultiplication(random);
      expect(String(a).length + String(b).length).toBe(6);
      expect(String(b)).not.toMatch(/[01]/);
      expect(solve(new PosedLongMultiplication(a, b)).written()).toBe(a * b);
    }
  });

  it('une série mélange les trois opérations', () => {
    const vertFonce = CALCUL_POSE.find((belt) => belt.belt === 'vert-fonce')!;
    const ops = pickOperations(vertFonce, 3, [], seeded(4));
    expect(new Set(ops.map((o) => o.constructor.name)).size).toBe(3);
  });
});

describe('Bleu clair : les nombres décimaux', () => {
  it('écrit les nombres avec leur virgule', () => {
    expect(formatDecimal(6097, 2)).toBe('60,97');
    expect(formatDecimal(430, 2, 1)).toBe('4,3');
    expect(formatDecimal(2200, 2, 0)).toBe('22');
    expect(formatDecimal(5015, 2)).toBe('50,15');
  });

  it('pose 60,97 + 4,3 + 22 comme la fiche : on complète par des 0, puis on additionne', () => {
    const op = solve(new PosedAddition([6097, 430, 2200], [2, 1, 0]));
    expect(op.text).toBe('60,97 + 4,3 + 22');
    expect(op.steps().filter((s) => s.kind === 'pad').map((s) => [s.term, s.column, s.ask])).toEqual([
      [1, 0, 'Complète 4,3 avec un 0 : les centièmes'],
      [2, 1, 'Complète 22 avec un 0 : les dixièmes'],
      [2, 0, 'Complète 22 avec un 0 : les centièmes'],
    ]);
    expect(op.steps()[1]!.explain).toBe('22 n’a pas de chiffres après la virgule : on écrit la virgule et des 0 (22 = 22,00).');
    expect(op.steps()[3]).toMatchObject({ kind: 'digit', column: 0, ask: 'Les centièmes', explain: '7 + 0 + 0 = 7 : on écrit 7.' });
    expect(op.writtenText()).toBe('87,27');
    expect(op.resultText).toBe('87,27');
  });

  it('pose 137 − 53,11 : 137,00, et la retenue en bas des dixièmes', () => {
    const op = solve(new PosedSubtraction(13700, 5311, [0, 2]));
    expect(op.text).toBe('137 − 53,11');
    expect(op.steps().slice(0, 2).map((s) => s.kind)).toEqual(['pad', 'pad']);
    expect(op.steps()[2]!.explain).toBe(
      '0 est plus petit que 1 : je ne peux pas calculer 0 − 1. J’ajoute 1 dixième en haut : 0 devient 10. ' +
        'Pour compenser, j’ajoute aussitôt 1 dixième en bas, dans le rond. Je calcule 10 − 1 = 9.',
    );
    expect(op.steps()[3]!.ask).toBe('La retenue, en bas des dixièmes');
    expect(op.writtenText()).toBe('83,89');
  });

  it('n’écrit pas de 0 à gauche : 147,8 − 63,54 = 84,26, 90 − 85,61 = 4,39', () => {
    const op = solve(new PosedSubtraction(14780, 6354, [1, 2]));
    expect(op.writtenText()).toBe('84,26');
    // La retenue des centaines s'écrit (1 − 1 = 0), mais pas le 0.
    expect(op.steps().at(-1)).toMatchObject({ kind: 'carry', column: 4 });
    expect(op.steps().filter((s) => s.kind === 'digit').map((s) => s.column)).toEqual([0, 1, 2, 3]);
    expect(solve(new PosedSubtraction(9000, 8561, [0, 2])).writtenText()).toBe('4,39');
  });

  it('retrouve toutes les opérations tirées', () => {
    const random = seeded(19);
    for (let i = 0; i < 300; i++) {
      const { terms, places } = drawDecimalAddition(random);
      expect([...places].sort()).toEqual([0, 1, 2]);
      expect(solve(new PosedAddition(terms, places)).written()).toBe(terms[0]! + terms[1]! + terms[2]!);
      const { top, bottom, places: p } = drawDecimalSubtraction(i % 2, random);
      expect(p).toEqual([i % 2, 2]);
      expect(bottom % 10).not.toBe(0);
      const op = solve(new PosedSubtraction(top, bottom, p));
      expect(op.written()).toBe(top - bottom);
      expect(op.result).toBeGreaterThanOrEqual(100);
    }
  });

  it('une série mélange une addition et les deux sortes de soustractions', () => {
    const bleuClair = CALCUL_POSE.find((belt) => belt.belt === 'bleu-clair')!;
    const ops = pickOperations(bleuClair, 3, [], seeded(4));
    expect(ops.filter((o) => o instanceof PosedSubtraction).map((o) => (o as PosedSubtraction).places[0]).sort()).toEqual([0, 1]);
  });
});

describe('Violette : multiplier les nombres décimaux', () => {
  it('pose 2,54 × 1,3 comme la leçon : 762, 2540, 3302, puis 3 chiffres après la virgule', () => {
    const op = solve(new PosedLongMultiplication(254, 13, [2, 1])) as PosedLongMultiplication;
    expect(op.text).toBe('2,54 × 1,3');
    expect([0, 1].map((line) => op.lineValue(line))).toEqual([762, 2540]);
    expect(op.steps().at(-1)).toMatchObject({
      kind: 'comma',
      expected: 3,
      ask: 'Combien de chiffres après la virgule au résultat ?',
      explain: '2,54 a 2 chiffres après la virgule, 1,3 en a 1 : 2 + 1 = 3. On place la virgule pour avoir 3 chiffres après la virgule : 3,302.',
    });
    expect(op.writtenText()).toBe('3,302');
    expect(op.resultText).toBe('3,302');
  });

  it('un entier n’a pas de chiffre après la virgule : 1,123 × 25 = 28,075', () => {
    const op = solve(new PosedLongMultiplication(1123, 25, [3, 0]));
    expect(op.steps().at(-1)!.explain).toBe(
      '1,123 a 3 chiffres après la virgule, 25 n’en a pas : 3 + 0 = 3. On place la virgule pour avoir 3 chiffres après la virgule : 28,075.',
    );
    expect(op.writtenText()).toBe('28,075');
  });

  it('écrit la virgule où l’enfant la place, même fausse', () => {
    const op = new PosedLongMultiplication(254, 13, [2, 1]);
    for (let step = op.current(); step && step.kind !== 'comma'; step = op.current()) op.place(step.expected);
    op.place(2);
    expect(op.writtenText()).toBe('33,02');
  });

  it('une multiplication d’entiers n’a pas d’étape de virgule', () => {
    expect(solve(new PosedLongMultiplication(549, 43)).steps().some((s) => s.kind === 'comma')).toBe(false);
  });

  it('retrouve toutes les opérations tirées', () => {
    const random = seeded(23);
    for (let i = 0; i < 300; i++) {
      const { top, factor, places } = drawDecimalMultiplication(i % 3, random);
      expect(String(factor)).not.toContain('0');
      expect(top % 10).not.toBe(0);
      const op = solve(new PosedLongMultiplication(top, factor, places));
      expect(op.written()).toBe(top * factor);
      expect(op.writtenText()).toBe(op.resultText);
    }
  });
});

describe('PosedDivision (par un nombre à 1 chiffre)', () => {
  it('pose 738 : 5 comme la leçon : 7, puis 23, puis 38, les produits écrits', () => {
    const op = solve(new PosedDivision(738, 5)) as PosedDivision;
    expect(op.steps().map((s) => [s.kind, s.expected])).toEqual([
      ['first', 7],
      ['size', 3],
      ['quotient', 1],
      ['product', 5],
      ['remainder', 2],
      ['quotient', 4],
      ['product', 20],
      ['remainder', 3],
      ['quotient', 7],
      ['product', 35],
      ['remainder', 3],
    ]);
    expect(op.writtenText()).toBe('147, reste 3');
    expect(op.check).toBe('147 × 5 + 3 = 738');
    expect(op.steps()[0]!.explain).toBe('On peut diviser 7 par 5 : on commence par 7.');
    expect(op.steps()[1]!.explain).toBe('Un chiffre au quotient pour 7, puis un pour chaque chiffre qu’on abaisse (3 et 8) : le quotient aura 3 chiffres.');
    expect(op.steps()[5]!.explain).toBe('5 × 4 = 20 et 5 × 5 = 25, c’est trop : on écrit 4.');
    expect(op.steps()[6]!.explain).toBe('4 fois 5 font 20 : on l’écrit sous 23.');
    expect(op.steps()[4]!).toMatchObject({ ask: 'La soustraction : 7 − 5', explain: '7 − 5 = 2 : il reste 2. On abaisse le 3 : 23.' });
  });

  it('prend 2 chiffres quand le premier est trop petit : 348 : 7 = 49, reste 5', () => {
    const op = solve(new PosedDivision(348, 7));
    expect(op.steps()[0]).toMatchObject({ expected: 34, explain: '3 est plus petit que 7 : on prend 34.' });
    expect(op.steps()[1]).toMatchObject({ kind: 'size', expected: 2 });
    expect(op.writtenText()).toBe('49, reste 5');
  });

  it('écrit 0 au quotient : 454 : 3 n’en a pas, 618 : 3 = 206', () => {
    const op = solve(new PosedDivision(618, 3));
    const steps = op.steps();
    const zero = steps.findIndex((s) => s.kind === 'quotient' && s.expected === 0);
    expect(steps[zero]!.explain).toBe('1 est plus petit que 3 : on écrit 0 au quotient.');
    // Pas de produit pour un 0 : il reste 1, on abaisse le 8.
    expect(steps[zero + 1]).toMatchObject({ kind: 'remainder', expected: 1, explain: 'Il reste 1. On abaisse le 8 : 18.' });
    expect(op.writtenText()).toBe('206, reste 0');
  });

  it('continue avec le reste écrit, même faux', () => {
    const op = new PosedDivision(738, 5);
    for (const value of [7, 3, 1, 5, 1]) op.place(value); // reste faux : 1 au lieu de 2
    expect(op.current()).toMatchObject({ kind: 'quotient', partial: 13, expected: 2 });
  });

  it('soustrait le produit écrit, même faux', () => {
    const op = new PosedDivision(738, 5);
    for (const value of [7, 3, 1, 6]) op.place(value); // produit faux : 6 au lieu de 5
    expect(op.current()).toMatchObject({ kind: 'remainder', expected: 1 });
  });

  it('retrouve toutes les divisions tirées', () => {
    const random = seeded(13);
    for (let i = 0; i < 300; i++) {
      const [dividend, divisor] = drawDivision(i % 3, random);
      const op = solve(new PosedDivision(dividend, divisor)) as PosedDivision;
      expect(op.written()).toBe(Math.floor(dividend / divisor));
      expect(op.writtenRemainder()).toBe(dividend % divisor);
      if (i % 3 === 0) expect(op.firstLength).toBe(2);
      if (i % 3 === 1) expect(String(op.result)).toContain('0');
    }
  });
});

describe('PosedSession', () => {
  const blanche = CALCUL_POSE[0]!;

  it('tire des opérations différentes, 2 et 3 nombres', () => {
    const ops = pickOperations(blanche, 5, [], seeded(3));
    expect(new Set(ops.map((o) => o.id)).size).toBe(5);
    expect(new Set(ops.map((o) => (o as PosedAddition).terms.length))).toEqual(new Set([2, 3]));
  });

  it('entraînement : une erreur est remplacée par la bonne valeur et compte faux', () => {
    const session = new PosedSession([new PosedAddition([437, 76, 209])]);
    expect(session.answer(3)).toBe(false);
    expect(session.operations[0]!.placed).toEqual([2]);
    for (let current = session.current(); current; current = session.current()) session.answer(current.step.expected);
    expect(session.result()).toMatchObject({ correct: 4, total: 5, toPractice: ['437 + 76 + 209 = 722'] });
  });

  it('conditions réelles : la valeur tapée reste, on peut revenir en arrière', () => {
    const session = new PosedSession([new PosedAddition([129, 29]), new PosedAddition([67, 46])], true);
    session.answer(8);
    session.answer(1);
    session.answer(5);
    session.answer(2); // 1 + 2 = 3 attendu
    expect(session.operations[0]!.done).toBe(true);
    expect(session.operations[0]!.writtenText()).toBe('258');
    expect(session.undo()).toBe(2);
    session.answer(1);
    for (let current = session.current(); current; current = session.current()) session.answer(current.step.expected);
    expect(session.result()).toMatchObject({ correct: 8, total: 8, passed: true, mistakes: [] });
  });

  it('conditions réelles : la correction donne le résultat écrit', () => {
    const session = new PosedSession([new PosedAddition([129, 29])], true);
    for (const value of [8, 1, 5, 2]) session.answer(value);
    const result = session.result();
    expect(result).toMatchObject({ correct: 3, total: 4, passed: false });
    expect(result.mistakes.map((m) => [m.operation.text, m.written])).toEqual([['129 + 29', '258']]);
  });

  it('l’entraînement ne revient pas en arrière', () => {
    const session = new PosedSession([new PosedAddition([129, 29])]);
    session.answer(8);
    expect(session.undo()).toBeUndefined();
  });
});
