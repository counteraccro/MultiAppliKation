import { stars } from '../../components/stars';
import { topbar } from '../../components/topbar';
import { h } from '../../core/dom';
import type { ActivityContext } from '../types';
import { starsOf, type TablesData } from './data';
import { ALL_PAIRS, SUGGESTED_ORDER, TABLES } from './questions';
import { knownCount } from './review-session';

/** Table conseillée : la première, dans l'ordre conseillé, sans étoile (sinon pas encore à 3). */
export function suggestedTable(data: TablesData): number | undefined {
  return (
    SUGGESTED_ORDER.find((t) => starsOf(data, t) === 0) ??
    SUGGESTED_ORDER.find((t) => starsOf(data, t) < 3)
  );
}

export interface TablesHomeActions {
  onLearn(table: number): void;
  onReview(): void;
}

export function renderTablesHome(
  root: HTMLElement,
  ctx: ActivityContext,
  data: TablesData,
  { onLearn, onReview }: TablesHomeActions,
): void {
  const suggested = suggestedTable(data);

  const tiles = TABLES.map((table) => {
    const isSuggested = table === suggested;
    return h(
      'button',
      {
        class: `tile table-tile${isSuggested ? ' suggested' : ''}`,
        type: 'button',
        'aria-label': `Table de ${table}`,
        onclick: () => onLearn(table),
      },
      isSuggested && h('span', { class: 'badge' }, 'À toi !'),
      h('span', { class: 'table-number' }, `×${table}`),
      stars(starsOf(data, table)),
    );
  });

  root.append(
    h(
      'section',
      { class: 'screen' },
      topbar('Activités', ctx.exit, ctx.profile),
      h('h1', { class: 'title' }, 'Les Tables'),
      h('p', { class: 'subtitle' }, 'Choisis une table pour gagner des étoiles.'),
      h('div', { class: 'table-grid' }, ...tiles),
      h(
        'div',
        { class: 'mode-buttons' },
        h(
          'button',
          { class: 'button mode primary', type: 'button', onclick: onReview },
          'Révision',
          h('small', {}, `${knownCount(data.leitner)} / ${ALL_PAIRS.length} sues`),
        ),
        h('button', { class: 'button mode', type: 'button', disabled: true }, 'Défi', h('small', {}, 'bientôt')),
      ),
    ),
  );
}
