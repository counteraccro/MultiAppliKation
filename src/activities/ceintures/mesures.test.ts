import { describe, expect, it } from 'vitest';
import { isCorrect, shownAnswerFor, splitMeasure } from '../../core/quiz';
import * as mesures from './mesures';
import { MESURES } from './mesures';

import { NUMERATION_TEST_SIZE, pickNumeration } from './numeration';
import { CalcTestSession } from './table-practice';

/** Les textes avec des espaces normales à la place des insécables (« 5 m » ne se coupe pas), pour les comparer. */
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value).replace(/\u00a0/g, ' ')) as T;
const plainly =
  <A extends unknown[], R>(make: (...args: A) => R) =>
  (...args: A): R =>
    plain(make(...args));
const { addTime, borabora, change, dishes, election, glasses, leak, leapfrog, plane, priceOfOne, prices, recipe, scales, severalOf, sideFromArea, squareSideFromArea, startOf, startTime, tiles, truck, vials, wish, compareMeasures, conversionTable, convert, endTime, equality, heaviestOrca, heightProblem, inMinutes, journey, julie, longJump, megasplash, mixedPerimeter, monthDays, mostOf, neighbourMonth, rectangleArea, rectanglePerimeter, rectangleSide, ribbon, segment, shareRope, showDuration, squareArea, squarePerimeter, squareSide, tallest, timeFact, twoUnits, unitFor, untilHour } = Object.fromEntries(
  Object.entries(mesures).map(([name, value]) => [name, typeof value === 'function' && name !== 'conversionTable' ? plainly(value as (...args: unknown[]) => unknown) : value]),
) as unknown as typeof mesures;

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
    expect(question.explain.replace(/ /g, ' ')).toBe('On écrit tout en cm : 1 m = 100 cm. Puis 120 cm > 100 cm.');
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
    expect(question.alsoAccepted).toEqual(['1 700 mm']);
    expect(isCorrect(question, '1700 mm')).toBe(true);
    expect(isCorrect(question, '170 m')).toBe(false);
    expect(question.solved).toBe('Maintenant, mon ruban mesure 170 cm.');
  });

  it('trouve le plus petit des quatre enfants (fiche n° 13)', () => {
    const question = tallest(['Ernest', 'Fleur', 'Gudule', 'Honoré'], [[1, 'm'], [950, 'mm'], [89, 'cm'], [1100, 'mm']], true);
    expect(question.answer).toBe('Gudule');
    expect(question.explain.replace(/ /g, ' ')).toBe('On écrit toutes les tailles en cm : Ernest 100 cm, Fleur 95 cm, Gudule 89 cm, Honoré 110 cm.');
  });

  it('connaît les relations entre jours, heures, minutes et secondes', () => {
    expect(timeFact(0)).toMatchObject({ prompt: 'Dans une heure, il y a', suffix: 'minutes.', answer: 60 });
  });

  it('calcule le périmètre d’un rectangle et d’un carré (fiches n° 19 à 23)', () => {
    const room = rectanglePerimeter(0, 4, 3);
    expect(room).toMatchObject({ prompt: 'Ma chambre mesure 4 m sur 3 m. Quel est son périmètre ?', answer: '14 m' });
    expect(room.solved).toBe('Le périmètre de ma chambre est de 14 m.');
    expect(isCorrect(room, '1400 cm')).toBe(true);
    // Le champ en hm : les unités autour de l'hectomètre.
    expect(rectanglePerimeter(1, 3, 2)).toMatchObject({ answer: '10 hm', units: ['m', 'dam', 'hm', 'km'] });
    expect(squarePerimeter(0, 35).answer).toBe('140 cm');
    expect(squareSide(20, true)).toMatchObject({ answer: '5 m', solved: 'Un côté de ma chambre mesure 5 m.' });
  });

  it('passe d’une à deux unités (2 m 50 cm)', () => {
    expect(twoUnits(0, 2, 50, 'total')).toMatchObject({ prompt: '2 m 50 cm =', suffix: 'cm', answer: 250 });
    expect(twoUnits(0, 1, 5, 'total').answer).toBe(105);
    expect(twoUnits(0, 3, 45, 'small')).toMatchObject({ prompt: '345 cm = 3 m', suffix: 'cm', answer: 45 });
    expect(twoUnits(3, 1, 500, 'big')).toMatchObject({ prompt: '1 500 g =', suffix: 'kg 500 g', answer: 1 });
    expect(twoUnits(0, 1, 5, 'total').explain.replace(/ /g, ' ')).toBe('1 m = 100 cm. Puis 100 + 5 = 105.');
  });

  it('compare des masses en tonnes et en kg (fiche n° 24)', () => {
    const question = heaviestOrca(['Zorba', 'Wago', 'Yakari'], [[8500, 'kg'], [9, 't'], [9100, 'kg']]);
    expect(question.answer).toBe('Yakari');
    expect(question.explain.replace(/ /g, ' ')).toBe('On écrit tout en kg : 8 500 kg, 9 t = 9 000 kg, 9 100 kg. Puis 9 100 kg > 9 000 kg > 8 500 kg.');
  });

  it('donne le nombre de jours d’un mois', () => {
    expect(monthDays(3).answer).toBe(30);
    expect(monthDays(7).answer).toBe(31);
  });

  it('compare trois morceaux de corde : les boutons sont les mesures (fiche n° 25)', () => {
    const question = mostOf('Quel est le morceau le plus long ?', '…', [[50, 'dm'], [400, 'cm'], [3, 'm']], undefined, (m) => `Le plus long mesure ${m}.`);
    expect(question.choices?.map((c) => c.label)).toEqual(['50 dm', '400 cm', '3 m']);
    expect(question.answer).toBe('50 dm');
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
            if (!belt.decimal) expect(Number.isInteger(question.answer)).toBe(true);
            expect(question.answer).toBeGreaterThan(0);
          }
          expect(`${question.prompt} ${question.suffix ?? ''} ${question.solved} ${question.explain}`).not.toMatch(/undefined|NaN/);
        }
      }
    }
  });

  it('dessine le tableau de conversion de la leçon (Mes 10)', () => {
    const texts = (value: number, from: Parameters<typeof conversionTable>[1], to: Parameters<typeof conversionTable>[2]) =>
      conversionTable(value, from, to).conversion.cells.map((c) => c.text).join('|');
    // 350 m = 35 000 cm : deux 0 ajoutés jusqu'aux cm.
    expect(texts(350, 'm', 'cm')).toBe('|3|5|0|0|0|');
    expect(conversionTable(350, 'm', 'cm').conversion.cells.filter((c) => c.added)).toHaveLength(2);
    // 453 cm = 4,53 m : la virgule dans la colonne des m ; 264 mm = 0,000264 km.
    expect(texts(453, 'cm', 'm')).toBe('|||4,|5|3|');
    expect(texts(264, 'mm', 'km')).toBe('0,|0|0|0|2|6|4');
    // 99 km : une colonne sans nom avant les km.
    expect(conversionTable(99, 'km', 'm').conversion.units[0]).toBe('');
    expect(convert(350, 'm', 'cm').lessonFigure).toBeDefined();
  });

  it('calcule l’aire d’un rectangle et d’un carré (fiches n° 37, 38, 40, 42, 46)', () => {
    const room = rectangleArea(0, 4, 3);
    expect(room).toMatchObject({ answer: '12 m²', units: ['m', 'dm²', 'm²', 'dam²'], solved: 'Ma chambre a une surface de 12 m².' });
    expect(isCorrect(room, '12 m')).toBe(false);
    expect(isCorrect(room, '1200 dm²')).toBe(true);
    expect(rectangleArea(1, 3, 2).answer).toBe('6 hm²');
    expect(rectangleArea(2, 100, 45).answer).toBe('4 500 m²');
    expect(rectangleArea(4, 50, 30).answer).toBe('1 500 cm²');
    expect(squareArea(1, 8, false).answer).toBe('64 m²');
    // Le périmètre n'est jamais juste en m² : 20 m ne vaut pas 2 dm².
    const fence = squareArea(1, 5, true);
    expect(fence.answer).toBe('20 m');
    expect(fence.alsoAccepted).toEqual([]);
  });

  it('trouve l’heure de fin d’une émission (fiches n° 39, 41, 45)', () => {
    const game = endTime(0, 18 * 60 + 10, 35);
    expect(game).toMatchObject({ clock: 'time', answer: '18 h 45', solved: 'Le jeu Super Défi se termine à 18 h 45.' });
    expect(isCorrect(game, '18 h 45')).toBe(true);
    expect(isCorrect(game, '18 h 45 min')).toBe(true);
    expect(isCorrect(game, '45 min')).toBe(false);
    const calculo = endTime(1, 9 * 60 + 15, 50);
    expect(calculo.answer).toBe('10 h 05');
    expect(isCorrect(calculo, '10 h 5')).toBe(true);
    expect(calculo.explain).toBe('De 9 h 15 à 10 h, il y a 45 min. Il reste 50 − 45 = 5 min : 10 h 05.');
    expect(endTime(3, 11 * 60 + 50, 50).answer).toBe('12 h 40');
    expect(addTime(8 * 60 + 30, 105)).toMatchObject({ prompt: 'Il est 8 h 30. Quelle heure sera-t-il dans 1 h 45 min ?', answer: '10 h 15' });
  });

  it('calcule une durée, en minutes ou en heures et minutes (fiches n° 43, 47, 48)', () => {
    expect(showDuration(2, 15 * 60 + 30, 16 * 60 + 15)).toMatchObject({ clock: 'duration', answer: '45 min', solved: 'Le jeu TopGénial dure 45 min.' });
    const tetrofor = showDuration(4, 11 * 60 + 15, 750);
    expect(tetrofor.prompt).toContain('commence à 11 h 15 et se termine à midi et demi');
    expect(isCorrect(tetrofor, '75 min')).toBe(true);
    expect(isCorrect(tetrofor, '1 h 15 min')).toBe(true);
    expect(isCorrect(tetrofor, '1 h 15')).toBe(true);
    expect(isCorrect(tetrofor, '1 h 75 min')).toBe(false);
    expect(isCorrect(tetrofor, '75')).toBe(false);
    // La correction s'écrit comme sa réponse.
    expect(shownAnswerFor(tetrofor, '1 h 20 min')).toBe('1 h 15 min');
    expect(shownAnswerFor(tetrofor, '80 min')).toBe('75 min');
    const train = journey(false, 8 * 60 + 10, 11 * 60 + 35);
    expect(train).toMatchObject({ answer: '205 min', alsoAccepted: ['3 h 25 min'], solved: 'Le voyage a duré 205 min (3 h 25 min).' });
    expect(train.explain).toBe(
      'On avance par bonds jusqu’aux heures pile. De 8 h 10 à 9 h : 50 min. De 9 h à 11 h : 2 h = 120 min. De 11 h à 11 h 35 : 35 min. 50 + 120 + 35 = 205. Ça dure 205 min (3 h 25 min).',
    );
    // Le film de la leçon : 20 h 50 → 22 h 30, 1 h 40.
    expect(isCorrect(journey(true, 20 * 60 + 50, 22 * 60 + 30), '1 h 40 min')).toBe(true);
    expect(untilHour(8 * 60 + 40)).toMatchObject({ prompt: 'Il est 8 h 40. Il sera 9 h dans', answer: 20 });
    expect(inMinutes(75).answer).toBe(75);
  });

  it('résout les problèmes avec des décimaux (fiches n° 49 à 60)', () => {
    const weight = julie(33_500, 12_650);
    expect(weight.prompt).toContain('La balance indique 46,15 kg. Sachant que le chien pèse 12 kg 650 g');
    expect(isCorrect(weight, '33,5 kg')).toBe(true);
    expect(isCorrect(weight, '33,50 kg')).toBe(true);
    // « en kg » : 33 500 g n'est pas accepté.
    expect(isCorrect(weight, '33500 g')).toBe(false);
    const jumper = heightProblem(0, 205, 6);
    expect(jumper.answer).toBe('199 cm');
    expect(isCorrect(jumper, '1,99 m')).toBe(true);
    expect(heightProblem(1, 65, 3).answer).toBe('68 cm');
    expect(heightProblem(2, 120, 45).answer).toBe('75 cm');
    expect(heightProblem(3, 235, 170).answer).toBe('65 cm');
    expect(longJump(1730, 1804).answer).toBe('74 cm');
    expect(isCorrect(longJump(1730, 1804), '0,74 m')).toBe(false);
    expect(shareRope(395, 4).prompt).toContain('une corde de 15,8 m en 4 morceaux');
    expect(shareRope(395, 4).answer).toBe('395 cm');
    const drink = megasplash(1.5, 55, 4, 22);
    expect(drink.answer).toBe('2,472 L');
    expect(isCorrect(drink, '2472 ml')).toBe(true);
    expect(borabora(2, 10, 60, 100).answer).toBe('30 cl');
    expect(convert(453, 'cm', 'm').answer).toBe(4.53);
    expect(convert(4.53, 'm', 'cm').answer).toBe(453);
  });

  it('trouve l’heure de début en reculant (leçon Mes 4, méthode 3)', () => {
    const show = startTime(1, 18 * 60 + 5, 35);
    expect(show).toMatchObject({ clock: 'time', answer: '17 h 30', solved: 'Le jeu Calculo a commencé à 17 h 30.' });
    expect(show.prompt).toBe('À la télévision, le jeu Calculo se termine à 18 h 05. Il a duré 35 minutes. À quelle heure a-t-il commencé ?');
    expect(show.explain).toBe('On recule : on enlève à part les heures et les minutes. Il n’y a pas assez de minutes : 18 h 05, c’est 17 h 65 min (1 h = 60 min). 17 − 0 = 17 h et 65 − 35 = 30 min. Ça fait 17 h 30.');
    expect(isCorrect(show, '17 h 30')).toBe(true);
    expect(isCorrect(show, '30 min')).toBe(false);
    // L'exemple de la leçon : 10 h 15 − 1 h 45 = 8 h 30.
    const train = startOf(0, 10 * 60 + 15, 105);
    expect(train).toMatchObject({ answer: '8 h 30', prompt: 'Mon train est arrivé à 10 h 15. Le voyage a duré 1 h 45 min. À quelle heure est-il parti ?' });
    expect(train.explain).toContain('10 h 15, c’est 9 h 75 min');
    expect(startOf(3, 12 * 60 + 40, 25).answer).toBe('12 h 15');
    expect(startTime(0, 750, 80).explain).toMatch(/^80 min = 1 h 20 min\. /);
  });

  it('trouve le côté d’un rectangle à partir de son aire', () => {
    const garden = sideFromArea(0, 8, 6, true);
    expect(garden.prompt).toBe('Un jardin rectangulaire a une aire de 48 m². Sa largeur mesure 6 m. Combien mesure sa longueur ?');
    expect(garden.answer).toBe('8 m');
    expect(garden.units).toEqual(['m', 'dm²', 'm²', 'dam²']);
    expect(isCorrect(garden, '8 m²')).toBe(false);
    expect(sideFromArea(3, 40, 30, false).answer).toBe('30 cm');
    expect(squareSideFromArea(7, 'cm')).toMatchObject({ prompt: 'Un carré a une aire de 49 cm². Combien mesure son côté ?', answer: '7 cm' });
  });

  it('résout les problèmes en plusieurs étapes (fiches n° 61 à 66)', () => {
    expect(leapfrog(90, 20)).toMatchObject({ answer: 20, suffix: 'élèves' });
    expect(leapfrog(90, 20).prompt).toContain('elle a parcouru 18 m');
    const balance = scales(1340, 1, 3, 2);
    expect(balance.prompt).toContain('il place une masse de 500 g, trois masses de 200 g et deux masses de 100 g');
    expect(balance.answer).toBe('40 g');
    expect(isCorrect(balance, '0,04 kg')).toBe(false);
    // Fiche n° 63 : 10 190 kg (la correction Charivari dit « 40 g » par erreur).
    const lorry = truck(6.2, 22, 45, 52, 50, 800);
    expect(lorry.answer).toBe('10 190 kg');
    expect(isCorrect(lorry, '10,19 t')).toBe(true);
    expect(vials(3, 15, 5).answer).toBe('225 ml');
    expect(isCorrect(vials(3, 15, 5), '22,5 cl')).toBe(true);
    expect(leak(5, 60).answer).toBe('3 L');
    expect(isCorrect(leak(5, 60), '300 cl')).toBe(false);
    expect(leak(3, 30).answer).toBe('0,9 L');
    expect(glasses(30, 75, true)).toMatchObject({ answer: 40, suffix: 'bouteilles' });
  });

  it('résout les problèmes de proportionnalité (fiches n° 67 à 78)', () => {
    const biscuits = prices(0, 2, 7, 400);
    expect(biscuits).toMatchObject({ prompt: '2 paquets de biscuits coûtent 8 €. Combien coûtent 7 paquets de biscuits ?', answer: '28 €' });
    expect(biscuits.explain).toBe('On cherche d’abord le prix d’un paquet de biscuits : 8 : 2 = 4 €. Puis 7 × 4 = 28.');
    expect(isCorrect(biscuits, '28 g')).toBe(false);
    const meat = prices(1, 3, 4, 2120);
    expect(meat.prompt).toContain('3 kilos de viande coûtent 63,60 €');
    expect(meat.answer).toBe('84,80 €');
    expect(isCorrect(meat, '84,8 €')).toBe(true);
    expect(prices(0, 2, 7, 415).answer).toBe('29,05 €');
    const sugar = recipe(0, 6, 18, 150);
    expect(sugar.answer).toBe('450 g');
    expect(sugar.explain).toBe('18 : 6 = 3 : il y a 3 fois plus de personnes, donc il faut 3 fois plus de sucre. 150 × 3 = 450.');
    expect(isCorrect(sugar, '0,45 kg')).toBe(true);
    expect(recipe(1, 4, 6, 200).explain).toBe('Pour 2 personnes, c’est la moitié : 200 : 2 = 100. 6 personnes, c’est 4 + 2 : 200 + 100 = 300.');
    expect(recipe(2, 4, 10, 30).explain).toContain('10 personnes, c’est 4 + 4 + 2 : 30 + 30 + 15 = 75.');
    expect(recipe(3, 6, 2, 36).answer).toBe('12 cl');
    expect(severalOf(0, 500, 8).answer).toBe('4 000 g');
    expect(isCorrect(severalOf(0, 500, 8), '4 kg')).toBe(true);
    expect(priceOfOne(0, 3, 2500)).toMatchObject({ prompt: '3 chaises coûtent 75 €. Combien coûte une chaise ?', answer: '25 €' });
  });

  it('résout les problèmes niveau 4 (fiches n° 79 à 84)', () => {
    expect(plane(14 * 60 + 10, 280, 150, false).answer).toBe('700 km');
    expect(plane(14 * 60 + 10, 280, 150, false).explain).toBe('En une demi-heure, l’avion parcourt 280 : 2 = 140 km. En 2 h 30 min : 2 × 280 + 140 = 700.');
    expect(plane(14 * 60 + 10, 280, 150, true).answer).toBe('11 h 40');
    const kitchen = tiles(4.5, 5, 8, 23);
    expect(kitchen.answer).toBe('276 €');
    expect(kitchen.explain).toContain('90 = 11 × 8 + 2 : 11 paquets ne suffisent pas, il faut 12 paquets.');
    const gift = wish(0, 35, 7, 30);
    expect(gift.prompt).toContain('qui coûte 210 €. Sa mère gagne 1 225 € par mois et travaille 35 heures par semaine. Combien d’heures la mère de Lucas travaille-t-elle');
    expect(isCorrect(gift, '30 h')).toBe(true);
    expect(gift.solved).toBe('La mère de Lucas travaille 30 heures pour gagner le prix du naïpode.');
    expect(change(756, 235, 145).answer).toBe('6,29 €');
    expect(dishes(1500, 465, 12, 30).answer).toBe('3 022,50 €');
    expect(isCorrect(dishes(1500, 465, 12, 30), '3022,5 €')).toBe(true);
    // Fiche n° 84 : 740 voix pour Mme Lejeune (la correction dit 738), 296 pour M. Legrand.
    const vote = election(2960);
    expect(vote.answer).toBe(1924);
    expect(vote.explain).toContain('2 960 : 4 = 740 voix pour Mme Lejeune');
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
