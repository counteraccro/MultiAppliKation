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

export function beltOf(id: BeltId): (typeof BELTS)[number] {
  return BELTS.find((b) => b.id === id)!;
}

/** Texte lisible sur la couleur de la ceinture : blanc sur les foncées, sombre sur les claires. */
export function beltTextColor(color: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16) / 255) as [number, number, number];
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance < 0.6 ? '#FFFFFF' : '#2D2A32';
}
