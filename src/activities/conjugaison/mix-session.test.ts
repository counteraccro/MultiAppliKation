import { describe, expect, it } from 'vitest';
import { readConjugaisonData } from './data';
import { cleanMixChoice, MIX_SIZE, mixSize, MixSession } from './mix-session';
import { VERBS } from './verbs';

function contexts(session: MixSession): string[] {
  const seen: string[] = [];
  for (let q = session.current(); q; q = session.current()) {
    seen.push(`${q.verb}.${q.tense}.${q.person}`);
    session.answer(q.answer, 1000);
  }
  return seen;
}

describe('MixSession', () => {
  it('ne pose que les temps et verbes cochés', () => {
    const forms = contexts(new MixSession({ tenses: ['imparfait'], verbs: ['faire', 'dire'] }));
    expect(forms).toHaveLength(12);
    expect(new Set(forms).size).toBe(12);
    for (const f of forms) expect(f).toMatch(/^(faire|dire)\.imparfait\.[1-6]$/);
  });

  it('pose 15 questions au plus, toutes différentes', () => {
    const session = new MixSession({ tenses: ['present', 'futur'], verbs: VERBS.map((v) => v.id) });
    expect(session.total).toBe(MIX_SIZE);
    expect(new Set(contexts(session)).size).toBe(MIX_SIZE);
  });

  it('annonce le bon nombre de questions', () => {
    expect(mixSize({ tenses: ['futur'], verbs: ['aller'] })).toBe(6);
    expect(mixSize({ tenses: ['futur', 'present'], verbs: ['aller'] })).toBe(12);
    expect(mixSize({ tenses: ['futur', 'present'], verbs: ['aller', 'voir'] })).toBe(15);
    expect(mixSize({ tenses: [], verbs: ['aller'] })).toBe(0);
  });

  it('met les erreurs à retravailler', () => {
    const session = new MixSession({ tenses: ['futur'], verbs: ['voir'] });
    let first = true;
    for (let q = session.current(); q; q = session.current()) {
      session.answer(first ? 'verai' : q.answer, 1000);
      first = false;
    }
    expect(session.result()).toMatchObject({ correct: 5, total: 6 });
    expect(session.result().toPractice).toHaveLength(1);
  });
});

describe('dernier choix du mélange', () => {
  it('est gardé, sans ce qui n’existe plus, dans l’ordre de l’accueil', () => {
    expect(cleanMixChoice({ tenses: ['futur', 'passe-simple' as never, 'present'], verbs: ['voir', 'courir', 'etre'] })).toEqual({
      tenses: ['present', 'futur'],
      verbs: ['etre', 'voir'],
    });
    expect(readConjugaisonData({ mix: { tenses: ['futur'], verbs: ['aller'] } }).mix).toEqual({ tenses: ['futur'], verbs: ['aller'] });
    expect(readConjugaisonData({}).mix).toBeUndefined();
  });
});
