import { h } from '../core/dom';
import type { Profile } from '../core/storage';
import { avatar } from './avatar';

/** Barre du haut : bouton retour à gauche, joueur à droite (qu'on touche pour modifier son profil, si `onProfile`). */
export function topbar(backLabel: string, onBack: () => void, profile?: Profile, onProfile?: () => void): HTMLElement {
  const player =
    profile &&
    (onProfile
      ? h(
          'button',
          { class: 'player player-button', type: 'button', 'aria-label': `Modifier le profil de ${profile.name}`, onclick: onProfile },
          avatar(profile.name, profile.color, 'small'),
          profile.name,
          h('span', { class: 'player-edit', 'aria-hidden': 'true' }, '✏️'),
        )
      : h('span', { class: 'player' }, avatar(profile.name, profile.color, 'small'), profile.name));
  return h('header', { class: 'topbar' }, h('button', { class: 'back', type: 'button', onclick: onBack }, `← ${backLabel}`), player);
}
