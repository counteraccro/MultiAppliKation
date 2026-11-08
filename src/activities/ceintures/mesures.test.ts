import { describe, expect, it } from 'vitest';
import { isCorrect, splitMeasure } from '../../core/quiz';
import { compareMeasures, equality, MESURES, neighbourMonth, ribbon, segment, tallest, timeFact, unitFor } from './mesures';
import { NUMERATION_TEST_SIZE, pickNumeration } from './numeration';
import { CalcTestSession } from './table-practice';

/** Générateur pseudo-aléatoire reproductible. */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe('Mesures', () => {
  it('fait toucher l’unité qui convient', () => {
    const question = unitFor(11);
    expect(question.prompt).toBe('Une canette de soda contient 33');
    expect(question.choices?.map((c) => c.value)).toEqual(['ml', 'cl', 'L']);
    expect(question.answer).toBe('cl');
    expect(question.solved).toBe('Une canette de soda contient 33 cl.');
  });

  it('compare des longueurs en les écrivant dans la même unité', () => {
    const question = compareMeasures([[120, 'cm']], [[1, 'm']]);
    expect(question.answer).toBe('>');
    expect(question.explain.replace(/\u00a0/g, ' ')).toBe('On écrit tout en cm : 1 m = 100 cm. Puis 120 cm > 100 cm.');
    expect(compareMeasures([[90, 'mm']], [[1, 'cm']]).answer).toBe('>');
    expect(compareMeasures([[1000, 'mm']], [[1, 'm']]).answer).toBe('=');
    // Fiche n° 17 : 20 m + 3 mm > 2 cm + 30 mm ; 300 mm + 200 cm = 2 m + 30 cm.
    expect(compareMeasures([[20, 'm'], [3, 'mm']], [[2, 'cm'], [30, 'mm']]).answer).toBe('>');
    expect(compareMeasures([[300, 'mm'], [200, 'cm']], [[2, 'm'], [30, 'cm']]).answer).toBe('=');
  });

  it('écrit la case à la bonne place dans une égalité', () => {
    expect(equality('10 × 10 mm', '… cm', 10, '')).toMatchObject({ prompt: '10 × 10 mm =', suffix: 'cm', solved: '10 × 10 mm = 10 cm' });
    expect(equality('1 m − … cm', '50 cm', 50, '')).toMatchObject({ prompt: '1 m −', suffix: 'cm = 50 cm', solved: '1 m − 50 cm = 50 cm' });
  });

  it('propose les mois voisins', () => {
    const question = neighbourMonth(8, false, seeded(1));
    expect(question.answer).toBe('août');
    expect(question.choices).toHaveLength(4);
    expect(neighbourMonth(0, false).answer).toBe('décembre');
    expect(neighbourMonth(11, true).answer).toBe('janvier');
  });

  it('accepte une mesure dans une autre unité', () => {
    const question = segment(47);
    expect(question.answer).toBe('47 mm');
    expect(isCorrect(question, '47 mm')).toBe(true);
    expect(question.alsoAccepted).toEqual([]);
    expect(isCorrect(question, '47 cm')).toBe(false);
    expect(isCorrect(question, '47')).toBe(false);
    expect(segment(70).answer).toBe('7 cm');
    expect(isCorrect(segment(70), '70 mm')).toBe(true);
  });

  it('lit un segment qui ne part pas du 0', () => {
    expect(segment(35, 20).explain).toBe('Le segment part du 2 et s’arrête 5 mm après le 5 : on compte les graduations entre les deux : 3 cm et 5 mm, soit 35 mm. 1 cm = 10 mm.');
  });

  it('résout le problème du ruban (fiche n° 15)', () => {
    const question = ribbon(0, 2, 30);
    expect(question.answer).toBe('170 cm');
    expect(isCorrect(question, '170 cm')).toBe(true);
    // Pas de virgule au pavé de la jaune : 1,7 m ne se tape pas.
    expect(question.alsoAccepted).toEqual(['1\u00a0700 mm']);
    expect(isCorrect(question, '1700 mm')).toBe(true);
    expect(isCorrect(question, '170 m')).toBe(false);
    expect(question.solved).toBe('Maintenant, mon ruban mesure 170 cm.');
  });

  it('trouve le plus petit des quatre enfants (fiche n° 13)', () => {
    const question = tallest(['Ernest', 'Fleur', 'Gudule', 'Honoré'], [[1, 'm'], [950, 'mm'], [89, 'cm'], [1100, 'mm']], true);
    expect(question.answer).toBe('Gudule');
    expect(question.explain.replace(/\u00a0/g, ' ')).toBe('On écrit toutes les tailles en cm : Ernest 100 cm, Fleur 95 cm, Gudule 89 cm, Honoré 110 cm.');
  });

  it('connaît les relations entre jours, heures, minutes et secondes', () => {
    expect(timeFact(0)).toMatchObject({ prompt: 'Dans une heure, il y a', suffix: 'minutes.', answer: 60 });
  });

  it('tire des questions justes pour chaque ceinture', () => {
    for (const belt of MESURES) {
      for (let seed = 1; seed <= 40; seed++) {
        for (const question of pickNumeration(belt, NUMERATION_TEST_SIZE, [], seeded(seed))) {
          const answer = String(question.answer);
          expect(isCorrect(question, answer)).toBe(true);
          if (question.units) {
            expect(question.units).toContain(splitMeasure(answer).unit);
            for (const other of question.alsoAccepted ?? []) expect(question.units).toContain(splitMeasure(other).unit);
          } else if (question.choices) expect(question.choices.some((c) => c.value === question.answer)).toBe(true);
          if (typeof question.answer === 'number') {
            expect(Number.isInteger(question.answer)).toBe(true);
            expect(question.answer).toBeGreaterThan(0);
          }
          expect(`${question.prompt} ${question.suffix ?? ''} ${question.solved} ${question.explain}`).not.toMatch(/undefined|NaN/);
        }
      }
    }
  });

  it('tire des questions différentes', () => {
    for (const belt of MESURES) {
      const first = pickNumeration(belt, NUMERATION_TEST_SIZE, [], seeded(3));
      expect(new Set(first.map((q) => q.id)).size).toBe(NUMERATION_TEST_SIZE);
    }
  });

  it('se réussit avec 9 justes sur 10', () => {
    const questions = pickNumeration(MESURES[0]!, NUMERATION_TEST_SIZE, [], seeded(9));
    const session = new CalcTestSession(questions);
    for (const question of questions.slice(0, 9)) session.answer(String(question.answer));
    session.answer('mauvaise réponse');
    expect(session.result()).toMatchObject({ correct: 9, total: 10, passed: true });
  });
});
