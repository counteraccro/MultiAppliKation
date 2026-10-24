import type { LeitnerState } from './leitner';

/** Jour local, « 2026-10-24 ». */
export function dayOf(time: number): string {
  const d = new Date(time);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Nombre de jours différents où elle a joué, et le dernier (« 2026-10-24 »). */
export interface PlayDays {
  leitner: LeitnerState;
  daysPlayed?: number;
  lastPlayedDay?: string;
}

/** Compte un jour de jeu de plus, une seule fois par jour. */
export function recordDay(data: PlayDays, now = Date.now()): void {
  const day = dayOf(now);
  if (data.daysPlayed === undefined) {
    // Données d'avant les jours de jeu : on retrouve au moins les jours encore visibles dans les boîtes.
    const seen = new Set(Object.values(data.leitner).map((entry) => dayOf(entry.lastSeen)));
    data.daysPlayed = seen.size;
    if (seen.has(day)) data.lastPlayedDay = day;
  }
  if (data.lastPlayedDay === day) return;
  data.lastPlayedDay = day;
  data.daysPlayed = (data.daysPlayed ?? 0) + 1;
}
