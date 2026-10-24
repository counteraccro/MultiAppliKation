import type { Stars } from './learn-session';

/** Progression de l'activité « tables » dans un profil. */
export interface TablesData {
  /** Meilleure note par table : { "7": 2 }. */
  stars: Record<string, Stars>;
}

/** Lit la progression enregistrée, en complétant ce qui manque (premier lancement, ancien format). */
export function readTablesData(raw: unknown): TablesData {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<TablesData>;
  return { ...data, stars: { ...data.stars } };
}

export function starsOf(data: TablesData, table: number): Stars {
  return data.stars[String(table)] ?? 0;
}

/** Garde la meilleure note ; renvoie true si c'est un nouveau record pour cette table. */
export function recordStars(data: TablesData, table: number, stars: Stars): boolean {
  if (stars <= starsOf(data, table)) return false;
  data.stars[String(table)] = stars;
  return true;
}
