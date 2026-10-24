import { h } from '../core/dom';

/** ★★☆ : `count` étoiles pleines sur `max`. */
export function stars(count: number, max = 3, size: 'small' | 'large' = 'small'): HTMLElement {
  const el = h(
    'span',
    { class: `stars stars-${size}`, role: 'img', 'aria-label': `${count} étoile${count > 1 ? 's' : ''} sur ${max}` },
    ...Array.from({ length: max }, (_, i) => h('span', { class: i < count ? 'star on' : 'star' }, '★')),
  );
  return el;
}
