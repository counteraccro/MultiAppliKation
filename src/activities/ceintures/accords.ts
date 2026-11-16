// Ceintures d'accords : « Je transpose un texte… » (voir .ai/analyse/21-ceintures-accords.md).
// Exercices des fiches Charivari « Je prépare la ceinture… » (n° 1 à 114, de la blanche à la noire),
// corrections relues, complétés par les nôtres. Une faute ici apprendrait une faute à l'enfant :
// accords.test.ts vérifie chaque phrase.
//
// Une phrase s'écrit déjà transposée ; chaque case donne le mot de départ et la réponse :
// « {L’avion|Les avions} {décolle|décollent}. ». Une case piège garde sa forme : « {très} ».
// Plusieurs réponses justes se séparent par « / » : « {maitre|maitres/maîtres} ».
// Des mots seuls (« {cet|cette} {invité|invitée} / {un|une} {musicien|musicienne} ») restent en minuscules.
// Ce qui change sans être à taper s'écrit entre crochets : « [Toufou|Toufou et Rex] {était|étaient} ».
// « Complète les terminaisons » : la case donne le début du mot, « {parl…|parle} » ; ce début est déjà tapé.
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
  /** Des textes plutôt que des phrases (vert clair, vert foncé…) : pour les écrans. */
  unit?: 'texte';
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
/** « [Toufou|Toufou et Rex] » : le texte de départ, puis le texte transposé. */
const FIXED = /\[([^[\]|]*)\|([^[\]]*)\]/g;

/** Coupe la phrase (transposée) en morceaux de texte et en cases, dans l'ordre. */
export function parseAccord(text: string): Piece[] {
  text = text.replace(FIXED, '$2');
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

/** La majuscule de début de phrase, mise toute seule ; celle d'un nom propre aussi (« les Grecs »). */
export const shown = (box: Box, word: string) =>
  box.capital || /^\p{Lu}/u.test(box.answer) ? word.charAt(0).toUpperCase() + word.slice(1) : word;

/** La phrase de départ (les cases avec leur mot de départ) ou la phrase corrigée. */
export function sentenceOf(text: string, side: 'start' | 'answer'): string {
  return parseAccord(side === 'start' ? text.replace(FIXED, '$1') : text)
    .map((piece) => (typeof piece === 'string' ? piece : side === 'start' ? piece.start : shown(piece, piece.answer)))
    .join('');
}

const DETERMINERS = /^(le|la|l’|un|une|du|de|les|des|mon|ton|son|ma|ta|sa|mes|tes|ses|ce|cet|cette|ces|notre|votre|nos|vos|leur|leurs)$/;
/** Le petit mot au masculin, et au féminin. */
const FEMININE_OF: Record<string, string> = { le: 'la', un: 'une', ce: 'cette', cet: 'cette', mon: 'ma', ton: 'ta', son: 'sa' };
/** Des mots en -s qui ne changent jamais : l'astuce des noms en -s, -x, -z ne leur va pas. */
const SMALL_WORDS = new Set(['très', 'après', 'plus', 'puis', 'jamais', 'toujours', 'toutefois', 'dans', 'sous', 'les', 'des', 'mes', 'tes', 'ses', 'ces', 'nos', 'vos', 'nous', 'vous']);

/** « {parl…|parle} » : le début du mot, déjà tapé dans la case ; vide pour une case ordinaire. */
export const prefillOf = (box: Box) => (box.start.endsWith('…') ? box.start.slice(0, -1) : '');

/** Le verbe avoir juste avant la case (« j’ai », « les a », « l’ai tellement ») : pour l'accord du participe. */
const AFTER_AVOIR = /(^|\s|’)(a|ai|as|ont|avons|avez|avait|avais|avaient|avoir)\s(\p{L}+ment\s|bien\s|beaucoup\s)?$/u;
const AFTER_ETRE = /(^|\s|’)(est|sont|était|étaient|sera|seront|serait|seraient|être|été)\s(\p{L}+ment\s|très\s|bien\s|trop\s)?$/u;
const PARTICIPLE = /(é|i|u|is|it)(e?s?)$/;

/** Le texte autour de la case : la phrase transposée avant elle, et ce qui la suit. */
export interface Around {
  before: string;
  after: string;
}

/** L'astuce de la case n° `index` du texte, d'après ce qui l'entoure. */
export function tipAt(text: string, index: number): string {
  const pieces = parseAccord(text);
  let before = '';
  let seen = 0;
  for (const [i, piece] of pieces.entries()) {
    if (typeof piece === 'string') before += piece;
    else if (seen++ === index) {
      const next = pieces[i + 1];
      const words = normalizeWords(before);
      return tipFor(piece, { before: /\s$/.test(before) && words ? `${words} ` : words, after: typeof next === 'string' ? next : '' });
    } else before += shown(piece, piece.answer);
  }
  return tipFor(boxesOf(text)[index]!);
}

/** L'astuce montrée après une erreur, d'après ce qui change dans la case (et ce qui l'entoure, si on le sait). */
export function tipFor(box: Box, around?: Around): string {
  const start = normalizeWords(box.start);
  const answer = normalizeWords(box.answer);
  if (start.endsWith('…')) return 'Cherche le mot qui commande l’accord. Le sujet peut être après le verbe : les souvenirs que raconte ma grand-mère. Qui raconte ? Ma grand-mère.';
  if (start === answer) {
    if (around && /^(fait|laissé)$/.test(start) && /^\s+\p{L}+(er|ir|re)\b/u.test(around.after)) return 'Ce mot ne change pas : fait suivi d’un verbe à l’infinitif ne change jamais (ça les a fait rigoler).';
    if (around && AFTER_AVOIR.test(around.before) && PARTICIPLE.test(start)) return 'Ce mot ne change pas. Avec avoir, le participe passé ne s’accorde pas avec le sujet : il a joué, ils ont joué. Il s’accorde seulement avec un mot placé avant (la clé que j’ai prise).';
    if (around && /(é|ée|és|ées|u|ue|ues|us)$/.test(start) && !SMALL_WORDS.has(start)) return 'Ce mot ne change pas : il va avec un mot qui, lui, ne change pas (mon oncle était déçu).';
    if (/ment$/.test(start)) return 'Ce mot ne change jamais : les mots en -ment (vraiment, notamment) restent pareils.';
    if (/ant$/.test(start)) return 'Ce mot ne change pas : le participe présent en -ant ne change jamais (en sautant, en broutant).';
    if (/^(tout|tous|toute|toutes)$/.test(start)) return 'Ce mot ne change pas : tout va avec le nom qui le suit, et ce nom ne change pas (tout le village, tout leur travail).';
    if (start === 'même') return around && /^\s+si\b/.test(around.after) ? 'Ce mot ne change pas : dans « même si », même ne change jamais.' : 'Ce mot ne change pas : même va avec le nom qui le suit, et ce nom ne change pas (à la même heure).';
    if (/^(bleu|vert|rouge|jaune|gris|noir|blanc|rose|violet) (clair|foncé|vif|pâle)$/.test(start)) return 'Ce mot ne change pas : une couleur en deux mots ne change jamais (des voitures bleu foncé).';
    if (/^(orange|marron)$/.test(start)) return 'Ce mot ne change pas : orange et marron sont aussi des noms, ils ne changent jamais (des fleurs orange).';
    if (start === 'l’a' || start === 'l’ai' || start === 'l’avons') return 'Ce mot ne change pas : l’ veut dire le ou la, il reste pareil au féminin (mon père l’a traité, mon père l’a traitée).';
    if ((/[éiu]$/.test(start) && start.length > 3) || start === 'été' || start === 'fait') return 'Ce mot ne change pas. Avec avoir, le participe passé ne s’accorde pas avec le sujet : il a joué, ils ont joué.';
    if (/^(mon|ton|son)$/.test(start)) return 'Ce mot ne change pas. Mon, ton et son restent devant une voyelle (mon ancienne maitresse) et devant un nom masculin (son cousin).';
    if (SMALL_WORDS.has(start)) return 'Ce mot ne change pas : il reste comme il est.';
    if (/(is|os|as|ux|z)$/.test(start) && start !== 'yeux') return 'Ce mot ne change pas : il reste comme il est. Les mots en -s, -x ou -z ne changent pas au pluriel : une souris, des souris.';
    if (/[sx]$/.test(start)) return 'Ce mot ne change pas : il ne va pas avec le sujet. Le crocodile attrape ses proies, les crocodiles attrapent leurs proies.';
    return 'Ce mot ne change pas : il reste comme il est.';
  }
  if (/^(l’|les )(a|ai|as|avoir|avais|avait)$/.test(start) && /^(l’|les )(a|ai|as|avoir|avais|avait)$/.test(answer)) {
    return start.startsWith('les')
      ? 'Devant le verbe, les devient l’ au singulier : je les ai trouvés, je l’ai trouvé. Avoir ne change pas, son sujet reste le même.'
      : 'Devant le verbe, le ou la devient les : je l’ai trouvé, je les ai trouvés. Avoir ne change pas, son sujet reste le même.';
  }
  if (/-t?-?(il|elle|ils|elles)$/.test(start) || /-t?-?(il|elle|ils|elles)$/.test(answer)) return 'Quand le sujet est après le verbe, le verbe s’accorde quand même : va-t-elle, vont-elles ; arrivera-t-il, arriveront-elles.';
  if (/-mêmes?$/.test(answer)) return 'Même change avec le pronom : lui-même, eux-mêmes ; elle-même, elles-mêmes.';
  if (/^(je|j’|tu|nous|vous)(\s|$)|^j’/.test(start) || /^(je|j’|tu|nous|vous)(\s|$)|^j’/.test(answer)) {
    return 'Je devient nous, tu devient vous, et le verbe change avec : je chante, nous chantons ; tu chantes, vous chantez.';
  }
  if (/^(c’est|ce sont)$/.test(start) && /^(c’est|ce sont)$/.test(answer)) return 'C’est devient ce sont au pluriel : c’est mon ami, ce sont mes amis.';
  if (/(^|\s|’)(est|sont)$/.test(start) && /(^|\s|’)(est|sont)$/.test(answer)) return 'Le verbe être : il est, ils sont. Il n’est pas, ils ne sont pas.';
  if (/^(qu’|s’|si )?ils?$/.test(start) && /^(qu’|s’|si )?elles?$/.test(answer)) return 'Au féminin, il devient elle et ils devient elles.';
  if (/^(qu’|s’|si )?elles?$/.test(start) && /^(qu’|s’|si )?ils?$/.test(answer)) return 'Au masculin, elle devient il et elles devient ils.';
  if (start.includes(' ') || answer.includes(' ')) {
    if (/^(les|des|aux|mes|tes|ses|ces|nos|vos|leurs) /.test(start)) return 'Au singulier, le petit mot devant le nom devient le, la, l’, un ou une, et le nom perd son -s.';
    if (/^(les|des|aux|mes|tes|ses|ces|nos|vos|leurs) /.test(answer)) return 'Au pluriel, le petit mot devant le nom devient les ou des, et le nom prend un -s.';
    return 'Quand le nom change, le petit mot devant change avec lui : un effort, une volonté ; le chemin, la route.';
  }
  if (start === 'lui' && answer === 'leur') return 'Lui devient leur au pluriel, sans -s : il lui donne du foin, il leur donne du foin.';
  if (/^(tout|tous|toute|toutes)$/.test(start) && /^(tout|tous|toute|toutes)$/.test(answer) && !(start === 'tous' && answer === 'toutes')) {
    return 'Tout change avec le mot qu’il accompagne : tout le jour, toute la nuit, tous les jours, toutes les nuits.';
  }
  if (answer === 'leurs') return 'Au pluriel, ses devient leurs : l’éléphant et ses oreilles, les éléphants et leurs oreilles.';
  if (answer === 'leur') return 'Au pluriel, son et sa deviennent leur quand chacun en a un seul : l’éléphant et sa trompe, les éléphants et leur trompe.';
  if (start === 'leurs') return 'Au singulier, leurs devient ses : leurs proies, ses proies.';
  if (start === 'leur') return 'Au singulier, leur devient son ou sa : leur cou, son cou ; leur tête, sa tête.';
  if (DETERMINERS.test(answer)) {
    if (FEMININE_OF[start] === answer) return 'Au féminin, le petit mot devant le nom change : le devient la, un devient une, ce et cet deviennent cette.';
    if (answer === 'ces') return 'Au pluriel, le petit mot ce, cet ou cette devient ces : ce chat, ces chats.';
    if (start === 'ces') return 'Au singulier, le petit mot ces devient ce, cet (devant une voyelle) ou cette (au féminin).';
    if (/^(les|des|de|mes|tes|ses|nos|vos|leurs)$/.test(start)) return 'Au singulier, le petit mot devant le nom change : les devient le, la ou l’, des devient un, une ou du.';
    return 'Le petit mot devant le nom change aussi : le, la et l’ deviennent les, un et une deviennent des, mon devient mes, notre devient nos.';
  }
  if (start === 'tous' && answer === 'toutes') return 'Au féminin, tous devient toutes : tous les ânes, toutes les ânesses.';
  if (start === 'il' || start === 'elle' || start === 'ils' || start === 'elles') return 'Il devient ils, elle devient elles. Et dans l’autre sens.';
  if ((start === 'a' && answer === 'ont') || (start === 'ont' && answer === 'a')) return 'Le verbe avoir : il a, ils ont.';
  if ((start === 'est' && answer === 'sont') || (start === 'sont' && answer === 'est')) return 'Le verbe être : il est, ils sont.';
  if (/^(jument|femme|fille|poule|cane|chèvre|vache|biche|louve)$/.test(answer)) return 'Au féminin, certains mots changent complètement : un cheval, une jument ; un homme, une femme.';
  if (/a(l|il)$/.test(start) && /aux$/.test(answer)) return 'Au pluriel, -al devient -aux : un cheval, des chevaux. Quelques mots en -ail aussi : un travail, des travaux.';
  if (/aux$/.test(start) && /a(l|il)$/.test(answer)) return 'Au singulier, -aux redevient -al : des chevaux, un cheval. Parfois -ail : des travaux, un travail.';
  if (around && AFTER_AVOIR.test(around.before) && PARTICIPLE.test(start) && PARTICIPLE.test(answer)) {
    return 'Avec avoir, le participe passé s’accorde avec le mot placé avant le verbe : la lettre que j’ai écrite ; les clés, je les ai prises.';
  }
  if (around && AFTER_ETRE.test(around.before) && start.replace(/e?s?$/, '') === answer.replace(/e?s?$/, '')) {
    return 'Après être, le mot s’accorde avec le sujet : elle est partie, ils sont contents.';
  }
  if (/ient$/.test(start) && /iennent$/.test(answer)) return 'Quand le sujet est au pluriel, le verbe se termine par -nt : il vient, ils viennent ; il entretient, ils entretiennent.';
  if (/iennent$/.test(start) && /ient$/.test(answer)) return 'Quand le sujet est au singulier, le verbe ne se termine pas par -nt : ils viennent, il vient.';
  if (answer === `${start}x`) return 'Les mots en -eau, -au, -eu et quelques mots en -ou prennent un -x : des bateaux, des genoux.';
  if (start === `${answer}x`) return 'Au singulier, le -x s’en va : des genoux, un genou.';
  if (answer === `${start}s`) return 'Au pluriel, le nom et l’adjectif prennent un -s : des chats noirs.';
  if (start === `${answer}s`) return 'Au singulier, le nom et l’adjectif perdent leur -s : un chat noir.';
  if (start === `${answer}e` || start === `${answer}es` || (/s$/.test(answer) && start === `${answer.slice(0, -1)}es`)) return 'Au masculin, on enlève souvent le -e du féminin : contente, content.';
  if (answer === `${start}e` || answer === `${start}es` || (/s$/.test(start) && answer === `${start.slice(0, -1)}es`)) return 'Au féminin, on ajoute souvent un -e : content, contente.';
  if (/nt$/.test(answer) && !/nt$/.test(start)) return 'Quand le sujet est au pluriel, le verbe se termine par -nt : ils jouent, ils jouaient.';
  if (/nt$/.test(start) && !/nt$/.test(answer)) return 'Quand le sujet est au singulier, le verbe ne se termine pas par -nt : il joue, il jouait.';
  if (/ons$/.test(answer) && !/ons$/.test(start)) return 'Avec nous, le verbe se termine par -ons : nous arrivons.';
  if (/ez$/.test(answer) && !/ez$/.test(start)) return 'Avec vous, le verbe se termine par -ez : vous traversez.';
  if (/esses?$/.test(answer)) return 'Au féminin, quelques mots prennent -esse : un maitre, une maitresse ; un prince, une princesse.';
  if (/(eau|ou)$/.test(start) && /lle$/.test(answer)) return 'Quelques mots changent plus au féminin : nouveau, nouvelle ; beau, belle ; fou, folle.';
  if (/teur$/.test(start) && /trice$/.test(answer)) return 'Au féminin, -teur devient souvent -trice : un acteur, une actrice.';
  if (/eur$/.test(start) && /euse$/.test(answer)) return 'Au féminin, -eur devient souvent -euse : un menteur, une menteuse.';
  if (/e[rt]$/.test(start) && /è[rt]e$/.test(answer)) return 'Au féminin, -er devient -ère : un boucher, une bouchère. Et inquiet devient inquiète.';
  if (/euse$/.test(start) && /eux$/.test(answer)) return 'Au masculin, -euse devient -eux : heureuse, heureux.';
  if (/euse$/.test(start) && /eur$/.test(answer)) return 'Au masculin, -euse devient -eur : menteuse, menteur.';
  if (/ère$/.test(start) && /er$/.test(answer)) return 'Au masculin, -ère devient -er : bouchère, boucher.';
  if (answer === `${start}${start.slice(-1)}e` || answer === `${start}${start.slice(-1)}es`) return 'Au féminin, on double souvent la dernière lettre avant le -e : réel, réelle ; gardien, gardienne.';
  if (/f$/.test(start) && /ve$/.test(answer)) return 'Au féminin, -f devient -ve : sportif, sportive.';
  if (/x$/.test(start) && /se$/.test(answer)) return 'Au féminin, -eux devient -euse : heureux, heureuse.';
  if (/c$/.test(start) && /che$/.test(answer)) return 'Au féminin, -c devient -che : blanc, blanche.';
  return 'Ce mot s’accorde avec le nom ou le pronom qu’il accompagne.';
}

/** « Remplace Lina par Enzo. » ; « Remplace Snoopy (mâle) par Didoune (femelle). » */
export const SWAP = /^Remplace (\p{Lu}\S*)(?: \(mâle\))? par (\p{Lu}\S*)(?: \(femelle\))?\.$/u;

/** La phrase de départ telle que sur la fiche : avec le prénom de départ quand la consigne en change. */
export function startSentence(exercise: AccordExercise): string {
  const swap = SWAP.exec(exercise.instruction);
  const start = sentenceOf(exercise.text, 'start');
  return swap ? start.replaceAll(swap[2]!, swap[1]!) : start;
}

const PLURAL = 'Transpose au pluriel.';
const ENDINGS = 'Complète les terminaisons manquantes.';
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
  {
    belt: 'vert-clair',
    skill: 'Je transforme un petit texte. Je choisis entre leur et leurs.',
    unit: 'texte',
    tips: [
      'Dans un texte, tout ce qui va avec le sujet change, dans toutes les phrases : le nom, il ou elle, les verbes.',
      'Son et sa deviennent leur quand chacun en a un seul : l’éléphant et sa trompe, les éléphants et leur trompe.',
      'Ses devient leurs : l’éléphant et ses oreilles, les éléphants et leurs oreilles.',
      'Leur, devant un nom, prend un -s seulement si le nom est au pluriel : leur trompe, leurs oreilles.',
      'Les mots qui ne vont pas avec le sujet ne changent pas : le crocodile attrape ses proies, les crocodiles attrapent leurs proies.',
    ],
    practiceSize: 1,
    testSize: 2,
    texts: exercises('vert-clair', [
      [1, 'Remplace l’éléphant par les éléphants.', '{L’éléphant|Les éléphants} {entend|entendent} {très} bien grâce à {ses|leurs} {grandes} {oreilles} et {il|ils} {a|ont} un bon odorat grâce à {sa|leur} trompe. On dit que {l’éléphant|les éléphants} {a|ont} peur {de la|des} {souris} !', 37],
      [2, 'Remplace les crocodiles par le crocodile.', '{Les|Le} {crocodiles|crocodile} {sont|est} {de|un} {redoutables|redoutable} {prédateurs|prédateur}. {Ils|Il} {attrapent|attrape} {leurs|ses} {proies} avec {leurs|ses} {larges} mâchoires. {Les|Le} {crocodiles|crocodile} {peuvent|peut} vivre très vieux. En captivité, {ils|il} {peuvent|peut} même dépasser l’âge de 100 ans !', 38],
      [3, 'Remplace les crocodiles par le crocodile.', '{Les|Le} {crocodiles|crocodile} {sont|est} {sensibles|sensible} aux vibrations dans l’eau. {Leurs|Ses} {yeux} {sont} situés en haut de {leur|sa} tête.', 39],
      [4, 'Remplace l’éléphant par les éléphants.', '{L’éléphant|Les éléphants} {est|sont} {le|les} plus {gros} {animal|animaux} {terrestre|terrestres} du monde. {L’éléphant|Les éléphants} d’Afrique {mesure|mesurent} 4 mètres de haut.', 40],
      // La fiche marque aussi « à » en vert : il ne change pas.
      [5, 'Remplace le renard par la renarde.', '{Le|La} {renard|renarde} {est} {rusé|rusée}. {Il|Elle} est souvent {associé|associée} à la ruse dans les contes. {Il|Elle} est {craintif|craintive} et parfois {cruel|cruelle}. {Le|La} {renard|renarde} vit généralement en groupe, {il|elle} est carnivore et aussi {très} sociable.', 41],
      [6, 'Remplace la limace par les limaces.', '{La|Les} {limace|limaces} {est|sont} {un|des} {animal|animaux} au corps {mou}. {Sa|Leur} bouche contient une langue garnie de dents. {Elle|Elles} {n’est|ne sont} pas {l’amie|les amies} du jardinier car {elle|elles} {dévore|dévorent} les jeunes plants !', 42],
      [7, 'Remplace l’âne par l’ânesse.', '{Tous|Toutes} les {ânes|ânesses} ont de grandes oreilles refroidissantes. {L’âne|L’ânesse} est {têtu|têtue} mais {très} {intelligent|intelligente}.', 43],
      [8, 'Remplace l’âne par l’ânesse.', '{L’âne|L’ânesse} est plus {petit|petite} que {son} cousin le cheval. {Il|Elle} reste {l’ami|l’amie} de l’homme. Autrefois, {l’âne|l’ânesse} était {utilisé|utilisée} pour transporter des biens et des personnes.', 44],
      [9, 'Remplace les girafes par la girafe.', '{Les|La} {girafes|girafe} {vivent|vit} entre quinze et vingt ans. {Leur|Son} cou mesure à lui tout seul deux mètres !', 45],
      [10, 'Remplace les girafes par la girafe.', '{Les|La} {girafes|girafe} {ont|a} un long cou et ne {parlent|parle} pas. {Elles|Elle} {peuvent|peut} mesurer jusqu’à cinq mètres de haut !', 46],
      [11, 'Remplace l’alligator par les alligators.', '{L’alligator|Les alligators} {adulte|adultes} {est|sont} {très} {féroce|féroces}. {Il|Ils} {défend|défendent} {son|leur} territoire et {pond|pondent} des œufs.', 47],
      // La fiche oublie de marquer le dernier « Ils » en vert.
      [12, 'Remplace l’alligator par les alligators.', '{L’alligator|Les alligators} {a|ont} peur de l’homme. {Il|Ils} {se} {jette|jettent} dans l’eau pour se cacher. {Il|Ils} {chasse|chassent}.', 48],
      [13, 'Remplace le chat par les chats.', '{Le|Les} {chat|chats} {est|sont} {le|les} {seul|seuls} {félin|félins} {domestiqué|domestiqués}. {Il|Ils} {conserve|conservent} {toutefois} {son|leur} caractère sauvage.', 49],
      // La fiche écrit « des gros dormeurs » ; « de gros dormeurs » est juste aussi.
      [14, 'Remplace le chat par les chats.', '{Le|Les} {chat|chats} {est|sont} {un|des/de} {gros} {dormeur|dormeurs} et {il|ils} {marque|marquent} {son|leur} territoire en laissant {son|leur} odeur. {Le|Les} {chat|chats} {est|sont} {indépendant|indépendants}.', 50],
      [15, 'Remplace cheval par jument.', '{Le|La} {cheval|jument} a été {domestiqué|domestiquée} par l’homme. {Certains|Certaines} {chevaux|juments} sont {devenus|devenues} célèbres !', 51],
      [16, 'Remplace le lion par la lionne.', '{Le|La} plus {grand|grande} {lion|lionne} vit en Afrique où {il|elle} a longtemps été {chassé|chassée}. {Il|Elle} est plus {petit|petite} que le tigre.', 52],
      [17, 'Remplace le loup par la louve.', '{Le|La} {loup|louve} n’est pas {dangereux|dangereuse} pour l’homme. {Il|Elle} est {présent|présente} dans beaucoup de légendes.', 53],
      [18, 'Remplace le chien par les chiens.', '{Le|Les} {chien|chiens} {est|sont} {considéré|considérés} comme {le|les} {meilleur|meilleurs} {ami|amis} de l’homme. {Sa|Leur} fidélité est impressionnante !', 54],
      [19, 'Remplace le hérisson par les hérissons.', '{Le|Les} {hérisson|hérissons} {sort|sortent} la nuit. {Il|Ils} {cherche|cherchent} {sa|leur} nourriture dans les feuilles. {Ses|Leurs} {piquants} {le|les} {protègent} des renards.'],
      [20, 'Remplace les abeilles par l’abeille.', '{Les abeilles|L’abeille} {butinent|butine} les fleurs du jardin. {Elles|Elle} {rapportent|rapporte} le pollen à {leur|sa} ruche. {Leurs|Ses} {ailes} {battent} très vite.'],
      [21, 'Remplace la tortue par les tortues.', '{La|Les} {tortue|tortues} {avance|avancent} lentement. {Elle|Elles} {transporte|transportent} {sa|leur} maison sur {son|leur} dos. {Elle|Elles} {peut|peuvent} vivre {très} longtemps.'],
    ]),
  },
  {
    belt: 'vert-fonce',
    skill: 'Je transforme un texte au passé composé. Avec avoir, le participe passé ne change pas. Les mots en -ment ne changent jamais.',
    goal: 'CM1',
    unit: 'texte',
    tips: [
      'Avec avoir, le participe passé ne s’accorde pas avec le sujet : il a joué, ils ont joué, elles ont joué.',
      'Seul le verbe avoir change : il a, ils ont.',
      'Les mots en -ment ne changent jamais : vraiment, notamment, pratiquement.',
      'Très, bien, beaucoup, toujours et parfois ne changent jamais non plus.',
      'Attention, avec être, le participe s’accorde : ils sont considérés comme des dieux.',
    ],
    practiceSize: 1,
    testSize: 2,
    texts: exercises('vert-fonce', [
      [1, 'Remplace la loutre par les loutres.', '{La|Les} {loutre|loutres} {est|sont} {un|des} {mammifère|mammifères} {semi-aquatique|semi-aquatiques} {pratiquement} {nocturne|nocturnes}. {Elle|Elles} {est|sont} {essentiellement} {piscivore|piscivores}. {Elle|Elles} se {nourrit|nourrissent} de différents poissons. {Elle|Elles} se {reproduit|reproduisent} à partir de 2 ou 3 ans.', 55],
      [2, 'Remplace les trous noirs par le trou noir.', '{Les|Le} {trous|trou} {noirs|noir} {sont|est} {des|un} {objets|objet} dans l’univers {très} {massifs|massif} mais {beaucoup} plus {petits|petit} que les étoiles. {Ils|Il} {engloutissent|engloutit} tout ce qui se trouve à {leur|sa} proximité, même la lumière.', 56],
      [3, 'Remplace Papa par Maman et Réglisse par Charles et Réglisse.', '[Papa|Maman] n’avait {vraiment} pas le moral, alors [Réglisse|Charles et Réglisse] {a|ont} {été} {contente|contents} qu’{il|elle} propose d’emmener Albert au parc.', 57],
      // « Chienne reste au singulier », prévient la fiche : un piège.
      [4, 'Remplace Toufou par Toufou et Rex.', '[Toufou|Toufou et Rex] {était|étaient} {extrêmement} {impatient|impatients} de sortir. {Il|Ils} {a|ont} {rencontré} une {chienne} et {a|ont} {reniflé} son derrière ! {Il|Ils} {réagit|réagissent} toujours comme cela quand {il|ils} {rencontre|rencontrent} une {inconnue}.', 58],
      [5, 'Remplace Noé par Noé et Victor.', 'À la récré, [Noé|Noé et Victor] {a|ont} {parlé} à un garçon. {Il|Ils} {a|ont} {joué} avec lui. {Il|Ils} {a|ont} bien {aimé}, {finalement}, ce premier jour d’école !', 59],
      // La fiche accepte « de bons marins » et « des bons marins ».
      [6, 'Remplace le Grec par les Grecs.', '{Le|Les} {Grec|Grecs} {a|ont} {été} {un|de/des} {bon|bons} {marin|marins}. {Il|Ils} {partait|partaient} {vraiment} loin en mer. {Il|Ils} {a|ont} {rapporté} des marchandises et {a|ont} beaucoup {perfectionné} {sa|leur} technique de navigation.', 60],
      [7, 'Remplace l’homme préhistorique par les hommes préhistoriques.', '{L’homme|Les hommes} {préhistorique|préhistoriques} se {réunissait|réunissaient} {notamment} dans des grottes. Puis, {il|ils} {a|ont} {bâti} des villages, {a|ont} {cultivé} des champs et {a|ont} {élevé} des animaux.', 61],
      [8, 'Remplace le pharaon par les pharaons.', '{Le|Les} {pharaon|pharaons} {est|sont} {le|les} {roi|rois} d’Égypte. {Il|Ils} {s’enrichit|s’enrichissent} grâce au travail des paysans. {Il|Ils} {est|sont} {tellement} {puissant|puissants} qu’{il|ils} {est|sont} {considéré|considérés} comme {un|des} {dieu|dieux} {vivant|vivants}.', 62],
      [9, 'Remplace empereur par impératrices.', '{Le|Les} {premier|premières} {empereur|impératrices} de Chine {était|étaient} {vraiment} {puissant|puissantes} et {cruel|cruelles} ! {Il|Elles} {a|ont} {fait} édifier des palais somptueux. {L’empereur|Les impératrices} {a|ont} {fait} construire la Grande Muraille de Chine.', 63],
      [10, 'Remplace le tigre par les tigres.', '{Le|Les} {tigre|tigres} n’{a|ont} pas peur de l’eau. {Il|Ils} {nage|nagent} {très} bien. {Le|Les} {tigre|tigres} {rugit|rugissent} et {souffle|soufflent}. {C’est|Ce sont} {le|les} plus {grand|grands} des félins et {ses|leurs} crocs sont énormes.', 64],
      [11, 'Remplace le coquillage par les coquillages et le mollusque par les mollusques.', '{Le|Les} {coquillage|coquillages} {est|sont} {la|les} « {maison|maisons} » que se {construit|construisent} {le|les} {mollusque|mollusques} ({animal|animaux} à corps {mou|mou/mous}) pour se protéger. {Le|Les} {coquillage|coquillages} {grandit|grandissent} en même temps que le corps {de l’animal|des animaux}.', 65],
      [12, 'Remplace les poissons par la carpe.', '{Les poissons|La carpe} {vivent|vit} {exclusivement} dans l’eau. {Ils|Elle} se {déplacent|déplace} grâce à {leurs|ses} nageoires. {Couverts|Couverte} d’écailles, {ils|elle} {sont|est} {parfaitement} {adaptés|adaptée} à la vie aquatique. {Les poissons|La carpe} {grandissent|grandit} toute {leur|sa} vie.', 66],
      [13, 'Remplace le chevalier par les chevaliers.', '{Le|Les} {chevalier|chevaliers} {a|ont} {quitté} {son|leur} château à l’aube. {Il|Ils} {a|ont} {traversé} la forêt et {a|ont} {combattu} {courageusement} le dragon.'],
      [14, 'Remplace Léo par Léo et Sami.', '[Léo|Léo et Sami] {a|ont} {préparé} un gâteau. {Il|Ils} {a|ont} {mélangé} la farine et les œufs, puis {il|ils} {a|ont} {attendu} {patiemment}. {Il|Ils} {était|étaient} {vraiment} {fier|fiers} !'],
      [15, 'Remplace la sorcière par les sorcières.', '{La|Les} {sorcière|sorcières} {a|ont} {préparé} une potion. {Elle|Elles} {a|ont} {ajouté} une patte de crapaud et {a|ont} {tourné} {lentement} le chaudron. {Elle|Elles} {était|étaient} {terriblement} {contente|contentes} !'],
    ]),
  },
  {
    belt: 'bleu-clair',
    skill: 'Je retrouve le sujet, même quand il est loin du verbe. Avec être, le participe passé s’accorde avec le sujet.',
    tips: [
      'Le sujet peut être loin du verbe : le docteur, le seul de la région, vient. Les docteurs, les seuls de la région, viennent.',
      'Avec être, le participe passé s’accorde avec le sujet : il est parti, elle est partie, ils sont partis, elles sont parties.',
      'C’est devient ce sont au pluriel : c’est ma préférée, ce sont mes préférées.',
      'Dans « que je préfère », le sujet est je : préfère ne change pas.',
      'Au féminin, certains animaux changent de nom : le coq, la poule. D’autres prennent un -e : le lapin, la lapine.',
    ],
    practiceSize: 3,
    testSize: 6,
    texts: exercises('bleu-clair', [
      [1, PLURAL, '{Mon|Mes} {frère|frères}, {prêt|prêts} pour l’école, {portait|portaient} {son|leur} cartable.', 67],
      [2, PLURAL, '{Ma|Mes} {sœur|sœurs/soeurs} {est|sont} {devenue|devenues} {journaliste|journalistes}.', 67],
      [3, PLURAL, '{Cette|Ces} {série|séries}, {c’est|ce sont} {ma|mes} {préférée|préférées}.', 67],
      [4, PLURAL, '{Le|Les} {chat|chats} {est|sont} {poursuivi|poursuivis} par {le|les} {chien|chiens}.', 68],
      [5, PLURAL, '{Le|Les} {docteur|docteurs}, {le|les} {seul|seuls} de la région, {vient|viennent} examiner {le|les} {malade|malades}.', 68],
      [6, PLURAL, '{Ma|Mes} {sœur|sœurs/soeurs} {est|sont} {allée|allées} au marché.', 68],
      [7, PLURAL, '{C’est|Ce sont} {la|les} {matière|matières} que {je} {préfère} !', 69],
      [8, PLURAL, '{Le|Les} {seigneur|seigneurs}, {entouré|entourés} par {sa|leur} cour, {regardera|regarderont} le tournoi.', 69],
      [9, PLURAL, '{Le|Les} {grain|grains} {est|sont} {picoré|picorés} par {la|les} {poule|poules}.', 69],
      [10, 'Remplace postier par postiers.', '{Le|Les} {postier|postiers}, comme tous les matins, {fait|font} {sa|leur} tournée. {Il|Ils} {est|sont} {précis}, {déterminé|déterminés} et {rapide|rapides}. {Il|Ils} {est|sont} {allé|allés} partout pour la distribution. {C’est|Ce sont} {un|des} {homme|hommes} {appliqué|appliqués}.', 70],
      [11, 'Remplace fraises par fraise.', '{Les|La} {fraises|fraise}, {présentes|présente} dans le jardin, {sont|est} {très} {bonnes|bonne}. {Elles|Elle} {sont|est} {juteuses|juteuse} et {sucrées|sucrée}. {Elles|Elle} {sont|est} {ramassées|ramassée} avec délicatesse. {Ce sont|C’est} {de|une} {vraies|vraie} {merveilles|merveille} !', 71],
      [12, 'Remplace cheval par jument.', '{Le|La} {cheval|jument} a été, il y a longtemps, {domestiqué|domestiquée} par l’homme. {Il|Elle} est {grand|grande}, {intelligent|intelligente}, {sensible} et {loyal|loyale}. {Il|Elle} est {le|la} {meilleur|meilleure} {ami|amie} de l’homme.', 72],
      [13, SINGULAR, '{Les|Le} {lapins|lapin} {sont|est} {entrés|entré} dans le terrier.', 73],
      [14, SINGULAR, '{Les|Le} {loups|loup}, à la tombée de la nuit, {hurleront|hurlera} à la lune.', 73],
      [15, SINGULAR, '{Ce sont|C’est} {mes|ma} {meilleures|meilleure} {amies|amie} !', 73],
      [16, SINGULAR, '{Mes|Mon} {frères|frère}, après le repas, {font|fait} la vaisselle.', 74],
      [17, SINGULAR, '{Tes|Ton} {amies|amie} {sont|est} {parties|partie} en voyage.', 74],
      [18, SINGULAR, '{Les|Le} {chiens|chien}, {impatients|impatient} de sortir, {regardaient|regardait} par la fenêtre et {jappaient|jappait}.', 74],
      [19, SINGULAR, '{Ce sont|C’est} {des|une} {jupes|jupe} {soldées|soldée}.', 75],
      [20, SINGULAR, '{Les|La} {lionnes|lionne}, {ces|cette} {femelles|femelle} {puissantes|puissante}, {chassent|chasse}.', 75],
      // Pas de touche œ au clavier : « l’oeil » est accepté.
      [21, SINGULAR, '{Les yeux|L’œil/L’oeil} {étincelants|étincelant}, {pétillants|pétillant} de bonheur, {sont|est} {beaux|beau} à regarder.', 75],
      [22, FEMININE, '{Ce|Cette} {garçon|fille}, tous les matins, {arrive} {débrayé|débrayée} et {décoiffé|décoiffée} à l’école.', 76],
      [23, FEMININE, '{Il|Elle} est {parti|partie} en voyage avec {ses} {amis|amies}.', 76],
      [24, FEMININE, '{Le|La} {coq|poule} est {mangé|mangée} par {le|la} {renard|renarde}.', 76],
      [25, FEMININE, '{Le|La} {maitre|maitresse/maîtresse} est {gentil|gentille}, {agréable} et toujours {ponctuel|ponctuelle}.', 77],
      [26, FEMININE, '{Il|Elle} est pourtant {arrivé|arrivée} en retard, complètement {décoiffé|décoiffée} et {il|elle} était {énervé|énervée} de cela.', 77],
      [27, FEMININE, '{Le|La} {loup|louve}, {blessé|blessée} et {affamé|affamée}, est {caché|cachée} dans la forêt.', 78],
      [28, FEMININE, '{Il|Elle} était {allé|allée} chasser et est {rentré|rentrée} bredouille.', 78],
      [29, FEMININE, '{Le|La} {lapin|lapine} est {chassé|chassée} par {le|la} {chat|chatte}.', 78],
      [30, PLURAL, '{Mon|Mes} {cousin|cousins}, {fatigué|fatigués} par le voyage, {est|sont} {allé|allés} se coucher.'],
      [31, PLURAL, '{La|Les} {voiture|voitures}, {garée|garées} devant l’école, {a|ont} été {réparée|réparées}.'],
      [32, SINGULAR, '{Les|La} {chanteuses|chanteuse}, {applaudies|applaudie} par le public, {sont|est} {revenues|revenue} sur scène.'],
      [33, SINGULAR, '{Ce sont|C’est} {des|un} {livres|livre} que j’{aime} beaucoup.'],
      [34, FEMININE, '{Le|La} {voisin|voisine}, {surpris|surprise} par l’orage, {est} {rentré|rentrée} en courant.'],
      [35, 'Remplace le serveur par la serveuse.', '{Le|La} {serveur|serveuse}, {pressé|pressée} et {souriant|souriante}, {est} {arrivé|arrivée} avec les desserts. {Il|Elle} {est} {très} {apprécié|appréciée} des clients.'],
    ]),
  },
  {
    belt: 'bleu-fonce',
    skill: 'J’accorde l’adjectif placé en tête de phrase : « Formées de grains, elles… ». Les mots en -ant après « en » ne changent pas. Je trouve le sujet, même quand il est après le verbe.',
    unit: 'texte',
    tips: [
      'Un adjectif ou un participe en tête de phrase s’accorde avec le sujet qui vient après : formée de gaz, la comète ; formées de gaz, les comètes.',
      'Le participe présent en -ant ne change jamais : en sautant, en broutant, une cicatrice lui barrant le visage.',
      'Le sujet peut être placé après le verbe : les souvenirs que raconte ma grand-mère. Qui raconte ? Ma grand-mère : raconte s’accorde avec elle.',
      'Quand le nom change, le petit mot devant change avec lui : un effort, une volonté ; cet homme, cette femme.',
    ],
    practiceSize: 1,
    testSize: 2,
    texts: exercises('bleu-fonce', [
      // La correction écrit « trainée » (orthographe rectifiée) : ce mot ne change pas, on garde celui de la fiche.
      [1, 'Remplace la comète par les comètes.', '{La|Les} {comète|comètes} {est|sont} {un|des} {astre|astres} {brillant|brillants}. {Elle|Elles} {est|sont} comme {une|des} {boule|boules} de neige et quand {elle|elles} {s’approche|s’approchent} du soleil, la glace {fond}. {Formée|Formées} de grains de poussière et de gaz, {elle|elles} {est|sont} {accompagnée|accompagnées} d’une traînée.', 79],
      // « Il en existe » ne change pas : un piège.
      [2, 'Remplace le nuage par les nuages.', '{Issu|Issus} de l’évaporation de l’eau, {il|ils} {fait|font} partie du cycle de l’eau. {Il} en existe de plusieurs sortes. {Le|Les} {nuage|nuages} {est|sont} {composé|composés} {essentiellement} d’eau et se {déplace|déplacent} en étant {poussé|poussés} par les vents.', 80],
      [3, 'Remplace Grandma par Grandpa.', 'Georges détestait Grandpa. C’était {une|un} {vieille femme|vieil homme} {grincheuse|grincheux} et {égoïste} qui avait des dents jaunes. {Elle|Il} était {râleuse|râleur} et passait {ses} journées {assise|assis} en se balançant dans un fauteuil. Grandpa était {méchante|méchant} et {très} {capricieuse|capricieux}. Serait-{elle|il} {une|un} {affreuse|affreux} {sorcière|sorcier} ?', 81],
      [4, 'Remplace l’effort par la volonté.', '{Il|Elle} est souvent {souhaité|souhaitée}, {demandé|demandée}, et même {exigé|exigée}. Chaque fois, {l’effort|la volonté} doit être {régulier|régulière}, {soutenu|soutenue}, {important|importante}, en un mot, {réel|réelle}. {Encouragé|Encouragée} ou pas, {il|elle} demande parfois {un effort|une volonté} {surhumain|surhumaine} !', 82],
      [5, 'Remplace Fabrice par Fabrice et Julien.', '[Fabrice|Fabrice et Julien] {est|sont} {apprenti|apprentis} {acrobate|acrobates}. {Il|Ils} {prépare|préparent} un spectacle. Sur scène, {vêtu|vêtus} d’un accoutrement {coloré}, {il|ils} {effectue|effectuent} des pirouettes en {sautant} sur un fil. Le public {applaudit} {ses|leurs} efforts.', 83],
      [6, 'Remplace le journal par les revues.', '{Acheté|Achetées} en kiosque, {envoyé|envoyées} aux abonnés, ou {distribué|distribuées} sur le quai des gares, {le journal|les revues} {a|ont} {toujours} du succès. {Peuplé|Peuplées} d’évènements sportifs, d’actualité ou bien de mode, {il|elles} {trouve|trouvent} acquéreur. {Il|Elles} {finit|finissent} souvent en étant {jeté|jetées} à la poubelle.', 84],
      // Les fiches n° 85-86 donnent le début du mot : l'enfant écrit la fin (le début est déjà tapé).
      [7, ENDINGS, 'Les deux enfants dont {parl…|parle} Kélian {habit…|habitent} ici. Les souvenirs que {racont…|raconte} ma grand-mère {étai…|étaient} toujours {passionnan…|passionnants}.', 85],
      [8, ENDINGS, 'Les valises que {recherch…|recherche} Fanny pour son voyage se {trouv…|trouvent} au grenier. Mia et Eglantine {admir…|admirent} les photos des pays que {visit…|visite} François.', 86],
      [9, 'Remplace les pandas par le panda.', '{Les|Le} {pandas|panda} {géants|géant} {vivent|vit} en Chine, {cachés|caché} dans la montagne. En hiver, {les pandas|le panda} {s’amusent|s’amuse} en se roulant dans la neige. Malgré {leurs|ses} 130 kilos, {ils|il} {sont|est} {très} {bons|bon} {grimpeurs|grimpeur}. {Ils|Il} {ne sont|n’est} pas comme {les ours|l’ours} qui {dorment|dort} tout l’hiver ; {ils|il} {n’hibernent|n’hiberne} pas.', 87],
      [10, 'Remplace les dodos par le dodo.', 'L’île Maurice a autrefois abrité {des animaux|un animal} aujourd’hui {disparus|disparu} : {les dodos|le dodo}. {Les|Le} {dodos|dodo} {étaient|était} {des|un} {oiseaux|oiseau} {coureurs|coureur} de la famille des pigeons. {Ils|Il} {ressemblaient|ressemblait} à une {grosse} dinde. {Ils|Il} {étaient|était} {dotés|doté} de deux pattes {jaunes} et d’un plumage sombre.', 88],
      [11, 'Remplace un type par une femme.', 'C’est alors que je remarquais {un type|une femme} à l’allure bizarre, {assis|assise} juste en face de moi, et qui me regardait. Un peu {caché|cachée} par un autre client, je voyais {qu’il|qu’elle} était {grand|grande} et {rond|ronde}, {bronzé|bronzée} et {très} {musclé|musclée}. La joue de {cet homme|cette femme} était {déformée} par une cicatrice lui {barrant} le visage.', 89],
      [12, 'Remplace les chèvres par la chèvre.', '{Les|La} {chèvres|chèvre} {sont|est} {de|un} {petits|petit} {animaux|animal} {très} {agiles|agile}. On {les|la} trouve dans toutes les régions du globe. {Herbivores|Herbivore}, {elles|elle} se {nourrissent|nourrit} en {broutant} toutes sortes de végétaux. {Ces|Cette} {bonnes|bonne} {grimpeuses|grimpeuse} {sont|est} {élevées|élevée} depuis longtemps pour {leur|son} lait.', 90],
      [13, 'Remplace le dauphin par les dauphins.', '{Joueur|Joueurs} et {curieux}, {le|les} {dauphin|dauphins} {suit|suivent} souvent les bateaux. {Il|Ils} {saute|sautent} hors de l’eau en {poussant} de petits cris. {Le|Les} {dauphin|dauphins} {est|sont} {un|des} {animal|animaux} {très} {intelligent|intelligents}.'],
      [14, 'Remplace la fusée par les fusées.', '{Lancée|Lancées} depuis la Guyane, {la|les} {fusée|fusées} {monte|montent} {rapidement} dans le ciel. En {quittant} la Terre, {elle|elles} {emporte|emportent} {un|des} {satellite|satellites} {neuf|neufs}.'],
      [15, ENDINGS, 'Les fleurs que {cueill…|cueille} ma sœur {sent…|sentent} bon. Dans la forêt {viv…|vivent} des loups {affam…|affamés}.'],
    ]),
  },
  {
    belt: 'violette',
    skill: 'Je transforme des textes plus longs. Je sais quand tout et même changent : tout le village, tous les pas, eux-mêmes.',
    unit: 'texte',
    tips: [
      'Tout change avec le nom qu’il accompagne : tout le village, toute la nuit, tous les jours, toutes les fleurs.',
      'Même change avec le pronom : lui-même, eux-mêmes ; elle-même, elles-mêmes. Dans « même si », il ne change jamais.',
      'Lui devient leur au pluriel, sans -s : il lui donne du foin, il leur donne du foin.',
      'Les mots qui vont avec un autre nom ne changent pas : l’ensemble des portées s’appelle une partition.',
    ],
    practiceSize: 1,
    testSize: 2,
    texts: exercises('violette', [
      // La fiche marque « passé » en vert, mais il ne change pas (avec avoir) : un piège.
      [1, 'Remplace la vache par les vaches.', 'C’est l’hiver, Paul le fermier donne de la nourriture {à la vache|aux vaches} : il {lui|leur} {remplit} la mangeoire de foin. Bien {nourrie|nourries}, {la vache|les vaches} {pourra|pourront} donner du lait de bonne qualité. {La|Les} {vache|vaches} {est|sont} {élevée|élevées} pour la production laitière. {Elle|Elles} {a|ont} {passé} l’été dans les pâturages.', 91],
      [2, 'Remplace caillou par cailloux.', 'En entrant dans la forêt, le petit Poucet a {déposé} {un caillou|des cailloux} sur le chemin. En s’enfonçant dans le bois, il a {continué} à semer {un caillou|des cailloux} tout au long de sa marche. {Perdus} au cœur du bois, le petit Poucet et ses frères n’eurent plus qu’à suivre le chemin du retour de {caillou|cailloux} en {caillou|cailloux}.', 92],
      [3, 'Remplace les noms de métier (horticulteur, jardinier, fleuriste) au singulier par le pluriel.', '{L’horticulteur|Les horticulteurs} {est|sont} {un|des} {spécialiste|spécialistes} qui {cultive|cultivent} des plantes d’ornement. {Tout} {son|leur} travail {consiste} à produire des arbres et des fleurs pour {le jardinier|les jardiniers} et {le fleuriste|les fleuristes}. {Le|Les} {jardinier|jardiniers} {cultive|cultivent} et {entretient|entretiennent} des plantes ornementales ou potagères. {Le|Les} {fleuriste|fleuristes} {achète|achètent} et {revend|revendent} des fleurs pour les particuliers.', 93],
      [4, 'Remplace les plantes par la plante.', 'La photosynthèse est le phénomène par lequel {les|la} {plantes|plante} {produisent|produit} des réserves de nourriture à partir de l’eau et du gaz carbonique de l’air. Ces réserves de nourriture {sont} {appelées} glucides. {Les|La} {plantes|plante} {fixent|fixe} les glucides grâce à la chlorophylle, en {employant} comme source d’énergie la lumière solaire.', 94],
      [5, 'Remplace la note par les notes.', 'La musique a son alphabet, {la note|les notes}. {La|Les} {note|notes} {donne|donnent} le son (do, ré, mi, fa, sol, la, si) mais aussi le temps (noire, blanche, croche, etc.). La ligne d’écriture s’appelle la portée. L’ensemble des portées d’une œuvre {s’appelle} une partition. {La|Les} {note|notes} {haute|hautes} {est|sont} {représentée|représentées} avec la clé de sol ; pour {la note|les notes} {basse|basses}, c’est la clé de fa.', 95],
      // Une lettre : « Cher oncle, » sur sa ligne.
      [6, 'Remplace journée par journées.', 'Cher oncle,\nJe te remercie pour {la|les} {belle|belles} {journée|journées} {passée|passées} ensemble. C’était une joie de me promener avec toi en vélo à travers champs ! Tu m’as fait découvrir la campagne, les bosquets, la faune et la flore de ton petit pays. {Même} si la pluie a interrompu quelques instants les balades, j’ai {tout} {aimé} de {cette|ces} {journée|journées} bien {agréable|agréables}.', 96],
      [7, 'Remplace le pompier par les pompiers.', '{Le|Les} {pompier|pompiers} {arrive|arrivent} {toujours} {très} vite. {Il|Ils} {arrose|arrosent} le feu {lui-même|eux-mêmes} et {sauve|sauvent} {tout} le village. {Tout} le monde {le|les} {remercie}.'],
      [8, 'Remplace la danseuse par les danseuses.', '{La|Les} {danseuse|danseuses} {est|sont} {toute|toutes} {contente|contentes}. {Elle|Elles} {a|ont} {répété} {tout} l’après-midi. {Elle|Elles} {connaît|connaissent} maintenant {tous} les pas par cœur.'],
      [9, 'Remplace le chat par les chats.', '{Le|Les} {chat|chats} {dort|dorment} {toute} la journée. Le soir, {il|ils} {fait|font} {sa|leur} toilette {lui-même|eux-mêmes}, puis {il|ils} {part|partent} chasser. {Il|Ils} {revient|reviennent} {toujours} à la {même} heure.'],
    ]),
  },
  {
    belt: 'marron',
    skill: 'Avec avoir, j’accorde le participe passé avec le mot placé avant : la voiture que j’ai achetée. Une couleur en deux mots ne change pas : bleu foncé.',
    goal: 'CM2',
    unit: 'texte',
    tips: [
      'Avec avoir, le participe passé s’accorde avec le complément placé avant le verbe : la voiture que j’ai achetée, les voitures que j’ai achetées.',
      'S’il n’y a rien avant, il ne s’accorde pas : j’ai acheté des voitures.',
      'Le, la et les devant le verbe remplacent un nom : je la frotte, je les frotte.',
      'Une couleur en deux mots ne change jamais : des voitures bleu foncé. Orange et marron non plus : des fleurs orange.',
      'Quand le sujet est après le verbe, le verbe s’accorde quand même : va-t-elle, vont-elles.',
    ],
    practiceSize: 1,
    testSize: 2,
    texts: exercises('marron', [
      [1, SINGULAR, '{Les|Le} {pandas|panda} {sont|est} {des|un} {mammifères|mammifère} {volumineux} et {massifs|massif}. {Ils|Il} se {nourrissent|nourrit} {essentiellement} de bambous. {Ils|Il} {les} {cueillent|cueille} en utilisant {leur|son} {faux} pouce et {les} {mastiquent|mastique} pendant plusieurs heures.', 97],
      [2, 'Remplace la voiture par les voitures.', '{La|Les} {petite|petites} {voiture|voitures} que j’ai {achetée|achetées} pour mon neveu {est|sont} {bleu foncé}. S’il {la|les} frotte sur le sol, {la|les} soulève puis {la|les} repose, {elle|elles} {peut|peuvent} avancer {toute|toutes} {seule|seules}. {Va-t-elle|Vont-elles} {lui} plaire ?', 98],
      [3, 'Remplace les médicaments par le médicament.', '{Les|Le} {médicaments|médicament} que le médecin {a} {prescrits|prescrit} {n’étaient|n’était} pas {disponibles|disponible} à la pharmacie du village. {Vont-ils|Va-t-il} être {présents|présent} à l’officine du centre commercial ?', 99],
      [4, 'Remplace la pièce de théâtre par les pièces de théâtre.', 'J’ai {beaucoup} {apprécié} {la|les} {pièce|pièces} de théâtre que j’ai {vue|vues} au festival d’Avignon. {Elle|Elles} {était|étaient} {interprétée|interprétées} par de jeunes acteurs {très} dynamiques. Je {la|les} recommande à mes amis.', 100],
      [5, 'Remplace le chemin par la route.', '{Le chemin|La route} que nous avons {emprunté|empruntée} à vélo est {très} {sinueux|sinueuse}. Les coureurs du Tour de France {le|la} {connaissent} bien. C’est {un chemin|une route} {sélectif|sélective} qu’ils ont {parcouru|parcourue} à de nombreuses reprises.', 101],
      [6, 'Remplace les cerises par les abricots.', 'Les {cerises|abricots} que j’ai {ramassées|ramassés} ce matin {sont} bien {mûres|mûrs} ! {Elles|Ils} {seront} {utilisées|utilisés} pour faire des confitures.', 102],
      [7, 'Remplace le ballon par les ballons.', '{Le|Les} {ballon|ballons} {rouge|rouges} que j’ai {gonflé|gonflés} hier {est|sont} déjà {dégonflé|dégonflés}. Je {l’avais|les avais} pourtant {rangé|rangés} dans le garage.'],
      [8, 'Remplace la robe par les robes.', '{La|Les} {robe|robes} que ma tante a {cousue|cousues} {est|sont} {vert clair}. Je {l’ai|les ai} {portée|portées} pour la fête et tout le monde {l’a|les a} {trouvée|trouvées} {jolie|jolies}.'],
      [9, SINGULAR, '{Les|La} {fleurs|fleur} que tu {as} {cueillies|cueillie} {sont|est} {orange}. {Elles|Elle} {sentent|sent} bon dans {ces|ce} {vases|vase} {marron}.'],
    ]),
  },
  {
    belt: 'noire',
    skill: 'J’accorde le participe passé quand le, la ou les est placé avant : je l’ai trouvée, je les ai trouvés.',
    unit: 'texte',
    tips: [
      'Avec avoir, le participe s’accorde avec le, la ou les placé avant : la clé, je l’ai prise ; les clés, je les ai prises.',
      'L’ veut dire le ou la : regarde le nom qu’il remplace. Le sac, je l’ai pris ; la clé, je l’ai prise.',
      'Fait suivi d’un verbe à l’infinitif ne change jamais : ça les a fait rigoler.',
      'Le verbe avoir ne change pas quand son sujet ne change pas : mon père l’a traité, mon père les a traités.',
    ],
    practiceSize: 1,
    testSize: 2,
    texts: exercises('noire', [
      [1, 'Remplace mon moniteur par mes moniteurs.', 'À cause de {mon moniteur|mes moniteurs} de ski, j’ai raté ma troisième étoile. {Il|Ils} {était|étaient} {nul|nuls} ! {Tellement} {mauvais} que mon père {l’a|les a} {traité|traités} de {bon|bons} à rien. {Mon moniteur|Mes moniteurs}, ça {l’a|les a} {fait} rigoler.', 103],
      [2, 'Remplace mon moniteur par ma monitrice.', 'À cause de {mon moniteur|ma monitrice} de ski, j’ai raté ma troisième étoile. {Il|Elle} était {nul|nulle} ! {Tellement} {mauvais|mauvaise} que mon père {l’a} {traité|traitée} de {bon|bonne} à rien. {Mon moniteur|Ma monitrice}, ça {l’a} {fait} rigoler.', 104],
      [3, 'Remplace mon moniteur par mes monitrices.', 'À cause de {mon moniteur|mes monitrices} de ski, j’ai raté ma troisième étoile. {Il|Elles} {était|étaient} {nul|nulles} ! {Tellement} {mauvais|mauvaises} que mon père {l’a|les a} {traité|traitées} de {bon|bonnes} à rien. {Mon moniteur|Mes monitrices}, ça {l’a|les a} {fait} rigoler.', 105],
      [4, 'Remplace le texte par l’histoire.', '{Le texte|L’histoire} que j’ai {lu|lue} en classe ce matin était {très} {compliqué|compliquée}. {Il|Elle} était {imprimé|imprimée} sur un vieux papier jauni. Je l’ai {trouvé|trouvée} trop {long|longue} et {ennuyeux|ennuyeuse}. {S’il|Si elle} était {illustré|illustrée}, {il|elle} serait plus {attractif|attractive} !', 106],
      [5, 'Remplace le texte par les textes.', '{Le texte|Les textes} que j’ai {lu|lus} en classe ce matin {était|étaient} {très} {compliqué|compliqués}. {Il|Ils} {était|étaient} {imprimé|imprimés} sur un vieux papier jauni. Je {l’ai|les ai} {trouvé|trouvés} trop {long|longs} et {ennuyeux}. {S’il|S’ils} {était|étaient} {illustré|illustrés}, {il|ils} {serait|seraient} plus {attractif|attractifs} !', 107],
      [6, 'Remplace le chemisier par la chemise.', '{Mon|Ma} {vieux|vieille} {chemisier|chemise} {noir|noire} est {devenu|devenue} trop {petit|petite} pour moi. {Il|Elle} est trop {serré|serrée}. Dommage, je l’ai {tellement} {aimé|aimée}, {ce chemisier|cette chemise} !', 108],
      [7, 'Remplace le chemisier par les chemisiers.', '{Mon|Mes} {vieux} {chemisier|chemisiers} {noir|noirs} {est|sont} {devenu|devenus} trop {petit|petits} pour moi. {Il|Ils} {est|sont} trop {serré|serrés}. Dommage, je {l’ai|les ai} {tellement} {aimé|aimés}, {ce chemisier|ces chemisiers} !', 109],
      [8, 'Remplace le courrier par la lettre.', 'À cause de la grève, {le courrier|la lettre} que j’ai {écrit|écrite} et {posté|postée} hier {n’est} {parti|partie} qu’aujourd’hui. Mon oncle était {déçu} de ne pas l’avoir {reçu|reçue}. {Arrivera-t-il|Arrivera-t-elle} demain ?', 110],
      [9, 'Remplace le courrier par les lettres.', 'À cause de la grève, {le courrier|les lettres} que j’ai {écrit|écrites} et {posté|postées} hier {n’est|ne sont} {parti|parties} qu’aujourd’hui. Mon oncle était {déçu} de ne pas {l’avoir|les avoir} {reçu|reçues}. {Arrivera-t-il|Arriveront-elles} demain ?', 111],
      [10, 'Remplace jeu électronique par console.', '{Mon jeu électronique|Ma console} est {tombé|tombée} en panne. Je l’ai {débranché|débranchée} et l’ai {remis|remise} dans sa boite. Ensuite je l’ai {rapporté|rapportée} au magasin : ils m’ont {dit} {qu’il|qu’elle} était encore {garanti|garantie}. Ouf !', 112],
      [11, 'Remplace sac par clé.', 'J’ai {perdu} {mon sac|ma clé}. Je l’ai {pris|prise} hier pour faire des courses. Je l’ai {posé|posée} dans l’entrée en rentrant. Pourtant, {il|elle} est {noir|noire} et {doré|dorée} : je devrais {le|la} voir facilement. Est-ce toi qui me l’as {emprunté|empruntée} ?', 113],
      [12, 'Remplace clés par sac.', 'J’ai {perdu} {mes clés|mon sac}. Je {les ai|l’ai} {prises|pris} hier pour faire des courses. Je {les ai|l’ai} {posées|posé} dans l’entrée en rentrant. Pourtant, {elles|il} {sont|est} {noires|noir} et {dorées|doré} : je devrais {les|le} voir facilement. Est-ce toi qui me {les as|l’as} {empruntées|emprunté} ?', 114],
      [13, 'Remplace le gâteau par la tarte.', '{Le gâteau|La tarte} que maman a {préparé|préparée} était {délicieux|délicieuse}. Nous {l’avons} {mangé|mangée} en entier. {Il|Elle} nous a {plu} à tous !'],
      [14, 'Remplace mon cousin par mes cousines.', '{Mon cousin|Mes cousines} {est|sont} {venu|venues} hier. Je {l’ai|les ai} {emmené|emmenées} au cinéma et je {l’ai|les ai} {trouvé|trouvées} {ravi|ravies}. {Il|Elles} {a|ont} {adoré} le film !'],
      [15, 'Remplace les pommes par le melon.', '{Les pommes|Le melon} que j’ai {achetées|acheté} au marché {sont|est} {mûres|mûr}. Je {les ai|l’ai} {lavées|lavé} puis je {les ai|l’ai} {coupées|coupé}.'],
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
