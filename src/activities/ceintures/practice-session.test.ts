import { describe, expect, it } from 'vitest';
import { homophoneBelt, type Group } from './homophones';
import { pickSentences, PRACTICE_SIZE, PracticeSession, type PracticeItem } from './practice-session';

const group: Group = { choices: ['et', 'est'], rules: ['', ''], tip: '', examples: [], sentences: [] };
const item = (id: string, text: string): PracticeItem => ({ sentence: { id, text }, group });

const one = item('a', 'Le chat {est} noir {et} blanc.');
const two = item('b', 'Il {est} là.');
const three = item('c', 'Tom {et} Léa.');
const four = item('d', 'La mer {est} bleue.');
const five = item('e', 'Du pain {et} du lait.');

describe('entraînement d’une ceinture', () => {
  it('tire des phrases différentes dans la ceinture', () => {
    const items = pickSentences(homophoneBelt('blanche')!);
    expect(items).toHaveLength(PRACTICE_SIZE);
    expect(new Set(items.map((i) => i.sentence.id)).size).toBe(PRACTICE_SIZE);
  });

  it('corrige trou par trou, dans l’ordre', () => {
    const session = new PracticeSession([one, two]);
    expect(session.blank).toBe(0);
    expect(session.choose('est')).toBe(true);
    expect(session.blank).toBe(1);
    expect(session.current()).toBe(one);
    expect(session.choose('et')).toBe(true);
    expect(session.current()).toBe(two);
    expect(session.blank).toBe(0);
    expect(session.attempted).toBe(1);
  });

  it('fait revenir plus tard une phrase avec une erreur, puis la compte au premier passage', () => {
    const session = new PracticeSession([one, two, three, four, five]);
    expect(session.choose('et')).toBe(false);
    expect(session.choose('et')).toBe(true);
    // La phrase est finie (le trou faux est montré juste) : les suivantes, puis elle revient.
    expect(session.current()).toBe(two);
    session.choose('est');
    session.choose('et');
    session.choose('est');
    expect(session.current()).toBe(one);
    expect(session.isRetry()).toBe(true);
    session.choose('est');
    session.choose('et');
    expect(session.current()).toBe(five);
    session.choose('et');
    expect(session.current()).toBeUndefined();
    expect(session.result()).toEqual({ correct: 5, total: 6, toPractice: [one.sentence] });
  });

  it('ne compte que le premier passage', () => {
    const session = new PracticeSession([two]);
    session.choose('et');
    expect(session.current()).toBe(two);
    session.choose('et');
    session.choose('est');
    expect(session.current()).toBeUndefined();
    expect(session.result()).toEqual({ correct: 0, total: 1, toPractice: [two.sentence] });
    expect(session.attempted).toBe(1);
  });
});
