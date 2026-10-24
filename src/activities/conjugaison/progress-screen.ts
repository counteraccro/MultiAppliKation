import { topbar } from '../../components/topbar';
import { h } from '../../core/dom';
import type { ActivityContext } from '../types';
import type { ConjugaisonData } from './data';
import { emptyCounts, MASTERY_LEVELS, type Mastery } from '../../core/mastery';
import { conjugationMastery, formMastery, MASTERY_LABELS } from './mastery';
import { conjugationQuestion, sentence } from './questions';
import { CONJUGATIONS, PERSONS, TENSES, VERBS, type Conjugation } from './verbs';

/** En-têtes de colonnes : « passé composé » ne tient pas sur un téléphone. */
const SHORT_LABELS = { present: 'présent', imparfait: 'imparfait', futur: 'futur', 'passe-compose': 'passé comp.' } as const;

/**
 * Grille des progrès : une ligne par verbe, une colonne par temps, colorée
 * selon la forme la moins sue. Toucher une case montre ses 6 formes.
 */
export function renderProgress(root: HTMLElement, ctx: ActivityContext, data: ConjugaisonData, onBack: () => void): void {
  // Un seul calcul par case : il sert à la légende, aux cases et au détail.
  const levels = new Map<Conjugation, Mastery>(CONJUGATIONS.map((c) => [c, conjugationMastery(data.leitner, c)]));
  const counts = emptyCounts();
  for (const level of levels.values()) counts[level]++;
  const detail = h('div', { class: 'conj-detail', 'aria-live': 'polite' }, h('p', {}, 'Touche une case pour voir ses 6 formes.'));
  const cells: { conjugation: Conjugation; el: HTMLElement }[] = [];

  function select(conjugation: Conjugation) {
    for (const cell of cells) {
      const selected = cell.conjugation === conjugation;
      cell.el.classList.toggle('selected', selected);
      cell.el.setAttribute('aria-pressed', String(selected));
    }
    const level = levels.get(conjugation)!;
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
        const level = levels.get(conjugation)!;
        const el = h('button', {
          class: `progress-cell m-${level}`,
          type: 'button',
          'aria-pressed': 'false',
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
