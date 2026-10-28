import { describe, expect, it } from 'vitest';
import { HIDDEN_SIZE, hiddenQuestion, HiddenSession } from './hidden-session';
import { ADDITION, MULTIPLICATION, pairKey } from './questions';

const HIDDEN_PAIRS = MULTIPLICATION.hiddenPairs;

describe('hiddenQuestion', () => {
  it('cache le second facteur', () => {
    expect(hiddenQuestion(7, 8, 'b')).toMatchObject({ prompt: '7 ×', suffix: '= 56', answer: 8 });
  });

  it('cache le premier facteur', () => {
    expect(hiddenQuestion(7, 8, 'a')).toMatchObject({ prompt: '', suffix: '× 8 = 56', answer: 7 });
  });

  it('cache un nombre d’une addition', () => {
    expect(hiddenQuestion(3, 4, 'b', ADDITION)).toMatchObject({ prompt: '3 +', suffix: '= 7', answer: 4 });
    expect(hiddenQuestion(3, 4, 'a', ADDITION)).toMatchObject({ prompt: '', suffix: '+ 4 = 7', answer: 3 });
  });
});

describe('HiddenSession', () => {
  it('pose les 36 multiplications de 2 à 9, jamais 1 ni 10', () => {
    expect(HIDDEN_PAIRS).toHaveLength(36);
    expect(HIDDEN_PAIRS).not.toContain('1x7');
    expect(HIDDEN_PAIRS).not.toContain('7x10');
  });

  it('pose les 45 additions de 1 à 9, jamais 10', () => {
    expect(ADDITION.hiddenPairs).toHaveLength(45);
    expect(ADDITION.hiddenPairs).toContain('1x7');
    expect(ADDITION.hiddenPairs).not.toContain('7x10');
    const session = new HiddenSession({ op: ADDITION });
    for (let q = session.current(); q; q = session.current()) {
      expect(ADDITION.hiddenPairs).toContain(pairKey(q.a, q.b));
      session.answer(q.answer, 1000);
    }
    expect(session.result().correct).toBe(HIDDEN_SIZE);
  });

  it('fait 15 questions toutes différentes', () => {
    const session = new HiddenSession();
    const keys = new Set<string>();
    for (let q = session.current(); q; q = session.current()) {
      expect(HIDDEN_PAIRS).toContain(pairKey(q.a, q.b));
      keys.add(pairKey(q.a, q.b));
      session.answer(q.answer, 1000);
    }
    expect(keys.size).toBe(HIDDEN_SIZE);
    expect(session.result()).toMatchObject({ correct: HIDDEN_SIZE, total: HIDDEN_SIZE, toPractice: [] });
  });

  it('repose plus tard une question ratée', () => {
    const session = new HiddenSession();
    const first = session.current()!;
    session.answer(first.answer + 1, 1000);
    expect(session.result().toPractice).toEqual([first]);
    expect(session.result().correct).toBe(0);
  });
});
