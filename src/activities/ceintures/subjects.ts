// Les matières du classeur, une tuile chacune à l'accueil des Ceintures
// (voir .ai/analyse/11-ceintures.md et 12-ceintures-conjugaison.md). Les autres
// s'ajoutent ici, une à la fois.
// Les identifiants servent de clés dans le profil : ne jamais les changer.

import { CONJUGAISON, type ConjugationBelt } from './conjugaison';
import { HOMOPHONES, type HomophoneBelt } from './homophones';

/** Une ceinture d'une matière : phrases à trous (homophones) ou verbes à conjuguer. */
export type SubjectBelt = HomophoneBelt | ConjugationBelt;

export interface Subject {
  id: 'homophones' | 'conjugaison';
  label: string;
  emoji: string;
  /** Les ceintures de la matière, de la plus basse à la plus haute. */
  belts: readonly SubjectBelt[];
}

export type SubjectId = Subject['id'];

export const SUBJECTS: readonly Subject[] = [
  { id: 'homophones', label: 'Homophones', emoji: '🔤', belts: HOMOPHONES },
  { id: 'conjugaison', label: 'Conjugaison', emoji: '✏️', belts: CONJUGAISON },
];

export const isHomophoneBelt = (belt: SubjectBelt): belt is HomophoneBelt => 'groups' in belt;
