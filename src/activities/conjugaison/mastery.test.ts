import { describe, expect, it } from 'vitest';
import type { LeitnerState } from '../../core/leitner';
import { conjugationMastery, masteryCounts } from './mastery';
import { CONJUGATIONS } from './verbs';

const allerFutur = CONJUGATIONS.find((c) => c.verb.id === 'aller' && c.tense.id === 'futur')!;
const boxes = (...list: number[]): LeitnerState =>
  Object.fromEntries(list.map((box, i) => [`aller.futur.${i + 1}`, { box, lastSeen: 0 }]));

describe('conjugationMastery', () => {
  it('prend la forme la moins sue', () => {
    expect(conjugationMastery({}, allerFutur)).toBe('unseen');
    expect(conjugationMastery(boxes(5, 5, 5, 5, 5, 5), allerFutur)).toBe('mastered');
    expect(conjugationMastery(boxes(5, 5, 4, 5, 5, 5), allerFutur)).toBe('known');
    expect(conjugationMastery(boxes(5, 5, 4, 5, 5, 2), allerFutur)).toBe('progress');
    expect(conjugationMastery(boxes(5, 1, 4, 5, 5, 2), allerFutur)).toBe('learning');
  });

  it('compte une forme pas encore vue « à travailler »', () => {
    expect(conjugationMastery(boxes(5, 5, 5), allerFutur)).toBe('learning');
  });
});

describe('masteryCounts', () => {
  it('compte les 80 verbe-temps', () => {
    const counts = masteryCounts(boxes(4, 4, 4, 4, 4, 4));
    expect(counts).toEqual({ unseen: 79, learning: 0, progress: 0, known: 1, mastered: 0 });
  });
});
