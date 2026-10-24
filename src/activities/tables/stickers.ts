import { countStickers, toSticker, unlockRules, type Sticker, type StickerRule } from '../../core/stickers';
import { starsOf, type TablesData } from './data';
import { ALL_PAIRS, pairKey, TABLES } from './questions';
import { KNOWN_BOX } from './review-session';

export type { Sticker } from '../../core/stickers';

/** Ce qui vient de se passer : une série finie, dans un mode. */
export interface SeriesEvent {
  mode: 'learn' | 'review' | 'defi' | 'mix' | 'hidden';
  /** Plus longue suite de bonnes réponses de la série. */
  bestStreak: number;
  correct: number;
  total: number;
  /** Défi : score, pénalités comprises (ms). */
  defiScoreMs?: number;
}

const ANIMALS = ['🐣', '🐰', '🐱', '🐶', '🦊', '🐼', '🐨', '🐯', '🦁', '🐲'];

/** Une multiplication est connue à partir de la boîte 4 (comme « N / 55 connues »). */
const isKnown = (data: TablesData, key: string) => (data.leitner[key]?.box ?? 0) >= KNOWN_BOX;

type Rule = StickerRule<TablesData, SeriesEvent>;

// L'ordre est celui de l'album. Ne jamais changer un `id` : c'est lui qui est enregistré.
const RULES: Rule[] = [
  {
    id: 'first-star',
    emoji: '🌟',
    name: 'Première étoile',
    hint: 'Gagne ta première étoile.',
    won: (data) => TABLES.some((t) => starsOf(data, t) > 0),
  },
  {
    id: 'three-stars',
    emoji: '🏅',
    name: 'Trois étoiles',
    hint: 'Gagne 3 étoiles à une table.',
    won: (data) => TABLES.some((t) => starsOf(data, t) === 3),
  },
  {
    id: 'all-tables',
    emoji: '🌈',
    name: 'Tour des tables',
    hint: 'Au moins une étoile à chaque table.',
    won: (data) => TABLES.every((t) => starsOf(data, t) > 0),
  },
  {
    id: 'crown',
    emoji: '👑',
    name: 'Couronne',
    hint: '3 étoiles à toutes les tables.',
    won: (data) => TABLES.every((t) => starsOf(data, t) === 3),
  },
  ...TABLES.map(
    (table, i): Rule => ({
      id: `table-${table}`,
      emoji: ANIMALS[i]!,
      name: `Table de ${table}`,
      hint: `Toute la table de ${table} en vert dans tes progrès.`,
      won: (data) => TABLES.every((k) => isKnown(data, pairKey(table, k))),
    }),
  ),
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
    id: 'defi-first',
    emoji: '⏱️',
    name: 'Premier défi',
    hint: 'Termine un défi.',
    won: (_, event) => event.mode === 'defi',
  },
  {
    id: 'defi-perfect',
    emoji: '🎯',
    name: 'Dans le mille',
    hint: 'Un défi sans aucune erreur.',
    won: (_, event) => event.mode === 'defi' && event.correct === event.total,
  },
  {
    id: 'defi-fast',
    emoji: '⚡',
    name: 'Éclair',
    hint: 'Un défi en moins d’une minute.',
    won: (_, event) => event.mode === 'defi' && (event.defiScoreMs ?? Infinity) < 60_000,
  },
  {
    id: 'mix-perfect',
    emoji: '🎨',
    name: 'Mélange parfait',
    hint: 'Un mélange de 20 questions sans erreur.',
    won: (_, event) => event.mode === 'mix' && event.total >= 20 && event.correct === event.total,
  },
  {
    id: 'hidden-perfect',
    emoji: '🔍',
    name: 'Détective',
    hint: 'Un nombre caché sans aucune erreur.',
    won: (_, event) => event.mode === 'hidden' && event.correct === event.total,
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
    name: 'Grille verte',
    hint: 'Les 55 multiplications connues.',
    won: (data) => ALL_PAIRS.every((key) => isKnown(data, key)),
  },
];

export const STICKERS: readonly Sticker[] = RULES.map(toSticker);

export function stickerCount(data: TablesData): number {
  return countStickers(data, STICKERS);
}

/**
 * À la fin d'une série (étoiles, boîtes et record déjà enregistrés) :
 * colle les autocollants gagnés et renvoie les nouveaux, à fêter.
 */
export function unlockStickers(data: TablesData, event: SeriesEvent, now = Date.now()): Sticker[] {
  return unlockRules(RULES, data, event, now);
}
