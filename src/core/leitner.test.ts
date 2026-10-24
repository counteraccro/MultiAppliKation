import { describe, expect, it } from 'vitest';
import { applyOutcome, boxOf, MAX_BOX, pickReview, type LeitnerState } from './leitner';

const DAY = 24 * 60 * 60 * 1000;
const NOW = 100 * DAY;

/** Générateur pseudo-aléatoire reproductible. */
function seeded(seed: number): () => number {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

describe('applyOutcome', () => {
  it('monte d’une boîte si juste et rapide, sans dépasser la dernière', () => {
    const state: LeitnerState = {};
    applyOutcome(state, 'k', 'fast', NOW);
    expect(boxOf(state, 'k')).toBe(2);
    for (let i = 0; i < 10; i++) applyOutcome(state, 'k', 'fast', NOW);
    expect(boxOf(state, 'k')).toBe(MAX_BOX);
  });

  it('reste dans sa boîte si juste mais lente', () => {
    const state: LeitnerState = { k: { box: 3, lastSeen: 0 } };
    applyOutcome(state, 'k', 'slow', NOW);
    expect(state.k).toEqual({ box: 3, lastSeen: NOW });
  });

  it('redescend en boîte 1 si fausse', () => {
    const state: LeitnerState = { k: { box: 4, lastSeen: 0 } };
    applyOutcome(state, 'k', 'wrong', NOW);
    expect(boxOf(state, 'k')).toBe(1);
  });
});

describe('pickReview', () => {
  const keys = Array.from({ length: 55 }, (_, i) => `q${i}`);
  const options = { size: 15, staleSlots: 3, staleAfterMs: 3 * DAY, now: NOW };

  it('choisit le bon nombre de questions, sans doublon', () => {
    const picked = pickReview(keys, {}, { ...options, random: seeded(1) });
    expect(picked).toHaveLength(15);
    expect(new Set(picked).size).toBe(15);
  });

  it('tire surtout dans les boîtes basses', () => {
    // 5 questions en boîte 1, toutes les autres en boîte 5, vues aujourd'hui.
    const state: LeitnerState = Object.fromEntries(
      keys.map((k, i) => [k, { box: i < 5 ? 1 : 5, lastSeen: NOW }]),
    );
    let lowPicked = 0;
    for (let seed = 1; seed <= 50; seed++) {
      const picked = pickReview(keys, state, { ...options, random: seeded(seed) });
      lowPicked += picked.filter((k) => state[k]!.box === 1).length;
    }
    // Les 5 de la boîte 1 sortent presque à chaque fois.
    expect(lowPicked / 50).toBeGreaterThan(4.5);
  });

  it('garde une place pour ce qui n’a pas été vu depuis longtemps', () => {
    const state: LeitnerState = Object.fromEntries(keys.map((k) => [k, { box: 1, lastSeen: NOW }]));
    state.q40 = { box: 5, lastSeen: NOW - 30 * DAY };
    state.q41 = { box: 4, lastSeen: NOW - 10 * DAY };
    state.q42 = { box: 5, lastSeen: NOW - 1 * DAY }; // vue récemment : pas « ancienne »
    const picked = pickReview(keys, state, { ...options, random: seeded(3) });
    expect(picked).toContain('q40');
    expect(picked).toContain('q41');
  });

  it('se contente de ce qui existe s’il y a peu de questions', () => {
    expect(pickReview(['a', 'b'], {}, { ...options, random: seeded(1) }).sort()).toEqual(['a', 'b']);
  });
});
