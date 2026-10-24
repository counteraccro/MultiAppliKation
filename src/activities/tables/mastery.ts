import type { LeitnerState } from '../../core/leitner';
import { pairKey, ALL_PAIRS } from './questions';
import { KNOWN_BOX } from './review-session';

/** Niveau d'une multiplication, d'après sa boîte (voir 04-modes.md). */
export type Mastery = 'unseen' | 'learning' | 'progress' | 'known' | 'mastered';

/** Du moins su au mieux su : l'ordre de la légende. */
export const MASTERY_LEVELS: readonly Mastery[] = ['unseen', 'learning', 'progress', 'known', 'mastered'];

export const MASTERY_LABELS: Record<Mastery, string> = {
  unseen: 'Pas encore vue',
  learning: 'À travailler',
  progress: 'En progrès',
  known: 'Sue',
  mastered: 'Bien sue',
};

/** 3 × 7 et 7 × 3 ont le même niveau : c'est la même chose à retenir. */
export function masteryOf(state: LeitnerState, a: number, b: number): Mastery {
  const entry = state[pairKey(a, b)];
  if (!entry) return 'unseen';
  if (entry.box <= 1) return 'learning';
  if (entry.box < KNOWN_BOX) return 'progress';
  if (entry.box === KNOWN_BOX) return 'known';
  return 'mastered';
}

/** Nombre de multiplications (sur 55) à chaque niveau. */
export function masteryCounts(state: LeitnerState): Record<Mastery, number> {
  const counts: Record<Mastery, number> = { unseen: 0, learning: 0, progress: 0, known: 0, mastered: 0 };
  for (const key of ALL_PAIRS) {
    const [a, b] = key.split('x').map(Number) as [number, number];
    counts[masteryOf(state, a, b)]++;
  }
  return counts;
}
