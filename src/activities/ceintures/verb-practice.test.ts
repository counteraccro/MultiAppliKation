import { describe, expect, it } from 'vitest';
import { CONJUGAISON, conjugationBelt } from './conjugaison';
import { exerciseQuestions, mixedQuestions, pickExercises, VERB_COUNT, VerbPracticeSession } from './verb-practice';

const exercise = (belt: Parameters<typeof conjugationBelt>[0], verb: string) =>
  conjugationBelt(belt)!.exercises.find((e) => e.verb === verb)!;

describe('entraînement de conjugaison', () => {
  it('donne à chaque forme son sujet : un pronom, un prénom ou un groupe nominal', () => {
    // 0,1 : il, ils au pronom ; nous, vous « Tom et moi », « Inès et toi ».
    const pronouns = exerciseQuestions(exercise('blanche', 'avoir'), () => 0.1);
    expect(pronouns.map((q) => q.prompt)).toEqual(['j’', 'tu', 'elle', 'Tom et moi', 'Inès et toi', 'elles']);
    expect(pronouns.map((q) => q.answer)).toEqual(['ai', 'as', 'a', 'avons', 'avez', 'ont']);
    expect(pronouns[0]!.full).toBe('j’ai');
    expect(pronouns[0]!.context).toBe('avoir · présent');
    // 0,5 : un prénom ; 0,9 : un groupe nominal ; nous et vous restent des pronoms.
    expect(exerciseQuestions(exercise('blanche', 'avoir'), () => 0.5).map((q) => q.full)).toEqual(['j’ai', 'tu as', 'Hugo a', 'nous avons', 'vous avez', 'Inès et Jade ont']);
    expect(exerciseQuestions(exercise('blanche', 'avoir'), () => 0.9).map((q) => q.prompt).slice(2)).toEqual(['ma tante', 'nous', 'vous', 'les maîtresses']);
  });

  it('fait grincer une porte, pas une personne', () => {
    const questions = exerciseQuestions(exercise('vert-fonce', 'grincer'), () => 0.9);
    expect([questions[2]!.prompt, questions[5]!.prompt]).toEqual(['le parquet', 'les volets']);
  });

  it('accorde le participe avec le genre du sujet', () => {
    // « ma tante », « les maîtresses » : au féminin.
    const questions = exerciseQuestions(exercise('marron', 'venir'), () => 0.9);
    expect(questions[2]).toMatchObject({ prompt: 'ma tante', answer: 'sera venue' });
    expect(questions[5]).toMatchObject({ prompt: 'les maîtresses', answer: 'seront venues' });
  });

  it('à l’impératif, rappelle la personne sans pronom à écrire', () => {
    const questions = exerciseQuestions(exercise('vert-clair', 'parler'));
    expect(questions.map((q) => q.prompt)).toEqual(['(tu)', '(nous)', '(vous)']);
    expect(questions.map((q) => q.full)).toEqual(['parle !', 'parlons !', 'parlez !']);
  });

  it('avec être, accorde le participe avec elle et accepte les deux genres pour je', () => {
    const feminine = exerciseQuestions(exercise('marron', 'venir'), () => 0.1);
    expect(feminine[2]).toMatchObject({ prompt: 'elle', answer: 'sera venue' });
    // « Tom et moi » : les deux genres sont justes pour nous.
    expect(feminine[3]).toMatchObject({ prompt: 'Tom et moi', answer: 'serons venus', alsoAccepted: ['serons venues'] });
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

  it('compte le premier essai et garde les formes ratées', () => {
    const session = new VerbPracticeSession([exercise('blanche', 'manger')], () => 0.1);
    const wrong = new Set(['avons', 'mangeons', 'mangent']);
    const missed: string[] = [];
    for (let i = 0; i < 6; i++) {
      const { answer, full } = session.current()!;
      if (wrong.has(answer)) missed.push(full);
      session.answer(wrong.has(answer) ? 'faux' : answer, 0);
    }
    // Les ratées reviennent : on les trouve.
    while (session.current()) session.answer(session.current()!.answer, 0);
    expect(session.result()).toEqual({ correct: 4, total: 6, toPractice: missed });
  });

  it('mélange les verbes et les personnes, sans deux fois de suite le même verbe', () => {
    const exercises = pickExercises(conjugationBelt('rose')!);
    for (let i = 0; i < 20; i++) {
      const mixed = mixedQuestions(exercises);
      expect(mixed).toHaveLength(18);
      // Chaque forme de chaque verbe, une fois.
      for (const exercise of exercises) {
        expect(mixed.filter((item) => item.exercise === exercise).map((item) => item.question.answer).sort()).toEqual(
          exerciseQuestions(exercise).map((q) => q.answer).sort(),
        );
      }
      // Pas deux fois de suite le même verbe tant qu'il en reste d'autres.
      const runs = mixed.filter((item, j) => j > 0 && item.exercise === mixed[j - 1]!.exercise).length;
      expect(runs).toBeLessThanOrEqual(2);
    }
  });
});
