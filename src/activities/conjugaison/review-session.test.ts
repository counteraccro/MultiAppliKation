import { describe, expect, it } from 'vitest';
import type { LeitnerState } from '../../core/leitner';
import { formKey, readConjugaisonData, recordAttempt } from './data';
import { knownCount, promotedCount, REVIEW_SIZE, ReviewSession, seenForms } from './review-session';
import { CONJUGATIONS, conjugationKey, PERSONS } from './verbs';

/** Toutes les formes d'un verbe-temps dans la même boîte. */
function fill(state: LeitnerState, key: string, box: number, lastSeen = 0) {
  for (const p of PERSONS) state[`${key}.${p}`] = { box, lastSeen };
}

function keysOf(session: ReviewSession): string[] {
  const keys: string[] = [];
  for (let q = session.current(); q; q = session.current()) {
    if (!keys.includes(formKey(q))) keys.push(formKey(q));
    session.answer(q.answer, 1000);
  }
  return keys;
}

describe('ReviewSession', () => {
  it('ne pose que des formes déjà vues', () => {
    const state: LeitnerState = {};
    fill(state, 'aller.futur', 1);
    fill(state, 'etre.present', 3);
    const keys = keysOf(new ReviewSession(state));
    expect(keys).toHaveLength(12);
    for (const key of keys) expect(key).toMatch(/^(aller\.futur|etre\.present)\.[1-6]$/);
  });

  it('pose 15 formes différentes quand il y en a assez', () => {
    const state: LeitnerState = {};
    for (const c of CONJUGATIONS.slice(0, 10)) fill(state, conjugationKey(c), 2);
    const session = new ReviewSession(state);
    expect(session.total).toBe(REVIEW_SIZE);
    expect(new Set(keysOf(session)).size).toBe(REVIEW_SIZE);
  });

  it('ignore les clés inconnues (verbe retiré, donnée abîmée)', () => {
    const state: LeitnerState = { 'courir.present.1': { box: 1, lastSeen: 0 } };
    fill(state, 'dire.imparfait', 1);
    expect(seenForms(state)).toHaveLength(6);
    expect(new ReviewSession(state).total).toBe(6);
  });

  it('range chaque premier essai dans les boîtes', () => {
    const data = readConjugaisonData({});
    fill(data.leitner, 'voir.futur', 2);
    const session = new ReviewSession(data.leitner, { onFirstAttempt: (a) => recordAttempt(data, a, 1) });
    const first = session.current()!;
    session.answer('faux', 1000);
    expect(data.leitner[formKey(first)]!.box).toBe(1);
    const second = session.current()!;
    session.answer(second.answer, 1000);
    expect(data.leitner[formKey(second)]!.box).toBe(3);
  });

  it('met à retravailler les erreurs, pas les réponses lentes', () => {
    const state: LeitnerState = {};
    fill(state, 'faire.present', 2);
    const session = new ReviewSession(state);
    let n = 0;
    for (let q = session.current(); q; q = session.current()) {
      n++;
      session.answer(n === 1 ? 'faux' : q.answer, n === 2 ? 60_000 : 1000);
    }
    expect(session.result()).toMatchObject({ correct: 5, total: 6 });
    expect(session.result().toPractice).toHaveLength(1);
  });
});

describe('knownCount', () => {
  it('compte un verbe-temps quand ses 6 formes sont en boîte 4 ou plus', () => {
    const state: LeitnerState = {};
    fill(state, 'aller.futur', 4);
    fill(state, 'etre.present', 5);
    fill(state, 'avoir.present', 4);
    state['avoir.present.3'] = { box: 3, lastSeen: 0 };
    expect(knownCount(state)).toBe(2);
  });
});

describe('promotedCount', () => {
  it('compte les formes montées d’une boîte', () => {
    const before: LeitnerState = {};
    fill(before, 'aller.futur', 2);
    const after = structuredClone(before);
    after['aller.futur.1'] = { box: 3, lastSeen: 1 };
    after['aller.futur.2'] = { box: 1, lastSeen: 1 };
    expect(promotedCount(before, after)).toBe(1);
  });
});
