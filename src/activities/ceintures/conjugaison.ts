// Ceintures de conjugaison : les ceintures du classeur, de la blanche à la marron
// (voir .ai/analyse/12-ceintures-conjugaison.md ; pas de noire pour l'instant).
// Exercices des fiches « Je prépare la ceinture… » (« Conjugue le verbe parler au présent »),
// corrections relues et corrigées, complétés par les nôtres. Une faute ici apprendrait
// une faute à l'enfant : conjugaison.test.ts vérifie chaque forme.
// Les identifiants (« blanche.3 ») servent de clés dans le profil : ne jamais les changer
// ni les réutiliser ; un nouvel exercice prend le numéro suivant.

import type { Form, Forms } from '../conjugaison/verbs';
import type { BeltId } from './belts';

export const TENSES = {
  present: { label: 'présent', at: 'au présent' },
  imparfait: { label: 'imparfait', at: 'à l’imparfait' },
  futur: { label: 'futur', at: 'au futur' },
  imperatif: { label: 'impératif', at: 'à l’impératif' },
  'passe-compose': { label: 'passé composé', at: 'au passé composé' },
  'passe-simple': { label: 'passé simple', at: 'au passé simple' },
  conditionnel: { label: 'conditionnel', at: 'au conditionnel' },
  'futur-anterieur': { label: 'futur antérieur', at: 'au futur antérieur' },
  'plus-que-parfait': { label: 'plus-que-parfait', at: 'au plus-que-parfait' },
} as const;

export type TenseId = keyof typeof TENSES;

/** À l'impératif, trois formes sans pronom : tu, nous, vous. */
export type ImperativeForms = [Form, Form, Form];

export interface Exercise {
  id: string;
  /** L'infinitif, comme sur la fiche : « parler ». */
  verb: string;
  tense: TenseId;
  /** Six formes (je … ils), ou trois à l'impératif ; sans le pronom. */
  forms: Forms | ImperativeForms;
  /** Lettre de la fiche (« A »), ou absente pour un exercice écrit pour l'app. */
  fiche?: string;
}

export interface ConjugationBelt {
  belt: BeltId;
  /** Ce que demande la ceinture, comme dans le classeur. */
  skill: string;
  /** « Objectif de fin de CM1 » dans le classeur. */
  goal?: 'CM1' | 'CM2';
  /** « Attention aux pièges ! » du classeur, pour la leçon. */
  tips: readonly string[];
  exercises: readonly Exercise[];
}

/** Six formes séparées par des espaces : « suis es est sommes êtes sont ». */
function six(forms: string): Forms {
  const list = forms.split(' ');
  if (list.length !== 6) throw new Error(`six formes attendues : ${forms}`);
  return list as Forms;
}

/** Trois formes de l'impératif : « parle parlons parlez ». */
function three(forms: string): ImperativeForms {
  const list = forms.split(' ');
  if (list.length !== 3) throw new Error(`trois formes attendues : ${forms}`);
  return list as ImperativeForms;
}

/** Temps composé avec avoir : l'auxiliaire au bon temps, puis le participe (« aurai fini »). */
function withAvoir(auxiliary: string, participle: string): Forms {
  return six(auxiliary).map((aux) => `${aux} ${participle}`) as Forms;
}

/**
 * Temps composé avec être : le participe s'accorde avec le sujet. Pour je, tu, nous, vous
 * le genre ne se voit pas : les deux sont justes ; « vous » peut être une seule personne.
 */
function withEtre(auxiliary: string, participle: string): Forms {
  const [je, tu, il, nous, vous, ils] = six(auxiliary) as string[];
  const p = participle;
  return [
    { answer: `${je} ${p}`, also: [`${je} ${p}e`] },
    { answer: `${tu} ${p}`, also: [`${tu} ${p}e`] },
    [`${il} ${p}`, `${il} ${p}e`],
    { answer: `${nous} ${p}s`, also: [`${nous} ${p}es`] },
    { answer: `${vous} ${p}s`, also: [`${vous} ${p}`, `${vous} ${p}e`, `${vous} ${p}es`] },
    [`${ils} ${p}s`, `${ils} ${p}es`],
  ];
}

/** Les auxiliaires des temps composés. */
const AVOIR_PRESENT = 'ai as a avons avez ont';
const AVOIR_IMPARFAIT = 'avais avais avait avions aviez avaient';
const AVOIR_FUTUR = 'aurai auras aura aurons aurez auront';
const ETRE_IMPARFAIT = 'étais étais était étions étiez étaient';
const ETRE_FUTUR = 'serai seras sera serons serez seront';

/** [numéro, verbe, temps, formes, lettre de la fiche] ; sans lettre : exercice écrit pour l'app. */
type Raw = readonly [number, string, TenseId, Forms | ImperativeForms, string?];

function exercises(belt: BeltId, raw: readonly Raw[]): Exercise[] {
  return raw.map(([n, verb, tense, forms, fiche]) => ({ id: `${belt}.${n}`, verb, tense, forms, ...(fiche ? { fiche } : {}) }));
}

export const CONJUGAISON: readonly ConjugationBelt[] = [
  {
    belt: 'blanche',
    skill: 'Présent des verbes en -er, être et avoir',
    tips: [
      'Le présent se trouve en disant « en ce moment, tous les jours… » (je mange, tu finis…). Évite de dire « aujourd’hui » pour trouver le présent.',
      'Attention aux verbes en -ger, comme nager : nous nageons.',
      'Attention aux verbes en -cer, comme lancer : nous lançons.',
    ],
    exercises: exercises('blanche', [
      [1, 'avoir', 'present', six('ai as a avons avez ont'), 'A'],
      [2, 'être', 'present', six('suis es est sommes êtes sont'), 'B'],
      [3, 'parler', 'present', six('parle parles parle parlons parlez parlent'), 'C'],
      [4, 'placer', 'present', six('place places place plaçons placez placent'), 'D'],
      [5, 'changer', 'present', six('change changes change changeons changez changent'), 'E'],
      [6, 'ranger', 'present', six('range ranges range rangeons rangez rangent'), 'F'],
      [7, 'lancer', 'present', six('lance lances lance lançons lancez lancent'), 'G'],
      [8, 'jouer', 'present', six('joue joues joue jouons jouez jouent')],
      [9, 'manger', 'present', six('mange manges mange mangeons mangez mangent')],
      [10, 'commencer', 'present', six('commence commences commence commençons commencez commencent')],
      [11, 'aimer', 'present', six('aime aimes aime aimons aimez aiment')],
    ]),
  },
  {
    belt: 'jaune',
    skill: 'Imparfait des verbes réguliers, être et avoir',
    tips: [
      'L’imparfait se trouve en disant « quand j’étais petit… » (j’avais, j’allais…).',
      'Quand on entend [s], attention aux deux s : je finissais, nous rougissions.',
    ],
    exercises: exercises('jaune', [
      [1, 'avoir', 'imparfait', six('avais avais avait avions aviez avaient'), 'A'],
      [2, 'être', 'imparfait', six('étais étais était étions étiez étaient'), 'B'],
      [3, 'plier', 'imparfait', six('pliais pliais pliait pliions pliiez pliaient'), 'C'],
      // La fiche corrige au présent (« j’écoute ») : corrigé.
      [4, 'écouter', 'imparfait', six('écoutais écoutais écoutait écoutions écoutiez écoutaient'), 'D'],
      [5, 'choisir', 'imparfait', six('choisissais choisissais choisissait choisissions choisissiez choisissaient'), 'E'],
      [6, 'réussir', 'imparfait', six('réussissais réussissais réussissait réussissions réussissiez réussissaient'), 'F'],
      [7, 'distribuer', 'imparfait', six('distribuais distribuais distribuait distribuions distribuiez distribuaient'), 'G'],
      [8, 'chanter', 'imparfait', six('chantais chantais chantait chantions chantiez chantaient')],
      [9, 'finir', 'imparfait', six('finissais finissais finissait finissions finissiez finissaient')],
      [10, 'rougir', 'imparfait', six('rougissais rougissais rougissait rougissions rougissiez rougissaient')],
    ]),
  },
  {
    belt: 'orange',
    skill: 'Futur des verbes réguliers, être, avoir, aller, faire, dire et venir',
    tips: [
      'Le futur se trouve en disant « quand je serai grand… » (j’aurai, tu feras…).',
      'Au futur, pas de -s à la première personne du singulier : je mangerai.',
      'Au futur, on entend toujours le « r » : j’irai, tu chanteras…',
    ],
    // La fiche M reprend la fiche I (préparer) : gardée une fois.
    exercises: exercises('orange', [
      [1, 'avoir', 'futur', six('aurai auras aura aurons aurez auront'), 'A'],
      [2, 'être', 'futur', six('serai seras sera serons serez seront'), 'B'],
      [3, 'plier', 'futur', six('plierai plieras pliera plierons plierez plieront'), 'C'],
      [4, 'aller', 'futur', six('irai iras ira irons irez iront'), 'D'],
      [5, 'faire', 'futur', six('ferai feras fera ferons ferez feront'), 'E'],
      [6, 'dire', 'futur', six('dirai diras dira dirons direz diront'), 'F'],
      [7, 'rester', 'futur', six('resterai resteras restera resterons resterez resteront'), 'G'],
      [8, 'finir', 'futur', six('finirai finiras finira finirons finirez finiront'), 'H'],
      [9, 'préparer', 'futur', six('préparerai prépareras préparera préparerons préparerez prépareront'), 'I'],
      [10, 'offrir', 'futur', six('offrirai offriras offrira offrirons offrirez offriront'), 'J'],
      [11, 'rêver', 'futur', six('rêverai rêveras rêvera rêverons rêverez rêveront'), 'K'],
      [12, 'grossir', 'futur', six('grossirai grossiras grossira grossirons grossirez grossiront'), 'L'],
      [13, 'venir', 'futur', six('viendrai viendras viendra viendrons viendrez viendront'), 'N'],
    ]),
  },
  {
    belt: 'rose',
    skill: 'Présent des verbes en -ir et -re',
    goal: 'CM1',
    tips: ['Repère bien l’infinitif du verbe pour choisir les bonnes terminaisons : je plie (verbe plier) mais je remplis (verbe remplir).'],
    exercises: exercises('rose', [
      [1, 'croire', 'present', six('crois crois croit croyons croyez croient'), 'A'],
      [2, 'écrire', 'present', six('écris écris écrit écrivons écrivez écrivent'), 'B'],
      [3, 'dire', 'present', six('dis dis dit disons dites disent'), 'C'],
      [4, 'remplir', 'present', six('remplis remplis remplit remplissons remplissez remplissent'), 'D'],
      [5, 'partir', 'present', six('pars pars part partons partez partent'), 'E'],
      [6, 'agir', 'present', six('agis agis agit agissons agissez agissent'), 'F'],
      [7, 'courir', 'present', six('cours cours court courons courez courent'), 'G'],
      [8, 'finir', 'present', six('finis finis finit finissons finissez finissent')],
      [9, 'sortir', 'present', six('sors sors sort sortons sortez sortent')],
      [10, 'lire', 'present', six('lis lis lit lisons lisez lisent')],
      [11, 'rendre', 'present', six('rends rends rend rendons rendez rendent')],
    ]),
  },
  {
    belt: 'vert-clair',
    skill: 'Passé composé avec avoir ; impératif des verbes réguliers',
    tips: [
      'Le passé composé se trouve en racontant ce qu’on a fait : « hier… » (j’ai terminé, j’ai fini…).',
      'Avec l’auxiliaire avoir, le participe passé ne s’accorde pas avec le sujet : nous avons aimé.',
      'L’impératif sert à donner un ordre ou une consigne : sors ! mange !',
      'À l’impératif, il n’y a pas de pronom : on écrit seulement le verbe.',
      'À l’impératif, à la 2ᵉ personne du singulier, pas de -s après le -e ni après le -a : va ! écoute !',
    ],
    exercises: exercises('vert-clair', [
      [1, 'être', 'imperatif', three('sois soyons soyez'), 'A'],
      [2, 'avoir', 'imperatif', three('aie ayons ayez'), 'B'],
      [3, 'parler', 'imperatif', three('parle parlons parlez'), 'C'],
      [4, 'finir', 'imperatif', three('finis finissons finissez'), 'D'],
      [5, 'rougir', 'passe-compose', withAvoir(AVOIR_PRESENT, 'rougi'), 'E'],
      [6, 'sauter', 'passe-compose', withAvoir(AVOIR_PRESENT, 'sauté'), 'F'],
      [7, 'pouvoir', 'passe-compose', withAvoir(AVOIR_PRESENT, 'pu'), 'G'],
      [8, 'lire', 'imperatif', three('lis lisons lisez'), 'H'],
      [9, 'manger', 'imperatif', three('mange mangeons mangez'), 'I'],
      [10, 'partir', 'imperatif', three('pars partons partez'), 'J'],
      [11, 'être', 'passe-compose', withAvoir(AVOIR_PRESENT, 'été'), 'K'],
      [12, 'avoir', 'passe-compose', withAvoir(AVOIR_PRESENT, 'eu'), 'L'],
      [13, 'croire', 'passe-compose', withAvoir(AVOIR_PRESENT, 'cru'), 'M'],
      [14, 'grandir', 'passe-compose', withAvoir(AVOIR_PRESENT, 'grandi'), 'N'],
    ]),
  },
  {
    belt: 'vert-fonce',
    skill: 'Imparfait et futur des verbes en -ger, -cer ou -ier',
    tips: [
      'Au futur des verbes en -er, on lit l’infinitif en entier : parfois il faut écrire un e qu’on n’entend pas (je jouerai, tu plieras).',
      'À l’imparfait des verbes en -ger, comme nager : je nageais, mais nous nagions.',
      'À l’imparfait des verbes en -cer, comme lancer : tu lançais, mais vous lanciez.',
      'À l’imparfait des verbes en -ier, -iller, -yer, comme crier : nous criions, nous travaillions, nous payions.',
    ],
    exercises: exercises('vert-fonce', [
      [1, 'nager', 'imparfait', six('nageais nageais nageait nagions nagiez nageaient'), 'A'],
      [2, 'grincer', 'imparfait', six('grinçais grinçais grinçait grincions grinciez grinçaient'), 'B'],
      [3, 'payer', 'imparfait', six('payais payais payait payions payiez payaient'), 'C'],
      [4, 'plier', 'imparfait', six('pliais pliais pliait pliions pliiez pliaient'), 'D'],
      [5, 'courir', 'futur', six('courrai courras courra courrons courrez courront'), 'E'],
      [6, 'saluer', 'futur', six('saluerai salueras saluera saluerons saluerez salueront'), 'F'],
      [7, 'pouvoir', 'futur', six('pourrai pourras pourra pourrons pourrez pourront'), 'G'],
      [8, 'commencer', 'imparfait', six('commençais commençais commençait commencions commenciez commençaient')],
      [9, 'crier', 'imparfait', six('criais criais criait criions criiez criaient')],
      [10, 'travailler', 'imparfait', six('travaillais travaillais travaillait travaillions travailliez travaillaient')],
      [11, 'jouer', 'futur', six('jouerai joueras jouera jouerons jouerez joueront')],
      [12, 'plier', 'futur', six('plierai plieras pliera plierons plierez plieront')],
    ]),
  },
  {
    belt: 'bleu-clair',
    skill: 'Passé simple',
    tips: [
      'Le passé simple se trouve en inventant un conte : « Le chevalier marchait quand, tout à coup… » (il aperçut…, il décida…, il vit…).',
    ],
    // Les titres de la fiche annoncent l'imparfait et le futur, ses corrections sont au passé simple, comme le classeur.
    exercises: exercises('bleu-clair', [
      [1, 'être', 'passe-simple', six('fus fus fut fûmes fûtes furent'), 'A'],
      [2, 'avoir', 'passe-simple', six('eus eus eut eûmes eûtes eurent'), 'B'],
      [3, 'oublier', 'passe-simple', six('oubliai oublias oublia oubliâmes oubliâtes oublièrent'), 'C'],
      [4, 'finir', 'passe-simple', six('finis finis finit finîmes finîtes finirent'), 'D'],
      [5, 'aller', 'passe-simple', six('allai allas alla allâmes allâtes allèrent'), 'E'],
      [6, 'faire', 'passe-simple', six('fis fis fit fîmes fîtes firent'), 'F'],
      [7, 'dire', 'passe-simple', six('dis dis dit dîmes dîtes dirent'), 'G'],
      [8, 'chanter', 'passe-simple', six('chantai chantas chanta chantâmes chantâtes chantèrent')],
      [9, 'prendre', 'passe-simple', six('pris pris prit prîmes prîtes prirent')],
      [10, 'venir', 'passe-simple', six('vins vins vint vînmes vîntes vinrent')],
    ]),
  },
  {
    belt: 'bleu-fonce',
    skill: 'Présent de tous les verbes courants',
    goal: 'CM2',
    tips: [
      'Y compris aller, faire, venir, prendre, pouvoir, voir, devoir, vouloir, croire.',
      'On écrit vous dites (et non « vous disez »), vous faites (et non « vous faisez »).',
      'On écrit ils voient (et non « ils voyent »), ils croient (et non « ils croivent »).',
    ],
    exercises: exercises('bleu-fonce', [
      [1, 'être', 'present', six('suis es est sommes êtes sont'), 'A'],
      [2, 'avoir', 'present', six('ai as a avons avez ont'), 'B'],
      [3, 'dire', 'present', six('dis dis dit disons dites disent'), 'C'],
      [4, 'faire', 'present', six('fais fais fait faisons faites font'), 'D'],
      [5, 'voir', 'present', six('vois vois voit voyons voyez voient'), 'E'],
      [6, 'croire', 'present', six('crois crois croit croyons croyez croient'), 'F'],
      [7, 'vouloir', 'present', six('veux veux veut voulons voulez veulent'), 'G'],
      [8, 'aller', 'present', six('vais vas va allons allez vont')],
      [9, 'venir', 'present', six('viens viens vient venons venez viennent')],
      [10, 'prendre', 'present', six('prends prends prend prenons prenez prennent')],
      [11, 'pouvoir', 'present', six('peux peux peut pouvons pouvez peuvent')],
      [12, 'devoir', 'present', six('dois dois doit devons devez doivent')],
    ]),
  },
  {
    belt: 'violette',
    skill: 'Conditionnel',
    tips: [
      'Le conditionnel se trouve en disant « si j’étais riche, je… » (je partirais, j’achèterais…).',
      'Ne confonds pas le conditionnel et l’imparfait, qui ont les mêmes terminaisons : si j’étais riche, j’irais… (conditionnel) ; quand j’étais petit, j’allais… (imparfait).',
    ],
    exercises: exercises('violette', [
      [1, 'être', 'conditionnel', six('serais serais serait serions seriez seraient'), 'A'],
      [2, 'avoir', 'conditionnel', six('aurais aurais aurait aurions auriez auraient'), 'B'],
      [3, 'finir', 'conditionnel', six('finirais finirais finirait finirions finiriez finiraient'), 'C'],
      // La fiche corrige « il ferai » : corrigé.
      [4, 'faire', 'conditionnel', six('ferais ferais ferait ferions feriez feraient'), 'D'],
      [5, 'prendre', 'conditionnel', six('prendrais prendrais prendrait prendrions prendriez prendraient'), 'E'],
      [6, 'partir', 'conditionnel', six('partirais partirais partirait partirions partiriez partiraient'), 'F'],
      [7, 'vouloir', 'conditionnel', six('voudrais voudrais voudrait voudrions voudriez voudraient'), 'G'],
      [8, 'aller', 'conditionnel', six('irais irais irait irions iriez iraient')],
      [9, 'chanter', 'conditionnel', six('chanterais chanterais chanterait chanterions chanteriez chanteraient')],
      [10, 'pouvoir', 'conditionnel', six('pourrais pourrais pourrait pourrions pourriez pourraient')],
    ]),
  },
  {
    belt: 'marron',
    skill: 'Futur antérieur et plus-que-parfait',
    tips: [
      'Ce sont des temps composés : l’auxiliaire être ou avoir, puis le participe passé.',
      'Au futur antérieur, l’auxiliaire est au futur : j’aurai fini, je serai venu.',
      'Au plus-que-parfait, l’auxiliaire est à l’imparfait : j’avais fait, j’étais parti.',
      'Avec l’auxiliaire être, le participe passé s’accorde avec le sujet : elles étaient parties.',
    ],
    // Fiches D et E : « nous avons, vous avez » corrigés en « nous avions, vous aviez ».
    // Fiche F (partir au plus-que-parfait) : sa correction est au conditionnel, et la fiche G
    // donne la bonne ; F n'est pas reprise.
    exercises: exercises('marron', [
      [1, 'être', 'futur-anterieur', withAvoir(AVOIR_FUTUR, 'été'), 'A'],
      [2, 'venir', 'futur-anterieur', withEtre(ETRE_FUTUR, 'venu'), 'B'],
      [3, 'finir', 'futur-anterieur', withAvoir(AVOIR_FUTUR, 'fini'), 'C'],
      [4, 'faire', 'plus-que-parfait', withAvoir(AVOIR_IMPARFAIT, 'fait'), 'D'],
      [5, 'prendre', 'plus-que-parfait', withAvoir(AVOIR_IMPARFAIT, 'pris'), 'E'],
      [6, 'partir', 'plus-que-parfait', withEtre(ETRE_IMPARFAIT, 'parti'), 'G'],
      [7, 'aller', 'futur-anterieur', withEtre(ETRE_FUTUR, 'allé')],
      [8, 'avoir', 'plus-que-parfait', withAvoir(AVOIR_IMPARFAIT, 'eu')],
      [9, 'chanter', 'plus-que-parfait', withAvoir(AVOIR_IMPARFAIT, 'chanté')],
    ]),
  },
];

export function conjugationBelt(belt: BeltId): ConjugationBelt | undefined {
  return CONJUGAISON.find((b) => b.belt === belt);
}
