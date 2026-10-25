import { describe, expect, it } from 'vitest';
import {
  beltStatuses,
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

describe('progression des ceintures', () => {
  it('commence à la blanche, les autres fermées', () => {
    const statuses = beltStatuses(homophones, progressOf({}, homophones));
    expect(statuses[0]).toBe('current');
    expect(statuses.slice(1).every((s) => s === 'locked')).toBe(true);
    expect(highestPassed(homophones, progressOf({}, homophones))).toBe(-1);
  });

  it('ouvre la ceinture qui suit la dernière obtenue', () => {
    const data = readCeinturesData({ homophones: { passed: { blanche: '2026-10-20', jaune: '2026-10-25' } } });
    expect(beltStatuses(homophones, progressOf(data, homophones)).slice(0, 4)).toEqual(['passed', 'passed', 'current', 'locked']);
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

  it('un test réussi note la ceinture et ouvre la suivante', () => {
    const data = readCeinturesData({});
    recordTest(data, homophones, 'blanche', { correct: 10, total: 10 }, true, '2026-10-25');
    expect(data.homophones?.passed).toEqual({ blanche: '2026-10-25' });
    expect(beltStatuses(homophones, progressOf(data, homophones)).slice(0, 2)).toEqual(['passed', 'current']);
  });

  it('après un test raté, il faut s’entraîner avant de repasser', () => {
    const data = readCeinturesData({});
    recordTest(data, homophones, 'blanche', { correct: 5, total: 10 }, false, '2026-10-25');
    expect(mustPracticeFirst(progressOf(data, homophones), 'blanche')).toBe(true);
    recordPractice(data, homophones, 'blanche', ['blanche.1', 'blanche.2'], { correct: 6, total: 7 });
    expect(mustPracticeFirst(progressOf(data, homophones), 'blanche')).toBe(false);
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
    // Une fois obtenue, on ne le dit plus.
    recordTest(data, homophones, 'blanche', { correct: 10, total: 10 }, true, '2026-10-25');
    expect(ready()).toBe(false);
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
