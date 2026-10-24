import { describe, expect, it } from 'vitest';
import { closestAnswer, diffParts } from './diff';
import { isCorrect, normalizeAnswer } from './quiz';

describe('diffParts', () => {
  it('surligne la lettre qui diffère', () => {
    expect(diffParts('commencons', 'commençons')).toEqual(['commen', 'ç', 'ons']);
  });

  it('surligne la lettre oubliée', () => {
    expect(diffParts('mangons', 'mangeons')).toEqual(['mang', 'e', 'ons']);
  });

  it('ne surligne rien quand une lettre est en trop', () => {
    expect(diffParts('mangeeons', 'mangeons')).toEqual(['mange', '', 'ons']);
  });

  it('surligne tout quand rien ne correspond', () => {
    expect(diffParts('', 'ont')).toEqual(['', 'ont', '']);
  });
});

describe('closestAnswer', () => {
  it('choisit la forme la plus proche de ce qui a été tapé', () => {
    expect(closestAnswer('suis allee', ['suis allé', 'suis allée'])).toBe('suis allée');
    expect(closestAnswer('suis alle', ['suis allé', 'suis allée'])).toBe('suis allé');
  });
});

describe('isCorrect', () => {
  it('compare les mots sans tenir compte des espaces ni des majuscules', () => {
    const q = { prompt: 'nous', answer: 'avons mangé' };
    expect(isCorrect(q, '  Avons   mangé ')).toBe(true);
    expect(normalizeAnswer('  Avons   mangé ')).toBe('avons mangé');
  });

  it('compte faux un accent oublié ou de travers', () => {
    const q = { prompt: 'nous', answer: 'avons mangé' };
    expect(isCorrect(q, 'avons mange')).toBe(false);
    expect(isCorrect(q, 'avons mangè')).toBe(false);
  });

  it('accepte les autres formes justes', () => {
    const q = { prompt: 'je', answer: 'suis allé', alsoAccepted: ['suis allée'] };
    expect(isCorrect(q, 'suis allée')).toBe(true);
  });

  it('garde la comparaison des nombres', () => {
    expect(isCorrect({ prompt: '7 × 8', answer: 56 }, '56')).toBe(true);
    expect(isCorrect({ prompt: '7 × 8', answer: 56 }, '')).toBe(false);
  });
});
