import { tables } from './tables';
import type { Activity } from './types';

// Ajouter une activité : créer son dossier, puis l'ajouter ici.
export const activities: readonly Activity[] = [tables];

export function findActivity(id: string): Activity | undefined {
  return activities.find((a) => a.id === id);
}
