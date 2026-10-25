import { applyOutcome, type LeitnerState } from '../../core/leitner';
import { cleanPlayDays, recordDay } from '../../core/play-days';
import { readStickers } from '../../core/stickers';
import type { Attempt } from '../../core/series';
import type { Stars } from './learn-session';
import { cleanMixChoice, type MixChoice } from './mix-session';
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
  /** Temps et verbes du dernier mélange, cochés d'office la fois suivante. */
  mix?: MixChoice;
  /** Autocollants gagnés : { "streak-10": date (ms) }. */
  stickers?: Record<string, number>;
  /** Nombre de jours différents où elle a joué, et le dernier (« 2026-10-24 »). */
  daysPlayed?: number;
  lastPlayedDay?: string;
}

/** Lit la progression enregistrée, en complétant ce qui manque (premier lancement). */
export function readConjugaisonData(raw: unknown): ConjugaisonData {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<ConjugaisonData>;
  const copy: ConjugaisonData = { ...data, stars: { ...data.stars }, leitner: { ...data.leitner } };
  // Un temps disparu (ou une donnée abîmée) ne doit pas laisser l'accueil sans onglet.
  if (!TENSES.some((t) => t.id === copy.tense)) delete copy.tense;
  if (data.mix) copy.mix = cleanMixChoice(data.mix);
  const stickers = readStickers(data.stickers);
  if (stickers) copy.stickers = stickers;
  else delete copy.stickers;
  cleanPlayDays(copy);
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

/** Range une réponse dans les boîtes, quel que soit le mode, et compte le jour de jeu. */
export function recordAttempt(data: ConjugaisonData, attempt: Attempt<ConjugationQuestion>, now = Date.now()): void {
  // Seul le résultat compte : juste, la forme monte d'une boîte, quel que soit le temps mis.
  const outcome = attempt.correct ? 'fast' : 'wrong';
  // D'abord le jour : un ancien profil retrouve ses jours dans les boîtes, avant que celle-ci change de date.
  recordDay(data, now);
  applyOutcome(data.leitner, formKey(attempt.question), outcome, now);
}
