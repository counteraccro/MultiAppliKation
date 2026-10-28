import { applyOutcome, type LeitnerState } from '../../core/leitner';
import { cleanPlayDays, recordDay } from '../../core/play-days';
import { readStickers } from '../../core/stickers';
import type { Attempt } from '../../core/series';
import type { Stars } from './learn-session';
import { MULTIPLICATION, pairKey, type Calculation, type Operation } from './questions';

/** Progression de l'activité « tables » (ou « additions ») dans un profil. */
export interface TablesData {
  /** Meilleure note par table : { "7": 2 }. */
  stars: Record<string, Stars>;
  /** Boîte de chaque calcul : { "3x7": { box, lastSeen } }. */
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
  const stickers = readStickers(data.stickers);
  if (stickers) copy.stickers = stickers;
  else delete copy.stickers;
  cleanPlayDays(copy);
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
export function recordAttempt(
  data: TablesData,
  attempt: Attempt<Calculation>,
  op: Operation = MULTIPLICATION,
  now = Date.now(),
): void {
  const { question, correct, elapsedMs } = attempt;
  const outcome = !correct ? 'wrong' : elapsedMs < op.fastMs ? 'fast' : 'slow';
  // D'abord le jour : un ancien profil retrouve ses jours dans les boîtes, avant que celle-ci change de date.
  recordDay(data, now);
  applyOutcome(data.leitner, pairKey(question.a, question.b), outcome, now);
}
