import { describe, expect, it } from 'vitest';
import { isCorrect, splitMeasure } from '../../core/quiz';
import {
  compareMeasures,
  convert,
  equality,
  heaviestOrca,
  MESURES,
  mixedPerimeter,
  monthDays,
  mostOf,
  neighbourMonth,
  rectanglePerimeter,
  rectangleSide,
  ribbon,
  segment,
  squarePerimeter,
  squareSide,
  tallest,
  timeFact,
  twoUnits,
  unitFor,
} from './mesures';
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

  it('calcule le périmètre d’un rectangle et d’un carré (fiches n° 19 à 23)', () => {
    const room = rectanglePerimeter(0, 4, 3);
    expect(room).toMatchObject({ prompt: 'Ma chambre mesure 4 m sur 3 m. Quel est son périmètre ?', answer: '14 m' });
    expect(room.solved).toBe('Le périmètre de ma chambre est de 14\u00a0m.');
    expect(isCorrect(room, '1400 cm')).toBe(true);
    // Le champ en hm : les unités autour de l'hectomètre.
    expect(rectanglePerimeter(1, 3, 2)).toMatchObject({ answer: '10 hm', units: ['m', 'dam', 'hm', 'km'] });
    expect(squarePerimeter(0, 35).answer).toBe('140 cm');
    expect(squareSide(20, true)).toMatchObject({ answer: '5 m', solved: 'Un côté de ma chambre mesure 5\u00a0m.' });
  });

  it('passe d’une à deux unités (2 m 50 cm)', () => {
    expect(twoUnits(0, 2, 50, 'total')).toMatchObject({ prompt: '2 m 50 cm =', suffix: 'cm', answer: 250 });
    expect(twoUnits(0, 1, 5, 'total').answer).toBe(105);
    expect(twoUnits(0, 3, 45, 'small')).toMatchObject({ prompt: '345 cm = 3 m', suffix: 'cm', answer: 45 });
    expect(twoUnits(3, 1, 500, 'big')).toMatchObject({ prompt: '1\u00a0500 g =', suffix: 'kg 500 g', answer: 1 });
    expect(twoUnits(0, 1, 5, 'total').explain.replace(/\u00a0/g, ' ')).toBe('1 m = 100 cm. Puis 100 + 5 = 105.');
  });

  it('compare des masses en tonnes et en kg (fiche n° 24)', () => {
    const question = heaviestOrca(['Zorba', 'Wago', 'Yakari'], [[8500, 'kg'], [9, 't'], [9100, 'kg']]);
    expect(question.answer).toBe('Yakari');
    expect(question.explain.replace(/\u00a0/g, ' ')).toBe('On écrit tout en kg : 8 500 kg, 9 t = 9 000 kg, 9 100 kg. Puis 9 100 kg > 9 000 kg > 8 500 kg.');
  });

  it('donne le nombre de jours d’un mois', () => {
    expect(monthDays(3).answer).toBe(30);
    expect(monthDays(7).answer).toBe(31);
  });

  it('compare trois morceaux de corde : les boutons sont les mesures (fiche n° 25)', () => {
    const question = mostOf('Quel est le morceau le plus long ?', '…', [[50, 'dm'], [400, 'cm'], [3, 'm']], undefined, (m) => `Le plus long mesure ${m}.`);
    expect(question.choices?.map((c) => c.label)).toEqual(['50\u00a0dm', '400\u00a0cm', '3\u00a0m']);
    expect(question.answer).toBe('50\u00a0dm');
  });

  it('convertit avec le tableau de conversion (leçon Mes 10)', () => {
    expect(convert(76, 'hg', 'dag')).toMatchObject({ prompt: '76 hg =', suffix: 'dag', answer: 760 });
    expect(convert(2700, 'dam', 'm').answer).toBe(27000);
    expect(convert(4000, 'ml', 'L').answer).toBe(4);
  });

  it('trouve un côté d’un rectangle à partir du périmètre (fiche n° 27)', () => {
    const question = rectangleSide(0, 80, 120, true);
    expect(question.prompt).toBe('Un champ rectangulaire a un périmètre de 400 m. Son petit côté mesure 80 m. Combien mesure le grand côté ?');
    expect(question.answer).toBe('120 m');
    expect(rectangleSide(0, 60, 90, false).answer).toBe('60 m');
  });

  it('convertit les côtés avant de calculer un périmètre (leçon Mes 8)', () => {
    const question = mixedPerimeter([[2, 'm'], [150, 'cm'], [1500, 'mm']]);
    expect(question.answer).toBe('500 cm');
    expect(isCorrect(question, '5 m')).toBe(true);
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
