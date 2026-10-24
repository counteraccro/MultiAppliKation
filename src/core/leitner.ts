// Révision intelligente par boîtes de Leitner (voir .ai/analyse/04-modes.md),
// valable pour toute activité de type question / réponse : chaque question a une clé.

export const MAX_BOX = 5;

export interface LeitnerEntry {
  box: number;
  /** Date du dernier passage (ms). */
  lastSeen: number;
}

/** Clé de la question → sa boîte. Une question absente n'a jamais été vue. */
export type LeitnerState = Record<string, LeitnerEntry>;

export type Outcome = 'fast' | 'slow' | 'wrong';

/** Juste et rapide : monte d'une boîte. Juste mais lente : reste. Fausse : retour en boîte 1. */
export function applyOutcome(state: LeitnerState, key: string, outcome: Outcome, now: number): void {
  const box = state[key]?.box ?? 1;
  const next = outcome === 'fast' ? Math.min(box + 1, MAX_BOX) : outcome === 'slow' ? box : 1;
  state[key] = { box: next, lastSeen: now };
}

export function boxOf(state: LeitnerState, key: string): number {
  return state[key]?.box ?? 1;
}

export interface PickOptions {
  size: number;
  /** Places gardées pour ce qui n'a pas été vu depuis longtemps. */
  staleSlots: number;
  staleAfterMs: number;
  now: number;
  random?: () => number;
}

// Plus la boîte est basse, plus la question a de chances de sortir.
const BOX_WEIGHTS: Record<number, number> = { 1: 16, 2: 8, 3: 4, 4: 2, 5: 1 };
// Une question jamais vue entre doucement, moins souvent qu'une question ratée.
const UNSEEN_WEIGHT = 4;

/** Choisit les questions d'une révision : surtout les boîtes basses, un peu d'ancien. */
export function pickReview(keys: readonly string[], state: LeitnerState, options: PickOptions): string[] {
  const random = options.random ?? Math.random;
  const size = Math.min(options.size, keys.length);

  const stale = keys
    .filter((k) => state[k] && state[k].box > 1 && options.now - state[k].lastSeen >= options.staleAfterMs)
    .sort((a, b) => state[a]!.lastSeen - state[b]!.lastSeen)
    .slice(0, Math.min(options.staleSlots, size));

  const picked = new Set(stale);
  const pool = keys.filter((k) => !picked.has(k));
  const weight = (k: string) => (state[k] ? (BOX_WEIGHTS[state[k].box] ?? 1) : UNSEEN_WEIGHT);

  // Tirage pondéré sans remise.
  while (picked.size < size && pool.length > 0) {
    const total = pool.reduce((sum, k) => sum + weight(k), 0);
    let r = random() * total;
    let index = pool.findIndex((k) => (r -= weight(k)) < 0);
    if (index === -1) index = pool.length - 1;
    picked.add(pool.splice(index, 1)[0]!);
  }
  return [...picked];
}

/** Nombre de questions rangées au moins dans `minBox`. */
export function countAtLeast(state: LeitnerState, keys: readonly string[], minBox: number): number {
  return keys.filter((k) => (state[k]?.box ?? 0) >= minBox).length;
}
