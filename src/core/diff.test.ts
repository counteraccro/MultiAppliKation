import { describe, expect, it } from 'vitest';
import { closestAnswer, diff } from './diff';
import { isCorrect, normalizeAnswer } from './quiz';

describe('diff', () => {
  it('trouve la lettre qui diffère', () => {
    expect(diff('commencons', 'commençons')).toEqual([
      { kind: 'same', text: 'commen' },
      { kind: 'missing', text: 'ç' },
      { kind: 'extra', text: 'c' },
      { kind: 'same', text: 'ons' },
    ]);
  });

  it('trouve la lettre oubliée et la lettre en trop', () => {
    expect(diff('mangons', 'mangeons')).toEqual([
      { kind: 'same', text: 'mang' },
      { kind: 'missing', text: 'e' },
      { kind: 'same', text: 'ons' },
    ]);
    expect(diff('mangeeons', 'mangeons')).toEqual([
      { kind: 'same', text: 'mange' },
      { kind: 'extra', text: 'e' },
      { kind: 'same', text: 'ons' },
    ]);
  });

  it('trouve toutes les fautes, même éloignées', () => {
    const parts = diff('huits-cent-quarante-un', 'huit-cent-quarante-et-un');
    expect(parts.filter((p) => p.kind === 'extra').map((p) => p.text)).toEqual(['s']);
    expect(parts.filter((p) => p.kind === 'missing').map((p) => p.text).join('')).toBe('et-');
  });

  it('tout manque quand rien n’a été tapé', () => {
    expect(diff('', 'ont')).toEqual([{ kind: 'missing', text: 'ont' }]);
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
