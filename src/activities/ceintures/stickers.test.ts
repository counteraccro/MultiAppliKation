import { describe, expect, it } from 'vitest';
import { countStickers } from '../../core/stickers';
import { progressOf, readCeinturesData, recordPlayDay, recordPractice, recordTest, setClassLevel } from './data';
import { beltMastery, masteryCounts } from './mastery';
import { STICKERS, unlockStickers, type SeriesEvent } from './stickers';
import { SUBJECTS } from './subjects';

const homophones = SUBJECTS[0]!;
const event = (overrides: Partial<SeriesEvent> = {}): SeriesEvent => ({
  mode: 'practice',
  bestStreak: 0,
  correct: 5,
  total: 7,
  ...overrides,
});
const ids = (stickers: { id: string }[]) => stickers.map((s) => s.id);

describe('progrès des ceintures', () => {
  it('colore chaque ceinture d’après ses entraînements et son test', () => {
    const data = readCeinturesData({});
    const level = () => beltMastery(progressOf(data, homophones), 'blanche');
    expect(level()).toBe('unseen');
    recordPractice(data, homophones, 'blanche', [], { correct: 4, total: 7 });
    expect(level()).toBe('learning');
    recordPractice(data, homophones, 'blanche', [], { correct: 9, total: 10 });
    expect(level()).toBe('progress');
    recordTest(data, homophones, 'blanche', { correct: 13, total: 14 }, true, '2026-10-25');
    expect(level()).toBe('known');
    const stats = progressOf(data, homophones).stats?.blanche;
    expect(stats).toEqual({ practices: 2, bestPractice: { correct: 9, total: 10 }, tests: 1, bestTest: { correct: 13, total: 14 } });
  });

  it('un test sans faute donne le vert foncé', () => {
    const data = readCeinturesData({});
    recordTest(data, homophones, 'blanche', { correct: 12, total: 12 }, true, '2026-10-25');
    expect(beltMastery(progressOf(data, homophones), 'blanche')).toBe('mastered');
  });

  it('compte les ceintures de chaque couleur pour la barre de l’accueil', () => {
    const data = readCeinturesData({});
    setClassLevel(data, homophones, 1, '2026-10-25');
    expect(masteryCounts(data)).toEqual({ unseen: 9, learning: 0, progress: 0, known: 2, mastered: 0 });
  });

  it('ne garde pas des statistiques abîmées', () => {
    const data = readCeinturesData({
      homophones: { passed: {}, stats: { blanche: { practices: 2, bestPractice: { correct: 9, total: 3 } }, jaune: 'non' } },
    });
    expect(data.homophones?.stats).toEqual({ blanche: { practices: 2, tests: 0 } });
  });
});

describe('autocollants des ceintures', () => {
  it('colle la première ceinture une seule fois', () => {
    const data = readCeinturesData({});
    recordTest(data, homophones, 'blanche', { correct: 9, total: 10 }, true, '2026-10-25');
    expect(ids(unlockStickers(data, event({ mode: 'test', correct: 9, total: 10 })))).toEqual(['first-belt']);
    expect(unlockStickers(data, event({ mode: 'test', correct: 9, total: 10 }))).toEqual([]);
    expect(countStickers(data, STICKERS)).toBe(1);
  });

  it('récompense l’objectif de CM1 et la ceinture noire', () => {
    const data = readCeinturesData({});
    setClassLevel(data, homophones, 6, '2026-10-25');
    expect(ids(unlockStickers(data, event()))).toEqual(['first-belt', 'three-belts', 'goal-cm1']);
    setClassLevel(data, homophones, 10, '2026-10-25');
    expect(ids(unlockStickers(data, event()))).toEqual(['black-belt']);
  });

  it('récompense un test sans faute, un entraînement parfait et les séries', () => {
    const data = readCeinturesData({});
    expect(ids(unlockStickers(data, event({ mode: 'test', correct: 12, total: 12 })))).toEqual(['perfect-test']);
    expect(ids(unlockStickers(data, event({ correct: 8, total: 8, bestStreak: 10 })))).toEqual(['perfect-practice', 'streak-10']);
  });

  it('compte les jours de jeu', () => {
    const data = readCeinturesData({});
    const day = new Date(2026, 9, 1, 10).getTime();
    for (let i = 0; i < 5; i++) recordPlayDay(data, day + i * 86_400_000);
    recordPlayDay(data, day + 4 * 86_400_000 + 3_600_000);
    expect(data.daysPlayed).toBe(5);
    expect(ids(unlockStickers(data, event()))).toEqual(['days-5']);
    expect(readCeinturesData(JSON.parse(JSON.stringify(data))).daysPlayed).toBe(5);
  });
});
