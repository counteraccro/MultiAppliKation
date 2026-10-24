import { topbar } from '../../components/topbar';
import { h } from '../../core/dom';
import type { ActivityContext } from '../types';
import type { TablesData } from './data';
import { MASTERY_LABELS, MASTERY_LEVELS, masteryCounts, masteryOf } from './mastery';
import { TABLES } from './questions';

/**
 * Grille des progrès : les 100 cases de la table de Pythagore, colorées selon
 * la boîte de chaque multiplication. Toucher une case la montre en dessous,
 * avec sa jumelle (3 × 7 et 7 × 3).
 */
export function renderProgress(root: HTMLElement, ctx: ActivityContext, data: TablesData, onBack: () => void): void {
  const counts = masteryCounts(data.leitner);
  const detail = h('p', { class: 'progress-detail', 'aria-live': 'polite' }, 'Touche une case pour la voir.');
  const cells: { a: number; b: number; el: HTMLElement }[] = [];

  function select(a: number, b: number) {
    for (const cell of cells) {
      const twin = (cell.a === a && cell.b === b) || (cell.a === b && cell.b === a);
      cell.el.classList.toggle('selected', twin);
    }
    detail.textContent = `${a} × ${b} = ${a * b} · ${MASTERY_LABELS[masteryOf(data.leitner, a, b)]}`;
  }

  const header = h(
    'div',
    { class: 'progress-row' },
    h('span', { class: 'progress-head corner' }, '×'),
    ...TABLES.map((b) => h('span', { class: 'progress-head' }, String(b))),
  );

  const rows = TABLES.map((a) =>
    h(
      'div',
      { class: 'progress-row' },
      h('span', { class: 'progress-head' }, String(a)),
      ...TABLES.map((b) => {
        const level = masteryOf(data.leitner, a, b);
        const el = h(
          'button',
          {
            class: `progress-cell m-${level}`,
            type: 'button',
            'aria-label': `${a} × ${b} : ${MASTERY_LABELS[level]}`,
            onclick: () => select(a, b),
          },
          String(a * b),
        );
        cells.push({ a, b, el });
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
      topbar('Les tables', onBack, ctx.profile),
      h('h1', { class: 'title' }, 'Mes progrès'),
      h('p', { class: 'subtitle' }, 'Plus c’est vert, mieux tu la sais.'),
      h('div', { class: 'progress-grid', role: 'group', 'aria-label': 'Grille des multiplications' }, header, ...rows),
      detail,
      legend,
    ),
  );
}
