import { describe, expect, it } from 'vitest';
import type { LeitnerState } from '../../core/leitner';
import { masteryCounts, masteryOf } from './mastery';

const seen = (box: number) => ({ box, lastSeen: 0 });

describe('masteryOf', () => {
  it('suit la boîte de la multiplication', () => {
    const state: LeitnerState = { '2x3': seen(1), '2x4': seen(2), '2x5': seen(3), '2x6': seen(4), '2x7': seen(5) };
    expect(masteryOf(state, 2, 2)).toBe('unseen');
    expect(masteryOf(state, 2, 3)).toBe('learning');
    expect(masteryOf(state, 2, 4)).toBe('progress');
    expect(masteryOf(state, 2, 5)).toBe('progress');
    expect(masteryOf(state, 2, 6)).toBe('known');
    expect(masteryOf(state, 2, 7)).toBe('mastered');
  });

  it('donne le même niveau à 3 × 7 et 7 × 3', () => {
    const state: LeitnerState = { '3x7': seen(4) };
    expect(masteryOf(state, 7, 3)).toBe('known');
    expect(masteryOf(state, 3, 7)).toBe('known');
  });
});

describe('masteryCounts', () => {
  it('compte les 55 multiplications', () => {
    const counts = masteryCounts({ '1x1': seen(5), '3x7': seen(1) });
    expect(counts).toEqual({ unseen: 53, learning: 1, progress: 0, known: 0, mastered: 1 });
  });
});
