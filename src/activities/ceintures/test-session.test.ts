import { describe, expect, it } from 'vitest';
import { homophoneBelt, type Group } from './homophones';
import type { PracticeItem } from './practice-session';
import { isPassing, pickTestSentences, TEST_SIZE, TestSession } from './test-session';

const group: Group = { choices: ['et', 'est'], rules: ['', ''], tip: '', examples: [], sentences: [] };
const item = (id: string, text: string): PracticeItem => ({ sentence: { id, text }, group });

describe('test de passage', () => {
  it('tire 10 phrases différentes', () => {
    const items = pickTestSentences(homophoneBelt('blanche')!);
    expect(items).toHaveLength(TEST_SIZE);
    expect(new Set(items.map((i) => i.sentence.id)).size).toBe(TEST_SIZE);
  });

  it('évite les phrases du dernier entraînement', () => {
    const belt = homophoneBelt('jaune')!;
    const seen = pickTestSentences(belt, [], 6).map((i) => i.sentence.id);
    for (let run = 0; run < 20; run++) {
      expect(pickTestSentences(belt, seen).some((i) => seen.includes(i.sentence.id))).toBe(false);
    }
  });

  it('prend chaque famille de mots de la ceinture', () => {
    for (const id of ['vert-clair', 'vert-fonce', 'marron'] as const) {
      const belt = homophoneBelt(id)!;
      const groups = new Set(pickTestSentences(belt).map((i) => i.group));
      expect(groups.size).toBe(belt.groups.length);
    }
  });

  it('ne dit rien pendant, compte chaque trou à la fin', () => {
    const session = new TestSession([item('a', 'Le chat {est} noir {et} blanc.'), item('b', 'Il {est} là.')]);
    expect(session.isRetry()).toBe(false);
    expect(session.choose('est')).toBe(true);
    expect(session.choose('est')).toBe(false);
    expect(session.attempted).toBe(1);
    // Une erreur ne fait pas revenir la phrase : le test avance.
    expect(session.current()?.sentence.id).toBe('b');
    session.choose('est');
    expect(session.current()).toBeUndefined();
    const result = session.result();
    expect(result).toMatchObject({ correct: 2, total: 3, passed: false });
    expect(result.mistakes).toEqual([{ sentence: { id: 'a', text: 'Le chat {est} noir {et} blanc.' }, chosen: ['est', 'est'] }]);
  });

  it('réussi à partir de 90 % des trous', () => {
    expect(isPassing(9, 10)).toBe(true);
    expect(isPassing(8, 10)).toBe(false);
    expect(isPassing(27, 30)).toBe(true);
    expect(isPassing(10, 12)).toBe(false);
    expect(isPassing(0, 0)).toBe(false);
  });
});
