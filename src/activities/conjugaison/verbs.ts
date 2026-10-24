// Les 20 verbes du CM1 à 4 temps (voir .ai/analyse/10-conjugaison.md).
// Une faute ici apprendrait une faute à l'enfant : chaque forme est vérifiée
// par verbs.test.ts contre une table de référence écrite à part.
// Les identifiants servent de clés dans le profil (« aller.futur ») : ne jamais les changer.

/** 1 à 6 : je, tu, il / elle, nous, vous, ils / elles. */
export type Person = 1 | 2 | 3 | 4 | 5 | 6;
export const PERSONS: readonly Person[] = [1, 2, 3, 4, 5, 6];

export const TENSES = [
  { id: 'present', label: 'présent' },
  { id: 'imparfait', label: 'imparfait' },
  { id: 'futur', label: 'futur' },
  { id: 'passe-compose', label: 'passé composé' },
] as const;
export type TenseId = (typeof TENSES)[number]['id'];

/** Une forme : la réponse attendue et, si une autre orthographe est juste, les autres. */
export type Form = string | { answer: string; also: string[] };
/** À la 3ᵉ personne, [il, elle] quand le participe s'accorde. */
export type ThirdPersonForm = Form | [string, string];
export type Forms = [Form, Form, ThirdPersonForm, Form, Form, ThirdPersonForm];

export interface Verb {
  id: string;
  infinitive: string;
  tenses: Record<TenseId, Forms>;
}

export interface Conjugation {
  verb: Verb;
  tense: (typeof TENSES)[number];
  forms: Forms;
}

/** Six formes écrites à la main, séparées par des espaces : « suis es est sommes êtes sont ». */
function six(forms: string): Forms {
  const list = forms.split(' ');
  if (list.length !== 6) throw new Error(`six formes attendues : ${forms}`);
  return list as Forms;
}

const ENDINGS = {
  present1: ['e', 'es', 'e', 'ons', 'ez', 'ent'],
  present2: ['is', 'is', 'it', 'issons', 'issez', 'issent'],
  imparfait: ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'],
  futur: ['ai', 'as', 'a', 'ons', 'ez', 'ont'],
} as const;

const withEndings = (stem: string, endings: readonly string[]) => endings.map((e) => stem + e) as Forms;

const AVOIR = six('ai as a avons avez ont');
const ETRE = six('suis es est sommes êtes sont');

/** Passé composé avec avoir : « ai chanté ». */
function withAvoir(participle: string): Forms {
  return AVOIR.map((aux) => `${aux} ${participle}`) as Forms;
}

/**
 * Passé composé avec être : le participe s'accorde avec le sujet.
 * Pour je, tu, nous, vous le genre ne se voit pas : les deux sont justes.
 */
function withEtre(participle: string): Forms {
  const [je, tu, il, nous, vous, ils] = ETRE as string[];
  const p = participle;
  return [
    { answer: `${je} ${p}`, also: [`${je} ${p}e`] },
    { answer: `${tu} ${p}`, also: [`${tu} ${p}e`] },
    [`${il} ${p}`, `${il} ${p}e`],
    { answer: `${nous} ${p}s`, also: [`${nous} ${p}es`] },
    // « vous » peut être une seule personne (vouvoiement) : singulier accepté aussi.
    { answer: `${vous} ${p}s`, also: [`${vous} ${p}`, `${vous} ${p}e`, `${vous} ${p}es`] },
    [`${ils} ${p}s`, `${ils} ${p}es`],
  ];
}

/** 1ᵉʳ groupe régulier : chanter, jouer. */
function firstGroup(id: string): Verb {
  const stem = id.slice(0, -2);
  return {
    id,
    infinitive: id,
    tenses: {
      present: withEndings(stem, ENDINGS.present1),
      imparfait: withEndings(stem, ENDINGS.imparfait),
      futur: withEndings(id, ENDINGS.futur),
      'passe-compose': withAvoir(`${stem}é`),
    },
  };
}

/** 2ᵉ groupe : finir. */
function secondGroup(id: string): Verb {
  const stem = id.slice(0, -2);
  return {
    id,
    infinitive: id,
    tenses: {
      present: withEndings(stem, ENDINGS.present2),
      imparfait: withEndings(`${stem}iss`, ENDINGS.imparfait),
      futur: withEndings(id, ENDINGS.futur),
      'passe-compose': withAvoir(`${stem}i`),
    },
  };
}

/** Écrits à la main, temps par temps. */
function byHand(
  id: string,
  infinitive: string,
  present: string,
  imparfait: string,
  futur: Forms,
  passeCompose: Forms,
): Verb {
  return {
    id,
    infinitive,
    tenses: { present: six(present), imparfait: six(imparfait), futur, 'passe-compose': passeCompose },
  };
}

/** Futur des verbes écrits à la main : le radical change, les terminaisons non. */
const futur = (stem: string) => withEndings(stem, ENDINGS.futur);

/** Futur d'espérer : « espérerai » et « espèrerai » (rectifications de 1990) sont justes tous les deux. */
const futurEsperer = ENDINGS.futur.map((e) => ({ answer: `espérer${e}`, also: [`espèrer${e}`] })) as Forms;

/** Dans l'ordre conseillé (badge « À toi ! ») : être, avoir, chanter, finir, aller, faire, puis les autres. */
export const VERBS: readonly Verb[] = [
  byHand('etre', 'être', 'suis es est sommes êtes sont', 'étais étais était étions étiez étaient', futur('ser'), withAvoir('été')),
  byHand('avoir', 'avoir', 'ai as a avons avez ont', 'avais avais avait avions aviez avaient', futur('aur'), withAvoir('eu')),
  firstGroup('chanter'),
  secondGroup('finir'),
  byHand('aller', 'aller', 'vais vas va allons allez vont', 'allais allais allait allions alliez allaient', futur('ir'), withEtre('allé')),
  byHand('faire', 'faire', 'fais fais fait faisons faites font', 'faisais faisais faisait faisions faisiez faisaient', futur('fer'), withAvoir('fait')),
  firstGroup('jouer'),
  byHand('manger', 'manger', 'mange manges mange mangeons mangez mangent', 'mangeais mangeais mangeait mangions mangiez mangeaient', futur('manger'), withAvoir('mangé')),
  byHand('commencer', 'commencer', 'commence commences commence commençons commencez commencent', 'commençais commençais commençait commencions commenciez commençaient', futur('commencer'), withAvoir('commencé')),
  byHand('appeler', 'appeler', 'appelle appelles appelle appelons appelez appellent', 'appelais appelais appelait appelions appeliez appelaient', futur('appeller'), withAvoir('appelé')),
  byHand('jeter', 'jeter', 'jette jettes jette jetons jetez jettent', 'jetais jetais jetait jetions jetiez jetaient', futur('jetter'), withAvoir('jeté')),
  byHand('acheter', 'acheter', 'achète achètes achète achetons achetez achètent', 'achetais achetais achetait achetions achetiez achetaient', futur('achèter'), withAvoir('acheté')),
  byHand('esperer', 'espérer', 'espère espères espère espérons espérez espèrent', 'espérais espérais espérait espérions espériez espéraient', futurEsperer, withAvoir('espéré')),
  byHand('nettoyer', 'nettoyer', 'nettoie nettoies nettoie nettoyons nettoyez nettoient', 'nettoyais nettoyais nettoyait nettoyions nettoyiez nettoyaient', futur('nettoier'), withAvoir('nettoyé')),
  byHand('dire', 'dire', 'dis dis dit disons dites disent', 'disais disais disait disions disiez disaient', futur('dir'), withAvoir('dit')),
  byHand('venir', 'venir', 'viens viens vient venons venez viennent', 'venais venais venait venions veniez venaient', futur('viendr'), withEtre('venu')),
  byHand('pouvoir', 'pouvoir', 'peux peux peut pouvons pouvez peuvent', 'pouvais pouvais pouvait pouvions pouviez pouvaient', futur('pourr'), withAvoir('pu')),
  byHand('voir', 'voir', 'vois vois voit voyons voyez voient', 'voyais voyais voyait voyions voyiez voyaient', futur('verr'), withAvoir('vu')),
  byHand('vouloir', 'vouloir', 'veux veux veut voulons voulez veulent', 'voulais voulais voulait voulions vouliez voulaient', futur('voudr'), withAvoir('voulu')),
  byHand('prendre', 'prendre', 'prends prends prend prenons prenez prennent', 'prenais prenais prenait prenions preniez prenaient', futur('prendr'), withAvoir('pris')),
];

/** Les 80 verbe-temps, verbe par verbe. */
export const CONJUGATIONS: readonly Conjugation[] = VERBS.flatMap((verb) =>
  TENSES.map((tense) => ({ verb, tense, forms: verb.tenses[tense.id] })),
);

/** Clé dans le profil : « aller.futur ». */
export const conjugationKey = ({ verb, tense }: Conjugation) => `${verb.id}.${tense.id}`;
