import { applyOutcome, type LeitnerState } from '../../core/leitner';
import type { Attempt } from '../../core/series';
import { isFast, type Stars } from './learn-session';
import type { ConjugationQuestion } from './questions';
import { conjugationKey, TENSES, type Conjugation, type TenseId } from './verbs';

/** Progression de l'activité « conjugaison » dans un profil. */
export interface ConjugaisonData {
  /** Meilleure note par verbe-temps : { "aller.futur": 2 }. */
  stars: Record<string, Stars>;
  /** Boîte de chaque forme : { "aller.futur.4": { box, lastSeen } } (personnes de 1 à 6). */
  leitner: LeitnerState;
  /** Dernier onglet ouvert à l'accueil. */
  tense?: TenseId;
}

/** Lit la progression enregistrée, en complétant ce qui manque (premier lancement). */
export function readConjugaisonData(raw: unknown): ConjugaisonData {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<ConjugaisonData>;
  const copy: ConjugaisonData = { ...data, stars: { ...data.stars }, leitner: { ...data.leitner } };
  // Un temps disparu (ou une donnée abîmée) ne doit pas laisser l'accueil sans onglet.
  if (!TENSES.some((t) => t.id === copy.tense)) delete copy.tense;
  return copy;
}

export function starsOf(data: ConjugaisonData, conjugation: Conjugation): Stars {
  return data.stars[conjugationKey(conjugation)] ?? 0;
}

/** Garde la meilleure note ; renvoie true si c'est un nouveau record pour ce verbe-temps. */
export function recordStars(data: ConjugaisonData, conjugation: Conjugation, stars: Stars): boolean {
  if (stars <= starsOf(data, conjugation)) return false;
  data.stars[conjugationKey(conjugation)] = stars;
  return true;
}

/** Clé de boîte d'une forme : « aller.futur.4 ». */
export const formKey = ({ verb, tense, person }: ConjugationQuestion) => `${verb}.${tense}.${person}`;

/** Range une réponse dans les boîtes (pour la future Révision). */
export function recordAttempt(data: ConjugaisonData, attempt: Attempt<ConjugationQuestion>, now = Date.now()): void {
  const outcome = !attempt.correct ? 'wrong' : isFast(attempt) ? 'fast' : 'slow';
  applyOutcome(data.leitner, formKey(attempt.question), outcome, now);
}
