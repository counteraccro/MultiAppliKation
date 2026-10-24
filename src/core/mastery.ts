// Niveaux de la grille des progrès, d'après la boîte de Leitner (voir 04-modes.md).
// Mêmes couleurs dans toutes les activités ; chacune donne ses mots (« vue », « vu »).

export type Mastery = 'unseen' | 'learning' | 'progress' | 'known' | 'mastered';

/** Du moins su au mieux su : l'ordre de la légende. */
export const MASTERY_LEVELS: readonly Mastery[] = ['unseen', 'learning', 'progress', 'known', 'mastered'];

/** À partir de cette boîte, c'est « connu » : grille, compteurs « N connus » et autocollants. */
export const KNOWN_BOX = 4;

/** Niveau d'une boîte ; undefined = jamais vu. */
export function masteryOfBox(box: number | undefined): Mastery {
  if (box === undefined) return 'unseen';
  if (box <= 1) return 'learning';
  if (box < KNOWN_BOX) return 'progress';
  if (box === KNOWN_BOX) return 'known';
  return 'mastered';
}

export function emptyCounts(): Record<Mastery, number> {
  return { unseen: 0, learning: 0, progress: 0, known: 0, mastered: 0 };
}
