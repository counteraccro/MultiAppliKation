import { describe, expect, it } from 'vitest';
import { readTablesData, recordStars, starsOf } from './data';
import { LearnSession, starsFor } from './learn-session';
import { FAST_MS } from './questions';

/** Répond à toute la série ; `respond` décide de la réponse et du temps mis. */
function play(session: LearnSession, respond: (a: number, b: number, answer: number) => [number, number]) {
  let guard = 0;
  for (let q = session.current(); q; q = session.current()) {
    if (++guard > 100) throw new Error('La série ne finit pas');
    const [value, ms] = respond(q.a, q.b, q.answer);
    session.answer(value, ms);
  }
  return session.result();
}

describe('LearnSession', () => {
  it('pose les 10 multiplications de la table, chacune une fois', () => {
    const session = new LearnSession(7);
    const seen: number[] = [];
    play(session, (a, b, answer) => {
      expect(a).toBe(7);
      seen.push(b);
      return [answer, 1000];
    });
    expect(seen.sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('donne 3 étoiles si tout est juste et rapide', () => {
    expect(play(new LearnSession(3), (_a, _b, answer) => [answer, 1000]).stars).toBe(3);
  });

  it('donne 2 étoiles si tout est juste mais une réponse est lente', () => {
    const result = play(new LearnSession(3), (_a, b, answer) => [answer, b === 6 ? FAST_MS : 1000]);
    expect(result.stars).toBe(2);
    expect(result.toPractice.map((q) => q.prompt)).toEqual(['3 × 6']);
  });

  it('fait revenir une question ratée, sans compter le second essai', () => {
    const tries = new Map<number, number>();
    const result = play(new LearnSession(8), (_a, b, answer) => {
      const n = (tries.get(b) ?? 0) + 1;
      tries.set(b, n);
      // 8 × 7 et 8 × 9 ratées une fois.
      return [(b === 7 || b === 9) && n === 1 ? 0 : answer, 1000];
    });
    expect(tries.get(7)).toBe(2);
    expect(tries.get(9)).toBe(2);
    expect(result.correct).toBe(8);
    expect(result.stars).toBe(1);
    expect(result.toPractice.map((q) => q.prompt)).toEqual(['8 × 7', '8 × 9']);
  });

  it('compte les questions tentées pour la progression', () => {
    const session = new LearnSession(2);
    const first = session.current()!;
    session.answer(0, 1000);
    expect(session.attempted).toBe(1);
    // La question ratée revient plus tard, pas tout de suite.
    expect(session.current()).not.toBe(first);
  });
});

describe('starsFor', () => {
  it('suit les seuils de l’analyse', () => {
    expect(starsFor(7, 10, false)).toBe(0);
    expect(starsFor(8, 10, false)).toBe(1);
    expect(starsFor(9, 10, false)).toBe(1);
    expect(starsFor(10, 10, false)).toBe(2);
    expect(starsFor(10, 10, true)).toBe(3);
  });
});

describe('données des tables', () => {
  it('garde la meilleure note de chaque table', () => {
    const data = readTablesData(undefined);
    expect(recordStars(data, 7, 2)).toBe(true);
    expect(recordStars(data, 7, 1)).toBe(false);
    expect(recordStars(data, 7, 3)).toBe(true);
    expect(starsOf(data, 7)).toBe(3);
    expect(starsOf(data, 8)).toBe(0);
  });

  it('conserve les champs inconnus (ajouts futurs)', () => {
    const data = readTablesData({ stars: { 2: 1 }, leitner: { '2x3': 4 } });
    expect(data).toEqual({ stars: { 2: 1 }, leitner: { '2x3': 4 } });
  });
});
