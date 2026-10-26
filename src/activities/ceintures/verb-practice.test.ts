import { describe, expect, it } from 'vitest';
import { conjugationBelt } from './conjugaison';
import { exerciseQuestions, pickExercise, VerbPracticeSession } from './verb-practice';

const exercise = (belt: Parameters<typeof conjugationBelt>[0], verb: string) =>
  conjugationBelt(belt)!.exercises.find((e) => e.verb === verb)!;

describe('entraînement de conjugaison', () => {
  it('pose les formes dans l’ordre de la fiche, avec le pronom', () => {
    const questions = exerciseQuestions(exercise('blanche', 'avoir'), () => 0.9);
    expect(questions.map((q) => q.prompt)).toEqual(['j’', 'tu', 'il', 'nous', 'vous', 'ils']);
    expect(questions.map((q) => q.answer)).toEqual(['ai', 'as', 'a', 'avons', 'avez', 'ont']);
    expect(questions[0]!.full).toBe('j’ai');
    expect(questions[0]!.context).toBe('avoir · présent');
  });

  it('à l’impératif, rappelle la personne sans pronom à écrire', () => {
    const questions = exerciseQuestions(exercise('vert-clair', 'parler'));
    expect(questions.map((q) => q.prompt)).toEqual(['(tu)', '(nous)', '(vous)']);
    expect(questions.map((q) => q.full)).toEqual(['parle !', 'parlons !', 'parlez !']);
  });

  it('avec être, accorde le participe avec elle et accepte les deux genres pour je', () => {
    const feminine = exerciseQuestions(exercise('marron', 'venir'), () => 0.1);
    expect(feminine[2]).toMatchObject({ prompt: 'elle', answer: 'sera venue' });
    expect(feminine[0]!.alsoAccepted).toEqual(['serai venue']);
  });

  it('choisit de préférence un autre verbe que la dernière fois', () => {
    const belt = conjugationBelt('blanche')!;
    const seen = belt.exercises.slice(1).map((e) => e.id);
    expect(pickExercise(belt, seen).id).toBe(belt.exercises[0]!.id);
    expect(belt.exercises).toContain(pickExercise(belt, belt.exercises.map((e) => e.id)));
  });

  it('compte le premier essai et garde les formes ratées dans l’ordre', () => {
    const session = new VerbPracticeSession(exercise('blanche', 'manger'), () => 0.9);
    const answers = ['mange', 'manges', 'mange', 'mangons', 'mangez', 'mangeant'];
    for (const typed of answers) session.answer(typed, 0);
    // Les deux ratées reviennent : on les trouve.
    while (session.current()) session.answer(session.current()!.answer, 0);
    expect(session.result()).toEqual({ correct: 4, total: 6, toPractice: ['nous mangeons', 'ils mangent'] });
  });
});
