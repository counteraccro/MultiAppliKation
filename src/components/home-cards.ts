import { h } from '../core/dom';
import { MASTERY_LEVELS, type Mastery } from '../core/mastery';

/** Accès à « Mes progrès » : une barre aux couleurs de la grille, du mieux su au moins su. */
export function progressCard(
  counts: Record<Mastery, number>,
  labels: Record<Mastery, string>,
  onProgress: () => void,
): HTMLElement {
  const levels = [...MASTERY_LEVELS].reverse();
  return h(
    'button',
    {
      class: 'progress-card',
      type: 'button',
      'aria-label': `Mes progrès : ${levels.map((l) => `${labels[l]} ${counts[l]}`).join(', ')}`,
      onclick: onProgress,
    },
    h('span', { class: 'card-title' }, 'Mes progrès', h('span', { class: 'card-arrow', 'aria-hidden': 'true' }, '›')),
    h(
      'span',
      { class: 'progress-bar', 'aria-hidden': 'true' },
      ...levels
        .filter((l) => counts[l] > 0)
        .map((l) => h('span', { class: `m-${l}`, style: `flex-grow: ${counts[l]}` })),
    ),
  );
}

/** Accès à l'album : combien d'autocollants sur combien. */
export function albumCard(count: number, total: number, onAlbum: () => void): HTMLElement {
  return h(
    'button',
    {
      class: 'progress-card',
      type: 'button',
      'aria-label': `Mes autocollants : ${count} sur ${total}`,
      onclick: onAlbum,
    },
    h('span', { class: 'card-title' }, 'Mes autocollants', h('span', { class: 'card-arrow', 'aria-hidden': 'true' }, '›')),
    h('span', { class: 'album-count', 'aria-hidden': 'true' }, `🌟 ${count} / ${total}`),
  );
}
