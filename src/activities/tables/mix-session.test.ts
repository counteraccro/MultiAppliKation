import { describe, expect, it } from 'vitest';
import { MIX_SIZE, mixKeys, MixSession, mixSize } from './mix-session';
import { pairKey } from './questions';

describe('mixKeys', () => {
  it('compte une seule fois 3 × 7 et 7 × 3', () => {
    expect(mixKeys([3])).toHaveLength(10);
    expect(mixKeys([3, 7])).toHaveLength(19);
  });
});

describe('MixSession', () => {
  it('ne pose que des multiplications des tables choisies, toutes différentes', () => {
    const session = new MixSession([3, 7, 8]);
    const keys = new Set<string>();
    for (let q = session.current(); q; q = session.current()) {
      expect([3, 7, 8].includes(q.a) || [3, 7, 8].includes(q.b)).toBe(true);
      keys.add(pairKey(q.a, q.b));
      session.answer(q.answer, 1000);
    }
    expect(keys.size).toBe(MIX_SIZE);
  });

  it('pose moins de questions quand les tables en ont moins', () => {
    expect(mixSize([4])).toBe(10);
    expect(new MixSession([4]).total).toBe(10);
  });

  it('fait revenir une erreur et la garde à retravailler', () => {
    // 2 et 5 : 19 multiplications (2 × 5 est commune aux deux).
    const session = new MixSession([2, 5]);
    let asked = 0;
    for (let q = session.current(); q; q = session.current()) {
      session.answer(asked === 0 ? -1 : q.answer, 1000);
      asked++;
    }
    const result = session.result();
    expect(result.total).toBe(19);
    expect(asked).toBe(20);
    expect(result.correct).toBe(18);
    expect(result.toPractice).toHaveLength(1);
  });
});
