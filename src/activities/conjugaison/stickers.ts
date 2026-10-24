import { countStickers, toSticker, unlockRules, type Sticker, type StickerRule } from '../../core/stickers';
import { starsOf, type ConjugaisonData } from './data';
import { conjugationMastery } from './mastery';
import { MIX_SIZE } from './mix-session';
import { REVIEW_SIZE } from './review-session';
import { CONJUGATIONS, conjugationsOf, TENSES, type Conjugation } from './verbs';

/** Ce qui vient de se passer : une série finie, dans un mode. */
export interface SeriesEvent {
  mode: 'learn' | 'review' | 'mix';
  /** Plus longue suite de bonnes réponses de la série. */
  bestStreak: number;
  correct: number;
  total: number;
}

type Rule = StickerRule<ConjugaisonData, SeriesEvent>;

const TENSE_EMOJIS = { present: '🌱', imparfait: '🕰️', futur: '🔭', 'passe-compose': '📜' } as const;
/** « du présent », mais « de l’imparfait ». */
const OF_TENSE = { present: 'du présent', imparfait: 'de l’imparfait', futur: 'du futur', 'passe-compose': 'du passé composé' } as const;
const IRREGULARS = ['faire', 'aller', 'dire', 'venir', 'pouvoir', 'voir', 'vouloir', 'prendre'];

/** En vert dans les progrès : les 6 formes en boîte 4 ou plus. */
const isGreen = (data: ConjugaisonData, c: Conjugation) =>
  ['known', 'mastered'].includes(conjugationMastery(data.leitner, c));

// L'ordre est celui de l'album. Ne jamais changer un `id` : c'est lui qui est enregistré.
const RULES: Rule[] = [
  {
    id: 'first-star',
    emoji: '🌟',
    name: 'Première étoile',
    hint: 'Gagne ta première étoile.',
    won: (data) => CONJUGATIONS.some((c) => starsOf(data, c) > 0),
  },
  {
    id: 'three-stars',
    emoji: '🏅',
    name: 'Trois étoiles',
    hint: 'Gagne 3 étoiles à un verbe.',
    won: (data) => CONJUGATIONS.some((c) => starsOf(data, c) === 3),
  },
  ...TENSES.map(
    (tense): Rule => ({
      id: `tour-${tense.id}`,
      emoji: TENSE_EMOJIS[tense.id],
      name: `Tour ${OF_TENSE[tense.id]}`,
      hint: `Une étoile aux 20 verbes ${OF_TENSE[tense.id]}.`,
      won: (data) => conjugationsOf(tense.id).every((c) => starsOf(data, c) > 0),
    }),
  ),
  {
    id: 'irregulars',
    emoji: '🦄',
    name: 'Les irréguliers',
    hint: 'Une étoile à faire, aller, dire, venir, pouvoir, voir, vouloir et prendre, à un même temps.',
    won: (data) =>
      TENSES.some((t) => conjugationsOf(t.id).filter((c) => IRREGULARS.includes(c.verb.id)).every((c) => starsOf(data, c) > 0)),
  },
  {
    id: 'crown',
    emoji: '👑',
    name: 'Couronne',
    hint: '3 étoiles aux 20 verbes d’un temps.',
    won: (data) => TENSES.some((t) => conjugationsOf(t.id).every((c) => starsOf(data, c) === 3)),
  },
  {
    id: 'etre-avoir',
    emoji: '🧱',
    name: 'Être et avoir',
    hint: 'Être et avoir en vert aux 4 temps dans tes progrès.',
    won: (data) => CONJUGATIONS.filter((c) => ['etre', 'avoir'].includes(c.verb.id)).every((c) => isGreen(data, c)),
  },
  {
    id: 'streak-10',
    emoji: '🔥',
    name: 'En feu',
    hint: '10 bonnes réponses d’affilée.',
    won: (_, event) => event.bestStreak >= 10,
  },
  {
    id: 'streak-20',
    emoji: '🚀',
    name: 'Fusée',
    hint: '20 bonnes réponses d’affilée.',
    won: (_, event) => event.bestStreak >= 20,
  },
  {
    id: 'review-perfect',
    emoji: '🐘',
    name: 'Mémoire d’éléphant',
    hint: `Une révision de ${REVIEW_SIZE} questions sans erreur.`,
    won: (_, event) => event.mode === 'review' && event.total >= REVIEW_SIZE && event.correct === event.total,
  },
  {
    id: 'mix-perfect',
    emoji: '🎨',
    name: 'Mélange parfait',
    hint: `Un mélange de ${MIX_SIZE} questions sans erreur.`,
    won: (_, event) => event.mode === 'mix' && event.total >= MIX_SIZE && event.correct === event.total,
  },
  {
    id: 'days-5',
    emoji: '📅',
    name: '5 jours',
    hint: 'Joue 5 jours différents.',
    won: (data) => (data.daysPlayed ?? 0) >= 5,
  },
  {
    id: 'days-15',
    emoji: '🗓️',
    name: '15 jours',
    hint: 'Joue 15 jours différents.',
    won: (data) => (data.daysPlayed ?? 0) >= 15,
  },
  {
    id: 'all-green',
    emoji: '🏆',
    name: 'Tout en vert',
    hint: 'Les 80 verbes, à tous les temps, en vert dans tes progrès.',
    won: (data) => CONJUGATIONS.every((c) => isGreen(data, c)),
  },
];

export const STICKERS: readonly Sticker[] = RULES.map(toSticker);

export function stickerCount(data: ConjugaisonData): number {
  return countStickers(data, STICKERS);
}

/**
 * À la fin d'une série (étoiles et boîtes déjà enregistrées) :
 * colle les autocollants gagnés et renvoie les nouveaux, à fêter.
 */
export function unlockStickers(data: ConjugaisonData, event: SeriesEvent, now = Date.now()): Sticker[] {
  return unlockRules(RULES, data, event, now);
}
