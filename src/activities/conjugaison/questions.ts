import type { QuizQuestion } from '../../core/quiz';
import type { Conjugation, Person, TenseId } from './verbs';

export interface ConjugationQuestion extends QuizQuestion {
  /** Identifiants : clé de boîte « aller.futur.4 ». */
  verb: string;
  tense: TenseId;
  person: Person;
  answer: string;
}

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
    verb: verb.id,
    tense: tense.id,
    person,
    prompt: pronoun(person, answer, feminine),
    context: `${verb.infinitive} · ${tense.label}`,
    answer,
    alsoAccepted: also,
  };
}
