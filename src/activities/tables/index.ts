import { h } from '../../core/dom';
import type { Activity } from '../types';

// Étape 2 : accueil des tables et mode « Apprendre » (voir .ai/analyse/04-modes.md).
export const tables: Activity = {
  id: 'tables',
  title: 'Les Tables',
  emoji: '×',
  color: '#4d96ff',
  mount(root, ctx) {
    root.append(
      h(
        'section',
        { class: 'screen' },
        h(
          'header',
          { class: 'topbar' },
          h('button', { class: 'back', type: 'button', onclick: () => ctx.exit() }, '← Retour'),
        ),
        h('h1', { class: 'title' }, 'Les Tables'),
        h('p', { class: 'subtitle' }, 'Bientôt ici, ' + ctx.profile.name + ' !'),
      ),
    );
  },
};
