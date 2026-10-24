import { describe, expect, it } from 'vitest';
import { acceptedAnswers, isCorrect } from '../../core/quiz';
import { conjugationQuestion } from './questions';
import { CONJUGATIONS, conjugationKey, PERSONS, VERBS, type Person } from './verbs';

// Table de référence, écrite à part des données, comme dans un tableau de conjugaison :
// le pronom compris (« j’ » aussi). Au passé composé avec être, « elle » et « elles » en plus.
// Une ligne fausse dans verbs.ts ne peut pas passer : il faudrait la même faute ici.
const REFERENCE: Record<string, string> = {
  'etre.present': 'je suis, tu es, il est, nous sommes, vous êtes, ils sont',
  'etre.imparfait': 'j’étais, tu étais, il était, nous étions, vous étiez, ils étaient',
  'etre.futur': 'je serai, tu seras, il sera, nous serons, vous serez, ils seront',
  'etre.passe-compose': 'j’ai été, tu as été, il a été, nous avons été, vous avez été, ils ont été',

  'avoir.present': 'j’ai, tu as, il a, nous avons, vous avez, ils ont',
  'avoir.imparfait': 'j’avais, tu avais, il avait, nous avions, vous aviez, ils avaient',
  'avoir.futur': 'j’aurai, tu auras, il aura, nous aurons, vous aurez, ils auront',
  'avoir.passe-compose': 'j’ai eu, tu as eu, il a eu, nous avons eu, vous avez eu, ils ont eu',

  'chanter.present': 'je chante, tu chantes, il chante, nous chantons, vous chantez, ils chantent',
  'chanter.imparfait': 'je chantais, tu chantais, il chantait, nous chantions, vous chantiez, ils chantaient',
  'chanter.futur': 'je chanterai, tu chanteras, il chantera, nous chanterons, vous chanterez, ils chanteront',
  'chanter.passe-compose': 'j’ai chanté, tu as chanté, il a chanté, nous avons chanté, vous avez chanté, ils ont chanté',

  'finir.present': 'je finis, tu finis, il finit, nous finissons, vous finissez, ils finissent',
  'finir.imparfait': 'je finissais, tu finissais, il finissait, nous finissions, vous finissiez, ils finissaient',
  'finir.futur': 'je finirai, tu finiras, il finira, nous finirons, vous finirez, ils finiront',
  'finir.passe-compose': 'j’ai fini, tu as fini, il a fini, nous avons fini, vous avez fini, ils ont fini',

  'aller.present': 'je vais, tu vas, il va, nous allons, vous allez, ils vont',
  'aller.imparfait': 'j’allais, tu allais, il allait, nous allions, vous alliez, ils allaient',
  'aller.futur': 'j’irai, tu iras, il ira, nous irons, vous irez, ils iront',
  'aller.passe-compose':
    'je suis allé, tu es allé, il est allé, elle est allée, nous sommes allés, vous êtes allés, ils sont allés, elles sont allées',

  'faire.present': 'je fais, tu fais, il fait, nous faisons, vous faites, ils font',
  'faire.imparfait': 'je faisais, tu faisais, il faisait, nous faisions, vous faisiez, ils faisaient',
  'faire.futur': 'je ferai, tu feras, il fera, nous ferons, vous ferez, ils feront',
  'faire.passe-compose': 'j’ai fait, tu as fait, il a fait, nous avons fait, vous avez fait, ils ont fait',

  'jouer.present': 'je joue, tu joues, il joue, nous jouons, vous jouez, ils jouent',
  'jouer.imparfait': 'je jouais, tu jouais, il jouait, nous jouions, vous jouiez, ils jouaient',
  'jouer.futur': 'je jouerai, tu joueras, il jouera, nous jouerons, vous jouerez, ils joueront',
  'jouer.passe-compose': 'j’ai joué, tu as joué, il a joué, nous avons joué, vous avez joué, ils ont joué',

  'manger.present': 'je mange, tu manges, il mange, nous mangeons, vous mangez, ils mangent',
  'manger.imparfait': 'je mangeais, tu mangeais, il mangeait, nous mangions, vous mangiez, ils mangeaient',
  'manger.futur': 'je mangerai, tu mangeras, il mangera, nous mangerons, vous mangerez, ils mangeront',
  'manger.passe-compose': 'j’ai mangé, tu as mangé, il a mangé, nous avons mangé, vous avez mangé, ils ont mangé',

  'commencer.present': 'je commence, tu commences, il commence, nous commençons, vous commencez, ils commencent',
  'commencer.imparfait':
    'je commençais, tu commençais, il commençait, nous commencions, vous commenciez, ils commençaient',
  'commencer.futur':
    'je commencerai, tu commenceras, il commencera, nous commencerons, vous commencerez, ils commenceront',
  'commencer.passe-compose':
    'j’ai commencé, tu as commencé, il a commencé, nous avons commencé, vous avez commencé, ils ont commencé',

  'appeler.present': 'j’appelle, tu appelles, il appelle, nous appelons, vous appelez, ils appellent',
  'appeler.imparfait': 'j’appelais, tu appelais, il appelait, nous appelions, vous appeliez, ils appelaient',
  'appeler.futur': 'j’appellerai, tu appelleras, il appellera, nous appellerons, vous appellerez, ils appelleront',
  'appeler.passe-compose': 'j’ai appelé, tu as appelé, il a appelé, nous avons appelé, vous avez appelé, ils ont appelé',

  'jeter.present': 'je jette, tu jettes, il jette, nous jetons, vous jetez, ils jettent',
  'jeter.imparfait': 'je jetais, tu jetais, il jetait, nous jetions, vous jetiez, ils jetaient',
  'jeter.futur': 'je jetterai, tu jetteras, il jettera, nous jetterons, vous jetterez, ils jetteront',
  'jeter.passe-compose': 'j’ai jeté, tu as jeté, il a jeté, nous avons jeté, vous avez jeté, ils ont jeté',

  'acheter.present': 'j’achète, tu achètes, il achète, nous achetons, vous achetez, ils achètent',
  'acheter.imparfait': 'j’achetais, tu achetais, il achetait, nous achetions, vous achetiez, ils achetaient',
  'acheter.futur': 'j’achèterai, tu achèteras, il achètera, nous achèterons, vous achèterez, ils achèteront',
  'acheter.passe-compose': 'j’ai acheté, tu as acheté, il a acheté, nous avons acheté, vous avez acheté, ils ont acheté',

  'esperer.present': 'j’espère, tu espères, il espère, nous espérons, vous espérez, ils espèrent',
  'esperer.imparfait': 'j’espérais, tu espérais, il espérait, nous espérions, vous espériez, ils espéraient',
  'esperer.futur': 'j’espérerai, tu espéreras, il espérera, nous espérerons, vous espérerez, ils espéreront',
  'esperer.passe-compose': 'j’ai espéré, tu as espéré, il a espéré, nous avons espéré, vous avez espéré, ils ont espéré',

  'nettoyer.present': 'je nettoie, tu nettoies, il nettoie, nous nettoyons, vous nettoyez, ils nettoient',
  'nettoyer.imparfait': 'je nettoyais, tu nettoyais, il nettoyait, nous nettoyions, vous nettoyiez, ils nettoyaient',
  'nettoyer.futur': 'je nettoierai, tu nettoieras, il nettoiera, nous nettoierons, vous nettoierez, ils nettoieront',
  'nettoyer.passe-compose':
    'j’ai nettoyé, tu as nettoyé, il a nettoyé, nous avons nettoyé, vous avez nettoyé, ils ont nettoyé',

  'dire.present': 'je dis, tu dis, il dit, nous disons, vous dites, ils disent',
  'dire.imparfait': 'je disais, tu disais, il disait, nous disions, vous disiez, ils disaient',
  'dire.futur': 'je dirai, tu diras, il dira, nous dirons, vous direz, ils diront',
  'dire.passe-compose': 'j’ai dit, tu as dit, il a dit, nous avons dit, vous avez dit, ils ont dit',

  'venir.present': 'je viens, tu viens, il vient, nous venons, vous venez, ils viennent',
  'venir.imparfait': 'je venais, tu venais, il venait, nous venions, vous veniez, ils venaient',
  'venir.futur': 'je viendrai, tu viendras, il viendra, nous viendrons, vous viendrez, ils viendront',
  'venir.passe-compose':
    'je suis venu, tu es venu, il est venu, elle est venue, nous sommes venus, vous êtes venus, ils sont venus, elles sont venues',

  'pouvoir.present': 'je peux, tu peux, il peut, nous pouvons, vous pouvez, ils peuvent',
  'pouvoir.imparfait': 'je pouvais, tu pouvais, il pouvait, nous pouvions, vous pouviez, ils pouvaient',
  'pouvoir.futur': 'je pourrai, tu pourras, il pourra, nous pourrons, vous pourrez, ils pourront',
  'pouvoir.passe-compose': 'j’ai pu, tu as pu, il a pu, nous avons pu, vous avez pu, ils ont pu',

  'voir.present': 'je vois, tu vois, il voit, nous voyons, vous voyez, ils voient',
  'voir.imparfait': 'je voyais, tu voyais, il voyait, nous voyions, vous voyiez, ils voyaient',
  'voir.futur': 'je verrai, tu verras, il verra, nous verrons, vous verrez, ils verront',
  'voir.passe-compose': 'j’ai vu, tu as vu, il a vu, nous avons vu, vous avez vu, ils ont vu',

  'vouloir.present': 'je veux, tu veux, il veut, nous voulons, vous voulez, ils veulent',
  'vouloir.imparfait': 'je voulais, tu voulais, il voulait, nous voulions, vous vouliez, ils voulaient',
  'vouloir.futur': 'je voudrai, tu voudras, il voudra, nous voudrons, vous voudrez, ils voudront',
  'vouloir.passe-compose': 'j’ai voulu, tu as voulu, il a voulu, nous avons voulu, vous avez voulu, ils ont voulu',

  'prendre.present': 'je prends, tu prends, il prend, nous prenons, vous prenez, ils prennent',
  'prendre.imparfait': 'je prenais, tu prenais, il prenait, nous prenions, vous preniez, ils prenaient',
  'prendre.futur': 'je prendrai, tu prendras, il prendra, nous prendrons, vous prendrez, ils prendront',
  'prendre.passe-compose': 'j’ai pris, tu as pris, il a pris, nous avons pris, vous avez pris, ils ont pris',
};

// Deuxième référence, extraite automatiquement (pas recopiée à la main) des « Tableaux de conjugaison
// cycle 3 » de Mysticlolly : https://www.mysticlolly.fr/wp-content/uploads/2017/04/Tableaux-de-conjugaison-Cycle-3.pdf
// 12 de nos 20 verbes y sont, aux 4 temps ; au masculin (« il », « ils ») ; sans les pronoms.
const MYSTICLOLLY: Record<string, string> = {
  'aller.present': 'vais / vas / va / allons / allez / vont',
  'aller.imparfait': 'allais / allais / allait / allions / alliez / allaient',
  'aller.futur': 'irai / iras / ira / irons / irez / iront',
  'aller.passe-compose': 'suis allé / es allé / est allé / sommes allés / êtes allés / sont allés',
  'avoir.present': 'ai / as / a / avons / avez / ont',
  'avoir.imparfait': 'avais / avais / avait / avions / aviez / avaient',
  'avoir.futur': 'aurai / auras / aura / aurons / aurez / auront',
  'avoir.passe-compose': 'ai eu / as eu / a eu / avons eu / avez eu / ont eu',
  'dire.present': 'dis / dis / dit / disons / dites / disent',
  'dire.imparfait': 'disais / disais / disait / disions / disiez / disaient',
  'dire.futur': 'dirai / diras / dira / dirons / direz / diront',
  'dire.passe-compose': 'ai dit / as dit / a dit / avons dit / avez dit / ont dit',
  'etre.present': 'suis / es / est / sommes / êtes / sont',
  'etre.imparfait': 'étais / étais / était / étions / étiez / étaient',
  'etre.futur': 'serai / seras / sera / serons / serez / seront',
  'etre.passe-compose': 'ai été / as été / a été / avons été / avez été / ont été',
  'faire.present': 'fais / fais / fait / faisons / faites / font',
  'faire.imparfait': 'faisais / faisais / faisait / faisions / faisiez / faisaient',
  'faire.futur': 'ferai / feras / fera / ferons / ferez / feront',
  'faire.passe-compose': 'ai fait / as fait / a fait / avons fait / avez fait / ont fait',
  'finir.present': 'finis / finis / finit / finissons / finissez / finissent',
  'finir.imparfait': 'finissais / finissais / finissait / finissions / finissiez / finissaient',
  'finir.futur': 'finirai / finiras / finira / finirons / finirez / finiront',
  'finir.passe-compose': 'ai fini / as fini / a fini / avons fini / avez fini / ont fini',
  'manger.present': 'mange / manges / mange / mangeons / mangez / mangent',
  'manger.imparfait': 'mangeais / mangeais / mangeait / mangions / mangiez / mangeaient',
  'manger.futur': 'mangerai / mangeras / mangera / mangerons / mangerez / mangeront',
  'manger.passe-compose': 'ai mangé / as mangé / a mangé / avons mangé / avez mangé / ont mangé',
  'pouvoir.present': 'peux / peux / peut / pouvons / pouvez / peuvent',
  'pouvoir.imparfait': 'pouvais / pouvais / pouvait / pouvions / pouviez / pouvaient',
  'pouvoir.futur': 'pourrai / pourras / pourra / pourrons / pourrez / pourront',
  'pouvoir.passe-compose': 'ai pu / as pu / a pu / avons pu / avez pu / ont pu',
  'prendre.present': 'prends / prends / prend / prenons / prenez / prennent',
  'prendre.imparfait': 'prenais / prenais / prenait / prenions / preniez / prenaient',
  'prendre.futur': 'prendrai / prendras / prendra / prendrons / prendrez / prendront',
  'prendre.passe-compose': 'ai pris / as pris / a pris / avons pris / avez pris / ont pris',
  'venir.present': 'viens / viens / vient / venons / venez / viennent',
  'venir.imparfait': 'venais / venais / venait / venions / veniez / venaient',
  'venir.futur': 'viendrai / viendras / viendra / viendrons / viendrez / viendront',
  'venir.passe-compose': 'suis venu / es venu / est venu / sommes venus / êtes venus / sont venus',
  'voir.present': 'vois / vois / voit / voyons / voyez / voient',
  'voir.imparfait': 'voyais / voyais / voyait / voyions / voyiez / voyaient',
  'voir.futur': 'verrai / verras / verra / verrons / verrez / verront',
  'voir.passe-compose': 'ai vu / as vu / a vu / avons vu / avez vu / ont vu',
  'vouloir.present': 'veux / veux / veut / voulons / voulez / veulent',
  'vouloir.imparfait': 'voulais / voulais / voulait / voulions / vouliez / voulaient',
  'vouloir.futur': 'voudrai / voudras / voudra / voudrons / voudrez / voudront',
  'vouloir.passe-compose': 'ai voulu / as voulu / a voulu / avons voulu / avez voulu / ont voulu',
};

// Troisième référence : « Tableaux de conjugaison CM1 à imprimer » (Scribd), lue dans la page :
// https://fr.scribd.com/document/818397919/tableau-conjug-cm1
// Le texte de la page perd les « ç » et le « Ê » : vérifiés sur l'image du tableau et remis ici.
// « allé(e) » : les deux sont justes. Avancer (-cer) sert de modèle à commencer : même règle, autre radical.
const SCRIBD: Record<string, string> = {
  'jouer.present': 'joue/joues/joue/jouons/jouez/jouent',
  'jouer.imparfait': 'jouais/jouais/jouait/jouions/jouiez/jouaient',
  'jouer.futur': 'jouerai/joueras/jouera/jouerons/jouerez/joueront',
  'jouer.passe-compose': 'ai joué/as joué/a joué/avons joué/avez joué/ont joué',
  'manger.present': 'mange/manges/mange/mangeons/mangez/mangent',
  'manger.imparfait': 'mangeais/mangeais/mangeait/mangions/mangiez/mangeaient',
  'manger.futur': 'mangerai/mangeras/mangera/mangerons/mangerez/mangeront',
  'manger.passe-compose': 'ai mangé/as mangé/a mangé/avons mangé/avez mangé/ont mangé',
  'avancer.present': 'avance/avances/avance/avançons/avancez/avancent',
  'avancer.imparfait': 'avançais/avançais/avançait/avancions/avanciez/avançaient',
  'avancer.futur': 'avancerai/avanceras/avancera/avancerons/avancerez/avanceront',
  'avancer.passe-compose': 'ai avancé/as avancé/a avancé/avons avancé/avez avancé/ont avancé',
  'etre.present': 'suis/es/est/sommes/êtes/sont',
  'etre.imparfait': 'étais/étais/était/étions/étiez/étaient',
  'etre.futur': 'serai/seras/sera/serons/serez/seront',
  'etre.passe-compose': 'ai été/as été/a été/avons été/avez été/ont été',
  'avoir.present': 'ai/as/a/avons/avez/ont',
  'avoir.imparfait': 'avais/avais/avait/avions/aviez/avaient',
  'avoir.futur': 'aurai/auras/aura/aurons/aurez/auront',
  'avoir.passe-compose': 'ai eu/as eu/a eu/avons eu/avez eu/ont eu',
  'finir.present': 'finis/finis/finit/finissons/finissez/finissent',
  'finir.imparfait': 'finissais/finissais/finissait/finissions/finissiez/finissaient',
  'finir.futur': 'finirai/finiras/finira/finirons/finirez/finiront',
  'finir.passe-compose': 'ai fini/as fini/a fini/avons fini/avez fini/ont fini',
  'aller.present': 'vais/vas/va/allons/allez/vont',
  'aller.imparfait': 'allais/allais/allait/allions/alliez/allaient',
  'aller.futur': 'irai/iras/ira/irons/irez/iront',
  'aller.passe-compose': 'suis allé(e)/es allé(e)/est allé(e)/sommes allé(e)s/êtes allé(e)s/sont allé(e)s',
  'faire.present': 'fais/fais/fait/faisons/faites/font',
  'faire.imparfait': 'faisais/faisais/faisait/faisions/faisiez/faisaient',
  'faire.futur': 'ferai/feras/fera/ferons/ferez/feront',
  'faire.passe-compose': 'ai fait/as fait/a fait/avons fait/avez fait/ont fait',
  'dire.present': 'dis/dis/dit/disons/dites/disent',
  'dire.imparfait': 'disais/disais/disait/disions/disiez/disaient',
  'dire.futur': 'dirai/diras/dira/dirons/direz/diront',
  'dire.passe-compose': 'ai dit/as dit/a dit/avons dit/avez dit/ont dit',
  'prendre.present': 'prends/prends/prend/prenons/prenez/prennent',
  'prendre.imparfait': 'prenais/prenais/prenait/prenions/preniez/prenaient',
  'prendre.futur': 'prendrai/prendras/prendra/prendrons/prendrez/prendront',
  'prendre.passe-compose': 'ai pris/as pris/a pris/avons pris/avez pris/ont pris',
  'voir.present': 'vois/vois/voit/voyons/voyez/voient',
  'voir.imparfait': 'voyais/voyais/voyait/voyions/voyiez/voyaient',
  'voir.futur': 'verrai/verras/verra/verrons/verrez/verront',
  'voir.passe-compose': 'ai vu/as vu/a vu/avons vu/avez vu/ont vu',
  'venir.present': 'viens/viens/vient/venons/venez/viennent',
  'venir.imparfait': 'venais/venais/venait/venions/veniez/venaient',
  'venir.futur': 'viendrai/viendras/viendra/viendrons/viendrez/viendront',
  'venir.passe-compose': 'suis venu(e)/es venu(e)/est venu(e)/sommes venu(e)s/êtes venu(e)s/sont venu(e)s',
  'vouloir.present': 'veux/veux/veut/voulons/voulez/veulent',
  'vouloir.imparfait': 'voulais/voulais/voulait/voulions/vouliez/voulaient',
  'vouloir.futur': 'voudrai/voudras/voudra/voudrons/voudrez/voudront',
  'vouloir.passe-compose': 'ai voulu/as voulu/a voulu/avons voulu/avez voulu/ont voulu',
  'pouvoir.present': 'peux/peux/peut/pouvons/pouvez/peuvent',
  'pouvoir.imparfait': 'pouvais/pouvais/pouvait/pouvions/pouviez/pouvaient',
  'pouvoir.futur': 'pourrai/pourras/pourra/pourrons/pourrez/pourront',
  'pouvoir.passe-compose': 'ai pu/as pu/a pu/avons pu/avez pu/ont pu',
};

const PERSON_OF: Record<string, [Person, boolean]> = {
  je: [1, false],
  'j’': [1, false],
  tu: [2, false],
  il: [3, false],
  elle: [3, true],
  nous: [4, false],
  vous: [5, false],
  ils: [6, false],
  elles: [6, true],
};

/** « j’ai chanté » → pronom « j’ », forme « ai chanté ». */
function parse(entry: string) {
  const [, pronoun, form] = /^(j’|\S+ )(.+)$/.exec(entry)!;
  const [person, feminine] = PERSON_OF[pronoun!.trim()]!;
  return { pronoun: pronoun!.trim(), form: form!, person, feminine };
}

const masculine = () => 0.9;
const feminine = () => 0.1;

describe('les 20 verbes du CM1', () => {
  it('20 verbes × 4 temps, tous dans la référence', () => {
    expect(VERBS).toHaveLength(20);
    expect(CONJUGATIONS).toHaveLength(80);
    expect(CONJUGATIONS.map(conjugationKey).sort()).toEqual(Object.keys(REFERENCE).sort());
  });

  it('des identifiants sans accent ni espace (clés du profil)', () => {
    for (const verb of VERBS) expect(verb.id).toMatch(/^[a-z]+$/);
  });

  for (const conjugation of CONJUGATIONS) {
    const key = conjugationKey(conjugation);
    it(`${key} : chaque forme et son pronom`, () => {
      const entries = REFERENCE[key]!.split(', ').map(parse);
      const seen = new Set<Person>();
      for (const { pronoun, form, person, feminine: fem } of entries) {
        const question = conjugationQuestion(conjugation, person, fem ? feminine : masculine);
        expect({ pronoun: question.prompt, form: question.answer }).toEqual({ pronoun, form });
        seen.add(person);
      }
      expect([...seen].sort()).toEqual([...PERSONS]);
    });
  }
});

describe('deuxième référence : tableaux de Mysticlolly', () => {
  for (const [key, line] of Object.entries(MYSTICLOLLY)) {
    it(key, () => {
      const conjugation = CONJUGATIONS.find((c) => conjugationKey(c) === key)!;
      const answers = PERSONS.map((p) => conjugationQuestion(conjugation, p, masculine).answer);
      expect(answers).toEqual(line.split(' / '));
    });
  }
});

describe('troisième référence : tableaux CM1 de Scribd', () => {
  /** « allé(e)s » → « allés » et « allées ». */
  const expand = (form: string) => (form.includes('(e)') ? [form.replace('(e)', ''), form.replace('(e)', 'e')] : [form]);

  for (const [sourceKey, line] of Object.entries(SCRIBD)) {
    const key = sourceKey.replace(/^avancer/, 'commencer');
    it(sourceKey === key ? key : `${key} (sur le modèle d’avancer)`, () => {
      const conjugation = CONJUGATIONS.find((c) => conjugationKey(c) === key)!;
      const forms = (sourceKey === key ? line : line.replaceAll('avan', 'commen')).split('/');
      for (const p of PERSONS) {
        const questions = [masculine, feminine].map((random) => conjugationQuestion(conjugation, p, random));
        const written = expand(forms[p - 1]!);
        // Notre réponse attendue est celle du tableau, et toutes celles du tableau sont acceptées.
        expect(written).toContain(questions[0]!.answer);
        for (const form of written) expect(questions.some((q) => isCorrect(q, form)), `${key}.${p} ${form}`).toBe(true);
      }
    });
  }
});

describe('les autres formes justes', () => {
  const others = CONJUGATIONS.flatMap((c) =>
    PERSONS.flatMap((p) =>
      [masculine, feminine].map((random) => {
        const question = conjugationQuestion(c, p, random);
        return [`${conjugationKey(c)}.${p} ${question.prompt}`, question.alsoAccepted ?? []] as const;
      }),
    ),
  ).filter(([, also]) => also.length > 0);

  it('seulement le genre qui ne se voit pas, et « espèrerai »', () => {
    expect(Object.fromEntries(others)).toEqual({
      'aller.passe-compose.1 je': ['suis allée'],
      'aller.passe-compose.2 tu': ['es allée'],
      'aller.passe-compose.4 nous': ['sommes allées'],
      'aller.passe-compose.5 vous': ['êtes allé', 'êtes allée', 'êtes allées'],
      'venir.passe-compose.1 je': ['suis venue'],
      'venir.passe-compose.2 tu': ['es venue'],
      'venir.passe-compose.4 nous': ['sommes venues'],
      'venir.passe-compose.5 vous': ['êtes venu', 'êtes venue', 'êtes venues'],
      'esperer.futur.1 j’': ['espèrerai'],
      'esperer.futur.2 tu': ['espèreras'],
      'esperer.futur.3 il': ['espèrera'],
      'esperer.futur.3 elle': ['espèrera'],
      'esperer.futur.4 nous': ['espèrerons'],
      'esperer.futur.5 vous': ['espèrerez'],
      'esperer.futur.6 ils': ['espèreront'],
      'esperer.futur.6 elles': ['espèreront'],
    });
  });
});

describe('le clavier de lettres', () => {
  it('peut écrire toutes les réponses justes', () => {
    // Lettres et accents du clavier dessiné (src/components/keyboard.ts), plus l'espace.
    const typable = /^[a-zéèêàçùâîô ]+$/;
    for (const c of CONJUGATIONS)
      for (const p of PERSONS)
        for (const random of [masculine, feminine])
          for (const answer of acceptedAnswers(conjugationQuestion(c, p, random))) expect(answer).toMatch(typable);
  });
});
