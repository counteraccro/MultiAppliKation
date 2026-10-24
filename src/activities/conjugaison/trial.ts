import { shuffle } from '../../core/quiz';
import { Series } from '../../core/series';
import { conjugationQuestion, type ConjugationQuestion } from './questions';
import { CONJUGATIONS, PERSONS } from './verbs';

// Série d'essai du clavier de lettres, en attendant l'accueil et le mode « Apprendre »
// (étape 3 de .ai/analyse/10-conjugaison.md) : des formes tirées au hasard parmi les 480.

export const TRIAL_SIZE = 12;

export interface TrialResult {
  correct: number;
  total: number;
  toPractice: ConjugationQuestion[];
}

/** 12 formes au hasard parmi les 20 verbes et les 4 temps ; une erreur revient plus tard. */
export class TrialSession extends Series<ConjugationQuestion> {
  constructor(random: () => number = Math.random) {
    const forms = CONJUGATIONS.flatMap((c) => PERSONS.map((p) => ({ c, p })));
    super(shuffle(forms, random).slice(0, TRIAL_SIZE).map(({ c, p }) => conjugationQuestion(c, p, random)));
  }

  result(): TrialResult {
    const attempts = this.attempts();
    return {
      correct: attempts.filter((a) => a.correct).length,
      total: this.total,
      toPractice: attempts.filter((a) => !a.correct).map((a) => a.question),
    };
  }
}
