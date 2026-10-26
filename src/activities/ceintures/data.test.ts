import { describe, expect, it } from 'vitest';
import {
  beltStatuses,
  canTakeTest,
  formatDay,
  highestPassed,
  isReady,
  mustPracticeFirst,
  progressOf,
  readCeinturesData,
  recordPractice,
  recordTest,
  setClassLevel,
} from './data';
import { gradeGoal, gradeNote } from './grade';
import { SUBJECTS } from './subjects';

const homophones = SUBJECTS[0]!;
const conjugaison = SUBJECTS[1]!;

describe('progression des ceintures', () => {
  it('commence à la blanche, les autres à faire mais ouvertes', () => {
    const statuses = beltStatuses(homophones, progressOf({}, homophones));
    expect(statuses[0]).toBe('current');
    expect(statuses.slice(1).every((s) => s === 'todo')).toBe(true);
    expect(highestPassed(homophones, progressOf({}, homophones))).toBe(-1);
  });

  it('la ceinture en cours est la première pas encore faite', () => {
    const data = readCeinturesData({ homophones: { passed: { blanche: '2026-10-20', jaune: '2026-10-25' } } });
    expect(beltStatuses(homophones, progressOf(data, homophones)).slice(0, 4)).toEqual(['passed', 'passed', 'current', 'todo']);
    expect(highestPassed(homophones, progressOf(data, homophones))).toBe(1);
  });

  it('ne garde pas une ceinture inconnue ni une date illisible', () => {
    const data = readCeinturesData({ homophones: { passed: { blanche: '2026-10-20', jaune: 12, mauve: '2026-10-20', orange: 'hier' } } });
    expect(data.homophones?.passed).toEqual({ blanche: '2026-10-20' });
    expect(readCeinturesData(null)).toEqual({});
    expect(readCeinturesData({ homophones: { passed: null } }).homophones?.passed).toEqual({});
  });

  it('une ceinture obtenue en classe note aussi celles d’en dessous, en gardant leur date', () => {
    const data = readCeinturesData({ homophones: { passed: { blanche: '2026-09-15' } } });
    setClassLevel(data, homophones, 2, '2026-10-25');
    expect(data.homophones?.passed).toEqual({ blanche: '2026-09-15', jaune: '2026-10-25', orange: '2026-10-25' });
  });

  it('un adulte peut redescendre (erreur de saisie)', () => {
    const data = readCeinturesData({ homophones: { passed: { blanche: '2026-09-15', jaune: '2026-10-01' } } });
    setClassLevel(data, homophones, 0, '2026-10-25');
    expect(data.homophones?.passed).toEqual({ blanche: '2026-09-15' });
    setClassLevel(data, homophones, -1, '2026-10-25');
    expect(data.homophones?.passed).toEqual({});
  });

  it('réussi en conditions réelles : la suivante devient celle en cours, la ceinture reste à passer en classe', () => {
    const data = readCeinturesData({});
    const statuses = () => beltStatuses(homophones, progressOf(data, homophones)).slice(0, 4);
    recordTest(data, homophones, 'blanche', { correct: 10, total: 10 }, true, '2026-10-25');
    expect(data.homophones?.passed).toEqual({});
    expect(data.homophones?.passedTest).toEqual({ blanche: '2026-10-25' });
    expect(statuses()).toEqual(['tested', 'current', 'todo', 'todo']);
    recordTest(data, homophones, 'jaune', { correct: 9, total: 10 }, true, '2026-10-26');
    expect(statuses()).toEqual(['tested', 'tested', 'current', 'todo']);
    expect(highestPassed(homophones, progressOf(data, homophones))).toBe(-1);
    // Seul un adulte la note obtenue (et celles d'en dessous).
    setClassLevel(data, homophones, 1, '2026-10-27');
    expect(statuses()).toEqual(['passed', 'passed', 'current', 'todo']);
    expect(readCeinturesData(JSON.parse(JSON.stringify(data))).homophones?.passedTest).toEqual({ blanche: '2026-10-25', jaune: '2026-10-26' });
  });

  it('une ceinture plus haute peut être réussie avant : celle en cours reste la première pas faite', () => {
    const data = readCeinturesData({});
    recordTest(data, homophones, 'orange', { correct: 10, total: 10 }, true, '2026-10-25');
    expect(beltStatuses(homophones, progressOf(data, homophones)).slice(0, 4)).toEqual(['current', 'todo', 'tested', 'todo']);
  });

  it('l’entraînement en conditions réelles est ouvert sur toute ceinture pas encore obtenue', () => {
    const data = readCeinturesData({});
    expect(canTakeTest(progressOf(data, homophones), 'noire')).toBe(true);
    setClassLevel(data, homophones, 0, '2026-10-25');
    expect(canTakeTest(progressOf(data, homophones), 'blanche')).toBe(false);
  });

  it('après un test raté, il faut s’entraîner avant de repasser', () => {
    const data = readCeinturesData({});
    recordTest(data, homophones, 'blanche', { correct: 5, total: 10 }, false, '2026-10-25');
    expect(mustPracticeFirst(progressOf(data, homophones), 'blanche')).toBe(true);
    expect(canTakeTest(progressOf(data, homophones), 'blanche')).toBe(false);
    recordPractice(data, homophones, 'blanche', ['blanche.1', 'blanche.2'], { correct: 6, total: 7 });
    expect(mustPracticeFirst(progressOf(data, homophones), 'blanche')).toBe(false);
    expect(canTakeTest(progressOf(data, homophones), 'blanche')).toBe(true);
    expect(progressOf(data, homophones).lastPractice).toEqual({ blanche: ['blanche.1', 'blanche.2'] });
  });

  it('relit le dernier entraînement et le test raté sans garder ce qui est abîmé', () => {
    const data = readCeinturesData({
      homophones: {
        passed: {},
        lastPractice: { blanche: ['blanche.1', 3], mauve: ['x'], jaune: 'non' },
        failedTest: { blanche: '2026-10-25', jaune: true },
      },
    });
    expect(data.homophones?.lastPractice).toEqual({ blanche: ['blanche.1'] });
    expect(data.homophones?.failedTest).toEqual({ blanche: '2026-10-25' });
  });

  it('prêt pour la ceinture après 3 entraînements réussis', () => {
    const data = readCeinturesData({});
    const ready = () => isReady(progressOf(data, homophones), 'blanche');
    recordPractice(data, homophones, 'blanche', [], { correct: 9, total: 10 });
    recordPractice(data, homophones, 'blanche', [], { correct: 5, total: 10 });
    recordPractice(data, homophones, 'blanche', [], { correct: 7, total: 7 });
    expect(ready()).toBe(false);
    recordPractice(data, homophones, 'blanche', [], { correct: 8, total: 8 });
    expect(ready()).toBe(true);
    expect(progressOf(data, homophones).stats?.blanche?.goodPractices).toBe(3);
    // Une fois obtenue en classe, on ne le dit plus.
    setClassLevel(data, homophones, 0, '2026-10-25');
    expect(ready()).toBe(false);
  });

  it('n’enregistre que le score d’un résultat', () => {
    const data = readCeinturesData({});
    const result = { correct: 5, total: 6, toPractice: ['je place'] };
    recordPractice(data, homophones, 'blanche', [], result);
    const testResult = { ...result, mistakes: [] };
    recordTest(data, homophones, 'blanche', testResult, false, '2026-10-26');
    expect(data.homophones?.stats?.blanche?.bestPractice).toEqual({ correct: 5, total: 6 });
    expect(data.homophones?.stats?.blanche?.bestTest).toEqual({ correct: 5, total: 6 });
  });

  it('garde une progression par matière', () => {
    const data = readCeinturesData({
      homophones: { passed: { blanche: '2026-10-20' } },
      conjugaison: { passed: { blanche: '2026-10-21', noire: '2026-10-21' }, passedTest: { jaune: '2026-10-26' } },
    });
    // Pas de ceinture noire en conjugaison : elle n'est pas comptée.
    expect(beltStatuses(conjugaison, progressOf(data, conjugaison)).slice(0, 3)).toEqual(['passed', 'tested', 'current']);
    expect(beltStatuses(conjugaison, progressOf(data, conjugaison)).length).toBe(10);
    setClassLevel(data, conjugaison, 2, '2026-10-26');
    expect(data.homophones?.passed).toEqual({ blanche: '2026-10-20' });
    expect(highestPassed(conjugaison, progressOf(data, conjugaison))).toBe(2);
  });

  it('écrit la date comme dans le classeur', () => {
    const today = new Date(2026, 9, 25);
    expect(formatDay('2026-10-05', today)).toBe('05/10');
    expect(formatDay('2025-06-30', today)).toBe('30/06/2025');
  });
});

describe('classe du profil', () => {
  it('prévient les plus petits que ce sont des ceintures de CM1', () => {
    expect(gradeNote('CE2')).toContain('CM1');
    expect(gradeNote('CM1')).toBeUndefined();
  });

  it('met en avant l’objectif de sa classe', () => {
    expect(gradeGoal('CM1')).toBe('CM1');
    expect(gradeGoal('CM2')).toBe('CM2');
    expect(gradeGoal('CE2')).toBeUndefined();
    expect(homophones.belts.filter((b) => b.goal).map((b) => [b.belt, b.goal])).toEqual([
      ['bleu-clair', 'CM1'],
      ['noire', 'CM2'],
    ]);
  });
});
