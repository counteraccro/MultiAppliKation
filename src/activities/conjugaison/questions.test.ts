import { describe, expect, it } from 'vitest';
import { isCorrect } from '../../core/quiz';
import { conjugationQuestion } from './questions';
import { CONJUGATIONS } from './verbs';

const find = (verb: string, tense: string) => CONJUGATIONS.find((c) => c.verb.id === verb && c.tense.id === tense)!;
const etre = find('etre', 'present');
const avoir = find('avoir', 'present');
const aller = find('aller', 'passe-compose');
const masculine = () => 0.9;
const feminine = () => 0.1;

describe('conjugationQuestion', () => {
  it('élide « je » devant une voyelle', () => {
    expect(conjugationQuestion(avoir, 1).prompt).toBe('j’');
    expect(conjugationQuestion(etre, 1).prompt).toBe('je');
  });

  it('montre l’infinitif et le temps, garde les identifiants', () => {
    expect(conjugationQuestion(find('esperer', 'futur'), 4)).toMatchObject({
      verb: 'esperer',
      tense: 'futur',
      person: 4,
      context: 'espérer · futur',
    });
  });

  it('accorde le participe avec « elle » au passé composé', () => {
    expect(conjugationQuestion(aller, 3, feminine)).toMatchObject({ prompt: 'elle', answer: 'est allée' });
    expect(conjugationQuestion(aller, 6, masculine)).toMatchObject({ prompt: 'ils', answer: 'sont allés' });
  });

  it('accepte les deux genres quand il ne se voit pas', () => {
    const vous = conjugationQuestion(aller, 5);
    for (const form of ['êtes allés', 'êtes allé', 'êtes allée', 'êtes allées']) expect(isCorrect(vous, form)).toBe(true);
    expect(isCorrect(vous, 'êtes alle')).toBe(false);
  });

  it('n’accepte qu’un genre quand le pronom le dit', () => {
    const elle = conjugationQuestion(aller, 3, feminine);
    expect(isCorrect(elle, 'est allé')).toBe(false);
  });
});
