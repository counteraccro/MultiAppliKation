import { describe, expect, it } from 'vitest';
import { readConjugaisonData, recordAttempt, recordStars, starsOf } from './data';
import { suggestedConjugation } from './home';
import { fastMs, LearnSession, starsFor } from './learn-session';
import type { ConjugationQuestion } from './questions';
import { CONJUGATIONS } from './verbs';

const find = (verb: string, tense: string) => CONJUGATIONS.find((c) => c.verb.id === verb && c.tense.id === tense)!;
const allerFutur = find('aller', 'futur');

/** Répond à toute la série ; `respond` décide de la réponse et du temps mis. */
function play(session: LearnSession, respond: (q: ConjugationQuestion) => [string, number]) {
  let guard = 0;
  for (let q = session.current(); q; q = session.current()) {
    if (++guard > 100) throw new Error('La série ne finit pas');
    session.answer(...respond(q));
  }
  return session.result();
}

describe('LearnSession', () => {
  it('pose les 6 personnes du verbe à ce temps, chacune une fois', () => {
    const seen: number[] = [];
    play(new LearnSession(allerFutur), (q) => {
      expect(q).toMatchObject({ verb: 'aller', tense: 'futur' });
      seen.push(q.person);
      return [q.answer, 1000];
    });
    expect(seen.sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('donne 3 étoiles si tout est juste et rapide', () => {
    expect(play(new LearnSession(allerFutur), (q) => [q.answer, 1000]).stars).toBe(3);
  });

  it('donne 2 étoiles si une réponse est lente, et la met à retravailler', () => {
    const result = play(new LearnSession(allerFutur), (q) => [q.answer, q.person === 4 ? fastMs(q.answer) : 1000]);
    expect(result.stars).toBe(2);
    expect(result.toPractice.map((q) => q.answer)).toEqual(['irons']);
  });

  it('donne 1 étoile avec une erreur, 0 avec deux ; l’erreur revient sans compter', () => {
    const tries = new Map<number, number>();
    const one = play(new LearnSession(allerFutur), (q) => {
      tries.set(q.person, (tries.get(q.person) ?? 0) + 1);
      return [q.person === 2 && tries.get(2) === 1 ? 'iras!' : q.answer, 1000];
    });
    expect(tries.get(2)).toBe(2);
    expect(one).toMatchObject({ stars: 1, correct: 5 });
    const missed = new Set<number>();
    const two = play(new LearnSession(allerFutur), (q) => {
      const wrong = q.person <= 2 && !missed.has(q.person);
      missed.add(q.person);
      return [wrong ? 'non' : q.answer, 1000];
    });
    expect(two.stars).toBe(0);
  });

  it('accorde plus de temps aux formes longues', () => {
    expect(fastMs('a')).toBe(3500);
    expect(fastMs('sommes allées')).toBe(9000);
  });

  it('étoiles : au moins 5 sur 6 pour la première', () => {
    expect(starsFor(4, 6, false)).toBe(0);
    expect(starsFor(5, 6, false)).toBe(1);
    expect(starsFor(6, 6, false)).toBe(2);
    expect(starsFor(6, 6, true)).toBe(3);
  });
});

describe('données du profil', () => {
  it('garde la meilleure note par verbe-temps', () => {
    const data = readConjugaisonData(undefined);
    expect(recordStars(data, allerFutur, 2)).toBe(true);
    expect(recordStars(data, allerFutur, 1)).toBe(false);
    expect(starsOf(data, allerFutur)).toBe(2);
    expect(data.stars).toEqual({ 'aller.futur': 2 });
  });

  it('range chaque forme dans sa boîte : « aller.futur.4 »', () => {
    const data = readConjugaisonData({});
    const session = new LearnSession(allerFutur, { onFirstAttempt: (a) => recordAttempt(data, a, 0) });
    play(session, (q) => [q.answer, 1000]);
    expect(Object.keys(data.leitner).sort()).toEqual([1, 2, 3, 4, 5, 6].map((p) => `aller.futur.${p}`));
    expect(data.leitner['aller.futur.4']!.box).toBe(2);
  });

  it('oublie un onglet de temps inconnu', () => {
    expect(readConjugaisonData({ tense: 'futur' }).tense).toBe('futur');
    expect(readConjugaisonData({ tense: 'passe-simple' }).tense).toBeUndefined();
  });

  it('ne modifie pas ce qui est enregistré tant qu’on ne sauvegarde pas', () => {
    const saved = { stars: {}, leitner: {} };
    recordStars(readConjugaisonData(saved), allerFutur, 3);
    expect(saved.stars).toEqual({});
  });
});

describe('verbe conseillé', () => {
  it('suit l’ordre : être, avoir, chanter, finir, aller, faire…', () => {
    const data = readConjugaisonData({});
    const order: string[] = [];
    for (let i = 0; i < 6; i++) {
      const next = suggestedConjugation(data, 'present')!;
      order.push(next.verb.id);
      recordStars(data, next, 1);
    }
    expect(order).toEqual(['etre', 'avoir', 'chanter', 'finir', 'aller', 'faire']);
  });

  it('revient aux verbes pas encore à 3 étoiles, puis plus rien', () => {
    const data = readConjugaisonData({});
    const present = CONJUGATIONS.filter((c) => c.tense.id === 'present');
    for (const c of present) recordStars(data, c, 3);
    recordStars(data, present[0]!, 3);
    data.stars['avoir.present'] = 2;
    expect(suggestedConjugation(data, 'present')!.verb.id).toBe('avoir');
    data.stars['avoir.present'] = 3;
    expect(suggestedConjugation(data, 'present')).toBeUndefined();
    expect(suggestedConjugation(data, 'futur')!.verb.id).toBe('etre');
  });
});
