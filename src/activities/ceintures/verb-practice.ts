// Entraînement d'une ceinture de conjugaison : 3 verbes de la ceinture tirés au hasard, dont au
// moins un piège, comme sur la fiche (« Conjugue le verbe parler au présent »), leurs formes tapées
// une à une dans l'ordre (je … ils), corrigées tout de suite. Une forme ratée revient un peu plus
// tard ; seul le premier essai compte.

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

/** Verbes par série, à l'entraînement comme en conditions réelles. */
export const VERB_COUNT = 3;

/**
 * Les verbes d'une série, au hasard parmi ceux de la ceinture : un verbe différent à chaque fois,
 * au moins un piège (`Exercise.trap`), chaque temps de la ceinture représenté (vert clair : passé
 * composé et impératif), de préférence pas ceux de la dernière fois (`seen`).
 */
export function pickExercises(
  belt: ConjugationBelt,
  seen: readonly string[] = [],
  count = VERB_COUNT,
  random = Math.random,
): Exercise[] {
  const unseenFirst = (exercises: readonly Exercise[]) => [
    ...shuffle(exercises.filter((e) => !seen.includes(e.id)), random),
    ...shuffle(exercises.filter((e) => seen.includes(e.id)), random),
  ];
  const picked: Exercise[] = [];
  const isNew = (e: Exercise) => !picked.some((p) => p.verb === e.verb);
  // D'abord un piège, puis chaque temps à son tour, en commençant par ceux qui manquent encore.
  const trap = unseenFirst(belt.exercises.filter((e) => e.trap))[0];
  if (trap) picked.push(trap);
  const tenses = shuffle([...new Set(belt.exercises.map((e) => e.tense))], random).sort(
    (a, b) => Number(picked.some((e) => e.tense === a)) - Number(picked.some((e) => e.tense === b)),
  );
  const piles = tenses.map((tense) => unseenFirst(belt.exercises.filter((e) => e.tense === tense)));
  // Pas deux fois le même verbe.
  while (picked.length < count && piles.some((pile) => pile.length > 0)) {
    for (const pile of piles) {
      let next = pile.shift();
      while (next && !isNew(next)) next = pile.shift();
      if (next && picked.length < count) picked.push(next);
    }
  }
  // Le piège n'est pas toujours le premier.
  return shuffle(picked, random);
}

export interface VerbPracticeResult {
  /** Formes justes au premier essai. */
  correct: number;
  total: number;
  /** Formes ratées au premier essai, dans l'ordre des fiches. */
  toPractice: string[];
}

export class VerbPracticeSession extends Series<VerbQuestion> {
  private readonly questions: readonly VerbQuestion[];

  /** Les verbes l'un après l'autre, chacun dans l'ordre de la fiche. */
  constructor(
    readonly exercises: readonly Exercise[],
    random: () => number = Math.random,
  ) {
    const questions = exercises.flatMap((exercise) => exerciseQuestions(exercise, random));
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
