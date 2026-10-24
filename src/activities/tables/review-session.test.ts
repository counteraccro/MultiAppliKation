import { describe, expect, it } from 'vitest';
import { boxOf } from '../../core/leitner';
import { readTablesData, recordAttempt } from './data';
import { ALL_PAIRS, FAST_MS, pairKey } from './questions';
import { knownCount, REVIEW_SIZE, ReviewSession } from './review-session';

describe('les multiplications à retenir', () => {
  it('sont 55, car 3 × 7 = 7 × 3', () => {
    expect(ALL_PAIRS).toHaveLength(55);
    expect(pairKey(7, 3)).toBe(pairKey(3, 7));
  });
});

describe('ReviewSession', () => {
  it('pose une révision de 15 multiplications différentes', () => {
    const session = new ReviewSession({});
    const keys = new Set<string>();
    for (let q = session.current(); q; q = session.current()) {
      keys.add(pairKey(q.a, q.b));
      session.answer(q.answer, 1000);
    }
    expect(session.total).toBe(REVIEW_SIZE);
    expect(keys.size).toBe(REVIEW_SIZE);
  });

  it('range chaque premier essai dans les boîtes', () => {
    const data = readTablesData(undefined);
    const session = new ReviewSession({}, { onFirstAttempt: (a) => recordAttempt(data, a) });
    const first = session.current()!;
    const second = (() => {
      session.answer(first.answer, 1000); // juste et rapide
      return session.current()!;
    })();
    session.answer(-1, 1000); // fausse
    const third = session.current()!;
    session.answer(third.answer, FAST_MS + 1); // juste mais lente

    expect(boxOf(data.leitner, pairKey(first.a, first.b))).toBe(2);
    expect(boxOf(data.leitner, pairKey(second.a, second.b))).toBe(1);
    expect(data.leitner[pairKey(third.a, third.b)]?.box).toBe(1);
    expect(session.result().toPractice).toEqual([second, third]);
  });
});

describe('knownCount', () => {
  it('compte les multiplications en boîte 4 ou 5', () => {
    expect(knownCount({ '1x1': { box: 4, lastSeen: 0 }, '2x3': { box: 5, lastSeen: 0 }, '3x7': { box: 3, lastSeen: 0 } })).toBe(2);
  });
});
