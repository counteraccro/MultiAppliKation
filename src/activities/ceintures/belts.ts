// L'échelle des ceintures, comme au judo et dans le classeur de la classe
// (voir .ai/analyse/11-ceintures.md). Commune à toutes les matières : chacune
// en prend une partie, dans cet ordre.
// Les identifiants servent de clés dans le profil : ne jamais les changer.

export const BELTS = [
  { id: 'blanche', label: 'blanche', color: '#FFFFFF' },
  { id: 'jaune', label: 'jaune', color: '#FFE14D' },
  { id: 'orange', label: 'orange', color: '#FF9900' },
  { id: 'rose', label: 'rose', color: '#FFB6C1' },
  { id: 'vert-clair', label: 'vert clair', color: '#90EE90' },
  { id: 'vert-fonce', label: 'vert foncé', color: '#3CB371' },
  { id: 'bleu-clair', label: 'bleu clair', color: '#87CEFA' },
  { id: 'bleu-fonce', label: 'bleu foncé', color: '#4169E1' },
  { id: 'violette', label: 'violette', color: '#9B85E8' },
  { id: 'marron', label: 'marron', color: '#B08865' },
  { id: 'noire', label: 'noire', color: '#4A3F35' },
] as const;

export type BeltId = (typeof BELTS)[number]['id'];
