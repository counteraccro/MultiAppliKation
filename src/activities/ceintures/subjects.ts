// Les matières du classeur, une tuile chacune à l'accueil des Ceintures
// (voir .ai/analyse/11-ceintures.md, 12-ceintures-conjugaison.md et 13-ceintures-tables.md). Les autres
// s'ajoutent ici, une à la fois.
// Les identifiants servent de clés dans le profil : ne jamais les changer.

import { CONJUGAISON, type ConjugationBelt } from './conjugaison';
import { HOMOPHONES, type HomophoneBelt } from './homophones';
import { TABLE_BELTS, type TableBelt } from './tables';

/** Une ceinture d'une matière : phrases à trous (homophones), verbes à conjuguer ou tables. */
export type SubjectBelt = HomophoneBelt | ConjugationBelt | TableBelt;

export interface Subject {
  id: 'homophones' | 'conjugaison' | 'tables';
  label: string;
  emoji: string;
  /** Les ceintures de la matière, de la plus basse à la plus haute. */
  belts: readonly SubjectBelt[];
}

export type SubjectId = Subject['id'];

export const SUBJECTS: readonly Subject[] = [
  { id: 'homophones', label: 'Homophones', emoji: '🔤', belts: HOMOPHONES },
  { id: 'conjugaison', label: 'Conjugaison', emoji: '✏️', belts: CONJUGAISON },
  { id: 'tables', label: 'Tables', emoji: '✖️', belts: TABLE_BELTS },
];

export const isHomophoneBelt = (belt: SubjectBelt): belt is HomophoneBelt => 'groups' in belt;
export const isTableBelt = (belt: SubjectBelt): belt is TableBelt => 'tables' in belt;
