import { toSticker, unlockRules, type Sticker, type StickerRule } from '../../core/stickers';
import { beltOf } from './belts';
import { beltsSucceeded, progressOf, type CeinturesData } from './data';
import { SUBJECTS, type Subject, type SubjectId } from './subjects';

/**
 * Ce qui vient de se passer dans une matière (données déjà à jour) : un entraînement ou un test fini,
 * ou une ceinture notée obtenue en classe par un adulte (`class`, sans score).
 */
export interface SeriesEvent {
  subject: SubjectId;
  mode: 'practice' | 'test' | 'class';
  /** Plus longue suite de trous justes du premier coup (0 en test : rien n'y est corrigé). */
  bestStreak: number;
  correct: number;
  total: number;
}

type Rule = StickerRule<CeinturesData, SeriesEvent>;

/**
 * Les autocollants d'une matière, rangés ensemble dans l'album. Identifiants préfixés par
 * la matière (« homophones.first-belt ») : ne jamais les changer, ils sont enregistrés.
 */
function subjectRules(subject: Subject): Rule[] {
  // Réussies en conditions réelles ou notées en classe : sans attendre la validation de l'adulte.
  const passed = (data: CeinturesData) => beltsSucceeded(subject, progressOf(data, subject));
  const cm1 = subject.belts.findIndex((b) => b.goal === 'CM1');
  const last = subject.belts.length - 1;
  const lastLabel = beltOf(subject.belts[last]!.belt).label;
  const inSubject = (event: SeriesEvent) => event.subject === subject.id;
  const rules: Rule[] = [
    {
      id: `${subject.id}.first-belt`,
      emoji: '🥋',
      name: 'Première ceinture',
      hint: 'Réussis ta première ceinture en conditions réelles.',
      won: (data) => passed(data) >= 1,
    },
    {
      id: `${subject.id}.three-belts`,
      emoji: '🎽',
      name: 'Trois ceintures',
      hint: 'Réussis 3 ceintures en conditions réelles.',
      won: (data) => passed(data) >= 3,
    },
  ];
  if (cm1 >= 0) {
    rules.push({
      id: `${subject.id}.goal-cm1`,
      emoji: '🎯',
      name: 'Objectif CM1',
      hint: `Réussis la ceinture ${beltOf(subject.belts[cm1]!.belt).label} : l’objectif de fin de CM1.`,
      won: (data) => passed(data) > cm1,
    });
  }
  rules.push(
    {
      id: `${subject.id}.last-belt`,
      emoji: '🐉',
      name: `Ceinture ${lastLabel}`,
      hint: `Réussis toutes les ceintures, jusqu’à la ${lastLabel}.`,
      won: (data) => passed(data) > last,
    },
    {
      id: `${subject.id}.perfect-test`,
      emoji: '💯',
      name: 'Sans faute',
      hint: 'Un entraînement en conditions réelles sans aucune erreur.',
      won: (_, event) => inSubject(event) && event.mode === 'test' && event.total > 0 && event.correct === event.total,
    },
    {
      id: `${subject.id}.perfect-practice`,
      emoji: '⭐',
      name: 'Entraînement parfait',
      hint: 'Un entraînement tout juste du premier coup.',
      won: (_, event) => inSubject(event) && event.mode === 'practice' && event.total > 0 && event.correct === event.total,
    },
    {
      id: `${subject.id}.streak-10`,
      emoji: '🔥',
      name: 'En feu',
      hint: '10 bonnes réponses d’affilée.',
      won: (_, event) => inSubject(event) && event.bestStreak >= 10,
    },
  );
  return rules;
}

// L'ordre est celui de l'album : matière par matière.
const RULES_BY_SUBJECT = SUBJECTS.map((subject) => ({ subject, rules: subjectRules(subject) }));
const RULES: Rule[] = RULES_BY_SUBJECT.flatMap((s) => s.rules);

export const STICKERS: readonly Sticker[] = RULES.map(toSticker);

/** L'album rangé par matière. */
export const STICKER_SECTIONS = RULES_BY_SUBJECT.map(({ subject, rules }) => ({
  title: subject.label,
  stickers: rules.map(toSticker),
}));

/** À la fin d'un entraînement ou d'un test : colle les autocollants gagnés et renvoie les nouveaux. */
export function unlockStickers(data: CeinturesData, event: SeriesEvent, now = Date.now()): Sticker[] {
  return unlockRules(RULES, data, event, now);
}
