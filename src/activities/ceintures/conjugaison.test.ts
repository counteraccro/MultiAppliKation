import { describe, expect, it } from 'vitest';
import { VERBS, type Form, type TenseId as VerbTenseId } from '../conjugaison/verbs';
import { BELTS } from './belts';
import { CONJUGAISON, type Exercise, type TenseId } from './conjugaison';

// Assez d'exercices pour s'entraîner sur un verbe puis passer le test sur trois autres.
const MIN_EXERCISES = 7;

const all = CONJUGAISON.flatMap((belt) => belt.exercises.map((exercise) => ({ belt: belt.belt, ...exercise })));

/** La réponse attendue de chaque forme (au masculin à la 3ᵉ personne). */
const answers = (exercise: Exercise): string[] =>
  exercise.forms.map((form: Form | [string, string]) =>
    Array.isArray(form) ? form[0] : typeof form === 'string' ? form : form.answer,
  );

const find = (verb: string, tense: TenseId) => all.find((e) => e.verb === verb && e.tense === tense);

/** Les temps de chaque ceinture, comme dans le classeur. */
const BELT_TENSES: Record<string, TenseId[]> = {
  blanche: ['present'],
  jaune: ['imparfait'],
  orange: ['futur'],
  rose: ['present'],
  'vert-clair': ['passe-compose', 'imperatif'],
  'vert-fonce': ['imparfait', 'futur'],
  'bleu-clair': ['passe-simple'],
  'bleu-fonce': ['present'],
  violette: ['conditionnel'],
  marron: ['futur-anterieur', 'plus-que-parfait'],
};

/**
 * Table de référence écrite à part, pour les verbes que l'activité Conjugaison n'a pas :
 * nous, vous, ils au présent.
 */
const PRESENT_PLURAL: Record<string, string> = {
  croire: 'croyons croyez croient',
  écrire: 'écrivons écrivez écrivent',
  partir: 'partons partez partent',
  courir: 'courons courez courent',
  sortir: 'sortons sortez sortent',
  lire: 'lisons lisez lisent',
  rendre: 'rendons rendez rendent',
  devoir: 'devons devez doivent',
};

describe('ceintures de conjugaison', () => {
  it('suivent les ceintures du classeur, de la blanche à la marron', () => {
    expect(CONJUGAISON.map((b) => b.belt)).toEqual(BELTS.map((b) => b.id).filter((id) => id !== 'noire'));
  });

  it('ont assez d’exercices, les pièges du classeur et les bons temps', () => {
    for (const belt of CONJUGAISON) {
      expect(belt.exercises.length, belt.belt).toBeGreaterThanOrEqual(MIN_EXERCISES);
      expect(belt.tips.length, belt.belt).toBeGreaterThan(0);
      expect(new Set(belt.exercises.map((e) => e.tense)), belt.belt).toEqual(new Set(BELT_TENSES[belt.belt]));
    }
  });

  it('ont des identifiants uniques, et pas deux fois le même verbe au même temps dans une ceinture', () => {
    expect(new Set(all.map((e) => e.id)).size).toBe(all.length);
    for (const belt of CONJUGAISON) {
      const keys = belt.exercises.map((e) => `${e.verb}.${e.tense}`);
      expect(new Set(keys).size, belt.belt).toBe(keys.length);
    }
  });

  it('écrivent des formes propres : minuscules, sans pronom, sans espace en trop', () => {
    for (const exercise of all) {
      expect(exercise.forms.length, exercise.id).toBe(exercise.tense === 'imperatif' ? 3 : 6);
      for (const form of answers(exercise)) {
        expect(form, exercise.id).toMatch(/^[a-zàâçéèêëîïôûü]+( [a-zàâçéèêëîïôûü]+)?$/);
        expect(form, exercise.id).not.toMatch(/^(je|j’|tu|il|elle|nous|vous|ils|elles) /);
      }
    }
  });

  it('donnent les mêmes formes que l’activité Conjugaison', () => {
    const tenses: Partial<Record<TenseId, VerbTenseId>> = {
      present: 'present',
      imparfait: 'imparfait',
      futur: 'futur',
      'passe-compose': 'passe-compose',
    };
    let compared = 0;
    for (const exercise of all) {
      const tense = tenses[exercise.tense];
      const verb = VERBS.find((v) => v.infinitive === exercise.verb);
      if (!tense || !verb) continue;
      expect(exercise.forms, exercise.id).toEqual(verb.tenses[tense]);
      compared++;
    }
    expect(compared).toBeGreaterThan(20);
  });

  it('suivent les terminaisons de chaque temps', () => {
    const endings: Partial<Record<TenseId, string[][]>> = {
      imparfait: [['ais', 'ais', 'ait', 'ions', 'iez', 'aient']],
      futur: [['rai', 'ras', 'ra', 'rons', 'rez', 'ront']],
      conditionnel: [['rais', 'rais', 'rait', 'rions', 'riez', 'raient']],
      'passe-simple': [
        ['ai', 'as', 'a', 'âmes', 'âtes', 'èrent'],
        ['is', 'is', 'it', 'îmes', 'îtes', 'irent'],
        ['us', 'us', 'ut', 'ûmes', 'ûtes', 'urent'],
        ['ins', 'ins', 'int', 'înmes', 'întes', 'inrent'],
      ],
    };
    for (const exercise of all) {
      const sets = endings[exercise.tense];
      if (!sets) continue;
      const forms = answers(exercise);
      const fits = sets.some((set) => forms.every((form, i) => form.endsWith(set[i]!)));
      expect(fits, `${exercise.id} ${forms.join(' ')}`).toBe(true);
    }
  });

  it('gardent le même radical à toutes les personnes (sauf -ger, -cer devant a, o)', () => {
    const stems: Partial<Record<TenseId, string[]>> = {
      imparfait: ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'],
      futur: ['ai', 'as', 'a', 'ons', 'ez', 'ont'],
      conditionnel: ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'],
    };
    for (const exercise of all) {
      const ends = stems[exercise.tense];
      if (!ends) continue;
      const found = answers(exercise).map((form, i) =>
        form
          .slice(0, form.length - ends[i]!.length)
          .replace(/ç$/, 'c')
          .replace(/ge$/, 'g'),
      );
      expect(new Set(found).size, `${exercise.id} ${found.join(' ')}`).toBe(1);
    }
  });

  it('au présent des verbes en -er : e, es, e, ons, ez, ent (nous mangeons, nous lançons)', () => {
    for (const exercise of all.filter((e) => e.tense === 'present' && e.verb.endsWith('er') && e.verb !== 'aller')) {
      const stem = exercise.verb.slice(0, -2);
      const nous = stem.replace(/g$/, 'ge').replace(/c$/, 'ç');
      expect(answers(exercise), exercise.id).toEqual([`${stem}e`, `${stem}es`, `${stem}e`, `${nous}ons`, `${stem}ez`, `${stem}ent`]);
    }
  });

  it('au présent des autres verbes : nous, vous, ils comme la table de référence', () => {
    for (const [verb, plural] of Object.entries(PRESENT_PLURAL)) {
      const exercise = find(verb, 'present');
      if (!exercise) continue;
      expect(answers(exercise).slice(3).join(' '), exercise.id).toBe(plural);
    }
    for (const exercise of all.filter((e) => e.tense === 'present' && /(ir|re|oir)$/.test(e.verb))) {
      const known = PRESENT_PLURAL[exercise.verb] !== undefined || VERBS.some((v) => v.infinitive === exercise.verb);
      const regularIr = answers(exercise)[3] === `${exercise.verb.slice(0, -2)}issons`;
      expect(known || regularIr, `${exercise.id} : à ajouter à la table de référence`).toBe(true);
    }
  });

  it('au futur et au conditionnel : le même radical (j’irai, j’irais)', () => {
    for (const conditional of all.filter((e) => e.tense === 'conditionnel')) {
      const future = find(conditional.verb, 'futur');
      const stem = answers(conditional)[0]!.slice(0, -3);
      if (future) expect(answers(future)[0], conditional.id).toBe(`${stem}ai`);
      // Les verbes réguliers gardent leur infinitif : je chanterais, je finirais.
      if (/^(chanter|finir|partir)$/.test(conditional.verb)) expect(stem, conditional.id).toBe(conditional.verb);
    }
  });

  it('à l’impératif : les formes du présent, sans -s après -e (parle, mange)', () => {
    // Être et avoir ont leur propre impératif : sois, soyons, soyez ; aie, ayons, ayez.
    expect(answers(find('être', 'imperatif')!)).toEqual(['sois', 'soyons', 'soyez']);
    expect(answers(find('avoir', 'imperatif')!)).toEqual(['aie', 'ayons', 'ayez']);
    for (const imperative of all.filter((e) => e.tense === 'imperatif' && e.verb !== 'être' && e.verb !== 'avoir')) {
      const present = find(imperative.verb, 'present');
      if (!present) continue;
      const [, tu, , nous, vous] = answers(present);
      const expectedTu = tu!.endsWith('es') ? tu!.slice(0, -1) : tu;
      expect(answers(imperative), imperative.id).toEqual([expectedTu, nous, vous]);
    }
  });

  it('aux temps composés : le bon auxiliaire au bon temps', () => {
    const auxiliaries: Partial<Record<TenseId, string[]>> = {
      'passe-compose': ['ai as a avons avez ont'],
      'futur-anterieur': ['aurai auras aura aurons aurez auront', 'serai seras sera serons serez seront'],
      'plus-que-parfait': ['avais avais avait avions aviez avaient', 'étais étais était étions étiez étaient'],
    };
    for (const exercise of all) {
      const expected = auxiliaries[exercise.tense];
      if (!expected) continue;
      const aux = answers(exercise).map((form) => form.split(' ')[0]).join(' ');
      expect(expected, exercise.id).toContain(aux);
      // Avec être, le participe s'accorde au pluriel : nous serons venus.
      const participles = answers(exercise).map((form) => form.split(' ')[1]!);
      if (aux.startsWith('serai') || aux.startsWith('étais')) {
        expect(participles[3], exercise.id).toBe(`${participles[0]}s`);
        expect(exercise.forms[2], exercise.id).toEqual([`${aux.split(' ')[2]} ${participles[0]}`, `${aux.split(' ')[2]} ${participles[0]}e`]);
      } else {
        expect(new Set(participles).size, exercise.id).toBe(1);
      }
    }
  });

  it('reprennent les erreurs corrigées des fiches', () => {
    expect(answers(find('écouter', 'imparfait')!)[0]).toBe('écoutais');
    expect(answers(find('faire', 'conditionnel')!)[2]).toBe('ferait');
    expect(answers(find('faire', 'plus-que-parfait')!).slice(3, 5)).toEqual(['avions fait', 'aviez fait']);
    expect(answers(find('partir', 'plus-que-parfait')!)[0]).toBe('étais parti');
  });
});
