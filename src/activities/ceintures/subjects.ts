// Les matières du classeur, une tuile chacune à l'accueil des Ceintures
// (voir .ai/analyse/11-ceintures.md, 12-ceintures-conjugaison.md, 13-ceintures-tables.md
// et 15-ceintures-calcul-pose.md). Les autres
// s'ajoutent ici, une à la fois.
// Les identifiants servent de clés dans le profil : ne jamais les changer.

import { CALCUL_POSE, type PosedBelt } from './calcul-pose';
import { CONJUGAISON, type ConjugationBelt } from './conjugaison';
import { HOMOPHONES, type HomophoneBelt } from './homophones';
import { TABLE_BELTS, type TableBelt } from './tables';

/** Une ceinture d'une matière : phrases à trous (homophones), verbes à conjuguer, tables ou opérations à poser. */
export type SubjectBelt = HomophoneBelt | ConjugationBelt | TableBelt | PosedBelt;

export interface Subject {
  id: 'homophones' | 'conjugaison' | 'tables' | 'calcul-pose';
  label: string;
  emoji: string;
  /** Les ceintures de la matière, de la plus basse à la plus haute. */
  belts: readonly SubjectBelt[];
  /** Des ceintures du classeur sont encore à venir (pas d'autocollant « dernière ceinture »). */
  unfinished?: true;
}

export type SubjectId = Subject['id'];

export const SUBJECTS: readonly Subject[] = [
  { id: 'homophones', label: 'Homophones', emoji: '🔤', belts: HOMOPHONES },
  { id: 'conjugaison', label: 'Conjugaison', emoji: '✏️', belts: CONJUGAISON },
  { id: 'tables', label: 'Tables', emoji: '✖️', belts: TABLE_BELTS },
  { id: 'calcul-pose', label: 'Calcul posé', emoji: '🧮', belts: CALCUL_POSE, unfinished: true },
];

export const isHomophoneBelt = (belt: SubjectBelt): belt is HomophoneBelt => 'groups' in belt;
export const isTableBelt = (belt: SubjectBelt): belt is TableBelt => 'tables' in belt;
export const isPosedBelt = (belt: SubjectBelt): belt is PosedBelt => 'operation' in belt;
