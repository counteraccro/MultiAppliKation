// Entraînement d'une ceinture : quelques phrases à trous, corrigées trou par trou.
// Comme les autres séries, seul le premier passage compte ; une phrase avec une erreur
// revient un peu plus tard, jusqu'à être trouvée en entier.

import { shuffle } from '../../core/quiz';
import { beltSentences, type Group, type HomophoneBelt, type Sentence } from './homophones';
import { blanksOf } from './sentence';

/** Phrases par entraînement. */
export const PRACTICE_SIZE = 6;
/** Une phrase ratée revient après ce nombre d'autres phrases. */
const RETRY_GAP = 3;

export interface PracticeItem {
  sentence: Sentence;
  group: Group;
}

export interface PracticeResult {
  /** Trous justes au premier passage. */
  correct: number;
  total: number;
  /** Phrases avec au moins une erreur au premier passage. */
  toPractice: Sentence[];
}

export function pickSentences(belt: HomophoneBelt, count = PRACTICE_SIZE, random = Math.random): PracticeItem[] {
  return shuffle(beltSentences(belt), random).slice(0, count);
}

export class PracticeSession {
  readonly total: number;
  private readonly queue: PracticeItem[];
  /** Premier passage de chaque phrase : juste ou faux, trou par trou. */
  private readonly firstPass = new Map<PracticeItem, boolean[]>();
  private readonly firstPassDone = new Set<PracticeItem>();
  /** Trou en cours dans la phrase en cours, et ce qui a été répondu à ce passage. */
  private blankIndex = 0;
  private marks: boolean[] = [];

  constructor(items: readonly PracticeItem[]) {
    this.queue = [...items];
    this.total = this.queue.length;
  }

  /** Phrases dont le premier passage est fini. */
  get attempted(): number {
    return this.firstPassDone.size;
  }

  current(): PracticeItem | undefined {
    return this.queue[0];
  }

  /** Trou à remplir dans la phrase en cours (0 pour le premier, et après une phrase finie). */
  get blank(): number {
    return this.blankIndex;
  }

  /** La phrase en cours revient après une erreur. */
  isRetry(): boolean {
    const item = this.current();
    return item !== undefined && this.firstPassDone.has(item);
  }

  /**
   * Le mot choisi pour le trou en cours ; renvoie true s'il est juste.
   * Le trou suivant devient le trou en cours ; après le dernier, la phrase suivante.
   */
  choose(word: string): boolean {
    const item = this.queue[0];
    if (!item) throw new Error('L’entraînement est fini');
    const blanks = blanksOf(item.sentence.text);
    const correct = word === blanks[this.blankIndex];
    this.marks.push(correct);
    if (!this.firstPassDone.has(item)) this.firstPass.set(item, [...this.marks]);
    this.blankIndex++;
    if (this.blankIndex === blanks.length) this.finishSentence(item);
    return correct;
  }

  result(): PracticeResult {
    const passes = [...this.firstPass.entries()];
    return {
      correct: passes.reduce((sum, [, marks]) => sum + marks.filter(Boolean).length, 0),
      total: passes.reduce((sum, [, marks]) => sum + marks.length, 0),
      toPractice: passes.filter(([, marks]) => marks.includes(false)).map(([item]) => item.sentence),
    };
  }

  private finishSentence(item: PracticeItem) {
    const missed = this.marks.includes(false);
    this.firstPassDone.add(item);
    this.queue.shift();
    if (missed) this.queue.splice(RETRY_GAP, 0, item);
    this.blankIndex = 0;
    this.marks = [];
  }
}
