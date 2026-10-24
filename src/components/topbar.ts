import { h } from '../core/dom';
import type { Profile } from '../core/storage';
import { avatar } from './avatar';

/** Barre du haut : bouton retour à gauche, joueur à droite. */
export function topbar(backLabel: string, onBack: () => void, profile?: Profile): HTMLElement {
  return h(
    'header',
    { class: 'topbar' },
    h('button', { class: 'back', type: 'button', onclick: onBack }, `← ${backLabel}`),
    profile && h('span', { class: 'player' }, avatar(profile.name, profile.color, 'small'), profile.name),
  );
}
