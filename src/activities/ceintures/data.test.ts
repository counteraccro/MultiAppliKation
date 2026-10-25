import { describe, expect, it } from 'vitest';
import { beltStatuses, formatDay, highestPassed, progressOf, readCeinturesData, setClassLevel } from './data';
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
