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
}

/** Lit la progression enregistrée, en complétant ce qui manque (premier lancement, ancien format). */
export function readTablesData(raw: unknown): TablesData {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<TablesData>;
  return { ...data, stars: { ...data.stars }, leitner: { ...data.leitner } };
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

/** Range une réponse dans les boîtes, quel que soit le mode où elle a été donnée. */
export function recordAttempt(data: TablesData, attempt: Attempt<Multiplication>, now = Date.now()): void {
  const { question, correct, elapsedMs } = attempt;
  const outcome = !correct ? 'wrong' : elapsedMs < FAST_MS ? 'fast' : 'slow';
  applyOutcome(data.leitner, pairKey(question.a, question.b), outcome, now);
}
