// Entraînement d'une ceinture de conjugaison : 3 verbes de la ceinture tirés au hasard, dont au
// moins un piège. Leurs formes sont mélangées (verbes et personnes), le sujet est un pronom, un prénom
// ou un groupe nominal (« Léa », « mes parents », « Tom et moi ») ; chaque forme est corrigée tout de
// suite. Une forme ratée revient un peu plus tard ; seul le premier essai compte.

import { shuffle, type QuizQuestion } from '../../core/quiz';
import { Series } from '../../core/series';
import { pronoun, sentence } from '../conjugaison/questions';
import type { Person } from '../conjugaison/verbs';
import { TENSES, type ConjugationBelt, type Exercise } from './conjugaison';

export interface VerbQuestion extends QuizQuestion {
  answer: string;
  /** La forme entière, pour le résultat : « nous parlons », « Léa écrit », « parle ! ». */
  full: string;
}

const IMPERATIVE_PERSONS = ['tu', 'nous', 'vous'];

/** Un sujet qui n'est pas un pronom ; son genre accorde le participe avec être (« mes cousines sont parties »). */
interface Subject {
  text: string;
  feminine: boolean;
}

const he = (text: string): Subject => ({ text, feminine: false });
const she = (text: string): Subject => ({ text, feminine: true });

/** Il / elle, ils / elles : un prénom ou un groupe nominal, comme dans les phrases de la classe. */
const OTHERS: Readonly<Record<3 | 6, { names: readonly Subject[]; groups: readonly Subject[] }>> = {
  3: {
    names: [she('Léa'), he('Tom'), she('Inès'), he('Hugo'), she('Chloé'), he('Malik')],
    groups: [she('ma sœur'), he('mon cousin'), she('la maîtresse'), he('le boulanger'), he('mon voisin'), she('ma tante')],
  },
  6: {
    names: [he('Léa et Tom'), she('Inès et Jade'), he('Hugo et Malik')],
    groups: [he('les enfants'), he('mes parents'), she('mes copines'), she('les filles'), he('mes cousins'), she('les maîtresses')],
  },
};

/** Ce qui grince n'est pas une personne : une porte, le parquet. */
const THINGS: Readonly<Record<string, Record<3 | 6, readonly Subject[]>>> = {
  grincer: { 3: [she('la porte'), he('le parquet')], 6: [she('les portes'), he('les volets')] },
};

/** Nous et vous sans le pronom : « Tom et moi », « Léa et toi ». */
const WITH_ME = ['Tom et moi', 'Léa et moi', 'mon frère et moi'];
const WITH_YOU = ['Inès et toi', 'Hugo et toi', 'ta sœur et toi'];

const pick = <T>(items: readonly T[], random: () => number) => items[Math.floor(random() * items.length)]!;

/**
 * Le sujet d'une forme : je et tu restent des pronoms ; il, ils : un pronom, un prénom ou un groupe
 * nominal, à parts égales ; nous, vous : une fois sur quatre « Tom et moi », « Léa et toi ».
 */
function subjectFor(person: Person, verb: string, random: () => number): { text?: string; feminine: boolean } {
  const feminine = random() < 0.5;
  const draw = random();
  if (person === 3 || person === 6) {
    if (draw < 1 / 3) return { feminine };
    const things = THINGS[verb]?.[person];
    if (things) return pick(things, random);
    const { names, groups } = OTHERS[person];
    return pick(draw < 2 / 3 ? names : groups, random);
  }
  if (person === 4 && draw < 0.25) return { text: pick(WITH_ME, random), feminine };
  if (person === 5 && draw < 0.25) return { text: pick(WITH_YOU, random), feminine };
  return { feminine };
}

/** Les questions d'un exercice, dans l'ordre de la fiche, chacune avec son sujet. */
export function exerciseQuestions(exercise: Exercise, random: () => number = Math.random): VerbQuestion[] {
  const imperative = exercise.tense === 'imperatif';
  const context = `${exercise.verb} · ${TENSES[exercise.tense].label}`;
  return exercise.forms.map((form, i) => {
    const person = (i + 1) as Person;
    const subject = subjectFor(person, exercise.verb, random);
    const { answer, also } = Array.isArray(form)
      ? { answer: form[subject.feminine ? 1 : 0], also: [] }
      : typeof form === 'string'
        ? { answer: form, also: [] }
        : form;
    // À l'impératif, pas de pronom à écrire : il est rappelé entre parenthèses.
    const prompt = imperative ? `(${IMPERATIVE_PERSONS[i]})` : (subject.text ?? pronoun(person, answer, subject.feminine));
    const full = imperative ? `${answer} !` : sentence({ prompt, answer });
    return { prompt, context, answer, alsoAccepted: also, full };
  });
}

/**
 * Les formes des verbes mélangées : verbes et personnes au hasard, jamais deux fois de suite le même
 * verbe quand on peut l'éviter. Le verbe qui a le plus de formes restantes passe plus souvent, pour ne
 * pas finir par une suite du même.
 */
export function mixedQuestions(exercises: readonly Exercise[], random: () => number = Math.random): { exercise: Exercise; question: VerbQuestion }[] {
  const piles = exercises.map((exercise) => ({ exercise, questions: shuffle(exerciseQuestions(exercise, random), random) }));
  const mixed: { exercise: Exercise; question: VerbQuestion }[] = [];
  let last: Exercise | undefined;
  for (;;) {
    const left = piles.filter((pile) => pile.questions.length > 0);
    if (left.length === 0) return mixed;
    const others = left.filter((pile) => pile.exercise !== last);
    const from = others.length > 0 ? others : left;
    let draw = random() * from.reduce((sum, pile) => sum + pile.questions.length, 0);
    const pile = from.find((p) => (draw -= p.questions.length) < 0) ?? from[from.length - 1]!;
    mixed.push({ exercise: pile.exercise, question: pile.questions.shift()! });
    last = pile.exercise;
  }
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
  /** Formes ratées au premier essai, dans l'ordre de la série. */
  toPractice: string[];
}

export class VerbPracticeSession extends Series<VerbQuestion> {
  private readonly questions: readonly VerbQuestion[];

  /** Les formes des verbes mélangées (voir `mixedQuestions`). */
  constructor(
    readonly exercises: readonly Exercise[],
    random: () => number = Math.random,
  ) {
    const questions = mixedQuestions(exercises, random).map((item) => item.question);
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
