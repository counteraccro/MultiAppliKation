import { describe, expect, it } from 'vitest';
import { blanksOf, fullSentence, parseSentence } from './sentence';

describe('phrases à trous', () => {
  it('coupe la phrase en texte et en trous', () => {
    expect(parseSentence('La route {est} longue {et} sinueuse.')).toEqual([
      'La route ',
      { answer: 'est', capital: false },
      ' longue ',
      { answer: 'et', capital: false },
      ' sinueuse.',
    ]);
    expect(blanksOf('Le chat a mang{é} la souris.')).toEqual(['é']);
  });

  it('met la majuscule en début de phrase seulement', () => {
    expect(fullSentence('{à} la plage, il y {a} du monde.')).toBe('À la plage, il y a du monde.');
    expect(fullSentence('J’aime bien cette émission. {et} toi ?')).toBe('J’aime bien cette émission. Et toi ?');
    expect(fullSentence('Circulez ! {on} ne voit rien.')).toBe('Circulez ! On ne voit rien.');
    expect(fullSentence('{on n’}a pas froid.')).toBe('On n’a pas froid.');
    expect(fullSentence('{qu’elles} sont gentilles !')).toBe('Qu’elles sont gentilles !');
    expect(fullSentence('C’{est} très bien.')).toBe('C’est très bien.');
    expect(fullSentence('Mang{er} équilibré, c’est important !')).toBe('Manger équilibré, c’est important !');
    expect(fullSentence('Dis-{leur} de venir.')).toBe('Dis-leur de venir.');
  });
});
