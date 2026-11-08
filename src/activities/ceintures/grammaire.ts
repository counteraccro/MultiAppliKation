// Ceintures de grammaire : les 11 ceintures du classeur (« Dans une phrase, je reconnais… »,
// voir .ai/analyse/19-ceintures-grammaire.md). Deux sortes d'exercices, comme sur les fiches :
// - les fonctions : l'enfant colorie les mots avec les crayons de la ceinture, comme en classe (leçon G5) :
//   le verbe surligné en jaune, le sujet souligné en bleu, les COD et COI en noir, les CC en vert…
// - les natures : des mots sont soulignés, l'enfant donne la nature de chacun (article défini, nom propre…).
// Phrases des fiches « Je prépare la ceinture… » de Charivari à l'école (numéro de la fiche), et les nôtres (0).
// Une phrase s'écrit avec ses groupes entre crochets : « [S:Mon petit chat] [V:se réveilla] et [V:miaula]. » ;
// un complément du nom se met dans son groupe : « [S:Les parents [CdN:de Béatrice]] [V:lisent]… ».
// Les identifiants des phrases (ceinture, exercice, rang) sont enregistrés : ajouter les nouvelles à la fin.

import { shuffle, type QuizQuestion } from '../../core/quiz';
import type { BeltId } from './belts';

export type GrammarTag =
  // Les fonctions, et le pronom de la jaune (entouré).
  | 'V'
  | 'S'
  | 'P'
  | 'COD'
  | 'COI'
  | 'CCT'
  | 'CCL'
  | 'CCC'
  | 'CdN'
  | 'AdS'
  // Les natures.
  | 'AD'
  | 'AI'
  | 'DP'
  | 'DD'
  | 'NC'
  | 'NP'
  | 'PP'
  | 'ADJ'
  | 'VC'
  | 'ADV'
  | 'PREP'
  | 'CONJ';

export interface TagInfo {
  /** Sur le bouton : « Sujet », « article défini ». */
  name: string;
  /** L'étiquette sous le groupe, comme sur les fiches (S, COD, CCT) ; sous un mot pour une nature (art. déf.). */
  label?: string;
  /** Le complément du nom : il est dans un autre groupe (sujet, COD…), le mot garde les deux. */
  inside?: true;
}

export const TAGS: Record<GrammarTag, TagInfo> = {
  // Le verbe est surligné, le pronom entouré : pas besoin d'étiquette.
  V: { name: 'Verbe' },
  S: { name: 'Sujet', label: 'S' },
  P: { name: 'Pronom' },
  COD: { name: 'COD', label: 'COD' },
  COI: { name: 'COI', label: 'COI' },
  CCT: { name: 'CC de temps', label: 'CCT' },
  CCL: { name: 'CC de lieu', label: 'CCL' },
  CCC: { name: 'CC de cause', label: 'CCC' },
  CdN: { name: 'CdN', label: 'CdN', inside: true },
  AdS: { name: 'Attribut', label: 'AdS' },
  AD: { name: 'article défini', label: 'art. déf.' },
  AI: { name: 'article indéfini', label: 'art. indéf.' },
  DP: { name: 'déterminant possessif', label: 'dét. poss.' },
  DD: { name: 'déterminant démonstratif', label: 'dét. dém.' },
  NC: { name: 'nom commun', label: 'nom c.' },
  NP: { name: 'nom propre', label: 'nom p.' },
  PP: { name: 'pronom personnel', label: 'pron. pers.' },
  ADJ: { name: 'adjectif', label: 'adjectif' },
  VC: { name: 'verbe conjugué', label: 'verbe' },
  ADV: { name: 'adverbe', label: 'adverbe' },
  PREP: { name: 'préposition', label: 'prépo.' },
  CONJ: { name: 'conjonction de coordination', label: 'conj. coord.' },
};

/** Les natures de chaque ceinture : celles des ceintures d'avant, et les nouvelles. */
const NATURES_ORANGE: readonly GrammarTag[] = ['AD', 'AI', 'DP', 'DD', 'NC', 'NP', 'PP'];
const NATURES_ROSE: readonly GrammarTag[] = [...NATURES_ORANGE, 'ADJ', 'VC'];
const NATURES_VIOLETTE: readonly GrammarTag[] = [...NATURES_ROSE, 'ADV'];
const NATURES_NOIRE: readonly GrammarTag[] = [...NATURES_VIOLETTE, 'PREP', 'CONJ'];

export interface GrammarExercise {
  id: string;
  /** La consigne, comme sur la fiche : « Surligne les verbes conjugués. » */
  instruction: string;
  /**
   * `color` : on colorie les mots avec les crayons (fonctions) ;
   * `nature` : les mots entre crochets sont soulignés, on donne la nature de chacun.
   */
  mode: 'color' | 'nature';
  /** Les crayons ou les natures de l'exercice, dans l'ordre des boutons. */
  pencils: readonly GrammarTag[];
  /** Montrée après une erreur. */
  tip: string;
  /** Les phrases : [numéro de la fiche Charivari ou 0 pour les nôtres, texte]. */
  sentences: readonly (readonly [number, string])[];
  /** Les phrases montrées dans la leçon (leur rang). */
  examples: readonly number[];
}

export interface GrammarBelt {
  belt: BeltId;
  /** Ce que demande la ceinture, comme dans le classeur. */
  skill: string;
  goal?: 'CE2' | 'CM1' | 'CM2';
  /** Les règles des leçons de la classe. */
  tips: readonly string[];
  /** Les exercices des fiches (jaune : les pronoms, puis le sujet). */
  tasks: readonly GrammarExercise[];
}

/** Les marques d'un mot : une fonction ou une nature, et parfois CdN en plus. */
export type WordMarks = readonly GrammarTag[];

/**
 * Un morceau de phrase : un mot à toucher, avec ses marques attendues et le groupe entre crochets où il est
 * (`unit`, pour les natures : « ai pu », « au-dessus d’ » se donnent ensemble), ou ce qu'il y a entre deux mots.
 */
export type Piece = string | { word: string; tags: WordMarks; unit?: number };

export interface GrammarQuestion extends QuizQuestion {
  id: string;
  exercise: GrammarExercise;
  pieces: readonly Piece[];
  /** Les marques attendues pour chaque mot, dans l'ordre des mots. */
  expected: readonly WordMarks[];
}

/** Phrases d'un entraînement, et de l'entraînement en conditions réelles (réussi à 9 justes sur 10). */
export const GRAMMAR_PRACTICE_SIZE = 6;
export const GRAMMAR_TEST_SIZE = 10;

const OPEN = new RegExp(`^\\[(${Object.keys(TAGS).join('|')}):`);
/** Un mot : « J’ » ou « d’ » seuls (élision), « cache-cache » en entier. */
const WORD = /\p{L}+’|[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu;

/** Coupe la phrase en mots et en ce qu'il y a entre eux, chaque mot avec ses marques. */
export function parseGrammar(text: string): Piece[] {
  const pieces: Piece[] = [];
  const open: { tag: GrammarTag; unit: number }[] = [];
  let units = 0;
  const pushText = (part: string) => {
    if (typeof pieces.at(-1) === 'string') pieces[pieces.length - 1] += part;
    else pieces.push(part);
  };
  const push = (part: string) => {
    let last = 0;
    const tags = open.map((o) => o.tag);
    const unit = open.at(-1)?.unit;
    for (const match of part.matchAll(WORD)) {
      if (match.index > last) pushText(part.slice(last, match.index));
      pieces.push(unit === undefined ? { word: match[0], tags } : { word: match[0], tags, unit });
      last = match.index + match[0].length;
    }
    if (last < part.length) pushText(part.slice(last));
  };
  let plain = '';
  for (let i = 0; i < text.length; i++) {
    const opening = OPEN.exec(text.slice(i));
    if (opening || (text[i] === ']' && open.length > 0)) {
      push(plain);
      plain = '';
      if (opening) {
        open.push({ tag: opening[1] as GrammarTag, unit: units++ });
        i += opening[0].length - 1;
      } else {
        open.pop();
      }
    } else {
      plain += text[i];
    }
  }
  push(plain);
  return pieces;
}

export const wordsOf = (pieces: readonly Piece[]) => pieces.filter((p): p is Exclude<Piece, string> => typeof p !== 'string');

/** La phrase sans les crochets. */
export const plainText = (pieces: readonly Piece[]) => pieces.map((p) => (typeof p === 'string' ? p : p.word)).join('');

/**
 * Le coloriage écrit comme une réponse, crayon par crayon, les mots dans l'ordre : « V:1,2|S:0 ».
 * Deux coloriages pareils s'écrivent pareil, quel que soit l'ordre où les mots ont été touchés.
 */
export function encodeMarks(marks: readonly WordMarks[], pencils: readonly GrammarTag[]): string {
  return pencils.map((tag) => `${tag}:${marks.flatMap((m, i) => (m.includes(tag) ? [i] : [])).join(',')}`).join('|');
}

/** Le contraire : les marques de chaque mot, pour la correction. */
export function decodeMarks(text: string, count: number): GrammarTag[][] {
  const marks: GrammarTag[][] = Array.from({ length: count }, () => []);
  for (const part of text.split('|')) {
    const [tag, indices = ''] = part.split(':') as [GrammarTag, string?];
    for (const i of indices.split(',').filter(Boolean)) marks[Number(i)]?.push(tag);
  }
  return marks;
}

/**
 * Colorier un mot avec un crayon : le même crayon l'efface ; un autre remplace la fonction qu'il avait.
 * Le complément du nom s'ajoute à la fonction du groupe, sans la remplacer.
 */
export function paint(marks: WordMarks, tag: GrammarTag): GrammarTag[] {
  if (marks.includes(tag)) return marks.filter((t) => t !== tag);
  return TAGS[tag].inside ? [...marks, tag] : [...marks.filter((t) => TAGS[t].inside), tag];
}

/** La fonction (ou la nature) d'un mot, sans le complément du nom. */
export const mainTag = (marks: WordMarks) => marks.find((t) => !TAGS[t].inside);

/** Deux mots marqués pareil. */
export const sameMarks = (a: WordMarks, b: WordMarks) => a.length === b.length && a.every((t) => b.includes(t));

export function grammarQuestion(belt: BeltId, exercise: GrammarExercise, index: number): GrammarQuestion {
  const text = exercise.sentences[index]![1];
  const pieces = parseGrammar(text);
  const expected = wordsOf(pieces).map((w) => w.tags);
  const plain = plainText(pieces);
  return {
    id: `${belt}.${exercise.id}.${index}`,
    exercise,
    pieces,
    expected,
    prompt: plain,
    context: exercise.instruction,
    answer: encodeMarks(expected, exercise.pencils),
    solved: plain,
    explain: exercise.tip,
  };
}

/**
 * Les phrases d'une série : chaque exercice de la ceinture à tour de rôle (jaune : les pronoms, puis le sujet),
 * de préférence pas vues au dernier entraînement (`seen`).
 */
export function pickGrammar(belt: GrammarBelt, count: number, seen: readonly string[] = [], random = Math.random): GrammarQuestion[] {
  const piles = shuffle(belt.tasks, random).map((exercise) => {
    const all = exercise.sentences.map((_, i) => grammarQuestion(belt.belt, exercise, i));
    return [...shuffle(all.filter((q) => !seen.includes(q.id)), random), ...shuffle(all.filter((q) => seen.includes(q.id)), random)];
  });
  const picked: GrammarQuestion[] = [];
  while (picked.length < count && piles.some((pile) => pile.length > 0)) {
    for (const pile of piles) {
      const next = pile.shift();
      if (next && picked.length < count) picked.push(next);
    }
  }
  return picked;
}

const VERBS: GrammarExercise = {
  id: 'verbes',
  instruction: 'Surligne les verbes conjugués.',
  mode: 'color',
  pencils: ['V'],
  examples: [8, 7, 1],
  tip: 'Le verbe conjugué change si on change le temps (hier, demain) ou la personne. Au passé composé, il a deux mots : « a pris », « sont partis ». Mais si le mot après « est » dit comment est le nom, il ne fait pas partie du verbe : « Le cheval est assoiffé » → on surligne seulement « est ». Un verbe à l’infinitif (escalader, partir) n’est pas conjugué.',
  sentences: [
    [1, 'Mon frère [V:sort] sa trottinette du garage.'],
    [1, 'Le cheval [V:est] assoiffé après sa course.'],
    [1, 'Les enfants, qui [V:jouent] à cache-cache, [V:courent] dans tous les sens.'],
    [2, 'Le maitre [V:fait] l’appel.'],
    [2, 'Ma voiture [V:est] près de la gare.'],
    [2, 'Je [V:gare] ma voiture devant l’école.'],
    [3, 'Je [V:rentrerai] à la maison avec mon vélo étincelant.'],
    [3, '[V:Joue] ou [V:passe] ton tour.'],
    [3, 'Il [V:a pris] sa douche au réveil.'],
    [4, 'Ils [V:referment] la porte.'],
    [4, 'Nous [V:jouons] avec un ballon dégonflé.'],
    [4, 'Le grimpeur [V:prend] des appuis pour escalader.'],
    [5, 'J’[V:aime] le brillant de ta veste.'],
    [5, 'Le feu d’artifice [V:étincelle] dans le ciel.'],
    [5, 'Nous [V:irons] à la pêche avec toi dimanche.'],
    [6, 'Une étincelle [V:a déclenché] l’incendie.'],
    [6, 'Il [V:met] le bois dans la cheminée.'],
    [6, 'Nous [V:sommes] dans une salle ensoleillée.'],
    [0, 'Hier soir, ma petite sœur [V:a regardé] un dessin animé avec mon cousin.'],
    [0, 'Pendant les vacances d’été, nous [V:partirons] chez nos grands-parents à la montagne.'],
    [0, 'Le chien de la voisine [V:aboie] chaque fois que le facteur [V:passe] devant la maison.'],
    [0, 'Mes parents [V:ont acheté] une nouvelle table pour la cuisine.'],
    [0, 'Pour gagner la course, Lina [V:court] tous les matins.'],
    [0, 'La porte de la classe [V:est restée] ouverte toute la matinée.'],
    [0, 'Autrefois, les enfants [V:allaient] à l’école à pied.'],
    [0, '[V:Range] tes affaires avant de partir.'],
    [0, 'Le vent [V:souffle] si fort que les arbres [V:plient].'],
    [0, 'Les oiseaux [V:sont partis] vers le sud.'],
    [0, 'Mon oncle [V:a] une moto rouge et noire.'],
    [0, 'Demain matin, la maitresse [V:corrigera] nos cahiers.'],
    [0, 'Le gâteau au chocolat que ma mère [V:a préparé] [V:sent] très bon.'],
    [0, 'Nous [V:avons mangé] des crêpes à la fête de l’école.'],
    [0, 'Tous les soirs, avant de dormir, Paul [V:lit] une histoire à son petit frère.'],
    [0, 'Le lion [V:dormait] sous un arbre pendant que les gazelles [V:mangeaient].'],
    [0, 'Les feuilles mortes [V:tombent] dans le jardin abandonné.'],
    [0, 'Vous [V:êtes arrivés] en retard ce matin.'],
    [0, 'Ce matin, sur le chemin de l’école, Inès [V:a trouvé] un petit chat perdu.'],
    [0, '[V:Écoutez] bien la consigne avant de commencer.'],
  ],
};

const PRONOUNS: GrammarExercise = {
  id: 'pronoms',
  instruction: 'Entoure les pronoms personnels sujets.',
  mode: 'color',
  pencils: ['P'],
  examples: [3],
  tip: 'Les pronoms personnels sujets : je (j’), tu, il, elle, on, nous, vous, ils, elles. Ils remplacent un nom devant le verbe. Le « c’ » de « c’est » n’en est pas un.',
  sentences: [
    [7, '[P:Je] voulais un petit chien. Papa ne voulait pas. [P:Il] a dit : « [P:Tu] vas avoir une petite sœur. [P:Elle] sera surement très mignonne. [P:Vous] deviendrez amis, [P:tu] vas voir. »'],
    [8, 'La neige est tombée. [P:Elle] est épaisse et poudreuse. Les skieurs sont ravis. [P:Ils] vont pouvoir dévaler les pistes. Avec mon frère, [P:nous] allons faire un bonhomme de neige : [P:j’]ai hâte !'],
    [9, 'C’est la rentrée. Mon père est inquiet. [P:Il] donne plein de conseils stupides ! [P:Je] suis impatiente d’arriver. [P:Nous] voilà à la grille. [P:J’]ai envie de retrouver mes copines mais [P:on] doit attendre. Voici Léa ! Le maitre appelle enfin : « [P:Vous] pouvez entrer, les enfants. »'],
    [0, 'Le matin, [P:je] prends mon petit déjeuner avec ma sœur. [P:Elle] mange toujours des tartines.'],
    [0, 'Nos voisins ont un grand jardin. [P:Ils] cultivent des tomates et des fraises.'],
    [0, 'Les filles jouent à la marelle. [P:Elles] sautent à cloche-pied. Puis [P:nous] rentrons en classe.'],
    [0, '« [P:Tu] viens au parc ? » demande Hugo. « Oui, [P:j’]arrive ! »'],
    [0, 'Le dimanche, [P:on] va souvent à la piscine. [P:Vous] pouvez venir aussi.'],
    [0, 'Mon chat est très gourmand. [P:Il] vole les croquettes du chien. Le chien n’est pas content !'],
    [0, '[P:Nous] partons en classe de découverte. Les parents sont un peu inquiets, mais [P:ils] savent que [P:nous] serons sages.'],
    [0, 'Léo et Sam construisent une cabane. [P:Ils] ramassent des branches. Ensuite, [P:ils] attachent les branches avec une ficelle.'],
    [0, 'La maitresse lit une histoire. [P:Elle] montre les images. [P:Nous] écoutons sans bruit.'],
    [0, 'Ce soir, [P:tu] mettras la table et [P:je] ferai la vaisselle.'],
    [0, 'Ma grand-mère habite à la campagne. Quand [P:j’]arrive, [P:elle] prépare une tarte aux pommes.'],
    [0, 'Le car est en retard. [P:Vous] attendez depuis longtemps ? Les élèves commencent à avoir froid.'],
  ],
};

const SUBJECTS_OF_VERBS: GrammarExercise = {
  id: 'sujet',
  instruction: 'Surligne les verbes conjugués et souligne leur sujet.',
  mode: 'color',
  pencils: ['V', 'S'],
  examples: [9, 12, 7],
  tip: 'Pour trouver le sujet : « C’est … qui » devant le verbe. Prends tout le groupe : « le chat silencieux », pas seulement « le chat ». Le sujet peut être loin du verbe, ou après lui. « se », « te » font partie du verbe : « se réveilla ».',
  sentences: [
    [10, 'Dès le printemps, [S:les hirondelles] [V:commencent] à revenir.'],
    [10, '[S:Quentin et Bastien] [V:jouent] à saute-mouton.'],
    [10, '[S:Les élèves de service] [V:distribuent] les cahiers.'],
    [11, '[S:Mon petit chat] [V:se réveilla] et [V:miaula] aussitôt.'],
    [11, '[S:Il] [V:avait] le bout du nez tout rose et les yeux tout chiffonnés de sommeil.'],
    [11, '[S:De nombreux nuages menaçants] [V:se forment].'],
    [12, '[S:Tu] [V:te dépêches] pour attraper ton train.'],
    [12, '[S:Les nouveaux élèves] [V:se sont assis] sur un banc.'],
    [12, 'En fronçant les sourcils, [S:Tom] [V:regarde] le ciel.'],
    [0, '[S:Le chat silencieux] [V:guette] une souris derrière le buffet.'],
    [0, 'Chaque matin, [S:le boulanger du village] [V:prépare] des croissants.'],
    [0, '[S:Mon cousin et sa petite sœur] [V:ont visité] le château de Versailles.'],
    [0, 'Dans la forêt sombre [V:vivait] [S:un vieux loup].'],
    [0, '[S:Les enfants de la classe de CM1] [V:prépareront] un spectacle pour la fin de l’année.'],
    [0, 'Au bord de la rivière, [S:une grenouille verte] [V:saute] sur un nénuphar.'],
    [0, '[S:Nous] [V:sommes allés] au cinéma avec nos amis.'],
    [0, '[S:La petite fille aux cheveux bouclés] [V:chante] une chanson.'],
    [0, '[S:Le facteur] [V:a déposé] une lettre dans la boite.'],
    [0, 'Sur la branche, [S:deux oiseaux] [V:se disputent] une graine.'],
    [0, '[S:Les feuilles des arbres] [V:jaunissent] en automne.'],
    [0, 'Hier, [S:mes parents] [V:sont partis] tôt et [V:ont pris] le train.'],
    [0, 'Depuis ce matin, [S:la pluie] [V:tombe] sur la ville.'],
    [0, '[S:Le vieux pêcheur] [V:lance] sa ligne dans l’eau et [V:attend] patiemment.'],
    [0, '[S:Mes amis] [V:se sont cachés] derrière la porte.'],
    [0, '[S:La voiture rouge de mon voisin] [V:démarre] difficilement.'],
    [0, 'Soudain, [S:un énorme chien noir] [V:surgit] au coin de la rue.'],
  ],
};

const NATURE_INSTRUCTION = 'Donne la nature des mots soulignés.';

const DETERMINERS: GrammarExercise = {
  id: 'natures',
  instruction: NATURE_INSTRUCTION,
  mode: 'nature',
  pencils: NATURES_ORANGE,
  examples: [0, 6],
  tip: 'Article défini : le, la, l’, les. Article indéfini : un, une, des. Déterminant possessif : mon, ton, son, ma, ta, sa, mes, tes, ses, notre, votre, leur, nos, vos, leurs. Déterminant démonstratif : ce, cet, cette, ces. Un nom propre prend une majuscule.',
  sentences: [
    [13, 'Lorsque j’ai appelé, [AI:une] femme aimable m’a répondu. [PP:Elle] m’a dit que [NP:Sébastien] faisait [DP:ses] devoirs.'],
    [13, '« Est-ce qu’il peut venir [DD:ce] [NC:soir] ? »'],
    [14, '[NP:Prince] était [AI:un] magnifique poulain alezan.'],
    [14, '[PP:Il] se tenait fièrement dans [AD:la] [NC:cour], nous observant de [DP:ses] grands yeux tranquilles.'],
    [15, 'Les fourmis sont [AI:des] travailleuses infatigables.'],
    [15, '[PP:Elles] passent [AD:l’]essentiel de [DP:leur] courte [NC:vie] à chercher de la nourriture, construire ou protéger [DP:leur] fourmilière.'],
    [16, 'Sais-tu, [NP:Victor], que, chez [AD:les] grands dauphins, les [NC:femelles] mettent au monde [AI:des] petits deux ou trois fois par an ?'],
    [16, '[PP:Je] suis passionnée par [DD:ces] animaux !'],
    [17, '[AD:Les] chênes sont [AI:des] arbres à bois dur. [PP:Ils] résistent aux insectes et aux champignons.'],
    [17, 'C’est pour cela que Maitre [NP:Lanteau] choisit [DD:ce] bois pour [DP:ses] charpentes.'],
    [18, 'Demain, [AI:des] averses seront possibles sur la [NP:Picardie].'],
    [18, 'Dans la moitié Sud, [AD:le] temps sera plus sec. Les [NC:températures] resteront bien basses.'],
    [18, '[PP:Elles] remonteront mardi mais [DD:ces] régions resteront peu ensoleillées.'],
    [0, '[NP:Léa] a perdu [DP:son] écharpe dans [AD:la] cour de récréation.'],
    [0, '[DD:Cette] [NC:maison] appartient à [DP:mes] grands-parents.'],
    [0, '[PP:Nous] avons vu [AI:un] [NC:dauphin] près de [NP:Marseille].'],
    [0, '[AD:L’][NC:hiver] arrive : [PP:il] fait froid.'],
    [0, '[DD:Ces] enfants jouent avec [DP:leurs] [NC:billes].'],
    [0, '[NP:Paris] est [AI:une] grande ville. [PP:Elle] attire [AI:des] touristes du monde entier.'],
    [0, '[PP:Vous] prendrez [DD:cet] [NC:escalier] pour aller au grenier.'],
    [0, '[AI:Une] [NC:souris] grignote [AD:le] fromage de [NP:Lucas].'],
    [0, '[PP:Tu] liras [DD:ce] livre à [DP:ta] sœur.'],
  ],
};

const ADJECTIVES: GrammarExercise = {
  id: 'natures',
  instruction: NATURE_INSTRUCTION,
  mode: 'nature',
  pencils: NATURES_ROSE,
  examples: [4, 14],
  tip: 'L’adjectif donne des précisions sur le nom : « un chat noir ». Il s’accorde avec lui : « des fleurs jaunes ». Le verbe conjugué change avec le temps : « fait » → « faisait ».',
  sentences: [
    [19, '[DD:Cet] été, [PP:je] suis partie en vacances à [NP:Madère], une ile [ADJ:splendide] à l’ouest de l’Afrique.'],
    [19, 'J’[VC:ai pu] admirer de [ADJ:magnifiques] paysages.'],
    [20, '[DP:Ses] [ADJ:jeunes] chiennes aimeraient bien jouer avec [DP:mon] chat, mais celui-ci les trouve trop [ADJ:brusques] et préfère faire [AD:la] [NC:chasse] aux [ADJ:petites] souris.'],
    [21, 'Le panda [ADJ:roux] [VC:fait] partie de [AD:la] famille des ours.'],
    [21, '[DP:Son] pelage est rouge à reflets [ADJ:dorés] et sa queue [ADJ:brune] est cerclée de rouge.'],
    [22, 'Le panda roux vit dans les forêts [ADJ:épaisses] de l’[NP:Himalaya].'],
    [22, 'Il se nourrit essentiellement de bambou, mais [VC:peut] aussi manger [AI:des] fruits, des feuilles, des [NC:racines] et des glands.'],
    [23, 'Les bébés, [ADJ:aveugles] et [ADJ:sourds], n’ouvrent [AD:les] yeux qu’après 18 jours.'],
    [23, 'Ils restent avec [DP:leur] mère jusqu’à sa prochaine [NC:portée].'],
    [24, 'Le panda roux est une espèce menacée à cause de la [NC:destruction] des forêts et du braconnage.'],
    [24, 'Certains [VC:essaient] de le protéger en informant [AD:les] populations [ADJ:proches] des parcs [ADJ:nationaux] et des réserves [ADJ:naturelles].'],
    [0, '[AI:Un] [ADJ:petit] chat [ADJ:noir] [VC:dort] sur [DP:mon] lit.'],
    [0, '[NP:Tom] [VC:a mangé] une pomme [ADJ:rouge] et [ADJ:sucrée].'],
    [0, '[DD:Ces] fleurs [ADJ:jaunes] [VC:sentent] très bon.'],
    [0, '[PP:Nous] [VC:visiterons] [AI:un] [ADJ:vieux] château.'],
    [0, 'La mer [VC:était] [ADJ:calme] et [AD:le] ciel [ADJ:bleu].'],
    [0, '[DP:Ma] [ADJ:grande] sœur [VC:porte] [AI:une] robe [ADJ:verte].'],
    [0, '[AD:Les] [NC:élèves] [ADJ:sages] [VC:recevront] une image.'],
  ],
};

const CC_TIP = 'Le complément circonstanciel se déplace ou se supprime. Il répond à quand ? (CCT), où ? (CCL), pourquoi ? (CCC). Prends tout le groupe : « à cause de la pluie ».';

const CIRCUMSTANTIAL: GrammarExercise = {
  id: 'cc',
  instruction: 'Surligne le verbe, souligne le sujet et les compléments circonstanciels.',
  mode: 'color',
  pencils: ['V', 'S', 'CCT', 'CCL', 'CCC'],
  examples: [7, 11],
  tip: CC_TIP,
  sentences: [
    [25, '[S:Mon gentil chat] [V:dort] [CCL:dans son panier].'],
    [25, '[CCL:Sur le terrain], [S:l’arbitre] [V:a sifflé] le joueur fautif.'],
    [26, '[CCT:Après la piscine], [S:Louise] [V:prend] un gouter.'],
    [26, '[CCT:Avant-hier], [S:j’][V:ai visité] la tour Eiffel.'],
    [27, '[S:Elles] [V:réparent] leurs vélos.'],
    [27, '[S:Samy et toi] [V:essayez] les déguisements [CCL:dans la boutique].'],
    [28, '[S:Le facteur] [V:distribue] le courrier [CCT:tous les matins] [CCT:vers 10 heures].'],
    [28, '[S:Les enfants] [V:jouent] à cache-cache [CCL:dans la cour].'],
    [28, '[CCT:Tôt le matin], [S:le livreur] [V:commence] son travail.'],
    [29, '[S:J’][V:ai rencontré] mon ancien professeur [CCL:à Paris].'],
    [29, '[S:Ce petit chien blanc] [V:appartient] à mon voisin.'],
    [30, '[CCT:Ce matin], [S:mon réveil] n’[V:a] pas [V:sonné].'],
    [30, '[S:Il] [V:joue] de la batterie [CCT:tous les samedis].'],
    [30, '[CCC:À cause de la grève], [S:mes parents] [V:font] les courses [CCL:au supermarché].'],
    [0, '[CCT:Pendant la nuit], [S:la neige] [V:a recouvert] le jardin.'],
    [0, '[CCC:Grâce à son courage], [S:le pompier] [V:a sauvé] un enfant.'],
    [0, '[S:Les canards] [V:nagent] [CCL:sur l’étang].'],
    [0, '[CCL:Dans la forêt], [S:nous] [V:avons cueilli] des champignons [CCT:hier après-midi].'],
    [0, '[S:Le match] [V:a été annulé] [CCC:à cause de l’orage].'],
    [0, '[CCT:Le mercredi], [S:Inès] [V:fait] du judo [CCL:au gymnase].'],
    [0, '[CCC:Par peur du loup], [S:les moutons] [V:restent] [CCL:dans la bergerie].'],
  ],
};

const OBJECTS_TIP = 'Le COD et le COI ne se déplacent pas et ne se suppriment pas. Le COD répond à « quoi ? » ou « qui ? » après le verbe ; le COI à « à quoi ? », « de qui ? » : il commence par à, au, aux, de, du, des. Les CC, eux, se déplacent.';

const OBJECTS: GrammarExercise = {
  id: 'cod-coi',
  instruction: 'Surligne le verbe, souligne le sujet, les COD, les COI et les CC.',
  mode: 'color',
  pencils: ['V', 'S', 'COD', 'COI', 'CCT', 'CCL', 'CCC'],
  examples: [0, 1, 8],
  tip: OBJECTS_TIP,
  sentences: [
    [31, '[S:La dame] [V:arrose] [COD:les fleurs] [CCL:devant sa maison].'],
    [31, '[S:Martin] [V:parle] [COI:à son ami].'],
    [31, '[CCT:Pendant les vacances], [S:j’][V:ai envoyé] [COD:une lettre] [COI:à ma tante].'],
    [32, '[S:Noa] [V:prend] [COD:son gouter] [CCL:chez sa mamie].'],
    [32, '[CCT:Souvent], [S:ton petit frère] [V:pense] [COI:à toi].'],
    [32, '[S:Je] [V:téléphonerai] [COI:au médecin] [CCT:dès que possible].'],
    [33, '[S:Maman] [V:épluche] [COD:des pommes].'],
    [33, '[S:Tu] [V:as vu] [COD:mes chaussures] [CCT:ce matin] ?'],
    [33, '[S:Le maitre] [V:a rendu] [COD:son stylo] [COI:à Kévin].'],
    [34, '[CCT:Pour demain], [S:la maitresse] [V:a donné] [COD:une leçon] [COI:aux élèves].'],
    [34, '[S:Il] [V:a terminé] [COD:ses exercices] [CCT:juste avant la récréation].'],
    [35, '[S:Mon petit frère] [V:a offert] [COD:un dessin] [COI:à maman].'],
    [36, '[CCT:Chaque soir], [S:Maxime] [V:lit] [COD:une histoire] [COI:à sa sœur].'],
    [36, '[S:Nous] [V:jouons] [COI:au ballon] [CCL:de l’autre côté de la rue].'],
    [36, '[S:Le petit chiot] [V:réclame] [COD:des caresses].'],
    [37, '[S:Papa] [V:croise] [COD:deux motos] [CCL:sur la route].'],
    [37, '[CCT:Hier], [S:les élèves] [V:ont rencontré] [COD:un écrivain célèbre].'],
    [38, '[CCT:Chaque matin], [CCT:au petit déjeuner], [S:Marie] [V:avale] [COD:un grand bol de chocolat].'],
    [38, '[CCT:Le soir], [S:mon père] [V:fait] [COD:la vaisselle] [CCT:après le repas].'],
    [38, '[CCC:À cause de la pluie], [S:je] [V:pense] [COI:à mon accident].'],
    [39, '[CCC:En raison des travaux], [S:Louis] [V:commence] [COI:à s’inquiéter].'],
    [39, '[S:Kevin] [V:oublie] [COD:ses affaires de sport] [CCT:tous les mardis] !'],
    [40, '[S:Le vent] [V:rafraichit] [COD:les marcheurs] [CCL:dans la montagne].'],
    [40, '[CCL:Dans leur nid], [S:les oisillons] [V:s’endorment].'],
    [41, '[CCC:À cause de Max], [S:Lucie] [V:a perdu] [COD:la course].'],
    [41, '[CCT:Depuis deux jours], [S:mon petit frère] [V:sait] [COD:marcher].'],
    [41, '[S:Il] [V:s’approche] [COI:de tous les bibelots] !'],
    [42, '[S:Son dernier film] [V:passait] [CCT:cette semaine].'],
    [0, '[S:Le boulanger] [V:a vendu] [COD:toutes ses baguettes] [CCT:avant midi].'],
    [0, '[S:Ma cousine] [V:ressemble] [COI:à sa mère].'],
    [0, '[CCL:Au zoo], [S:les enfants] [V:ont donné] [COD:des carottes] [COI:aux chèvres].'],
    [0, '[S:Nous] [V:parlerons] [COI:de ce livre] [CCT:demain].'],
    [0, '[CCC:À cause du bruit], [S:le bébé] [V:a réveillé] [COD:toute la maison].'],
  ],
};

const NOUN_COMPLEMENT_TIP = 'Le complément du nom précise le nom juste avant lui ; il commence par une préposition : à, de, d’, du, en, sans… « une tarte au chocolat ». Il fait partie du groupe : souligne d’abord tout le groupe (sujet, COD…), puis le CdN avec son crayon.';

const NOUN_COMPLEMENTS: GrammarExercise = {
  id: 'cdn',
  instruction: 'Surligne le verbe, souligne le sujet, les COD, les COI, les CC et les compléments du nom.',
  mode: 'color',
  pencils: ['V', 'S', 'COD', 'COI', 'CCT', 'CCL', 'CCC', 'CdN'],
  examples: [2, 0],
  tip: NOUN_COMPLEMENT_TIP,
  sentences: [
    [43, '[S:Béatrice] [V:mange] [COD:un bonbon [CdN:à la menthe]] [CCL:dans sa chambre].'],
    [43, '[CCT:Hier], [S:j’][V:ai changé] [COD:la roue [CdN:de mon vélo]].'],
    [43, '[S:Les parents [CdN:de Béatrice]] [V:lisent] [COD:des romans policiers].'],
    [44, '[CCT:Un jour], [S:Léon] [V:a trouvé] [COD:un oiseau] [CCL:près de la fenêtre [CdN:de la classe]].'],
    [44, '[S:La pauvre bête [CdN:à plumes]] [V:avait] [COD:une aile cassée].'],
    [44, '[S:Nous] [V:avons soigné] [COD:l’oiseau] [CCT:pendant un mois].'],
    [45, '[CCT:Dimanche], [S:mon oncle] [V:a acheté] [COD:des patins [CdN:à roulettes]].'],
    [45, '[S:Rémi] [V:a offert] [COD:un bracelet [CdN:en argent]] [COI:à Camille].'],
    [45, '[S:La mère [CdN:de Simon]] [V:prépare] [COD:un gâteau] [CCL:dans la cuisine].'],
    [46, '[CCT:La semaine dernière], [S:j’][V:ai trouvé] [COD:un objet [CdN:sans valeur]].'],
    [46, '[S:La cousine [CdN:de Timéo]] [V:aime] [COD:le chocolat [CdN:au lait]].'],
    [46, '[CCT:Depuis une heure], [S:Max] [V:pense] [COI:à son devoir [CdN:de grammaire]].'],
    [47, '[CCT:En regardant ses photos], [S:Victor] [V:se souvient] [COI:de ses vacances [CdN:à la mer]].'],
    [47, '[S:Les chênes] [V:résistent] [COI:aux insectes et aux champignons].'],
    [47, '[S:Le fabriquant [CdN:de meubles]] [V:choisit] [COD:ce bois].'],
    [48, '[S:Le facteur [CdN:du village]] [V:distribue] [COD:le courrier] [CCT:tous les matins].'],
    [48, '[CCL:Dans leur nid], [S:les oisillons [CdN:du merle]] [V:s’endorment].'],
    [0, '[S:Le chien [CdN:de mon voisin]] [V:aboie] [CCT:toute la nuit].'],
    [0, '[S:J’][V:ai mis] [COD:mon pull [CdN:en laine]] [CCC:à cause du froid].'],
    [0, '[S:La maitresse] [V:lit] [COD:une histoire [CdN:de pirates]] [COI:aux élèves].'],
  ],
};

const ATTRIBUTES: GrammarExercise = {
  id: 'ads',
  instruction: 'Surligne le verbe, souligne le sujet, les attributs du sujet, les COD, les COI, les CC et les compléments du nom.',
  mode: 'color',
  pencils: ['V', 'S', 'AdS', 'COD', 'COI', 'CCT', 'CCL', 'CCC', 'CdN'],
  examples: [3, 1, 15],
  tip: 'L’attribut du sujet vient après un verbe d’état : être, paraitre, sembler, devenir, rester, avoir l’air. Il dit comment est le sujet : « Ton chat est câlin ». Après un autre verbe, c’est un COD : « Mon père attend le facteur ».',
  sentences: [
    [49, '[S:Mon père] [V:attend] [COD:le facteur].'],
    [49, '[S:Ces chaussures] [V:semblent] [AdS:petites pour toi].'],
    [49, '[S:Pierre] [V:est resté] [AdS:silencieux] [CCT:pendant quelques instants].'],
    [50, '[S:Ton chat] [V:est] [AdS:câlin].'],
    [50, '[CCT:Avant-hier], [S:il] [V:a semblé] [AdS:fatigué].'],
    [50, '[S:Elodie et moi] [V:avons mangé] [COD:les pommes [CdN:de ton jardin]].'],
    [51, '[CCT:Dimanche], [S:ma mère] [V:était] [AdS:gaie].'],
    [51, '[S:Samy et toi] [V:devenez] [AdS:amis].'],
    [51, '[S:Éric] [V:parle] [COI:à un grand amateur [CdN:d’art]].'],
    [52, '[CCC:À cause des grimaces [CdN:de Paul]], [S:Léo] [V:éclate] [COI:de rire].'],
    [52, '[S:La mer] [V:reste] [AdS:calme] [CCT:cet été].'],
    [52, '[S:La sœur [CdN:de Tom]] [V:semble] [AdS:malade] [CCT:depuis hier].'],
    [53, '[S:La voiture [CdN:de mes parents]] [V:est] [AdS:bleue].'],
    [53, '[S:Cette cascade] [V:est] [AdS:extrêmement dangereuse] [CCT:en été].'],
    [53, '[S:Je] [V:suis] [AdS:seul] [CCL:sur l’ile [CdN:de la Réunion]].'],
    [54, '[S:Mon frère] [V:devient] [AdS:un gentil garçon].'],
    [54, '[S:Magellan et Vasco de Gama] [V:sont] [AdS:de grands navigateurs].'],
    [54, '[S:Paul et Aline] [V:ont sauvé] [COD:l’équipe [CdN:de France]].'],
    [0, '[CCT:Ce matin], [S:le ciel] [V:paraissait] [AdS:gris].'],
    [0, '[S:Les élèves [CdN:de CM1]] [V:sont] [AdS:contents] [CCT:aujourd’hui].'],
  ],
};

const ADVERBS: GrammarExercise = {
  id: 'natures',
  instruction: NATURE_INSTRUCTION,
  mode: 'nature',
  pencils: NATURES_VIOLETTE,
  examples: [9, 7],
  tip: 'L’adverbe ne change jamais (il est invariable). Il précise un verbe, un adjectif ou un autre adverbe : lieu (ici, là-bas), temps (demain, déjà), manière (vite, bruyamment). Beaucoup finissent par -ment.',
  sentences: [
    [55, 'Maman chérie, je suis [ADV:bien] arrivée et le temps est [ADJ:magnifique].'],
    [55, '[ADV:Demain], j’irai à la plage : il y a des vagues [ADJ:énormes].'],
    [55, 'J’ai [ADV:vraiment] hâte de me baigner [ADV:ici] !'],
    [56, 'Comme il a [ADV:très] faim, Barnabé mange [ADV:salement].'],
    [56, 'En plus, il est assis sur une chaise [ADV:trop] [ADJ:petite]. [ADV:Demain], il fera un effort !'],
    [57, '[ADV:Là-bas], tout est [ADJ:neuf] et tout [VC:est] sauvage.'],
    [57, '[ADJ:Libre] continent sans grillage. [ADV:Ici], nos rêves sont [ADJ:étroits].'],
    [58, 'Dans [DD:cette] langue [ADJ:belle] aux couleurs de Provence où [AD:la] saveur des choses est [ADV:déjà] dans les mots, c’est [ADV:d’abord] en parlant que la fête commence, et l’on boit des paroles [ADV:aussi] bien que de l’eau.'],
    [59, '[ADV:Soudain], le ciel s’obscurcit. [AD:Les] premières gouttes [ADJ:chaudes] tombent [ADV:bruyamment].'],
    [59, 'Chacun ferme [ADV:vite] [DP:ses] volets.'],
    [60, 'Ici et [ADV:là], des chiens rentrent la queue [ADJ:basse].'],
    [60, 'Le village se coupe [ADV:rapidement] du monde. Une [NC:fois] l’averse passée, [AD:la] vie reprend [ADV:paisiblement].'],
    [0, '[NP:Julie] court [ADV:vite] mais [PP:elle] arrive [ADV:toujours] [ADV:tard].'],
    [0, '[AD:Le] chat dort [ADV:tranquillement] sur [AI:un] coussin [ADJ:moelleux].'],
    [0, '[ADV:Hier], nous [VC:avons marché] [ADV:longtemps] dans la forêt.'],
    [0, 'Ce gâteau est [ADV:trop] [ADJ:sucré] : [PP:je] n’en mangerai [ADV:jamais] !'],
  ],
};

const OBJECT_PRONOUNS_NATURES: GrammarExercise = {
  id: 'natures',
  instruction: NATURE_INSTRUCTION,
  mode: 'nature',
  pencils: NATURES_VIOLETTE,
  examples: [0, 1],
  tip: 'Devant un nom, le, la, les sont des articles (« le maitre ») ; devant un verbe, ce sont des pronoms personnels compléments (« il la regarde »). Pronoms compléments : me, te, le, la, l’, les, lui, leur, nous, vous. « leur » devant un nom est un déterminant possessif.',
  sentences: [
    [61, '[AD:Le] maitre [PP:la] regarde.'],
    [62, 'Le soir, avant de dormir, [PP:elle] [PP:lui] lit [AI:un] chapitre de son livre.'],
    [63, 'Demain, [AD:le] facteur [PP:la] donnera à [DP:ma] voisine.'],
    [64, 'En raison de [DP:son] allergie, [PP:je] [PP:les] ai enlevés.'],
    [65, '[PP:Je] [PP:lui] ai rendu [DP:ses] livres de maths hier.'],
    [66, '[PP:Vous] [PP:le] lirez pendant [AD:le] temps libre.'],
    [0, '[AD:La] maitresse [PP:nous] explique [AD:la] leçon.'],
    [0, '[DP:Mon] chien [PP:me] suit partout : [PP:je] [PP:l’]adore.'],
    [0, '[PP:Tu] [PP:leur] as offert [AI:des] fleurs.'],
    [0, '[PP:Ils] ont rangé [DP:leurs] jouets et [PP:les] ont donnés.'],
    [0, '[AD:Les] enfants [PP:la] cherchent [ADV:partout].'],
  ],
};

const OBJECT_PRONOUNS_FUNCTIONS: GrammarExercise = {
  id: 'fonctions',
  instruction: 'Surligne le verbe, souligne le sujet, les COD, les COI, les CC et les compléments du nom.',
  mode: 'color',
  pencils: ['V', 'S', 'AdS', 'COD', 'COI', 'CCT', 'CCL', 'CCC', 'CdN'],
  examples: [0, 3],
  tip: 'Un pronom complément se met devant le verbe : « Le maitre la regarde » (il regarde qui ? la : COD). « lui », « leur » sont des COI : « Je lui ai rendu ses livres » (à qui ? lui). Le verbe garde ses deux mots : « les ai enlevés ».',
  sentences: [
    [61, '[S:Le maitre] [COD:la] [V:regarde].'],
    [62, '[CCT:Le soir], [CCT:avant de dormir], [S:elle] [COI:lui] [V:lit] [COD:un chapitre [CdN:de son livre]].'],
    [63, '[CCT:Demain], [S:le facteur] [COD:la] [V:donnera] [COI:à ma voisine].'],
    [64, '[CCC:En raison de son allergie], [S:je] [COD:les] [V:ai enlevés].'],
    [65, '[S:Je] [COI:lui] [V:ai rendu] [COD:ses livres [CdN:de maths]] [CCT:hier].'],
    [66, '[S:Vous] [COD:le] [V:lirez] [CCT:pendant le temps libre].'],
    [0, '[S:Mes parents] [COD:m’][V:attendent] [CCL:devant l’école].'],
    [0, '[S:La maitresse] [COI:leur] [V:a expliqué] [COD:la règle].'],
    [0, '[CCT:Ce soir], [S:nous] [COI:lui] [V:téléphonerons].'],
    [0, '[S:Mon chat] [COD:nous] [V:réveille] [CCT:chaque matin].'],
  ],
};

const LINKING_WORDS: GrammarExercise = {
  id: 'natures',
  instruction: NATURE_INSTRUCTION,
  mode: 'nature',
  pencils: NATURES_NOIRE,
  examples: [0, 6],
  tip: 'Prépositions : à, dans, par, pour, en, vers, avec, de, sans, sous, chez, depuis, derrière… elles introduisent un groupe. Conjonctions de coordination : mais, ou, et, donc, or, ni, car (« Mais où est donc Ornicar ? ») : elles relient deux mots ou deux groupes.',
  sentences: [
    [67, 'Jérôme suit des cours [PREP:de] natation [PREP:depuis] l’année dernière [CONJ:mais] il a l’intention de changer [CONJ:car] il préfèrerait débuter le judo [CONJ:ou] le karaté.'],
    [68, 'Marianne se cache [PREP:derrière] le canapé du salon.'],
    [68, 'Louis [PP:la] cherche dans le grenier [CONJ:et] sous la table [CONJ:mais] il ne pense pas [PREP:à] regarder [PREP:dans] le salon !'],
    [69, 'Ma voisine [PREP:d’]atelier est arrivée [PREP:en] retard hier matin [CONJ:car] elle n’avait pas réglé [DP:son] réveil.'],
    [69, 'Je suis allée [PREP:avec] elle [PREP:pour] prévenir le contremaitre.'],
    [70, 'L’eau s’évapore [PREP:de] la terre [CONJ:et] remonte [PREP:dans] l’air [PREP:sous] forme [PREP:de] vapeur d’eau.'],
    [70, 'L’air chaud monte, et se rafraichit, par exemple [PREP:au-dessus d’]une montagne.'],
    [71, 'Les fourmis vivent [PREP:en] colonies.'],
    [71, 'Une colonie comprend [AI:des] milliers de fourmis [CONJ:et] [DP:leur] nid souterrain consiste en une série [PREP:de] chambres reliées [PREP:par] des galeries.'],
    [72, '[ADV:Aujourd’hui], les forêts recouvrent 4 milliards d’hectares de la surface terrestre.'],
    [72, '[ADV:Auparavant], elles en recouvraient 6 [CONJ:mais] l’abattage massif auquel l’homme s’adonne [PREP:pour] gagner de l’argent [CONJ:et] de la place [PP:les] a détruites.'],
    [0, '[NP:Léo] [CONJ:et] [NP:Zoé] partent [PREP:sans] leur parapluie [CONJ:donc] [PP:ils] seront mouillés.'],
    [0, '[PP:Nous] irons [PREP:chez] [DP:nos] cousins [PREP:pendant] les vacances.'],
    [0, '[PP:Elle] n’aime [CONJ:ni] les épinards [CONJ:ni] les choux.'],
    [0, '[NP:Hugo] range [DP:ses] affaires [PREP:avant] [AD:la] récréation.'],
  ],
};

export const GRAMMAIRE: readonly GrammarBelt[] = [
  {
    belt: 'blanche',
    skill: 'Les verbes conjugués',
    tips: [
      'Le verbe dit ce que l’on fait (une action) ou comment on est (un état) : « Le cheval est assoiffé ». Ici, le verbe est seulement « est ».',
      'Pour le trouver, change le temps de la phrase : hier, aujourd’hui, demain. Le mot qui change est le verbe conjugué.',
      'Ou bien mets-le entre « ne » et « pas » : « Il ne sort pas ».',
      'Au passé composé, le verbe a deux mots : « Il a pris sa douche », « Les oiseaux sont partis ». Surligne les deux.',
      'Un verbe à l’infinitif (escalader, de partir) n’est pas conjugué. « assoiffé », « perdu » qui décrivent un nom ne le sont pas non plus.',
    ],
    tasks: [VERBS],
  },
  {
    belt: 'jaune',
    skill: 'Les pronoms personnels sujets et le sujet du verbe',
    goal: 'CE2',
    tips: [
      'Les pronoms personnels sujets : je (j’), tu, il, elle, on, nous, vous, ils, elles. Ils remplacent un nom ou un groupe nominal.',
      'Le sujet est un pronom (il), un nom propre (Julie) ou un groupe de mots (les jeunes écoliers).',
      'Pour le trouver : « C’est … qui » devant le verbe. « C’est le ciel qui est bleu » : le sujet est « le ciel ».',
      'Prends le groupe en entier : « Le chat silencieux guette une souris » → le sujet est « le chat silencieux ».',
      'Le sujet n’est pas toujours au début : « Le jour de son anniversaire, Pierre visite le zoo. » Il est parfois après le verbe : « Dans la forêt vivait un vieux loup. »',
      'En classe, on souligne le sujet en bleu et on surligne le verbe en jaune.',
    ],
    tasks: [PRONOUNS, SUBJECTS_OF_VERBS],
  },
  {
    belt: 'orange',
    skill: 'Les noms propres et communs, et les déterminants',
    tips: [
      'Le nom désigne une personne, un animal, une chose ou une idée. Le nom propre prend une majuscule (Sébastien, la Picardie) ; le nom commun non (soir, cour).',
      'Le déterminant est le petit mot devant le nom.',
      'Articles définis : le, la, l’, les. Articles indéfinis : un, une, des.',
      'Déterminants possessifs (à qui ?) : mon, ton, son, ma, ta, sa, mes, tes, ses, notre, votre, leur, nos, vos, leurs.',
      'Déterminants démonstratifs (on montre) : ce, cet, cette, ces.',
      'Les pronoms personnels (je, tu, il, elle, on, nous, vous, ils, elles) remplacent un nom.',
    ],
    tasks: [DETERMINERS],
  },
  {
    belt: 'rose',
    skill: 'Les adjectifs',
    tips: [
      'L’adjectif est le compagnon du nom : il donne des précisions sur lui (« une ile splendide », « un panda roux »).',
      'Il s’accorde avec le nom : « des fleurs jaunes », « une queue brune ».',
      'Il peut être avant le nom (« de jeunes chiennes »), après lui, ou après le verbe être (« le ciel est bleu »).',
      'On peut le supprimer, la phrase garde un sens ; on peut en ajouter un autre : « un petit chat noir ».',
      'Le verbe conjugué garde ses deux mots au passé composé : « ai pu », « a mangé ».',
    ],
    tasks: [ADJECTIVES],
  },
  {
    belt: 'vert-clair',
    skill: 'Les compléments circonstanciels de lieu, de temps et de cause',
    tips: [
      'Le complément circonstanciel (complément de phrase) se déplace ou se supprime : « Dans la cour, les enfants jouent » ou « Les enfants jouent ».',
      'CCT, le temps : quand ? (ce matin, après la classe, tous les samedis).',
      'CCL, le lieu : où ? (dans son panier, à Paris, sur le terrain).',
      'CCC, la cause : pourquoi ? (à cause de la grève, grâce à son courage, par peur du loup).',
      'Prends tout le groupe, et il peut y en avoir plusieurs : « tous les matins » et « vers 10 heures ».',
      'En classe, on souligne les CC en vert.',
    ],
    tasks: [CIRCUMSTANTIAL],
  },
  {
    belt: 'vert-fonce',
    skill: 'Le COD et le COI',
    tips: [
      'Le complément d’objet complète le verbe. Il ne se déplace pas et, en général, ne se supprime pas.',
      'Le COD est relié directement au verbe. Il répond à « quoi ? » ou « qui ? » : « La dame arrose quoi ? les fleurs ».',
      'Le COI est relié au verbe par un petit mot : à, au, aux, de, du, des. Il répond à « à qui ? », « à quoi ? », « de quoi ? » : « Martin parle à qui ? à son ami ».',
      'Un verbe peut avoir un COD et un COI : « Le maitre a rendu son stylo à Kévin ».',
      'Les CC, eux, se déplacent : « Pendant les vacances, j’ai envoyé une lettre ».',
      'En classe, on souligne les COD et les COI en noir.',
    ],
    tasks: [OBJECTS],
  },
  {
    belt: 'bleu-clair',
    skill: 'Les compléments du nom (CdN)',
    goal: 'CM1',
    tips: [
      'Le complément du nom précise le nom placé juste avant lui : « une tarte au chocolat ».',
      'Il commence par une préposition : à, de, d’, du, en, sans, pour… « un bracelet en argent », « des patins à roulettes ».',
      'Il fait partie du groupe du nom : « Les parents de Béatrice » est le sujet en entier, et « de Béatrice » est le CdN.',
      'Souligne d’abord tout le groupe (sujet, COD, COI ou CC), puis prends le crayon CdN pour le complément du nom.',
      'En classe, on souligne le CdN en violet.',
    ],
    tasks: [NOUN_COMPLEMENTS],
  },
  {
    belt: 'bleu-fonce',
    skill: 'L’attribut du sujet (AdS)',
    tips: [
      'L’attribut du sujet donne une information sur le sujet : « Ton chat est câlin ».',
      'Il vient après un verbe d’état : être, paraitre, sembler, devenir, rester, demeurer, avoir l’air.',
      'Il peut être un adjectif (fatigué) ou un groupe nominal (un gentil garçon).',
      'Ne le confonds pas avec le COD : « Mon père attend le facteur » (attendre n’est pas un verbe d’état).',
      'En classe, on souligne l’attribut du sujet en rose.',
    ],
    tasks: [ATTRIBUTES],
  },
  {
    belt: 'violette',
    skill: 'Les adverbes',
    tips: [
      'L’adverbe est un mot invariable : il ne change jamais.',
      'Il précise un verbe (mange salement), un adjectif (trop petite) ou un autre adverbe (très vite).',
      'Adverbes de lieu : ici, là, là-bas, partout. De temps : demain, hier, déjà, soudain, toujours. De manière : bien, vite, vraiment.',
      'Beaucoup se forment avec -ment à partir d’un adjectif : rapide → rapidement, bruyant → bruyamment.',
    ],
    tasks: [ADVERBS],
  },
  {
    belt: 'marron',
    skill: 'Les pronoms personnels compléments, et le COD ou COI quand c’est un pronom',
    goal: 'CM2',
    tips: [
      '« Je mange une pomme. Je la mange. » La nature du mot « la », c’est pronom personnel. Sa fonction, c’est COD du verbe manger.',
      'Devant un nom, le, la, les sont des articles ; devant un verbe, ce sont des pronoms personnels compléments.',
      'Les pronoms compléments : me, te, le, la, l’, les, lui, leur, nous, vous. Ils se mettent devant le verbe.',
      'le, la, l’, les sont COD ; lui et leur sont COI (à qui ?).',
      '« leur » devant un nom est un déterminant possessif (leurs jouets) ; devant un verbe, c’est un pronom (je leur parle).',
    ],
    tasks: [OBJECT_PRONOUNS_NATURES, OBJECT_PRONOUNS_FUNCTIONS],
  },
  {
    belt: 'noire',
    skill: 'Les prépositions et les conjonctions de coordination',
    tips: [
      'Les prépositions sont des petits mots invariables qui introduisent un groupe : à, dans, par, pour, en, vers, avec, de, sans, sous, chez, depuis, derrière, pendant, avant…',
      'Les conjonctions de coordination relient deux mots ou deux groupes qui ont la même fonction : mais, ou, et, donc, or, ni, car.',
      'Pour s’en souvenir : « Mais où est donc Ornicar ? »',
      'Attention : « où » avec un accent n’est pas une conjonction ; « ou » sans accent, oui (ou bien).',
    ],
    tasks: [LINKING_WORDS],
  },
];
