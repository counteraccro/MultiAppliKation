import { topbar } from '../../components/topbar';
import { h } from '../../core/dom';
import type { ActivityContext } from '../types';
import { mixSize } from './mix-session';
import { TABLES, type Operation } from './questions';

/** Écran « Mélange » : l'enfant coche les tables à mélanger, puis lance la série. */
export function renderMixChoice(
  root: HTMLElement,
  ctx: ActivityContext,
  op: Operation,
  initial: readonly number[],
  { onStart, onBack }: { onStart(tables: number[]): void; onBack(): void },
): void {
  const chosen = new Set(initial.filter((t) => (TABLES as readonly number[]).includes(t)));

  const start = h('button', { class: 'button primary', type: 'button' });
  start.addEventListener('click', () => onStart(TABLES.filter((t) => chosen.has(t))));

  const tiles = TABLES.map((table) => {
    const tile = h(
      'button',
      { class: 'tile table-tile', type: 'button', 'aria-label': `Table de ${table}` },
      h('span', { class: 'check' }, '✓'),
      h('span', { class: 'table-number' }, `${op.symbol}${table}`),
    );
    tile.addEventListener('click', () => {
      if (chosen.has(table)) chosen.delete(table);
      else chosen.add(table);
      update();
    });
    return { table, tile };
  });

  function update() {
    for (const { table, tile } of tiles) {
      tile.classList.toggle('chosen', chosen.has(table));
      tile.setAttribute('aria-pressed', String(chosen.has(table)));
    }
    start.disabled = chosen.size === 0;
    start.textContent = chosen.size === 0 ? 'Choisis au moins une table' : `C'est parti ! (${mixSize([...chosen])} questions)`;
  }

  root.append(
    h(
      'section',
      { class: 'screen' },
      topbar(op.backLabel, onBack, ctx.profile),
      h('h1', { class: 'title' }, 'Mélange'),
      h('p', { class: 'subtitle' }, 'Touche les tables à mélanger.'),
      h('div', { class: 'table-grid' }, ...tiles.map(({ tile }) => tile)),
      h('div', { class: 'mix-start' }, start),
    ),
  );
  update();
}
