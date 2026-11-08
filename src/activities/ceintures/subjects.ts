// Les matières du classeur, une tuile chacune à l'accueil des Ceintures
// (voir .ai/analyse/11-ceintures.md, 12-ceintures-conjugaison.md, 13-ceintures-tables.md
// 15-ceintures-calcul-pose.md, 16-ceintures-calcul-mental.md, 18-ceintures-numeration.md, 19-ceintures-grammaire.md et 20-ceintures-mesures.md). Les autres
// s'ajoutent ici, une à la fois.
// Les identifiants servent de clés dans le profil : ne jamais les changer.

import { CALCUL_MENTAL, type MentalBelt } from './calcul-mental';
import { CALCUL_POSE, type PosedBelt } from './calcul-pose';
import { CONJUGAISON, type ConjugationBelt } from './conjugaison';
import { GRAMMAIRE, type GrammarBelt } from './grammaire';
import { HOMOPHONES, type HomophoneBelt } from './homophones';
import { MESURES } from './mesures';
import { NUMERATION, type NumerationBelt } from './numeration';
import { TABLE_BELTS, type TableBelt } from './tables';

/**
 * Une ceinture d'une matière : phrases à trous (homophones), verbes à conjuguer, tables, opérations à poser,
 * calculs de tête, questions de numération ou de mesures, ou phrases à colorier (grammaire).
 */
export type SubjectBelt = HomophoneBelt | ConjugationBelt | TableBelt | PosedBelt | MentalBelt | NumerationBelt | GrammarBelt;

export interface Subject {
  id: 'homophones' | 'conjugaison' | 'tables' | 'calcul-pose' | 'calcul-mental' | 'numeration' | 'grammaire' | 'mesures';
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
  { id: 'calcul-mental', label: 'Calcul mental', emoji: '🧠', belts: CALCUL_MENTAL },
  { id: 'numeration', label: 'Numération', emoji: '🔢', belts: NUMERATION, unfinished: true },
  { id: 'grammaire', label: 'Grammaire', emoji: '🖍️', belts: GRAMMAIRE },
  { id: 'mesures', label: 'Mesures', emoji: '📏', belts: MESURES },
];

export const isHomophoneBelt = (belt: SubjectBelt): belt is HomophoneBelt => 'groups' in belt;
export const isTableBelt = (belt: SubjectBelt): belt is TableBelt => 'tables' in belt;
export const isPosedBelt = (belt: SubjectBelt): belt is PosedBelt => 'operation' in belt;
export const isMentalBelt = (belt: SubjectBelt): belt is MentalBelt => 'drawCalc' in belt;
export const isNumerationBelt = (belt: SubjectBelt): belt is NumerationBelt => 'kinds' in belt;
export const isGrammarBelt = (belt: SubjectBelt): belt is GrammarBelt => 'tasks' in belt;
