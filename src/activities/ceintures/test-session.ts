// Entraînement en conditions réelles (le test de la ceinture) : 10 phrases, sans correction pendant le test (comme une évaluation).
// Réussi avec au moins 90 % des trous justes ; tout est corrigé à la fin.

import { shuffle } from '../../core/quiz';
import { beltSentences, type HomophoneBelt, type Sentence } from './homophones';
import type { PracticeItem } from './practice-session';
import { blanksOf } from './sentence';

/** Phrases par test. */
export const TEST_SIZE = 10;
/** Pourcentage des trous justes pour obtenir la ceinture. */
export const PASS_PERCENT = 90;

export interface TestMistake {
  sentence: Sentence;
  /** Le mot choisi pour chaque trou, dans l'ordre. */
  chosen: string[];
}

export interface TestResult {
  correct: number;
  total: number;
  passed: boolean;
  /** Phrases avec au moins un trou faux, pour la correction. */
  mistakes: TestMistake[];
}

export function isPassing(correct: number, total: number): boolean {
  // En entiers : 0,9 × 30 vaut 27,000000000000004 en virgule flottante.
  return total > 0 && correct * 100 >= total * PASS_PERCENT;
}

/**
 * Les phrases du test : de préférence pas vues au dernier entraînement (`seen`),
 * et chaque famille de mots de la ceinture représentée (vert clair : ou / où et mais / mes / met).
 */
export function pickTestSentences(
  belt: HomophoneBelt,
  seen: readonly string[] = [],
  count = TEST_SIZE,
  random = Math.random,
): PracticeItem[] {
  const unseenFirst = (items: PracticeItem[]) => {
    const fresh = shuffle(items.filter((i) => !seen.includes(i.sentence.id)), random);
    const old = shuffle(items.filter((i) => seen.includes(i.sentence.id)), random);
    return [...fresh, ...old];
  };
  const all = beltSentences(belt);
  const piles = belt.groups.map((group) => unseenFirst(all.filter((i) => i.group === group)));
  const picked: PracticeItem[] = [];
  // Chacun son tour, une phrase par famille, jusqu'à en avoir assez.
  while (picked.length < count && piles.some((pile) => pile.length > 0)) {
    for (const pile of piles) {
      const next = pile.shift();
      if (next && picked.length < count) picked.push(next);
    }
  }
  return shuffle(picked, random);
}

export class TestSession {
  readonly total: number;
  private readonly items: readonly PracticeItem[];
  private index = 0;
  private blankIndex = 0;
  private readonly answers: string[][] = [];

  constructor(items: readonly PracticeItem[]) {
    this.items = [...items];
    this.total = this.items.length;
  }

  /** Phrases finies. */
  get attempted(): number {
    return this.index;
  }

  current(): PracticeItem | undefined {
    return this.items[this.index];
  }

  get blank(): number {
    return this.blankIndex;
  }

  /** Pas de deuxième chance pendant le test. */
  isRetry(): boolean {
    return false;
  }

  /** Le mot choisi pour le trou en cours ; renvoie true s'il est juste (l'écran ne le montre pas). */
  choose(word: string): boolean {
    const item = this.items[this.index];
    if (!item) throw new Error('Le test est fini');
    const blanks = blanksOf(item.sentence.text);
    const answers = (this.answers[this.index] ??= []);
    answers.push(word);
    this.blankIndex++;
    if (this.blankIndex === blanks.length) {
      this.index++;
      this.blankIndex = 0;
    }
    return word === blanks[answers.length - 1];
  }

  /** Les mots déjà choisis dans la phrase en cours. */
  chosen(): readonly string[] {
    return this.answers[this.index]?.slice(0, this.blankIndex) ?? [];
  }

  /**
   * Revient au trou d'avant pour changer de mot, au besoin dans la phrase d'avant ;
   * renvoie le mot retiré (undefined au début du test).
   */
  undo(): string | undefined {
    if (this.blankIndex === 0) {
      if (this.index === 0) return undefined;
      this.index--;
      this.blankIndex = this.answers[this.index]!.length;
    }
    this.blankIndex--;
    return this.answers[this.index]!.pop();
  }

  result(): TestResult {
    let correct = 0;
    let total = 0;
    const mistakes: TestMistake[] = [];
    this.items.forEach((item, i) => {
      const chosen = this.answers[i] ?? [];
      const blanks = blanksOf(item.sentence.text);
      const right = blanks.filter((answer, b) => chosen[b] === answer).length;
      correct += right;
      total += blanks.length;
      if (right < blanks.length) mistakes.push({ sentence: item.sentence, chosen });
    });
    return { correct, total, passed: isPassing(correct, total), mistakes };
  }
}
