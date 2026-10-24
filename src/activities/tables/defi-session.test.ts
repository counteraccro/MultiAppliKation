import { describe, expect, it } from 'vitest';
import { readTablesData, recordDefi } from './data';
import { DEFI_SIZE, DefiSession, PENALTY_MS } from './defi-session';
import { pairKey } from './questions';

describe('DefiSession', () => {
  it('pose 20 multiplications différentes, sans faire revenir les erreurs', () => {
    const session = new DefiSession();
    const keys = new Set<string>();
    let asked = 0;
    for (let q = session.current(); q; q = session.current()) {
      keys.add(pairKey(q.a, q.b));
      asked++;
      session.answer(asked % 4 === 0 ? -1 : q.answer, 1000);
    }
    expect(asked).toBe(DEFI_SIZE);
    expect(keys.size).toBe(DEFI_SIZE);
  });

  it('compte le temps et ajoute 5 s par erreur', () => {
    const session = new DefiSession();
    let i = 0;
    for (let q = session.current(); q; q = session.current()) {
      i++;
      // 2 erreurs, chaque réponse en 2 s.
      session.answer(i === 3 || i === 10 ? -1 : q.answer, 2000);
    }
    const result = session.result();
    expect(result.timeMs).toBe(DEFI_SIZE * 2000);
    expect(result.errors).toBe(2);
    expect(result.scoreMs).toBe(DEFI_SIZE * 2000 + 2 * PENALTY_MS);
    expect(result.toPractice).toHaveLength(2);
  });
});

describe('recordDefi', () => {
  it('le premier défi fait le record, puis seul un meilleur temps le remplace', () => {
    const data = readTablesData(undefined);
    expect(recordDefi(data, 60_000)).toBe(true);
    expect(recordDefi(data, 70_000)).toBe(false);
    expect(recordDefi(data, 60_000)).toBe(false);
    expect(recordDefi(data, 55_000)).toBe(true);
    expect(data.defiRecordMs).toBe(55_000);
  });
});
