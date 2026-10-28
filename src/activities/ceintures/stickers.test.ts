import { describe, expect, it } from 'vitest';
import { countStickers } from '../../core/stickers';
import { progressOf, readCeinturesData, recordPractice, recordTest, setClassLevel } from './data';
import { beltMastery, masteryCounts } from './mastery';
import { STICKER_SECTIONS, STICKERS, unlockStickers, type SeriesEvent } from './stickers';
import { SUBJECTS } from './subjects';

const homophones = SUBJECTS[0]!;
const event = (overrides: Partial<SeriesEvent> = {}): SeriesEvent => ({
  subject: 'homophones',
  mode: 'practice',
  bestStreak: 0,
  correct: 5,
  total: 7,
  ...overrides,
});
// Sans le préfixe de la matière, pour lire les tests.
const ids = (stickers: { id: string }[]) => stickers.map((s) => s.id.replace('homophones.', ''));

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
    expect(level()).toBe('progress');
    setClassLevel(data, homophones, 0, '2026-10-26');
    expect(level()).toBe('known');
    const stats = progressOf(data, homophones).stats?.blanche;
    expect(stats).toEqual({
      practices: 2,
      goodPractices: 1,
      bestPractice: { correct: 9, total: 10 },
      tests: 1,
      bestTest: { correct: 13, total: 14 },
    });
  });

  it('un test sans faute donne le vert foncé', () => {
    const data = readCeinturesData({});
    recordTest(data, homophones, 'blanche', { correct: 12, total: 12 }, true, '2026-10-25');
    setClassLevel(data, homophones, 0, '2026-10-26');
    expect(beltMastery(progressOf(data, homophones), 'blanche')).toBe('mastered');
  });

  it('compte les ceintures de chaque couleur pour la barre de l’accueil', () => {
    const data = readCeinturesData({});
    setClassLevel(data, homophones, 1, '2026-10-25');
    // 9 homophones, 10 conjugaison, 10 tables et 5 calcul posé pas encore commencées.
    expect(masteryCounts(data)).toEqual({ unseen: 34, learning: 0, progress: 0, known: 2, mastered: 0 });
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
    // Réussi en conditions réelles : l'autocollant n'attend pas la validation en classe.
    expect(ids(unlockStickers(data, event({ mode: 'test', correct: 9, total: 10 })))).toEqual(['first-belt']);
    setClassLevel(data, homophones, 0, '2026-10-26');
    expect(unlockStickers(data, event({ mode: 'class', correct: 0, total: 0 }))).toEqual([]);
    expect(countStickers(data, STICKERS)).toBe(1);
  });

  it('compte les ceintures réussies en conditions réelles et celles notées en classe', () => {
    const data = readCeinturesData({});
    setClassLevel(data, homophones, 1, '2026-10-25');
    recordTest(data, homophones, 'orange', { correct: 10, total: 10 }, true, '2026-10-26');
    expect(ids(unlockStickers(data, event()))).toEqual(['first-belt', 'three-belts']);
  });

  it('récompense l’objectif de CM1 et la ceinture noire', () => {
    const data = readCeinturesData({});
    setClassLevel(data, homophones, 6, '2026-10-25');
    expect(ids(unlockStickers(data, event()))).toEqual(['first-belt', 'three-belts', 'goal-cm1']);
    setClassLevel(data, homophones, 10, '2026-10-25');
    expect(unlockStickers(data, event())).toMatchObject([{ id: 'homophones.last-belt', name: 'Ceinture noire' }]);
  });

  it('récompense l’objectif de CE2 et la ceinture brillante aux tables', () => {
    const tables = SUBJECTS[2]!;
    const data = readCeinturesData({});
    setClassLevel(data, tables, 7, '2026-10-27');
    expect(unlockStickers(data, event({ subject: 'tables', mode: 'class' })).map((s) => s.id)).toEqual([
      'tables.first-belt',
      'tables.three-belts',
      'tables.goal-ce2',
    ]);
    recordTest(data, tables, 'noire', { correct: 20, total: 20 }, true, '2026-10-27');
    recordTest(data, tables, 'brillante', { correct: 30, total: 30 }, true, '2026-10-27');
    expect(unlockStickers(data, event({ subject: 'tables', mode: 'test', correct: 30, total: 30 }))).toMatchObject([
      { id: 'tables.last-belt', name: 'Ceinture brillante' },
      { id: 'tables.perfect-test' },
    ]);
  });

  it('récompense un test sans faute, un entraînement parfait et les séries', () => {
    const data = readCeinturesData({});
    expect(ids(unlockStickers(data, event({ mode: 'test', correct: 12, total: 12 })))).toEqual(['perfect-test']);
    expect(ids(unlockStickers(data, event({ correct: 8, total: 8, bestStreak: 10 })))).toEqual(['perfect-practice', 'streak-10']);
  });

  it('range l’album par matière', () => {
    expect(STICKER_SECTIONS.map((s) => s.title)).toEqual(['Homophones', 'Conjugaison', 'Tables', 'Calcul posé']);
    // Calcul posé : pas de « dernière ceinture » tant que des ceintures sont à venir.
    expect(STICKER_SECTIONS[3]!.stickers.map((s) => s.id)).not.toContain('calcul-pose.last-belt');
    expect(STICKER_SECTIONS.flatMap((s) => s.stickers)).toEqual(STICKERS);
    const [homophones, conjugaison] = STICKER_SECTIONS;
    expect(homophones!.stickers.every((s) => s.id.startsWith('homophones.'))).toBe(true);
    expect(conjugaison!.stickers.map((s) => s.id)).toContain('conjugaison.goal-cm1');
    expect(conjugaison!.stickers.map((s) => s.name)).toContain('Ceinture marron');
    // Pas encore de ceinture « objectif CM1 » aux tables : elle viendra avec les divisions (mauve).
    expect(STICKER_SECTIONS[2]!.stickers.map((s) => s.name)).toContain('Ceinture brillante');
    expect(STICKER_SECTIONS[2]!.stickers.map((s) => s.id)).not.toContain('tables.goal-cm1');
    expect(STICKER_SECTIONS[2]!.stickers.map((s) => s.id)).toContain('tables.goal-ce2');
    expect(conjugaison!.stickers.map((s) => s.id)).not.toContain('conjugaison.goal-ce2');
  });

  it('garde les autocollants de la 0.21.0 sous leur nouveau nom, sans les jours', () => {
    const data = readCeinturesData({
      daysPlayed: 6,
      lastPlayedDay: '2026-10-25',
      stickers: { 'first-belt': 1, 'black-belt': 2, 'days-5': 3, 'homophones.streak-10': 4 },
    });
    expect(data.stickers).toEqual({ 'homophones.first-belt': 1, 'homophones.last-belt': 2, 'homophones.streak-10': 4 });
    expect(data).not.toHaveProperty('daysPlayed');
    expect(countStickers(data, STICKERS)).toBe(3);
  });

});
