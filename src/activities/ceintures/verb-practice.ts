// Entraînement d'une ceinture de conjugaison : un verbe de la ceinture, comme sur la fiche
// (« Conjugue le verbe parler au présent »), ses formes tapées une à une dans l'ordre
// (je … ils), corrigées tout de suite. Une forme ratée revient un peu plus tard ;
// seul le premier essai compte.

import { shuffle, type QuizQuestion } from '../../core/quiz';
import { Series } from '../../core/series';
import { pronoun, sentence } from '../conjugaison/questions';
import type { Person } from '../conjugaison/verbs';
import { TENSES, type ConjugationBelt, type Exercise } from './conjugaison';

export interface VerbQuestion extends QuizQuestion {
  answer: string;
  /** La forme entière, pour le résultat : « nous parlons », « parle ! ». */
  full: string;
}

const IMPERATIVE_PERSONS = ['tu', 'nous', 'vous'];

/** Les questions d'un exercice, dans l'ordre de la fiche ; le genre (il / elle) au hasard. */
export function exerciseQuestions(exercise: Exercise, random: () => number = Math.random): VerbQuestion[] {
  const imperative = exercise.tense === 'imperatif';
  const context = `${exercise.verb} · ${TENSES[exercise.tense].label}`;
  return exercise.forms.map((form, i) => {
    const feminine = random() < 0.5;
    const { answer, also } = Array.isArray(form)
      ? { answer: form[feminine ? 1 : 0], also: [] }
      : typeof form === 'string'
        ? { answer: form, also: [] }
        : form;
    // À l'impératif, pas de pronom à écrire : il est rappelé entre parenthèses.
    const prompt = imperative ? `(${IMPERATIVE_PERSONS[i]})` : pronoun((i + 1) as Person, answer, feminine);
    const full = imperative ? `${answer} !` : sentence({ prompt, answer });
    return { prompt, context, answer, alsoAccepted: also, full };
  });
}

/** Le verbe de l'entraînement : au hasard, de préférence pas celui de la fois d'avant (`seen`). */
export function pickExercise(belt: ConjugationBelt, seen: readonly string[] = [], random = Math.random): Exercise {
  const fresh = belt.exercises.filter((e) => !seen.includes(e.id));
  return shuffle(fresh.length > 0 ? fresh : belt.exercises, random)[0]!;
}

export interface VerbPracticeResult {
  /** Formes justes au premier essai. */
  correct: number;
  total: number;
  /** Formes ratées au premier essai, dans l'ordre de la fiche. */
  toPractice: string[];
}

export class VerbPracticeSession extends Series<VerbQuestion> {
  private readonly questions: readonly VerbQuestion[];

  constructor(
    readonly exercise: Exercise,
    random: () => number = Math.random,
  ) {
    const questions = exerciseQuestions(exercise, random);
    super(questions);
    this.questions = questions;
  }

  result(): VerbPracticeResult {
    const missed = new Set(this.attempts().filter((a) => !a.correct).map((a) => a.question));
    return {
      correct: this.total - missed.size,
      total: this.total,
      toPractice: this.questions.filter((q) => missed.has(q)).map((q) => q.full),
    };
  }
}
