import { h } from '../core/dom';

/** Rond de couleur avec l'initiale du prénom. */
export function avatar(name: string, color: string, size: 'small' | 'large' = 'large'): HTMLElement {
  const initial = [...name.trim()][0]?.toLocaleUpperCase('fr') ?? '?';
  const el = h('span', { class: `avatar avatar-${size}`, 'aria-hidden': 'true' }, initial);
  el.style.setProperty('--profile-color', color);
  return el;
}
