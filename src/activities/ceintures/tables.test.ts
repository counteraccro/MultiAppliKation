import { describe, expect, it } from 'vitest';
import { beltOf } from './belts';
import { gradeGoal } from './grade';
import { factText, pickFacts, PRACTICE_SIZE, TablePracticeSession, TableTestSession } from './table-practice';
import { beltFacts, newTables, TABLE_BELTS } from './tables';

const belt = (id: string) => TABLE_BELTS.find((b) => b.belt === id)!;

describe('ceintures de tables', () => {
  it('suit le classeur, de la blanche à la brillante (sans les divisions)', () => {
    expect(TABLE_BELTS.map((b) => `${beltOf(b.belt).label} : ${b.skill}`)).toEqual([
      'blanche : Tables de 2 et 10',
      'jaune : Table de 5',
      'orange : Table de 3',
      'rose : Table de 4',
      'vert clair : Table de 6',
      'vert foncé : Table de 7',
      'bleu clair : Table de 8',
      'bleu foncé : Table de 9',
      'noire : Tables de 1 à 12',
      'brillante : Toutes les précédentes, plus rapidement',
    ]);
    expect(TABLE_BELTS.filter((b) => b.goal).map((b) => [b.belt, b.goal])).toEqual([
      ['bleu-fonce', 'CE2'],
      ['noire', 'CM2'],
    ]);
    expect(gradeGoal('CE2')).toBe('CE2');
  });

  it('donne chaque multiplication une fois, dans un seul sens', () => {
    // 2 × 10 et 10 × 2 sont la même.
    expect(beltFacts(belt('blanche'))).toHaveLength(19);
    expect(beltFacts(belt('jaune'))).toEqual(['1x5', '2x5', '3x5', '4x5', '5x5', '5x6', '5x7', '5x8', '5x9', '5x10']);
    expect(beltFacts(belt('noire'))).toContain('7x12');
    expect(beltFacts(belt('noire'))).not.toContain('11x12');
  });

  it('a des astuces justes', () => {
    for (const b of TABLE_BELTS) expect(b.tips.length, b.belt).toBeGreaterThan(0);
    // Les calculs écrits dans les astuces : « 6 × 7 = 35 + 7 = 42 », « 12 × 7 = 70 + 14 = 84 ».
    for (const tip of TABLE_BELTS.flatMap((b) => b.tips)) {
      for (const [, a, b, result] of tip.matchAll(/(\d+) × (\d+) = (?:[\d +−]+ = )?(\d+)/g)) {
        expect(Number(a) * Number(b), tip).toBe(Number(result));
      }
    }
  });

  it('montre à la leçon les tables pas encore vues', () => {
    expect(newTables(belt('blanche'))).toEqual([2, 10]);
    expect(newTables(belt('noire'))).toEqual([1, 11, 12]);
    expect(newTables(belt('brillante'))).toEqual([]);
  });
});

describe('séries de tables', () => {
  it('tire chaque calcul une fois avant d’en redonner un, jamais deux fois de suite', () => {
    const jaune = belt('jaune');
    for (let run = 0; run < 20; run++) {
      const keys = pickFacts(jaune, 20);
      expect(keys).toHaveLength(20);
      expect(new Set(keys.slice(0, 10)).size).toBe(10);
      keys.slice(1).forEach((key, i) => expect(key).not.toBe(keys[i]));
    }
  });

  it('commence par les calculs pas vus au dernier entraînement', () => {
    const seen = ['1x5', '2x5', '3x5', '4x5', '5x5'];
    const keys = pickFacts(belt('jaune'), 5, seen);
    expect(keys.every((k) => !seen.includes(k))).toBe(true);
  });

  it('entraînement : 10 calculs, un raté revient et compte faux', () => {
    const session = new TablePracticeSession(pickFacts(belt('vert-fonce'), PRACTICE_SIZE));
    expect(session.total).toBe(10);
    const first = session.current()!;
    session.answer('0', 1000);
    while (session.current()) session.answer(String(session.current()!.answer), 1000);
    expect(session.result()).toEqual({ correct: 9, total: 10, toPractice: [factText(first)] });
    expect(factText(first)).toMatch(/^\d+ × \d+ = \d+$/);
  });

  it('conditions réelles : 18 justes sur 20, et ceux qui manquent comptent faux', () => {
    const session = new TableTestSession(pickFacts(belt('orange'), 20));
    session.answer('0');
    for (let i = 0; i < 17; i++) session.answer(String(session.current()!.answer));
    // Le temps est fini avant les deux derniers.
    const result = session.result();
    expect(result).toMatchObject({ correct: 17, total: 20, passed: false });
    expect(result.mistakes.map((m) => m.typed)).toEqual(['0', undefined, undefined]);

    session.answer(String(session.current()!.answer));
    session.answer(String(session.current()!.answer));
    expect(session.result()).toMatchObject({ correct: 19, total: 20, passed: true });
  });

  it('conditions réelles : revient au calcul d’avant pour le corriger', () => {
    const session = new TableTestSession(pickFacts(belt('rose'), 20));
    expect(session.undo()).toBeUndefined();
    session.answer('2');
    expect(session.undo()).toBe('2');
    expect(session.attempted).toBe(0);
  });
});
