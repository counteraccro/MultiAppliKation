import { describe, expect, it } from 'vitest';
import { conjugationBelt } from './conjugaison';
import { pickTestExercises, VerbTestSession } from './verb-test';

describe('conjugaison en conditions réelles', () => {
  it('prend 3 verbes différents, chaque temps de la ceinture représenté', () => {
    const belt = conjugationBelt('vert-clair')!;
    for (let i = 0; i < 20; i++) {
      const picked = pickTestExercises(belt);
      expect(picked).toHaveLength(3);
      expect(new Set(picked.map((e) => e.verb)).size).toBe(3);
      expect(new Set(picked.map((e) => e.tense))).toEqual(new Set(['imperatif', 'passe-compose']));
    }
  });

  it('évite le verbe du dernier entraînement', () => {
    const belt = conjugationBelt('blanche')!;
    const seen = [belt.exercises[0]!.id];
    for (let i = 0; i < 20; i++) expect(pickTestExercises(belt, seen).map((e) => e.id)).not.toContain(seen[0]);
  });

  it('ne corrige rien pendant, et réussit à 90 % des formes', () => {
    const belt = conjugationBelt('blanche')!;
    const exercises = belt.exercises.slice(0, 3);
    const session = new VerbTestSession(exercises, () => 0.9);
    expect(session.total).toBe(18);
    let i = 0;
    while (session.current()) {
      const { answer } = session.current()!;
      // Deux fautes sur 18 : 88 %, pas assez.
      session.answer(i === 3 || i === 10 ? 'faux' : answer);
      i++;
    }
    const result = session.result();
    expect(result).toMatchObject({ correct: 16, total: 18, passed: false });
    expect(result.mistakes.map((m) => [m.exercise.verb, m.question.prompt, m.typed])).toEqual([
      ['avoir', 'nous', 'faux'],
      ['être', 'vous', 'faux'],
    ]);
  });

  it('réussit avec une seule faute sur 18', () => {
    const session = new VerbTestSession(conjugationBelt('jaune')!.exercises.slice(0, 3));
    session.answer('faux');
    while (session.current()) session.answer(session.current()!.answer);
    expect(session.result()).toMatchObject({ correct: 17, total: 18, passed: true });
  });

  it('revient à la forme d’avant pour la corriger', () => {
    const session = new VerbTestSession(conjugationBelt('blanche')!.exercises.slice(0, 3), () => 0.9);
    expect(session.undo()).toBeUndefined();
    // Validé par erreur après une lettre.
    session.answer('a');
    expect(session.attempted).toBe(1);
    expect(session.undo()).toBe('a');
    expect(session.attempted).toBe(0);
    while (session.current()) session.answer(session.current()!.answer);
    expect(session.result()).toMatchObject({ correct: 18, total: 18, mistakes: [] });
  });
});
