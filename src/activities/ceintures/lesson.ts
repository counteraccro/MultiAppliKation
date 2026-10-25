import { topbar } from '../../components/topbar';
import { h } from '../../core/dom';
import type { ActivityContext } from '../types';
import { beltOf, beltTextColor } from './belts';
import type { Group, HomophoneBelt } from './homophones';
import { capitalize, parseSentence, withNbsp } from './sentence';

export interface LessonActions {
  onPractice(): void;
  onBack(): void;
}

/**
 * La leçon d'une ceinture, à lire avant de s'entraîner : pour chaque famille de mots,
 * ce qu'est chaque mot, l'astuce pour choisir et des exemples, le mot en couleur.
 */
export function renderLesson(
  root: HTMLElement,
  ctx: ActivityContext,
  belt: HomophoneBelt,
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
      ...belt.groups.map((group) => groupCard(group, belt.groups.length > 1)),
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

/** Des terminaisons (« mang{é} ») : le trou colle au mot, la leçon écrit « -é ». */
function isEnding(group: Group): boolean {
  return group.sentences.length > 0 && group.sentences.every((s) => /\p{L}\{/u.test(s.text));
}
