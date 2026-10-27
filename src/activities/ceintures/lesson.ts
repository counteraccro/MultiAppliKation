import { topbar } from '../../components/topbar';
import { h } from '../../core/dom';
import type { ActivityContext } from '../types';
import { beltOf, beltTextColor } from './belts';
import { pronoun, sentence } from '../conjugaison/questions';
import type { Person } from '../conjugaison/verbs';
import { TENSES, type ConjugationBelt, type Exercise, type TenseId } from './conjugaison';
import type { Group } from './homophones';
import { capitalize, parseSentence, withNbsp } from './sentence';
import { isHomophoneBelt, isTableBelt, type SubjectBelt } from './subjects';
import { MAX_FACTOR, newTables, type TableBelt } from './tables';

export interface LessonActions {
  onPractice(): void;
  onBack(): void;
}

/**
 * La leçon d'une ceinture, à lire avant de s'entraîner. Homophones : pour chaque famille de mots,
 * ce qu'est chaque mot, l'astuce pour choisir et des exemples, le mot en couleur.
 * Conjugaison : les pièges du classeur, et un verbe conjugué à chaque temps de la ceinture.
 * Tables : les astuces, et les tables de la ceinture qu'aucune ceinture d'avant n'a montrées.
 */
export function renderLesson(
  root: HTMLElement,
  ctx: ActivityContext,
  belt: SubjectBelt,
  backLabel: string,
  { onPractice, onBack }: LessonActions,
): void {
  const { label, color } = beltOf(belt.belt);
  root.append(
    h(
      'section',
      { class: 'screen lesson', style: `--belt: ${color}; --belt-text: ${beltTextColor(color)}` },
      topbar(backLabel, onBack, ctx.profile),
      h('h1', { class: 'title' }, h('span', { class: 'belt-chip' }, label)),
      h('p', { class: 'subtitle' }, belt.skill),
      ...(isHomophoneBelt(belt)
        ? belt.groups.map((group) => groupCard(group, belt.groups.length > 1))
        : isTableBelt(belt)
          ? tableCards(belt)
          : conjugationCards(belt)),
      h('button', { class: 'button primary lesson-practice', type: 'button', onclick: onPractice }, 'S’entraîner'),
    ),
  );
}

function groupCard(group: Group, titled: boolean): HTMLElement {
  const ending = isEnding(group);
  const word = (choice: string) => (ending ? `-${choice}` : choice);
  return h(
    'article',
    { class: 'lesson-card' },
    titled && h('h2', {}, group.choices.map(word).join(' / ')),
    h(
      'ul',
      { class: 'lesson-rules' },
      ...group.choices.map((choice, i) => h('li', {}, h('strong', { class: 'lesson-word' }, word(choice)), ' ', withNbsp(group.rules[i] ?? ''))),
    ),
    h('p', { class: 'lesson-tip' }, h('span', { 'aria-hidden': 'true' }, '💡 '), h('strong', {}, 'Astuce\u00a0: '), withNbsp(group.tip)),
    h('ul', { class: 'lesson-examples' }, ...group.examples.map(example)),
  );
}

/**
 * Un exemple avec le mot entre accolades, mis en couleur ; sans accolades,
 * c'est l'astuce essayée sur l'exemple d'avant (« Le ciel était bleu. »).
 */
function example(text: string): HTMLElement {
  const segments = parseSentence(text);
  if (segments.every((s) => typeof s === 'string')) {
    return h('li', { class: 'lesson-swap' }, h('span', { 'aria-hidden': 'true' }, '↳ '), withNbsp(text));
  }
  return h(
    'li',
    {},
    ...segments.map((s) =>
      typeof s === 'string' ? withNbsp(s) : h('strong', { class: 'lesson-word' }, s.capital ? capitalize(s.answer) : s.answer),
    ),
  );
}

function conjugationCards(belt: ConjugationBelt): HTMLElement[] {
  const tenses = [...new Set(belt.exercises.map((e) => e.tense))];
  return [
    h(
      'article',
      { class: 'lesson-card' },
      h('h2', {}, 'Attention aux pièges !'),
      h('ul', { class: 'lesson-rules' }, ...belt.tips.map((tip) => h('li', {}, withNbsp(tip)))),
    ),
    ...tenses.map((tense) => {
      // De préférence un verbe ordinaire : être et avoir ont souvent leurs propres formes (sois, aie).
      const ofTense = belt.exercises.filter((e) => e.tense === tense);
      const example = ofTense.find((e) => e.verb !== 'être' && e.verb !== 'avoir') ?? ofTense[0]!;
      return conjugatedExample(example, tense);
    }),
  ];
}

/** Un verbe de la ceinture conjugué en entier, la forme en couleur : « nous {parlons} ». */
function conjugatedExample(exercise: Exercise, tense: TenseId): HTMLElement {
  const imperative = tense === 'imperatif';
  const lines = exercise.forms.map((form, i) => {
    const answer = Array.isArray(form) ? form[0] : typeof form === 'string' ? form : form.answer;
    if (imperative) return h('li', {}, h('strong', { class: 'lesson-word' }, answer), '\u00a0!');
    const prompt = pronoun((i + 1) as Person, answer, false);
    const full = sentence({ prompt, answer });
    return h('li', {}, full.slice(0, full.length - answer.length), h('strong', { class: 'lesson-word' }, answer));
  });
  return h(
    'article',
    { class: 'lesson-card' },
    h('h2', {}, `${capitalize(exercise.verb)} ${TENSES[tense].at}`),
    h('ul', { class: `lesson-examples lesson-conjugation${imperative ? ' imperative' : ''}` }, ...lines),
  );
}

function tableCards(belt: TableBelt): HTMLElement[] {
  return [
    h(
      'article',
      { class: 'lesson-card' },
      h('h2', {}, 'Astuces'),
      h('ul', { class: 'lesson-rules' }, ...belt.tips.map((tip) => h('li', {}, withNbsp(tip)))),
    ),
    ...newTables(belt).map((table) =>
      h(
        'article',
        { class: 'lesson-card' },
        h('h2', {}, `Table de ${table}`),
        h(
          'ul',
          { class: 'lesson-examples lesson-table' },
          ...Array.from({ length: MAX_FACTOR }, (_, i) =>
            h('li', {}, `${table} × ${i + 1} = `, h('strong', { class: 'lesson-word' }, String(table * (i + 1)))),
          ),
        ),
      ),
    ),
  ];
}

/** Des terminaisons (« mang{é} ») : le trou colle au mot, la leçon écrit « -é ». */
function isEnding(group: Group): boolean {
  return group.sentences.length > 0 && group.sentences.every((s) => /\p{L}\{/u.test(s.text));
}
