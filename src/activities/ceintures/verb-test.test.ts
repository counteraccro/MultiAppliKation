import { describe, expect, it } from 'vitest';
import { conjugationBelt } from './conjugaison';
import { VerbTestSession } from './verb-test';

describe('conjugaison en conditions réelles', () => {
  it('ne corrige rien pendant, et réussit à 90 % des formes', () => {
    const belt = conjugationBelt('blanche')!;
    const exercises = belt.exercises.slice(0, 3);
    const session = new VerbTestSession(exercises, () => 0.9);
    expect(session.total).toBe(18);
    const wrong: [string, string][] = [];
    let i = 0;
    while (session.current()) {
      const { answer, prompt } = session.current()!;
      // Deux fautes sur 18 : 88 %, pas assez.
      if (i === 3 || i === 10) wrong.push([prompt, 'faux']);
      session.answer(i === 3 || i === 10 ? 'faux' : answer);
      i++;
    }
    const result = session.result();
    expect(result).toMatchObject({ correct: 16, total: 18, passed: false });
    expect(result.mistakes.map((m) => [m.question.prompt, m.typed])).toEqual(wrong);
    expect(result.mistakes.every((m) => exercises.includes(m.exercise))).toBe(true);
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
