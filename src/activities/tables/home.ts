import { albumCard, progressCard } from '../../components/home-cards';
import { stars } from '../../components/stars';
import { topbar } from '../../components/topbar';
import { h } from '../../core/dom';
import { countStickers } from '../../core/stickers';
import { formatDuration } from '../../core/time';
import type { ActivityContext } from '../types';
import { starsOf, type TablesData } from './data';
import { DEFI_SIZE } from './defi-session';
import { MASTERY_LABELS, masteryCounts } from './mastery';
import { ALL_PAIRS, TABLES, type Operation } from './questions';
import type { Sticker } from './stickers';
import { knownCount } from './review-session';

/** Table conseillée : la première, dans l'ordre conseillé, sans étoile (sinon pas encore à 3). */
export function suggestedTable(data: TablesData, order: readonly number[]): number | undefined {
  return (
    order.find((t) => starsOf(data, t) === 0) ??
    order.find((t) => starsOf(data, t) < 3)
  );
}

export interface TablesHomeActions {
  onLearn(table: number): void;
  onReview(): void;
  onDefi(): void;
  onMix(): void;
  onHidden(): void;
  onProgress(): void;
  onAlbum(): void;
}

export function renderTablesHome(
  root: HTMLElement,
  ctx: ActivityContext,
  op: Operation,
  data: TablesData,
  stickers: readonly Sticker[],
  { onLearn, onReview, onDefi, onMix, onHidden, onProgress, onAlbum }: TablesHomeActions,
): void {
  const suggested = suggestedTable(data, op.suggestedOrder);

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
      h('span', { class: 'table-number' }, `${op.symbol}${table}`),
      stars(starsOf(data, table)),
    );
  });

  root.append(
    h(
      'section',
      { class: 'screen' },
      topbar('Activités', ctx.exit, ctx.profile),
      h('h1', { class: 'title' }, op.title),
      h('p', { class: 'subtitle' }, 'Choisis une table pour gagner des étoiles.'),
      h('div', { class: 'table-grid' }, ...tiles),
      h(
        'div',
        { class: 'mode-buttons' },
        h(
          'button',
          { class: 'button mode primary', type: 'button', onclick: onReview },
          'Révision',
          h('small', {}, `${knownCount(data.leitner)} / ${ALL_PAIRS.length} connues`),
        ),
        h(
          'button',
          { class: 'button mode primary mix', type: 'button', onclick: onMix },
          'Mélange',
          h('small', {}, 'Tables au choix'),
        ),
        h(
          'button',
          { class: 'button mode primary mystery', type: 'button', onclick: onHidden },
          'Nombre caché',
          h('small', {}, op.hiddenExample),
        ),
        h(
          'button',
          { class: 'button mode primary defi', type: 'button', onclick: onDefi },
          'Défi',
          h(
            'small',
            {},
            data.defiRecordMs === undefined ? `${DEFI_SIZE} questions chrono` : `Record : ${formatDuration(data.defiRecordMs)}`,
          ),
        ),
      ),
      h(
        'div',
        { class: 'home-cards' },
        progressCard(masteryCounts(data.leitner), MASTERY_LABELS, onProgress),
        albumCard(countStickers(data, stickers), stickers.length, onAlbum),
      ),
    ),
  );
}
