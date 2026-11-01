import { describe, expect, it } from 'vitest';
import { numberToWords, numberToWordsTraditional } from './number-words';

describe('numberToWords', () => {
  it('écrit les nombres comme les fiches et les leçons de la classe', () => {
    // Fiches Charivari (corrections) et leçons N1, N10.
    expect(numberToWords(76)).toBe('soixante-seize');
    expect(numberToWords(98)).toBe('quatre-vingt-dix-huit');
    expect(numberToWords(94)).toBe('quatre-vingt-quatorze');
    expect(numberToWords(163)).toBe('cent-soixante-trois');
    expect(numberToWords(360)).toBe('trois-cent-soixante');
    expect(numberToWords(124)).toBe('cent-vingt-quatre');
    expect(numberToWords(180)).toBe('cent-quatre-vingts');
    expect(numberToWords(420)).toBe('quatre-cent-vingt');
    expect(numberToWords(8352)).toBe('huit-mille-trois-cent-cinquante-deux');
    expect(numberToWords(35914)).toBe('trente-cinq-mille-neuf-cent-quatorze');
    expect(numberToWords(143591)).toBe('cent-quarante-trois-mille-cinq-cent-quatre-vingt-onze');
    expect(numberToWords(100391)).toBe('cent-mille-trois-cent-quatre-vingt-onze');
    expect(numberToWords(303030000)).toBe('trois-cent-trois-millions-trente-mille');
    expect(numberToWords(550050005)).toBe('cinq-cent-cinquante-millions-cinquante-mille-cinq');
    expect(numberToWords(7024835960)).toBe('sept-milliards-vingt-quatre-millions-huit-cent-trente-cinq-mille-neuf-cent-soixante');
  });

  it('met « et » dans 21, 31… 71, pas dans 81 ni 91', () => {
    expect(numberToWords(21)).toBe('vingt-et-un');
    expect(numberToWords(61)).toBe('soixante-et-un');
    expect(numberToWords(71)).toBe('soixante-et-onze');
    expect(numberToWords(81)).toBe('quatre-vingt-un');
    expect(numberToWords(91)).toBe('quatre-vingt-onze');
  });

  it('accorde cent et vingt seulement quand rien ne les suit, jamais mille', () => {
    expect(numberToWords(80)).toBe('quatre-vingts');
    expect(numberToWords(300)).toBe('trois-cents');
    expect(numberToWords(880)).toBe('huit-cent-quatre-vingts');
    expect(numberToWords(200000)).toBe('deux-cent-mille');
    expect(numberToWords(80000)).toBe('quatre-vingt-mille');
    expect(numberToWords(3000)).toBe('trois-mille');
    expect(numberToWords(1000)).toBe('mille');
    expect(numberToWords(100)).toBe('cent');
    expect(numberToWords(1000000)).toBe('un-million');
    expect(numberToWords(200000000)).toBe('deux-cents-millions');
  });

  it('écrit aussi l’orthographe traditionnelle', () => {
    expect(numberToWordsTraditional(21)).toBe('vingt et un');
    expect(numberToWordsTraditional(71)).toBe('soixante et onze');
    expect(numberToWordsTraditional(77)).toBe('soixante-dix-sept');
    expect(numberToWordsTraditional(98)).toBe('quatre-vingt-dix-huit');
    expect(numberToWordsTraditional(163)).toBe('cent soixante-trois');
    expect(numberToWordsTraditional(300)).toBe('trois cents');
    expect(numberToWordsTraditional(8352)).toBe('huit mille trois cent cinquante-deux');
    expect(numberToWordsTraditional(80000)).toBe('quatre-vingt mille');
  });
});
