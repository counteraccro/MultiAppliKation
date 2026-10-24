import { shuffle, type QuizQuestion } from '../../core/quiz';
import { Series } from '../../core/series';

// Série d'essai du clavier de lettres, en attendant les 20 verbes du CM1
// (voir .ai/analyse/10-conjugaison.md) : quelques formes courtes, écrites à la main.

/** 1 à 6 : je, tu, il / elle, nous, vous, ils / elles. */
export type Person = 1 | 2 | 3 | 4 | 5 | 6;

export interface ConjugationQuestion extends QuizQuestion {
  verb: string;
  tense: string;
  person: Person;
  answer: string;
}

/** Une forme : la réponse attendue et, si le genre ne se voit pas, les autres justes. */
type Form = string | { answer: string; also: string[] };

/** Les six formes d'un verbe à un temps ; à la 3ᵉ personne, [il, elle] quand l'accord change. */
interface Conjugation {
  verb: string;
  tense: string;
  forms: [Form, Form, Form | [string, string], Form, Form, Form | [string, string]];
}

export const TRIAL: readonly Conjugation[] = [
  { verb: 'être', tense: 'présent', forms: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'] },
  { verb: 'avoir', tense: 'présent', forms: ['ai', 'as', 'a', 'avons', 'avez', 'ont'] },
  {
    verb: 'aller',
    tense: 'passé composé',
    // Accord avec être ; pour je, tu, nous, vous le genre ne se voit pas : les deux sont justes.
    forms: [
      { answer: 'suis allé', also: ['suis allée'] },
      { answer: 'es allé', also: ['es allée'] },
      ['est allé', 'est allée'],
      { answer: 'sommes allés', also: ['sommes allées'] },
      { answer: 'êtes allés', also: ['êtes allé', 'êtes allée', 'êtes allées'] },
      ['sont allés', 'sont allées'],
    ],
  },
];

/** Au passé composé on lit aussi l'auxiliaire : « je suis », « j'ai ». */
function pronoun(person: Person, answer: string, feminine: boolean): string {
  switch (person) {
    case 1:
      return /^[aeéèêiouh]/.test(answer) ? 'j’' : 'je';
    case 2:
      return 'tu';
    case 3:
      return feminine ? 'elle' : 'il';
    case 4:
      return 'nous';
    case 5:
      return 'vous';
    case 6:
      return feminine ? 'elles' : 'ils';
  }
}

export function conjugationQuestion(
  { verb, tense, forms }: Conjugation,
  person: Person,
  random: () => number = Math.random,
): ConjugationQuestion {
  const form = forms[person - 1]!;
  const feminine = random() < 0.5;
  const { answer, also } = Array.isArray(form)
    ? { answer: form[feminine ? 1 : 0], also: [] }
    : typeof form === 'string'
      ? { answer: form, also: [] }
      : form;
  return {
    verb,
    tense,
    person,
    prompt: pronoun(person, answer, feminine),
    context: `${verb} · ${tense}`,
    answer,
    alsoAccepted: also,
  };
}

export const TRIAL_SIZE = 12;

export interface TrialResult {
  correct: number;
  total: number;
  toPractice: ConjugationQuestion[];
}

/** 12 formes tirées des trois conjugaisons d'essai ; une erreur revient plus tard. */
export class TrialSession extends Series<ConjugationQuestion> {
  constructor(random: () => number = Math.random) {
    const all = TRIAL.flatMap((c) => ([1, 2, 3, 4, 5, 6] as const).map((p) => conjugationQuestion(c, p, random)));
    super(shuffle(all, random).slice(0, TRIAL_SIZE));
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
