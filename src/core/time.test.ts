import { describe, expect, it } from 'vitest';
import { formatDuration } from './time';

describe('formatDuration', () => {
  it('affiche les secondes au dixième', () => {
    expect(formatDuration(0)).toBe('0,0 s');
    expect(formatDuration(42_349)).toBe('42,3 s');
    expect(formatDuration(5_000)).toBe('5,0 s');
  });

  it('passe aux minutes au-delà de 60 s', () => {
    expect(formatDuration(60_000)).toBe('1 min 00,0 s');
    expect(formatDuration(65_300)).toBe('1 min 05,3 s');
    expect(formatDuration(125_900)).toBe('2 min 05,9 s');
  });

  it('ne descend jamais sous zéro', () => {
    expect(formatDuration(-500)).toBe('0,0 s');
  });
});
