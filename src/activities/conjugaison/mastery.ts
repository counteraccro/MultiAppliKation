import type { LeitnerState } from '../../core/leitner';
import { emptyCounts, KNOWN_BOX, masteryOfBox, type Mastery } from '../../core/mastery';
import { CONJUGATIONS, conjugationKey, PERSONS, type Conjugation, type Person } from './verbs';

export { MASTERY_LEVELS, type Mastery } from '../../core/mastery';

export const MASTERY_LABELS: Record<Mastery, string> = {
  unseen: 'Pas encore vu',
  learning: 'À travailler',
  progress: 'En progrès',
  known: 'Connu',
  mastered: 'Bravo',
};

export const formMastery = (state: LeitnerState, c: Conjugation, person: Person): Mastery =>
  masteryOfBox(state[`${conjugationKey(c)}.${person}`]?.box);

/**
 * Niveau d'un verbe à un temps : celui de sa forme la moins sue, comme « connu »
 * (les 6 formes en boîte 4). Une forme pas encore vue compte « à travailler ».
 */
export function conjugationMastery(state: LeitnerState, c: Conjugation): Mastery {
  const boxes = PERSONS.map((p) => state[`${conjugationKey(c)}.${p}`]?.box);
  if (boxes.every((box) => box === undefined)) return 'unseen';
  return masteryOfBox(Math.min(...boxes.map((box) => box ?? 1)));
}

/** Connu : les 6 formes en boîte 4 ou plus (« N / 80 connus », vert dans la grille). */
export function isKnownConjugation(state: LeitnerState, c: Conjugation): boolean {
  return PERSONS.every((p) => (state[`${conjugationKey(c)}.${p}`]?.box ?? 0) >= KNOWN_BOX);
}

/** Nombre de verbe-temps (sur 80) à chaque niveau. */
export function masteryCounts(state: LeitnerState): Record<Mastery, number> {
  const counts = emptyCounts();
  for (const c of CONJUGATIONS) counts[conjugationMastery(state, c)]++;
  return counts;
}
