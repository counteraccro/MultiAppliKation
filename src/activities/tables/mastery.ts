import { emptyCounts, masteryOfBox, type Mastery } from '../../core/mastery';
import type { LeitnerState } from '../../core/leitner';
import { pairKey, ALL_PAIRS } from './questions';

export { MASTERY_LEVELS, type Mastery } from '../../core/mastery';

export const MASTERY_LABELS: Record<Mastery, string> = {
  unseen: 'Pas encore vue',
  learning: 'À travailler',
  progress: 'En progrès',
  known: 'Connu',
  mastered: 'Bravo',
};

/** 3 × 7 et 7 × 3 ont le même niveau : c'est la même chose à retenir. */
export function masteryOf(state: LeitnerState, a: number, b: number): Mastery {
  return masteryOfBox(state[pairKey(a, b)]?.box);
}

/** Nombre de multiplications (sur 55) à chaque niveau. */
export function masteryCounts(state: LeitnerState): Record<Mastery, number> {
  const counts = emptyCounts();
  for (const key of ALL_PAIRS) {
    const [a, b] = key.split('x').map(Number) as [number, number];
    counts[masteryOf(state, a, b)]++;
  }
  return counts;
}
