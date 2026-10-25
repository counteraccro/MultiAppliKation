// « Mes progrès » des Ceintures : une couleur par ceinture, les mêmes que dans les autres
// activités (du gris au vert foncé), d'après ses entraînements et son test.

import { emptyCounts, type Mastery } from '../../core/mastery';
import type { BeltId } from './belts';
import { progressOf, statsOf, type CeinturesData, type SubjectProgress } from './data';
import { SUBJECTS } from './subjects';
import { isPassing } from './test-session';

export const MASTERY_LABELS: Record<Mastery, string> = {
  unseen: 'Pas encore commencée',
  learning: 'À travailler',
  progress: 'Prête pour le test',
  known: 'Obtenue',
  mastered: 'Sans faute',
};

/**
 * Pas encore commencée, à travailler (entraînée, pas encore à 90 %), prête pour le test
 * (un entraînement à 90 %), obtenue, et obtenue avec un test sans faute.
 */
export function beltMastery(progress: SubjectProgress, belt: BeltId): Mastery {
  const stats = statsOf(progress, belt);
  if (progress.passed[belt]) {
    const perfect = stats.bestTest !== undefined && stats.bestTest.correct === stats.bestTest.total;
    return perfect ? 'mastered' : 'known';
  }
  if (stats.practices === 0 && stats.tests === 0) return 'unseen';
  const ready = stats.bestPractice !== undefined && isPassing(stats.bestPractice.correct, stats.bestPractice.total);
  return ready ? 'progress' : 'learning';
}

/** Combien de ceintures à chaque couleur, toutes matières confondues : la barre de l'accueil. */
export function masteryCounts(data: CeinturesData): Record<Mastery, number> {
  const counts = emptyCounts();
  for (const subject of SUBJECTS) {
    const progress = progressOf(data, subject);
    for (const { belt } of subject.belts) counts[beltMastery(progress, belt)]++;
  }
  return counts;
}
