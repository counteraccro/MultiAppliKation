import { topbar } from '../../components/topbar';
import { h } from '../../core/dom';
import { MASTERY_LEVELS } from '../../core/mastery';
import type { ActivityContext } from '../types';
import type { ConjugaisonData } from './data';
import { conjugationMastery, formMastery, MASTERY_LABELS, masteryCounts } from './mastery';
import { conjugationQuestion, sentence } from './questions';
import { CONJUGATIONS, PERSONS, TENSES, VERBS, type Conjugation } from './verbs';

/** En-têtes de colonnes : « passé composé » ne tient pas sur un téléphone. */
const SHORT_LABELS = { present: 'présent', imparfait: 'imparfait', futur: 'futur', 'passe-compose': 'passé comp.' } as const;

/**
 * Grille des progrès : une ligne par verbe, une colonne par temps, colorée
 * selon la forme la moins sue. Toucher une case montre ses 6 formes.
 */
export function renderProgress(root: HTMLElement, ctx: ActivityContext, data: ConjugaisonData, onBack: () => void): void {
  const counts = masteryCounts(data.leitner);
  const detail = h('div', { class: 'conj-detail', 'aria-live': 'polite' }, h('p', {}, 'Touche une case pour voir ses 6 formes.'));
  const cells: { conjugation: Conjugation; el: HTMLElement }[] = [];

  function select(conjugation: Conjugation) {
    for (const cell of cells) cell.el.classList.toggle('selected', cell.conjugation === conjugation);
    const level = conjugationMastery(data.leitner, conjugation);
    detail.replaceChildren(
      h('p', {}, `${conjugation.verb.infinitive} · ${conjugation.tense.label} : ${MASTERY_LABELS[level]}`),
      h(
        'ul',
        { class: 'conj-forms' },
        // Le masculin (« il », « ils ») : la grille parle de la forme à retenir, pas d'une question.
        ...PERSONS.map((person) =>
          h(
            'li',
            { class: `m-${formMastery(data.leitner, conjugation, person)}` },
            sentence(conjugationQuestion(conjugation, person, () => 1)),
          ),
        ),
      ),
    );
  }

  const header = h(
    'div',
    { class: 'conj-progress-row' },
    h('span', {}),
    ...TENSES.map((t) => h('span', { class: 'progress-head' }, SHORT_LABELS[t.id])),
  );

  const rows = VERBS.map((verb) =>
    h(
      'div',
      { class: 'conj-progress-row' },
      h('span', { class: 'conj-verb' }, verb.infinitive),
      ...CONJUGATIONS.filter((c) => c.verb === verb).map((conjugation) => {
        const level = conjugationMastery(data.leitner, conjugation);
        const el = h('button', {
          class: `progress-cell m-${level}`,
          type: 'button',
          'aria-label': `${verb.infinitive}, ${conjugation.tense.label} : ${MASTERY_LABELS[level]}`,
          onclick: () => select(conjugation),
        });
        cells.push({ conjugation, el });
        return el;
      }),
    ),
  );

  const legend = h(
    'ul',
    { class: 'progress-legend' },
    ...[...MASTERY_LEVELS].reverse().map((level) =>
      h(
        'li',
        {},
        h('span', { class: `legend-swatch m-${level}`, 'aria-hidden': 'true' }),
        MASTERY_LABELS[level],
        h('strong', {}, String(counts[level])),
      ),
    ),
  );

  root.append(
    h(
      'section',
      { class: 'screen' },
      topbar('Conjugaison', onBack, ctx.profile),
      h('h1', { class: 'title' }, 'Mes progrès'),
      h('p', { class: 'subtitle' }, 'Plus c’est vert, mieux tu le sais.'),
      legend,
      detail,
      h('div', { class: 'conj-progress', role: 'group', 'aria-label': 'Grille des verbes' }, header, ...rows),
    ),
  );
}
