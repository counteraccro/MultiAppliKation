import { describe, expect, it } from 'vitest';
import { CALCUL_POSE, drawAdditionTerms, drawMultiplication, drawSubtraction, pickOperations } from './calcul-pose';
import { PosedAddition, PosedMultiplication, PosedSubtraction, solve } from './posed';
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
    expect(op.steps()[0]!.explain).toBe('2 < 6 : on ajoute 10 en haut (12) et 1 en bas des dizaines. 12 − 6 = 6 : on écrit 6.');
    expect(op.steps()[2]!.explain).toBe('6 + 1 = 7 ; 9 − 7 = 2 : on écrit 2.');
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
    expect(session.operations[0]!.written()).toBe(258);
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
    expect(result.mistakes.map((m) => [m.operation.text, m.written])).toEqual([['129 + 29', 258]]);
  });

  it('l’entraînement ne revient pas en arrière', () => {
    const session = new PosedSession([new PosedAddition([129, 29])]);
    session.answer(8);
    expect(session.undo()).toBeUndefined();
  });
});
