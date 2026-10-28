import { additions } from './additions';
import { ceintures } from './ceintures';
import { conjugaison } from './conjugaison';
import { tables } from './tables';
import type { Activity } from './types';

// Ajouter une activité : créer son dossier, puis l'ajouter ici.
export const activities: readonly Activity[] = [tables, additions, conjugaison, ceintures];

export function findActivity(id: string): Activity | undefined {
  return activities.find((a) => a.id === id);
}
