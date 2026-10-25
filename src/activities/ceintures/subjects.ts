// Les matières du classeur, une tuile chacune à l'accueil des Ceintures
// (voir .ai/analyse/11-ceintures.md). Pour l'instant les Homophones ; les autres
// s'ajoutent ici, une à la fois.
// Les identifiants servent de clés dans le profil : ne jamais les changer.

import { HOMOPHONES, type HomophoneBelt } from './homophones';

export interface Subject {
  id: 'homophones';
  label: string;
  emoji: string;
  /** Les ceintures de la matière, de la plus basse à la plus haute. */
  belts: readonly HomophoneBelt[];
}

export type SubjectId = Subject['id'];

export const SUBJECTS: readonly Subject[] = [{ id: 'homophones', label: 'Homophones', emoji: '🔤', belts: HOMOPHONES }];
