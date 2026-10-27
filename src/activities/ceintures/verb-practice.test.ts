import { describe, expect, it } from 'vitest';
import { CONJUGAISON, conjugationBelt } from './conjugaison';
import { exerciseQuestions, pickExercises, VERB_COUNT, VerbPracticeSession } from './verb-practice';

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

  it('tire 3 verbes différents, dont au moins un piège, chaque temps de la ceinture représenté', () => {
    for (const belt of CONJUGAISON) {
      const tenses = new Set(belt.exercises.map((e) => e.tense));
      for (let i = 0; i < 20; i++) {
        const picked = pickExercises(belt);
        expect(picked).toHaveLength(VERB_COUNT);
        expect(new Set(picked.map((e) => e.verb)).size).toBe(VERB_COUNT);
        expect(picked.some((e) => e.trap)).toBe(true);
        expect(new Set(picked.map((e) => e.tense))).toEqual(tenses);
      }
    }
  });

  it('a des pièges et des verbes ordinaires dans chaque ceinture', () => {
    for (const belt of CONJUGAISON) {
      expect(belt.exercises.some((e) => e.trap)).toBe(true);
      expect(belt.exercises.some((e) => !e.trap)).toBe(true);
    }
  });

  it('évite les verbes de la dernière fois', () => {
    const belt = conjugationBelt('blanche')!;
    const seen = [belt.exercises[0]!.id, belt.exercises[3]!.id];
    for (let i = 0; i < 20; i++) {
      expect(pickExercises(belt, seen).map((e) => e.id).filter((id) => seen.includes(id))).toEqual([]);
    }
  });

  it('compte le premier essai et garde les formes ratées dans l’ordre', () => {
    const session = new VerbPracticeSession([exercise('blanche', 'manger')], () => 0.9);
    const answers = ['mange', 'manges', 'mange', 'mangons', 'mangez', 'mangeant'];
    for (const typed of answers) session.answer(typed, 0);
    // Les deux ratées reviennent : on les trouve.
    while (session.current()) session.answer(session.current()!.answer, 0);
    expect(session.result()).toEqual({ correct: 4, total: 6, toPractice: ['nous mangeons', 'ils mangent'] });
  });

  it('enchaîne les verbes, chacun dans l’ordre de la fiche', () => {
    const session = new VerbPracticeSession([exercise('blanche', 'avoir'), exercise('blanche', 'être')], () => 0.9);
    expect(session.total).toBe(12);
    const answers: string[] = [];
    while (session.current()) {
      answers.push(String(session.current()!.answer));
      session.answer(session.current()!.answer, 0);
    }
    expect(answers).toEqual(['ai', 'as', 'a', 'avons', 'avez', 'ont', 'suis', 'es', 'est', 'sommes', 'êtes', 'sont']);
  });
});
