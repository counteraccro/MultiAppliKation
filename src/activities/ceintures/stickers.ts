import { toSticker, unlockRules, type Sticker, type StickerRule } from '../../core/stickers';
import type { BeltId } from './belts';
import { highestPassed, progressOf, type CeinturesData } from './data';
import { SUBJECTS } from './subjects';

/** Ce qui vient de se passer : un entraînement ou un test fini (données déjà à jour). */
export interface SeriesEvent {
  mode: 'practice' | 'test';
  /** Plus longue suite de trous justes du premier coup (0 en test : rien n'y est corrigé). */
  bestStreak: number;
  correct: number;
  total: number;
}

type Rule = StickerRule<CeinturesData, SeriesEvent>;

/** Nombre de ceintures obtenues, toutes matières confondues. */
function beltsPassed(data: CeinturesData): number {
  return SUBJECTS.reduce((sum, subject) => sum + highestPassed(subject, progressOf(data, subject)) + 1, 0);
}

const homophones = SUBJECTS.find((s) => s.id === 'homophones')!;
const passedHomophone = (data: CeinturesData, belt: BeltId) => progressOf(data, homophones).passed[belt] !== undefined;

// L'ordre est celui de l'album. Ne jamais changer un `id` : c'est lui qui est enregistré.
const RULES: Rule[] = [
  {
    id: 'first-belt',
    emoji: '🥋',
    name: 'Première ceinture',
    hint: 'Obtiens ta première ceinture.',
    won: (data) => beltsPassed(data) >= 1,
  },
  {
    id: 'three-belts',
    emoji: '🎽',
    name: 'Trois ceintures',
    hint: 'Obtiens 3 ceintures.',
    won: (data) => beltsPassed(data) >= 3,
  },
  {
    id: 'goal-cm1',
    emoji: '🎯',
    name: 'Objectif CM1',
    hint: 'La ceinture bleu clair des homophones : l’objectif de fin de CM1.',
    won: (data) => passedHomophone(data, 'bleu-clair'),
  },
  {
    id: 'black-belt',
    emoji: '🐉',
    name: 'Ceinture noire',
    hint: 'Toutes les ceintures des homophones, jusqu’à la noire.',
    won: (data) => passedHomophone(data, 'noire'),
  },
  {
    id: 'perfect-test',
    emoji: '💯',
    name: 'Sans faute',
    hint: 'Un test de ceinture sans aucune erreur.',
    won: (_, event) => event.mode === 'test' && event.total > 0 && event.correct === event.total,
  },
  {
    id: 'perfect-practice',
    emoji: '⭐',
    name: 'Entraînement parfait',
    hint: 'Un entraînement tout juste du premier coup.',
    won: (_, event) => event.mode === 'practice' && event.total > 0 && event.correct === event.total,
  },
  {
    id: 'streak-10',
    emoji: '🔥',
    name: 'En feu',
    hint: '10 bonnes réponses d’affilée.',
    won: (_, event) => event.bestStreak >= 10,
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
];

export const STICKERS: readonly Sticker[] = RULES.map(toSticker);

/** À la fin d'un entraînement ou d'un test : colle les autocollants gagnés et renvoie les nouveaux. */
export function unlockStickers(data: CeinturesData, event: SeriesEvent, now = Date.now()): Sticker[] {
  return unlockRules(RULES, data, event, now);
}
