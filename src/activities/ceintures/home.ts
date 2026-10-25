import { topbar } from '../../components/topbar';
import { h } from '../../core/dom';
import type { ActivityContext } from '../types';
import { beltOf, beltTextColor } from './belts';
import { highestPassed, progressOf, type CeinturesData } from './data';
import { SUBJECTS, type Subject } from './subjects';

// Accueil de l'activité : une tuile par matière, avec la ceinture qu'on porte.
// Seules les matières faites apparaissent (pas de tuile « bientôt »).

export function renderCeinturesHome(
  root: HTMLElement,
  ctx: ActivityContext,
  data: CeinturesData,
  onSubject: (subject: Subject) => void,
): void {
  root.append(
    h(
      'section',
      { class: 'screen' },
      topbar('Activités', ctx.exit, ctx.profile),
      h('h1', { class: 'title' }, 'Ceintures'),
      h('p', { class: 'subtitle' }, 'Choisis une matière.'),
      h('div', { class: 'tile-grid' }, ...SUBJECTS.map((subject) => subjectTile(subject, data, onSubject))),
    ),
  );
}

function subjectTile(subject: Subject, data: CeinturesData, onSubject: (subject: Subject) => void): HTMLElement {
  const highest = highestPassed(subject, progressOf(data, subject));
  const worn = subject.belts[highest];
  const belt = worn && beltOf(worn.belt);
  return h(
    'button',
    { class: 'tile subject-tile', type: 'button', onclick: () => onSubject(subject) },
    h('span', { class: 'subject-emoji', 'aria-hidden': 'true' }, subject.emoji),
    h('span', { class: 'tile-label' }, subject.label),
    belt
      ? h('span', { class: 'belt-chip', style: `--belt: ${belt.color}; --belt-text: ${beltTextColor(belt.color)}` }, belt.label)
      : h('span', { class: 'subject-start' }, 'Commence par la blanche'),
  );
}
