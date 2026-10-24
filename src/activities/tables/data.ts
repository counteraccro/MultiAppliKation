import { applyOutcome, type LeitnerState } from '../../core/leitner';
import type { Attempt } from '../../core/series';
import type { Stars } from './learn-session';
import { FAST_MS, pairKey, type Multiplication } from './questions';

/** Progression de l'activité « tables » dans un profil. */
export interface TablesData {
  /** Meilleure note par table : { "7": 2 }. */
  stars: Record<string, Stars>;
  /** Boîte de chaque multiplication : { "3x7": { box, lastSeen } }. */
  leitner: LeitnerState;
  /** Meilleur score au défi (ms, pénalités comprises) ; absent avant le premier défi. */
  defiRecordMs?: number;
  /** Tables du dernier mélange, cochées d'office la fois suivante. */
  mixTables?: number[];
  /** Autocollants gagnés : { "streak-10": date (ms) }. */
  stickers?: Record<string, number>;
  /** Nombre de jours différents où elle a joué, et le dernier (« 2026-10-24 »). */
  daysPlayed?: number;
  lastPlayedDay?: string;
}

/** Lit la progression enregistrée, en complétant ce qui manque (premier lancement, ancien format). */
export function readTablesData(raw: unknown): TablesData {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<TablesData>;
  const copy: TablesData = { ...data, stars: { ...data.stars }, leitner: { ...data.leitner } };
  if (data.stickers) copy.stickers = { ...data.stickers };
  return copy;
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

/** Garde le meilleur (plus petit) score au défi ; renvoie true si c'est un nouveau record. */
export function recordDefi(data: TablesData, scoreMs: number): boolean {
  if (data.defiRecordMs !== undefined && scoreMs >= data.defiRecordMs) return false;
  data.defiRecordMs = scoreMs;
  return true;
}

/** Garde les tables choisies pour le prochain mélange. */
export function recordMixTables(data: TablesData, tables: readonly number[]): void {
  data.mixTables = [...tables];
}

/** Range une réponse dans les boîtes, quel que soit le mode où elle a été donnée. */
export function recordAttempt(data: TablesData, attempt: Attempt<Multiplication>, now = Date.now()): void {
  const { question, correct, elapsedMs } = attempt;
  const outcome = !correct ? 'wrong' : elapsedMs < FAST_MS ? 'fast' : 'slow';
  applyOutcome(data.leitner, pairKey(question.a, question.b), outcome, now);
  recordDay(data, now);
}

/** Jour local, « 2026-10-24 ». */
export function dayOf(time: number): string {
  const d = new Date(time);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Compte un jour de jeu de plus, une seule fois par jour. */
export function recordDay(data: TablesData, now = Date.now()): void {
  const day = dayOf(now);
  if (data.daysPlayed === undefined) {
    // Profil d'avant les jours de jeu : on retrouve au moins les jours encore visibles dans les boîtes.
    const seen = new Set(Object.values(data.leitner).map((entry) => dayOf(entry.lastSeen)));
    data.daysPlayed = seen.size;
    if (seen.has(day)) data.lastPlayedDay = day;
  }
  if (data.lastPlayedDay === day) return;
  data.lastPlayedDay = day;
  data.daysPlayed = (data.daysPlayed ?? 0) + 1;
}
