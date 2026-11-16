// Ceintures d'accords : « Je transpose un texte… » (voir .ai/analyse/21-ceintures-accords.md).
// Exercices des fiches Charivari « Je prépare la ceinture… » (n° 1 à 18 pour la blanche et la jaune),
// corrections relues, complétés par les nôtres. Une faute ici apprendrait une faute à l'enfant :
// accords.test.ts vérifie chaque phrase.
//
// Une phrase s'écrit déjà transposée ; chaque case donne le mot de départ et la réponse :
// « {L’avion|Les avions} {décolle|décollent}. ». Une case piège garde sa forme : « {très} ».
// Plusieurs réponses justes se séparent par « / » : « {maitre|maitres/maîtres} ».
// Les identifiants (« blanche.3 ») servent de clés dans le profil : ne jamais les changer
// ni les réutiliser ; un nouvel exercice prend le numéro suivant.

import { shuffle } from '../../core/quiz';
import type { BeltId } from './belts';

export interface AccordExercise {
  id: string;
  /** La consigne, comme sur la fiche : « Transpose au pluriel. ». */
  instruction: string;
  /** La phrase transposée, avec ses cases. */
  text: string;
  /** Numéro de la fiche Charivari, ou absent pour une phrase écrite pour l'app. */
  fiche?: number;
}

export interface AccordBelt {
  belt: BeltId;
  /** Ce que demande la ceinture, en phrases courtes pour les enfants. */
  skill: string;
  /** « Objectif de fin de CE2 » dans le classeur. */
  goal?: 'CE2' | 'CM1' | 'CM2';
  /** Les règles des leçons O4 à O15 de la classe. */
  tips: readonly string[];
  texts: readonly AccordExercise[];
  /** Phrases (ou textes) par entraînement, et par entraînement en conditions réelles. */
  practiceSize: number;
  testSize: number;
}

/** Une case : le mot de départ, la réponse (et d'autres justes), en début de phrase ou non. */
export interface Box {
  start: string;
  answer: string;
  also: readonly string[];
  /** En début de phrase : ce qui est tapé prend une majuscule. */
  capital: boolean;
}

export type Piece = string | Box;

const BOX = /\{([^{}]*)\}/g;

/** Coupe la phrase en morceaux de texte et en cases, dans l'ordre. */
export function parseAccord(text: string): Piece[] {
  const pieces: Piece[] = [];
  let before = '';
  let last = 0;
  for (const match of text.matchAll(BOX)) {
    const plain = text.slice(last, match.index);
    if (plain) pieces.push(plain);
    const [start, answers = start] = (match[1] ?? '').split('|') as [string, string?];
    const [answer, ...also] = answers.split('/') as [string, ...string[]];
    pieces.push({ start, answer, also, capital: /^\s*$|[.!?]\s*$/.test(before + plain) });
    before += plain + answer;
    last = match.index + match[0].length;
  }
  const rest = text.slice(last);
  if (rest) pieces.push(rest);
  return pieces;
}

export const boxesOf = (text: string): Box[] => parseAccord(text).filter((p): p is Box => typeof p !== 'string');

export const isTrap = (box: Box) => box.start === box.answer;

/** Pour comparer : minuscules, une seule espace, l'apostrophe droite comme la courbe. */
export const normalizeWords = (text: string) =>
  text.normalize('NFC').trim().replace(/\s+/g, ' ').replace(/'/g, '’').toLocaleLowerCase('fr');

export function isRight(box: Box, typed: string): boolean {
  const given = normalizeWords(typed);
  return [box.answer, ...box.also].some((answer) => normalizeWords(answer) === given);
}

/** La majuscule de début de phrase, mise toute seule. */
export const shown = (box: Box, word: string) => (box.capital ? word.charAt(0).toUpperCase() + word.slice(1) : word);

/** La phrase de départ (les cases avec leur mot de départ) ou la phrase corrigée. */
export function sentenceOf(text: string, side: 'start' | 'answer'): string {
  return parseAccord(text)
    .map((piece) => (typeof piece === 'string' ? piece : side === 'start' ? piece.start : shown(piece, piece.answer)))
    .join('');
}

const DETERMINERS = /^(le|la|l’|un|une|les|des|mon|ton|son|ma|ta|sa|mes|tes|ses|ce|cet|cette|ces|notre|votre|nos|vos|leur|leurs)$/;

/** L'astuce montrée après une erreur, d'après ce qui change dans la case. */
export function tipFor(box: Box): string {
  const start = normalizeWords(box.start);
  const answer = normalizeWords(box.answer);
  if (start === answer) return 'Ce mot ne change pas : il reste comme il est.';
  if (start.includes(' ') || answer.includes(' ')) {
    return /^(les|des) /.test(answer)
      ? 'Au pluriel, le petit mot devant le nom devient les ou des, et le nom prend un -s.'
      : 'Au singulier, le petit mot devant le nom devient le, la, l’, un ou une, et le nom perd son -s.';
  }
  if (DETERMINERS.test(answer)) return 'Le petit mot devant le nom change aussi : le, la et l’ deviennent les, un et une deviennent des.';
  if (start === 'il' || start === 'elle' || start === 'ils' || start === 'elles') return 'Il devient ils, elle devient elles. Et dans l’autre sens.';
  if (/nt$/.test(answer) && !/nt$/.test(start)) return 'Quand le sujet est au pluriel, le verbe se termine par -nt : ils jouent, ils jouaient.';
  if (/nt$/.test(start) && !/nt$/.test(answer)) return 'Quand le sujet est au singulier, le verbe ne se termine pas par -nt : il joue, il jouait.';
  if (answer === `${start}s` || answer === `${start}x`) return 'Au pluriel, le nom et l’adjectif prennent un -s : des chats noirs.';
  if (start === `${answer}s` || start === `${answer}x`) return 'Au singulier, le nom et l’adjectif perdent leur -s : un chat noir.';
  if (start === `${answer}e` || start === `${answer}es`) return 'Au masculin, on enlève souvent le -e du féminin : contente, content.';
  if (answer === `${start}e` || answer === `${start}es`) return 'Au féminin, on ajoute souvent un -e : content, contente.';
  return 'Ce mot s’accorde avec le nom ou le pronom qu’il accompagne.';
}

const PLURAL = 'Transpose au pluriel.';
const SINGULAR = 'Transpose au singulier.';

/** [numéro, consigne, phrase, fiche] ; sans fiche : phrase écrite pour l'app. */
type Raw = readonly [number, string, string, number?];

function exercises(belt: BeltId, raw: readonly Raw[]): AccordExercise[] {
  return raw.map(([n, instruction, text, fiche]) => ({ id: `${belt}.${n}`, instruction, text, ...(fiche ? { fiche } : {}) }));
}

export const ACCORDS: readonly AccordBelt[] = [
  {
    belt: 'blanche',
    skill: 'Je mets de courtes phrases au pluriel ou au singulier.',
    tips: [
      'Au pluriel, le, la et l’ deviennent les. Un et une deviennent des.',
      'Au pluriel, le nom prend un -s : un chat, des chats.',
      'Quand le sujet est au pluriel, le verbe se termine par -nt : les chats griffent, les chats griffaient.',
      'Au singulier, c’est l’inverse : pas de -s au nom, pas de -nt au verbe.',
    ],
    practiceSize: 3,
    testSize: 6,
    texts: exercises('blanche', [
      [1, PLURAL, '{L’avion|Les avions} {décolle|décollent}.', 1],
      [2, PLURAL, '{Le|Les} {chien|chiens} {aboie|aboient}.', 1],
      [3, PLURAL, '{Une|Des} {abeille|abeilles} {butinait|butinaient}.', 1],
      [4, PLURAL, '{Le|Les} {camion|camions} {freine|freinent}.', 2],
      [5, PLURAL, '{Le|Les} {coiffeur|coiffeurs} {travaillait|travaillaient}.', 2],
      [6, PLURAL, '{Un aigle|Des aigles} {volait|volaient}.', 2],
      [7, PLURAL, '{Le|Les} {bébé|bébés} {gazouillait|gazouillaient}.', 3],
      [8, PLURAL, '{Un|Des} {train|trains} {passe|passent}.', 3],
      [9, PLURAL, '{La|Les} {radio|radios} {fonctionne|fonctionnent}.', 3],
      [10, PLURAL, '{La|Les} {pie|pies} {jacasse|jacassent}.', 4],
      [11, PLURAL, '{Un|Des} {garçon|garçons} {jouait|jouaient}.', 4],
      [12, PLURAL, '{Le|Les} {moteur|moteurs} {explose|explosent}.', 4],
      [13, PLURAL, '{La|Les} {chouette|chouettes} {dormait|dormaient}.', 5],
      [14, PLURAL, '{La|Les} {voiture|voitures} {roule|roulent}.', 5],
      [15, PLURAL, '{Un|Des} {danseur|danseurs} {sautille|sautillent}.', 5],
      [16, PLURAL, '{Le|Les} {singe|singes} {mange|mangent}.', 6],
      [17, PLURAL, '{Une|Des} {fleur|fleurs} {pousse|poussent}.', 6],
      [18, PLURAL, '{L’homme|Les hommes} {travaillait|travaillaient}.', 6],
      [19, SINGULAR, '{Des|Un} {chats|chat} {griffent|griffe}.', 7],
      [20, SINGULAR, '{Les horloges|L’horloge} {sonnaient|sonnait}.', 7],
      [21, SINGULAR, '{Les enfants|L’enfant} {arrivent|arrive}.', 7],
      [22, SINGULAR, '{Les|Le} {coureurs|coureur} {gagnent|gagne}.', 8],
      [23, SINGULAR, '{Les|La} {filles|fille} {chantent|chante}.', 8],
      [24, SINGULAR, '{Des|Une} {billes|bille} {roulaient|roulait}.', 8],
      [25, SINGULAR, '{Les|Le} {touristes|touriste} {bronzent|bronze}.', 9],
      [26, SINGULAR, '{Les|Le} {garçons|garçon} {lisaient|lisait}.', 9],
      [27, SINGULAR, '{Des|Une} {chenilles|chenille} {se} {transforment|transforme}.', 9],
      [28, SINGULAR, '{Les|Le} {trains|train} {arrivent|arrive}.', 10],
      [29, SINGULAR, '{Les|Le} {plongeurs|plongeur} {zigzaguaient|zigzaguait}.', 10],
      [30, SINGULAR, '{Les|Le} {perroquets|perroquet} {parlent|parle}.', 10],
      // La fiche corrige « La barque charive » : corrigé.
      [31, SINGULAR, '{Les|La} {barques|barque} {chavirent|chavire}.', 11],
      [32, SINGULAR, '{Les|La} {mouettes|mouette} {plongent|plonge}.', 11],
      [33, SINGULAR, '{Des|Une} {bougies|bougie} {brûlaient|brûlait}.', 11],
      [34, SINGULAR, '{Les enfants|L’enfant} {crient|crie}.', 12],
      [35, SINGULAR, '{Des|Un} {lions|lion} {dormaient|dormait}.', 12],
      [36, SINGULAR, '{Les|La} {gazelles|gazelle} {couraient|courait}.', 12],
      [37, PLURAL, '{Le|Les} {lapin|lapins} {saute|sautent}.'],
      [38, PLURAL, '{La|Les} {cloche|cloches} {sonnait|sonnaient}.'],
      [39, PLURAL, '{Un oiseau|Des oiseaux} {chante|chantent}.'],
      [40, PLURAL, '{L’élève|Les élèves} {écoute|écoutent}.'],
      [41, PLURAL, '{Une étoile|Des étoiles} {brillait|brillaient}.'],
      [42, PLURAL, '{La|Les} {porte|portes} {claque|claquent}.'],
      [43, SINGULAR, '{Les|La} {poules|poule} {picorent|picore}.'],
      [44, SINGULAR, '{Des|Une} {voitures|voiture} {klaxonnaient|klaxonnait}.'],
      [45, SINGULAR, '{Les arbres|L’arbre} {poussent|pousse}.'],
      [46, SINGULAR, '{Les|Le} {chiens|chien} {jouaient|jouait}.'],
      [47, SINGULAR, '{Des|Un} {ballons|ballon} {roulent|roule}.'],
      [48, SINGULAR, '{Les|La} {grenouilles|grenouille} {sautaient|sautait}.'],
    ]),
  },
  {
    belt: 'jaune',
    skill: 'Je transforme des phrases plus longues. J’accorde les adjectifs. Je passe du féminin au masculin.',
    tips: [
      'Tous les mots qui vont avec le nom changent : le petit chat, les petits chats.',
      'L’adjectif s’accorde avec le nom : une fille contente, des filles contentes.',
      'Il et elle deviennent ils et elles. Est devient sont, était devient étaient.',
      'Les mots en -s ou en -x ne changent pas au pluriel : un chat gris, des chats gris.',
      'Au masculin, on enlève souvent le -e : contente, content. Parfois le mot change plus : une princesse, un prince.',
      'Des mots ne changent jamais : très, après, de, se.',
    ],
    practiceSize: 3,
    testSize: 6,
    texts: exercises('jaune', [
      [1, PLURAL, '{Il|Ils} {regardait|regardaient} {la|les} {grosse|grosses} {araignée|araignées}.', 13],
      [2, PLURAL, '{Son|Ses} {frère|frères} {était|étaient} {sportif|sportifs} et {travailleur|travailleurs}.', 13],
      [3, PLURAL, '{Le|Les} {facteur|facteurs} {apporte|apportent} {une|des} {lettre|lettres}.', 13],
      [4, SINGULAR, '{Les|Le} {petits|petit} {chats|chat} {couraient|courait} {après} {les oiseaux|l’oiseau}.', 14],
      [5, SINGULAR, '{Ils|Il} {habitaient|habitait} {de|une} {belles|belle} {maisons|maison}.', 14],
      // « De branche en branche » ne change pas : deux pièges.
      [6, SINGULAR, '{Les|Le} {singes|singe} {sautent|saute} de {branche} en {branche}.', 14],
      [7, 'Remplace Lina par Enzo.', 'Enzo {semble} {fatiguée|fatigué} ce matin.', 15],
      [8, 'Remplace Lina par Enzo.', 'Enzo {était} {une|un} {princesse|prince} {charmante|charmant}.', 15],
      [9, 'Remplace Lina par Enzo.', 'Enzo {est} {devenue|devenu} {championne|champion} de judo.', 15],
      [10, PLURAL, '{Le|Les} {magicien|magiciens} {maladroit|maladroits} {rate|ratent} {le|les} {tour|tours}.', 16],
      [11, PLURAL, '{L’étoile|Les étoiles} {filante|filantes} {était|étaient} {très} {brillante|brillantes}.', 16],
      // « Nous » peut être des filles : contentes est juste aussi.
      [12, PLURAL, '{Je|Nous} {suis|sommes} {très} {content|contents/contentes} d’avoir réussi.', 16],
      [13, SINGULAR, '{Des|Une} {comètes|comète} {visibles|visible} à l’œil nu {sont|est} {rares|rare}.', 17],
      // Les fiches écrivent « maitre » (orthographe rectifiée) : maître est juste aussi.
      [14, SINGULAR, '{Ils|Il} {sont|est} {passés|passé} {maitres|maitre/maître} dans l’art du dessin.', 17],
      [15, SINGULAR, '{Les éruptions|L’éruption} {volcaniques|volcanique} {peuvent|peut} {être} {meurtrières|meurtrière}.', 17],
      [16, 'Remplace Anna par Tom.', 'Tom n’est jamais {arrivée|arrivé} en retard.', 18],
      [17, 'Remplace Anna par Tom.', 'Tom {semblait} {perdue|perdu} dans {ses} pensées.', 18],
      [18, 'Remplace Anna par Tom.', 'Tom est {devenue|devenu} {maitresse|maitre/maître} d’école.', 18],
      [19, PLURAL, '{La|Les} {petite|petites} {fille|filles} {est|sont} {contente|contentes}.'],
      [20, PLURAL, '{Mon|Mes} {voisin|voisins} {était|étaient} {gentil|gentils} et {drôle|drôles}.'],
      [21, PLURAL, '{Le|Les} {gros} {chat|chats} {gris} {dormait|dormaient}.'],
      [22, SINGULAR, '{Les|La} {grandes|grande} {tours|tour} {étaient|était} {très} {hautes|haute}.'],
      [23, SINGULAR, '{Elles|Elle} {portaient|portait} {de|une} {jolies|jolie} {robes|robe}.'],
      [24, SINGULAR, '{Mes|Mon} {cousins|cousin} {sont|est} {heureux} de partir.'],
      [25, 'Remplace Léa par Hugo.', 'Hugo {est} {une|un} {bonne|bon} {élève}.'],
      [26, 'Remplace Léa par Hugo.', 'Hugo {était} {fière|fier} de son dessin.'],
      [27, 'Remplace Léa par Hugo.', 'Hugo {est} {partie|parti} chez {sa} {grand-mère}.'],
    ]),
  },
];

export const accordBelt = (belt: BeltId) => ACCORDS.find((b) => b.belt === belt);

/** Les exercices d'une série, au hasard, de préférence pas ceux de la dernière fois (`seen`). */
export function pickAccords(belt: AccordBelt, count: number, seen: readonly string[] = [], random = Math.random): AccordExercise[] {
  const fresh = shuffle(belt.texts.filter((e) => !seen.includes(e.id)), random);
  const old = shuffle(belt.texts.filter((e) => seen.includes(e.id)), random);
  return [...fresh, ...old].slice(0, count);
}
