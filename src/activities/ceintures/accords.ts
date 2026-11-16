// Ceintures d'accords : « Je transpose un texte… » (voir .ai/analyse/21-ceintures-accords.md).
// Exercices des fiches Charivari « Je prépare la ceinture… » (n° 1 à 36, de la blanche à la rose),
// corrections relues, complétés par les nôtres. Une faute ici apprendrait une faute à l'enfant :
// accords.test.ts vérifie chaque phrase.
//
// Une phrase s'écrit déjà transposée ; chaque case donne le mot de départ et la réponse :
// « {L’avion|Les avions} {décolle|décollent}. ». Une case piège garde sa forme : « {très} ».
// Plusieurs réponses justes se séparent par « / » : « {maitre|maitres/maîtres} ».
// Des mots seuls (« {cet|cette} {invité|invitée} / {un|une} {musicien|musicienne} ») restent en minuscules.
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
  /** En début de phrase (le mot de départ a une majuscule) : ce qui est tapé en prend une. */
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
    pieces.push({ start, answer, also, capital: /^\s*$|[.!?…]\s*$/.test(before + plain) && /^\p{Lu}/u.test(start) });
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

const DETERMINERS = /^(le|la|l’|un|une|du|de|les|des|mon|ton|son|ma|ta|sa|mes|tes|ses|ce|cet|cette|ces|notre|votre|nos|vos|leur|leurs)$/;
/** Le petit mot au masculin, et au féminin. */
const FEMININE_OF: Record<string, string> = { le: 'la', un: 'une', ce: 'cette', cet: 'cette', mon: 'ma', ton: 'ta', son: 'sa' };
/** Des mots en -s qui ne changent jamais : l'astuce des noms en -s, -x, -z ne leur va pas. */
const SMALL_WORDS = new Set(['très', 'après', 'plus', 'puis', 'jamais', 'toujours', 'dans', 'sous', 'les', 'des', 'mes', 'tes', 'ses', 'ces', 'nos', 'vos', 'nous', 'vous']);

/** L'astuce montrée après une erreur, d'après ce qui change dans la case. */
export function tipFor(box: Box): string {
  const start = normalizeWords(box.start);
  const answer = normalizeWords(box.answer);
  if (start === answer) {
    if (/^(mon|ton|son)$/.test(start)) return 'Devant une voyelle, mon, ton et son ne changent pas : mon ancienne maitresse.';
    if (/[sxz]$/.test(start) && !SMALL_WORDS.has(start)) return 'Ce mot ne change pas : il reste comme il est. Les mots en -s, -x ou -z ne changent pas au pluriel : une souris, des souris.';
    return 'Ce mot ne change pas : il reste comme il est.';
  }
  if (/^(je|j’|tu|nous|vous)(\s|$)|^j’/.test(start) || /^(je|j’|tu|nous|vous)(\s|$)|^j’/.test(answer)) {
    return 'Je devient nous, tu devient vous, et le verbe change avec : je chante, nous chantons ; tu chantes, vous chantez.';
  }
  if (start.includes(' ') || answer.includes(' ')) {
    return /^(les|des) /.test(answer)
      ? 'Au pluriel, le petit mot devant le nom devient les ou des, et le nom prend un -s.'
      : 'Au singulier, le petit mot devant le nom devient le, la, l’, un ou une, et le nom perd son -s.';
  }
  if (DETERMINERS.test(answer)) {
    if (FEMININE_OF[start] === answer) return 'Au féminin, le petit mot devant le nom change : le devient la, un devient une, ce et cet deviennent cette.';
    if (answer === 'ces') return 'Au pluriel, le petit mot ce, cet ou cette devient ces : ce chat, ces chats.';
    if (start === 'ces') return 'Au singulier, le petit mot ces devient ce, cet (devant une voyelle) ou cette (au féminin).';
    if (/^(les|des|de|mes|tes|ses|nos|vos|leurs)$/.test(start)) return 'Au singulier, le petit mot devant le nom change : les devient le, la ou l’, des devient un, une ou du.';
    return 'Le petit mot devant le nom change aussi : le, la et l’ deviennent les, un et une deviennent des, mon devient mes, notre devient nos.';
  }
  if (start === 'il' || start === 'elle' || start === 'ils' || start === 'elles') return 'Il devient ils, elle devient elles. Et dans l’autre sens.';
  if ((start === 'a' && answer === 'ont') || (start === 'ont' && answer === 'a')) return 'Le verbe avoir : il a, ils ont.';
  if ((start === 'est' && answer === 'sont') || (start === 'sont' && answer === 'est')) return 'Le verbe être : il est, ils sont.';
  if (/^(jument|femme|fille|poule|cane|chèvre|vache|biche|louve)$/.test(answer)) return 'Au féminin, certains mots changent complètement : un cheval, une jument ; un homme, une femme.';
  if (/a(l|il)$/.test(start) && /aux$/.test(answer)) return 'Au pluriel, -al devient -aux : un cheval, des chevaux. Quelques mots en -ail aussi : un travail, des travaux.';
  if (/aux$/.test(start) && /a(l|il)$/.test(answer)) return 'Au singulier, -aux redevient -al : des chevaux, un cheval. Parfois -ail : des travaux, un travail.';
  if (answer === `${start}x`) return 'Les mots en -eau, -au, -eu et quelques mots en -ou prennent un -x : des bateaux, des genoux.';
  if (start === `${answer}x`) return 'Au singulier, le -x s’en va : des genoux, un genou.';
  if (answer === `${start}s`) return 'Au pluriel, le nom et l’adjectif prennent un -s : des chats noirs.';
  if (start === `${answer}s`) return 'Au singulier, le nom et l’adjectif perdent leur -s : un chat noir.';
  if (start === `${answer}e` || start === `${answer}es`) return 'Au masculin, on enlève souvent le -e du féminin : contente, content.';
  if (answer === `${start}e` || answer === `${start}es`) return 'Au féminin, on ajoute souvent un -e : content, contente.';
  if (/nt$/.test(answer) && !/nt$/.test(start)) return 'Quand le sujet est au pluriel, le verbe se termine par -nt : ils jouent, ils jouaient.';
  if (/nt$/.test(start) && !/nt$/.test(answer)) return 'Quand le sujet est au singulier, le verbe ne se termine pas par -nt : il joue, il jouait.';
  if (/ons$/.test(answer) && !/ons$/.test(start)) return 'Avec nous, le verbe se termine par -ons : nous arrivons.';
  if (/ez$/.test(answer) && !/ez$/.test(start)) return 'Avec vous, le verbe se termine par -ez : vous traversez.';
  if (/esse$/.test(answer)) return 'Au féminin, quelques mots prennent -esse : un maitre, une maitresse ; un prince, une princesse.';
  if (/(eau|ou)$/.test(start) && /lle$/.test(answer)) return 'Quelques mots changent plus au féminin : nouveau, nouvelle ; beau, belle ; fou, folle.';
  if (/teur$/.test(start) && /trice$/.test(answer)) return 'Au féminin, -teur devient souvent -trice : un acteur, une actrice.';
  if (/eur$/.test(start) && /euse$/.test(answer)) return 'Au féminin, -eur devient souvent -euse : un menteur, une menteuse.';
  if (/e[rt]$/.test(start) && /è[rt]e$/.test(answer)) return 'Au féminin, -er devient -ère : un boucher, une bouchère. Et inquiet devient inquiète.';
  if (answer === `${start}${start.slice(-1)}e`) return 'Au féminin, on double souvent la dernière lettre avant le -e : réel, réelle ; gardien, gardienne.';
  if (/f$/.test(start) && /ve$/.test(answer)) return 'Au féminin, -f devient -ve : sportif, sportive.';
  if (/x$/.test(start) && /se$/.test(answer)) return 'Au féminin, -eux devient -euse : heureux, heureuse.';
  if (/c$/.test(start) && /che$/.test(answer)) return 'Au féminin, -c devient -che : blanc, blanche.';
  return 'Ce mot s’accorde avec le nom ou le pronom qu’il accompagne.';
}

/** « Remplace Lina par Enzo. » ; « Remplace Snoopy (mâle) par Didoune (femelle). » */
export const SWAP = /^Remplace (\S+)(?: \(mâle\))? par (\S+)(?: \(femelle\))?\.$/;

/** La phrase de départ telle que sur la fiche : avec le prénom de départ quand la consigne en change. */
export function startSentence(exercise: AccordExercise): string {
  const swap = SWAP.exec(exercise.instruction);
  const start = sentenceOf(exercise.text, 'start');
  return swap ? start.replace(swap[2]!, swap[1]!) : start;
}

const PLURAL = 'Transpose au pluriel.';
const SINGULAR = 'Transpose au singulier.';
const FEMININE = 'Transpose au féminin.';

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
  {
    belt: 'orange',
    skill: 'Je transforme les phrases avec ne… pas. Ce et cet deviennent ces. A devient ont. Je mets des mots au féminin : un acteur, une actrice.',
    goal: 'CE2',
    tips: [
      'Avec ne… pas, le verbe change comme d’habitude : il ne joue pas, ils ne jouent pas.',
      'Ce, cet et cette deviennent ces : ce chat, cet arbre, cette fille, ces enfants.',
      'Il a devient ils ont. Il est devient ils sont.',
      'Au féminin, -teur devient souvent -trice : un acteur, une actrice.',
      'Au féminin, -er devient -ère : un boucher, une bouchère. Et -eur devient -euse : un menteur, une menteuse.',
      'Parfois, on double la dernière lettre : gardien, gardienne ; réel, réelle.',
      'Devant une voyelle, mon, ton et son ne changent pas : mon ancienne maitresse.',
    ],
    practiceSize: 3,
    testSize: 6,
    texts: exercises('orange', [
      [1, PLURAL, '{Enthousiaste|Enthousiastes}, {ce|ces} {maitre|maitres/maîtres} {prépare|préparent} {une|des} {séance|séances} {ludique|ludiques} et {intéressante|intéressantes} !', 19],
      [2, PLURAL, '{Il|Ils} {a|ont} {un|des} {crayon|crayons} {rouge|rouges} {neuf|neufs}.', 19],
      [3, PLURAL, '{Son|Ses} {ancien|anciens} {stylo|stylos} {préféré|préférés} {ne} {fonctionnait|fonctionnaient} plus.', 19],
      [4, PLURAL, '{Elle|Elles} {a|ont} {une|des} {petite|petites} {main|mains} {potelée|potelées}.', 20],
      [5, PLURAL, '{Ce|Ces} {grand|grands} {paquet|paquets} {encombre|encombrent} {ma|mes} {petite|petites} {étagère|étagères} {étroite|étroites}.', 20],
      [6, PLURAL, '{Je|Nous} n’{arrive|arrivons} pas à faire {cet|ces} {exercice|exercices} {long|longs} et {difficile|difficiles}.', 20],
      [7, PLURAL, '{Tu|Vous} {ne} {traverses|traversez} jamais sur {ce|ces} {passage|passages} {piéton|piétons} !', 21],
      [8, PLURAL, '{Ta|Tes} {cousine|cousines} {a|ont} {une|des} {jolie|jolies} {maison|maisons} {fleurie|fleuries}.', 21],
      [9, PLURAL, '{Apeuré|Apeurés}, {notre|nos} {jeune|jeunes} {chien|chiens} {aboie|aboient} sur {cette|ces} {personne|personnes} {inconnue|inconnues}.', 21],
      [10, SINGULAR, '{Effrayés|Effrayé}, {ces|ce} {canards|canard} {bruyants|bruyant} {cancanent|cancane}.', 22],
      [11, SINGULAR, '{Les|Le} {poissons|poisson} {ont|a} peur {des|du} {grands|grand} {requins|requin} {blancs|blanc}.', 22],
      [12, SINGULAR, '{Tes|Ton} {nouveaux|nouveau} {livres|livre} {ne} {parlent|parle} ni de {ces|ce} {personnages|personnage}, ni de {ces|ce} {villages|village} !', 22],
      [13, SINGULAR, '{Ces|Cette} {fillettes|fillette} {ramassent|ramasse} {les|le} {fruits|fruit} {mûrs|mûr} et {sucrés|sucré}.', 23],
      [14, SINGULAR, '{Mes|Ma} {maitresses|maitresse/maîtresse} {ont|a} {des|une} {idées|idée} {farfelues|farfelue} mais {intéressantes|intéressante} !', 23],
      [15, SINGULAR, '{Fatigués|Fatigué}, {ces|ce} {soldats|soldat} {écrivaient|écrivait} {de|une} {nouvelles|nouvelle} {lettres|lettre} {émouvantes|émouvante}.', 23],
      [16, SINGULAR, '{Inquiets|Inquiet}, {les|le} {policiers|policier} {surveillent|surveille} {ces|ce} {suspects|suspect}.', 24],
      [17, SINGULAR, '{Nous effaçons|J’efface} {ces|cette} {traces|trace} sur {vos|votre} {vieilles|vieille} {tables|table} {abimées|abimée/abîmée}.', 24],
      [18, SINGULAR, '{Ils|Il} {ne} {révisent|révise} guère {les|la} {nouvelles|nouvelle} {leçons|leçon} !', 24],
      [19, FEMININE, '{cet|cette} {invité|invitée} / l’{employé|employée} / {votre} {ami|amie}', 25],
      [20, FEMININE, '{le|la} {gardien|gardienne} / {ce|cette} {collégien|collégienne} / {un|une} {musicien|musicienne}', 25],
      [21, FEMININE, '{cet|cette} {acteur|actrice} / {notre} {animateur|animatrice} / {un|une} {navigateur|navigatrice}', 25],
      [22, FEMININE, '{mon|ma} {boucher|bouchère} / {un|une} {droitier|droitière} / {le|la} {sorcier|sorcière}', 26],
      [23, FEMININE, '{un|une} {menteur|menteuse} / {le|la} {dompteur|dompteuse} / {un|une} {chercheur|chercheuse}', 26],
      [24, FEMININE, '{immortel|immortelle} / {mensuel|mensuelle} / {réel|réelle} / {naturel|naturelle}', 26],
      [25, FEMININE, '{Le|La} {directeur|directrice} {discute} avec {notre} {maitre|maitresse/maîtresse}.', 27],
      [26, FEMININE, '{Le|La} {spectateur|spectatrice} {applaudit} {ce|cette} {nouveau|nouvelle} {comédien|comédienne} {talentueux|talentueuse}.', 27],
      [27, FEMININE, '{Son|Sa} {chien|chienne} {désobéissant|désobéissante} {grogne} sur {ton|ta} {fils|fille} {apeuré|apeurée}.', 27],
      [28, FEMININE, '{Ce|Cette} {pharmacien|pharmacienne} {est} {très} {professionnel|professionnelle}.', 28],
      [29, FEMININE, '{Mon|Ma} {moniteur|monitrice} d’équitation {est} {phénoménal|phénoménale} !', 28],
      [30, FEMININE, '{Cet|Cette} {étranger|étrangère} {semble} {perdu|perdue} et {inquiet|inquiète}.', 28],
      [31, FEMININE, '{Je} veux devenir {un|une} {informaticien|informaticienne} {exceptionnel|exceptionnelle} !', 29],
      [32, FEMININE, '{Ce|Cette} {jeune} {homme|femme} sera {apprenti-boulanger|apprentie-boulangère}.', 29],
      // La fiche prévient : « mon » ne devient pas « ma » devant une voyelle. Un piège.
      [33, FEMININE, '{Mon} {ancien|ancienne} {instituteur|institutrice} {passionné|passionnée} enseigne toujours ici.', 29],
      [34, 'Remplace Quentin par Éléa.', 'Éléa {est} {un|une} {grand|grande} {magicien|magicienne}…', 30],
      [35, 'Remplace Quentin par Éléa.', 'Éléa {semble} {motivé|motivée} et {travailleur|travailleuse}.', 30],
      // La fiche oublie de marquer « une » en vert.
      [36, 'Remplace Quentin par Éléa.', 'Éléa {deviendra} {un|une} {ouvrier|ouvrière} {qualifié|qualifiée}.', 30],
      [37, PLURAL, '{Cet|Ces} {enfant|enfants} {a|ont} {un|des} {vélo|vélos} {neuf|neufs}.'],
      [38, PLURAL, '{Le|Les} {chat|chats} {ne} {mange|mangent} pas {cette|ces} {souris} {grise|grises}.'],
      [39, PLURAL, '{Elle|Elles} n’{a|ont} jamais vu {ce|ces} {film|films} {étrange|étranges}.'],
      [40, SINGULAR, '{Ces|Cet} {hôtels|hôtel} {ont|a} {des|une} {piscines|piscine} {immenses|immense}.'],
      [41, SINGULAR, '{Les|La} {voisines|voisine} n’{ont|a} pas {aimé} {ces|ce} {bonbons|bonbon} {acides|acide}.'],
      [42, FEMININE, '{Cet|Cette} {aviateur|aviatrice} {est} {courageux|courageuse}.'],
      [43, FEMININE, '{Le|La} {fermier|fermière} {nourrit} {ses} {poules}.'],
      [44, FEMININE, '{Ton|Ta} {cousin|cousine} {est} {un|une} {nageur|nageuse} {exceptionnel|exceptionnelle}.'],
      [45, FEMININE, '{un|une} {électeur|électrice} / {cet|cette} {écolier|écolière} / {le|la} {lycéen|lycéenne} / {cruel|cruelle}'],
      [46, 'Remplace Paul par Inès.', 'Inès {est} {un|une} {lecteur|lectrice} {passionné|passionnée}.'],
    ]),
  },
  {
    belt: 'rose',
    skill: 'Je transforme des phrases avec plusieurs verbes. Je connais les pluriels en -aux et en -x : des chevaux, des genoux. Je mets les animaux au féminin : un coq, une poule.',
    tips: [
      'Quand un sujet a plusieurs verbes, ils s’accordent tous : les chevaux trottent puis galopent.',
      'Les mots en -s, -x ou -z ne changent pas au pluriel : une souris, des souris ; un nez, des nez.',
      'Les mots en -al font -aux : un cheval, des chevaux. Sauf bal, carnaval et festival : des festivals.',
      'Quelques mots en -ail font -aux : un travail, des travaux. Les autres prennent un -s : des portails.',
      'Les mots en -eau, -au et -eu prennent un -x : des châteaux, des cheveux. Sauf pneu et bleu : des yeux bleus.',
      'Les mots en -ou prennent un -s : des kangourous. Sauf bijou, caillou, chou, genou, hibou, joujou et pou : des genoux.',
      'Au féminin, -f devient -ve (sportif, sportive), -on devient -onne (mignon, mignonne), -c devient -che (blanc, blanche).',
      'Pour les animaux, le mot change parfois : un cheval, une jument ; un coq, une poule ; un loup, une louve.',
    ],
    practiceSize: 3,
    testSize: 6,
    texts: exercises('rose', [
      [1, PLURAL, '{Le|Les} {cheval|chevaux} {blanc|blancs} {trotte|trottent} puis {galope|galopent}.', 31],
      [2, PLURAL, '{Son|Ses} {genou|genoux} {ne} {semblait|semblaient} pas {gonflé|gonflés}. {Il|Ils} {était|étaient} {bleu|bleus}.', 31],
      [3, PLURAL, '{L’écolier|Les écoliers} {ouvre|ouvrent} et {entre|entrent} par {le|les} {grand|grands} {portail|portails} {vert|verts}.', 31],
      [4, PLURAL, '{Le|Les} {seigneur|seigneurs} {construit|construisent} {ce|ces} {magnifique|magnifiques} {château|châteaux} {fortifié|fortifiés} puis {habite|habitent} dans {le|les} {donjon|donjons}.', 32],
      [5, PLURAL, '{Le|Les} {tournoi|tournois} {médiéval|médiévaux} {est|sont} {très} {attendu|attendus}.', 32],
      [6, PLURAL, '{La|Les} {reine|reines} {admire|admirent} {le|les} {favori|favoris} mais n’{encourage|encouragent} pas {le|les} {perdant|perdants}.', 32],
      [7, SINGULAR, '{Les|La} {souris} {grises|grise} {vivent|vit} dans {les|la} {vastes|vaste} {plaines|plaine}.', 33],
      [8, SINGULAR, '{Les|Le} {travaux|travail} de {ces|ce} {maçons|maçon} {ne} {commencent|commence} pas avant janvier et {se} {terminent|termine} en mars.', 33],
      [9, SINGULAR, '{Les|Le} {longs|long} {nez} {roses|rose} {des|du} {cochons|cochon} {sont|est} {les|le} {groins|groin} ou {les|le} {museaux|museau}.', 33],
      [10, SINGULAR, '{Les|Le} {hiboux|hibou} {sont|est} {des|un} {animaux|animal} {nocturnes|nocturne} {carnivores|carnivore}.', 34],
      [11, SINGULAR, '{Les|Le} {plats|plat} {cuisinés|cuisiné} {étaient|était} {conservés|conservé} dans {des|un} {bocaux|bocal} puis {savourés|savouré}.', 34],
      [12, SINGULAR, '{Des|Une} {grosses|grosse} {miettes|miette} {tombent|tombe} sur {mes|ma} {jambes|jambe} et {les|la} {salissent|salit}.', 34],
      [13, 'Remplace Snoopy (mâle) par Didoune (femelle).', 'Didoune {est} {un|une} {cheval|jument} {capricieux|capricieuse}.', 35],
      [14, 'Remplace Snoopy (mâle) par Didoune (femelle).', 'Didoune {est} {un|une} {loup|louve} un peu {fou|folle}.', 35],
      [15, 'Remplace Snoopy (mâle) par Didoune (femelle).', 'Didoune {est} {un|une} {coq|poule} {compétitif|compétitive}.', 35],
      [16, FEMININE, '{Le|La} {chat|chatte} {blanc|blanche} et {agressif|agressive} s’enfuit.', 36],
      [17, FEMININE, '{Le|La} {garçon|fille} {mignon|mignonne} {monte} {le|la} {cheval|jument} {brun|brune}.', 36],
      [18, FEMININE, '{L’affreux|L’affreuse} {canard|cane} et {le|la} {coq|poule} {maladif|maladive} {picorent}.', 36],
      [19, PLURAL, '{Le|Les} {journal|journaux} {local|locaux} {annonce|annoncent} {un|des} {festival|festivals} {génial|géniaux}.'],
      [20, PLURAL, '{Mon|Mes} {neveu|neveux} {joue|jouent} avec {le|les} {caillou|cailloux} {gris}.'],
      [21, PLURAL, '{Le|Les} {kangourou|kangourous} {saute|sautent} et {court|courent} dans {le|les} {désert|déserts}.'],
      [22, PLURAL, '{Le|Les} {bateau|bateaux} {gris} {quitte|quittent} {le|les} {port|ports} et {s’éloigne|s’éloignent}.'],
      [23, PLURAL, '{Ce|Ces} {travail|travaux} {est|sont} {long|longs} et {difficile|difficiles}.'],
      [24, SINGULAR, '{Les|Le} {gaz} {toxiques|toxique} {sont|est} {dangereux}.'],
      [25, SINGULAR, '{Les|Le} {chevaux|cheval} {noirs|noir} {mangent|mange} et {boivent|boit} près {des|du} {canaux|canal}.'],
      [26, SINGULAR, '{Les|Le} {poux|pou} {sautent|saute} sur {les|le} {cheveux|cheveu} {bruns|brun}.'],
      [27, FEMININE, '{Le|La} {lion|lionne} {sportif|sportive} {chasse} puis {rugit}.'],
      [28, FEMININE, '{Ce|Cette} {bon|bonne} {ami|amie} {est} {franc|franche} et {gentil|gentille}.'],
      [29, FEMININE, '{un|une} {canard|cane} / {le|la} {cerf|biche} / {un|une} {bouc|chèvre} / {le|la} {taureau|vache}'],
      [30, 'Remplace Rex (mâle) par Câline (femelle).', 'Câline {est} {un|une} {chien|chienne} {joueur|joueuse} et {naïf|naïve}.'],
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
