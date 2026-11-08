import { describe, expect, it } from 'vitest';
import { isCorrect } from '../../core/quiz';
import { BELTS } from './belts';
import {
  decodeMarks,
  encodeMarks,
  GRAMMAIRE,
  GRAMMAR_PRACTICE_SIZE,
  GRAMMAR_TEST_SIZE,
  grammarQuestion,
  isCompound,
  mainTag,
  paint,
  parseGrammar,
  pickGrammar,
  plainText,
  TAGS,
  wordsOf,
  type GrammarTag,
  type WordMarks,
} from './grammaire';

const all = GRAMMAIRE.flatMap((belt) => belt.tasks.flatMap((task) => task.sentences.map((_, i) => grammarQuestion(belt.belt, task, i))));
const task = (belt: string, id: string) => GRAMMAIRE.find((b) => b.belt === belt)!.tasks.find((t) => t.id === id)!;

describe('les ceintures de grammaire', () => {
  it('suivent le classeur : 11 ceintures, de la blanche à la noire, dans l’ordre de l’échelle', () => {
    expect(GRAMMAIRE.map((b) => b.belt)).toEqual(['blanche', 'jaune', 'orange', 'rose', 'vert-clair', 'vert-fonce', 'bleu-clair', 'bleu-fonce', 'violette', 'marron', 'noire']);
    const order = GRAMMAIRE.map((b) => BELTS.findIndex((x) => x.id === b.belt));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(GRAMMAIRE.filter((b) => b.goal).map((b) => [b.belt, b.goal])).toEqual([['jaune', 'CE2'], ['bleu-clair', 'CM1'], ['marron', 'CM2']]);
  });

  it('ont assez de phrases pour un entraînement en conditions réelles', () => {
    for (const belt of GRAMMAIRE) expect(pickGrammar(belt, GRAMMAR_TEST_SIZE), belt.belt).toHaveLength(GRAMMAR_TEST_SIZE);
  });
});

describe('les phrases de grammaire', () => {
  it('se lisent sans crochet oublié', () => {
    for (const question of all) expect(question.prompt, question.id).not.toMatch(/[[\]]|[A-Z]{1,4}:/);
  });

  it('ne demandent que les crayons ou les natures de leur exercice', () => {
    for (const question of all) {
      const { pencils, mode } = question.exercise;
      for (const marks of question.expected) for (const tag of marks) expect(pencils, `${question.id} ${tag}`).toContain(tag);
      expect(question.expected.some((m) => m.length > 0), question.id).toBe(true);
      // Les fonctions : le verbe toujours, et le sujet dès qu'il est demandé.
      if (mode === 'color' && pencils.includes('V')) expect(question.expected.flat(), question.id).toContain('V');
      if (mode === 'color' && pencils.includes('S')) expect(question.expected.flat(), question.id).toContain('S');
    }
  });

  it('mettent chaque complément du nom dans un groupe, et une seule nature par mot', () => {
    for (const question of all) {
      for (const marks of question.expected) {
        if (marks.includes('CdN')) expect(mainTag(marks), question.id).toBeDefined();
        if (question.exercise.mode === 'nature') expect(marks.length, question.id).toBeLessThanOrEqual(1);
        expect(marks.filter((t) => !TAGS[t].inside).length, question.id).toBeLessThanOrEqual(1);
      }
    }
  });

  it('ont des identifiants uniques', () => {
    expect(new Set(all.map((q) => q.id)).size).toBe(all.length);
  });

  it('ont des exemples de leçon qui existent', () => {
    for (const belt of GRAMMAIRE) for (const t of belt.tasks) for (const i of t.examples) expect(t.sentences[i], `${belt.belt} ${i}`).toBeDefined();
  });

  it('coupent les élisions et gardent les mots composés', () => {
    const words = wordsOf(parseGrammar('J’[V:aime] le feu d’artifice à cache-cache.')).map((w) => w.word);
    expect(words).toEqual(['J’', 'aime', 'le', 'feu', 'd’', 'artifice', 'à', 'cache-cache']);
  });

  it('gardent le verbe en deux mots et le sujet en entier', () => {
    const pieces = parseGrammar('[S:Le chat silencieux] [V:a pris] la souris.');
    expect(plainText(pieces)).toBe('Le chat silencieux a pris la souris.');
    expect(wordsOf(pieces).map((w) => w.tags)).toEqual([['S'], ['S'], ['S'], ['V'], ['V'], [], []]);
  });

  it('lisent le complément du nom dans son groupe', () => {
    const pieces = parseGrammar('[S:Les parents [CdN:de Béatrice]] [V:lisent].');
    expect(plainText(pieces)).toBe('Les parents de Béatrice lisent.');
    expect(wordsOf(pieces).map((w) => w.tags)).toEqual([['S'], ['S'], ['S', 'CdN'], ['S', 'CdN'], ['V']]);
  });

  it('donnent une nature à un groupe de mots en entier (« au-dessus d’ », « ai pu »)', () => {
    const words = wordsOf(parseGrammar('par exemple [PREP:au-dessus d’]une montagne'));
    expect(words.map((w) => w.word)).toEqual(['par', 'exemple', 'au-dessus', 'd’', 'une', 'montagne']);
    expect(words[2]!.unit).toBeDefined();
    expect(words[3]!.unit).toBe(words[2]!.unit);
    expect(words[4]!.unit).toBeUndefined();
  });
});

describe('le coloriage', () => {
  const question = grammarQuestion('jaune', task('jaune', 'sujet'), 9); // [S:Le chat silencieux] [V:guette] une souris…
  const marks = (...tags: (GrammarTag | undefined)[]): WordMarks[] =>
    question.expected.map((_, i) => (tags[i] ? [tags[i]!] : []));

  it('est juste quand tout est colorié comme il faut', () => {
    expect(isCorrect(question, encodeMarks(marks('S', 'S', 'S', 'V'), ['V', 'S']))).toBe(true);
  });

  it('est faux avec un sujet incomplet (« le chat » au lieu de « le chat silencieux »)', () => {
    expect(isCorrect(question, encodeMarks(marks('S', 'S', undefined, 'V'), ['V', 'S']))).toBe(false);
  });

  it('est faux avec un mot en trop', () => {
    expect(isCorrect(question, encodeMarks(marks('S', 'S', 'S', 'V', 'V'), ['V', 'S']))).toBe(false);
  });

  it('se relit pour la correction', () => {
    const given: WordMarks[] = [['S'], [], ['S', 'CdN'], ['V']];
    expect(decodeMarks(encodeMarks(given, ['V', 'S', 'CdN']), given.length)).toEqual(given);
  });

  it('demande les deux mots du passé composé', () => {
    const pris = grammarQuestion('blanche', task('blanche', 'verbes'), 8); // Il [V:a pris] sa douche au réveil.
    const only = pris.expected.map((_, i): WordMarks => (i === 1 ? ['V'] : []));
    expect(isCorrect(pris, encodeMarks(only, ['V']))).toBe(false);
    expect(isCorrect(pris, pris.answer as string)).toBe(true);
  });

  it('remplace la fonction d’un mot, mais ajoute le complément du nom', () => {
    expect(paint([], 'S')).toEqual(['S']);
    expect(paint(['S'], 'S')).toEqual([]);
    expect(paint(['S'], 'COD')).toEqual(['COD']);
    expect(paint(['S'], 'CdN')).toEqual(['S', 'CdN']);
    expect(paint(['S', 'CdN'], 'COD')).toEqual(['CdN', 'COD']);
    expect(paint(['S', 'CdN'], 'CdN')).toEqual(['S']);
  });

  it('compte faux un complément du nom oublié', () => {
    const cdn = grammarQuestion('bleu-clair', task('bleu-clair', 'cdn'), 2); // [S:Les parents [CdN:de Béatrice]] [V:lisent] [COD:…]
    const withoutCdn = cdn.expected.map((m) => m.filter((t) => t !== 'CdN'));
    expect(isCorrect(cdn, encodeMarks(withoutCdn, cdn.exercise.pencils))).toBe(false);
    expect(isCorrect(cdn, encodeMarks(cdn.expected, cdn.exercise.pencils))).toBe(true);
  });
});

describe('le tirage', () => {
  it('alterne les exercices de la jaune et évite les phrases déjà vues', () => {
    const jaune = GRAMMAIRE[1]!;
    const first = pickGrammar(jaune, 6);
    expect(new Set(first.map((q) => q.exercise.id)).size).toBe(2);
    const next = pickGrammar(jaune, 6, first.map((q) => q.id));
    expect(next.some((q) => first.some((f) => f.id === q.id))).toBe(false);
  });

  it('met toujours un verbe au passé composé quand l’exercice demande le verbe', () => {
    expect(isCompound(grammarQuestion('blanche', GRAMMAIRE[0]!.tasks[0]!, 8))).toBe(true);
    expect(isCompound(grammarQuestion('blanche', GRAMMAIRE[0]!.tasks[0]!, 1))).toBe(false);
    for (const belt of GRAMMAIRE) {
      const any = belt.tasks.some((task) => task.sentences.some((_, i) => isCompound(grammarQuestion(belt.belt, task, i))));
      for (let n = 0; n < 50; n++) expect(pickGrammar(belt, GRAMMAR_PRACTICE_SIZE).some(isCompound), belt.belt).toBe(any);
    }
  });
});
