import { describe, expect, it } from 'vitest';
import { readConjugaisonData, recordAttempt } from './data';
import { conjugationQuestion } from './questions';
import { STICKERS, stickerCount, unlockStickers, type SeriesEvent } from './stickers';
import { CONJUGATIONS, conjugationKey, conjugationsOf, PERSONS } from './verbs';

const event = (overrides: Partial<SeriesEvent> = {}): SeriesEvent => ({
  mode: 'learn',
  bestStreak: 0,
  correct: 6,
  total: 6,
  ...overrides,
});

describe('unlockStickers', () => {
  it('colle un autocollant une seule fois', () => {
    const data = readConjugaisonData(undefined);
    data.stars['aller.futur'] = 1;
    expect(unlockStickers(data, event()).map((s) => s.id)).toEqual(['first-star']);
    expect(unlockStickers(data, event())).toEqual([]);
    expect(stickerCount(data)).toBe(1);
  });

  it('fait le tour d’un temps avec une étoile à chacun des 20 verbes', () => {
    const data = readConjugaisonData(undefined);
    for (const c of conjugationsOf('imparfait')) data.stars[conjugationKey(c)] = 1;
    const ids = unlockStickers(data, event()).map((s) => s.id);
    expect(ids).toContain('tour-imparfait');
    expect(ids).toContain('irregulars');
    expect(ids).not.toContain('tour-present');
    expect(ids).not.toContain('crown');
  });

  it('met être et avoir en vert quand leurs 4 temps sont connus', () => {
    const data = readConjugaisonData(undefined);
    for (const c of CONJUGATIONS.filter((c) => ['etre', 'avoir'].includes(c.verb.id)))
      for (const p of PERSONS) data.leitner[`${conjugationKey(c)}.${p}`] = { box: 4, lastSeen: 0 };
    expect(unlockStickers(data, event()).map((s) => s.id)).toEqual(['etre-avoir']);
  });

  it('récompense les séries, la révision et le mélange sans erreur', () => {
    const data = readConjugaisonData(undefined);
    expect(unlockStickers(data, event({ mode: 'review', bestStreak: 12, correct: 15, total: 15 })).map((s) => s.id)).toEqual([
      'streak-10',
      'review-perfect',
    ]);
    expect(unlockStickers(data, event({ mode: 'mix', correct: 14, total: 15 }))).toEqual([]);
    expect(unlockStickers(data, event({ mode: 'mix', correct: 15, total: 15 })).map((s) => s.id)).toEqual(['mix-perfect']);
  });

  it('compte les jours de jeu à chaque réponse', () => {
    const data = readConjugaisonData(undefined);
    const day = new Date(2026, 9, 20, 10).getTime();
    const question = conjugationQuestion(CONJUGATIONS[0]!, 1);
    for (let i = 0; i < 5; i++) recordAttempt(data, { question, correct: true, elapsedMs: 1000 }, day + i * 86_400_000);
    expect(data.daysPlayed).toBe(5);
    expect(unlockStickers(data, event({ correct: 0 })).map((s) => s.id)).toEqual(['days-5']);
  });

  it('a des identifiants uniques', () => {
    expect(new Set(STICKERS.map((s) => s.id)).size).toBe(STICKERS.length);
  });
});
