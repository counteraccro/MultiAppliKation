import { topbar } from '../../components/topbar';
import { h } from '../../core/dom';
import type { ActivityContext } from '../types';
import { beltOf, beltTextColor } from './belts';
import { HOMOPHONES, type HomophoneBelt } from './homophones';

// Accueil provisoire (étape 2) : une ceinture par ligne, pour s'entraîner.
// L'échelle, la leçon et le test de passage arrivent aux étapes 3 et 4.

export function renderCeinturesHome(root: HTMLElement, ctx: ActivityContext, onPractice: (belt: HomophoneBelt) => void): void {
  root.append(
    h(
      'section',
      { class: 'screen' },
      topbar('Activités', ctx.exit, ctx.profile),
      h('h1', { class: 'title' }, 'Ceintures'),
      h('p', { class: 'subtitle' }, 'Homophones : choisis une ceinture pour t’entraîner.'),
      h(
        'div',
        { class: 'belt-list' },
        ...HOMOPHONES.map((belt) => {
          const { label, color } = beltOf(belt.belt);
          return h(
            'button',
            {
              class: 'belt-row',
              type: 'button',
              style: `--belt: ${color}; --belt-text: ${beltTextColor(color)}`,
              onclick: () => onPractice(belt),
            },
            h('span', { class: 'belt-chip' }, label),
            h('span', { class: 'belt-skill' }, belt.skill),
          );
        }),
      ),
    ),
  );
}
