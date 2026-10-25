import { topbar } from '../../components/topbar';
import { h } from '../../core/dom';
import { MASTERY_LEVELS } from '../../core/mastery';
import type { ActivityContext } from '../types';
import { beltOf, beltTextColor } from './belts';
import { formatDay, progressOf, statsOf, type CeinturesData, type Score } from './data';
import { beltMastery, MASTERY_LABELS, masteryCounts } from './mastery';
import { SUBJECTS } from './subjects';

const scoreText = ({ correct, total }: Score) => `${correct} / ${total}`;

/**
 * Mes progrès : chaque ceinture de chaque matière, colorée comme les grilles des autres
 * activités, avec ses entraînements, son meilleur test et la date où elle a été obtenue.
 */
export function renderProgress(root: HTMLElement, ctx: ActivityContext, data: CeinturesData, onBack: () => void): void {
  const counts = masteryCounts(data);
  const legend = h(
    'ul',
    { class: 'progress-legend' },
    ...[...MASTERY_LEVELS].reverse().map((level) =>
      h(
        'li',
        {},
        h('span', { class: `legend-swatch m-${level}`, 'aria-hidden': 'true' }),
        MASTERY_LABELS[level],
        h('strong', {}, String(counts[level])),
      ),
    ),
  );

  const subjects = SUBJECTS.map((subject) => {
    const progress = progressOf(data, subject);
    return h(
      'section',
      { class: 'belt-progress' },
      h('h2', {}, subject.label),
      h(
        'ul',
        { class: 'belt-list' },
        ...subject.belts.map(({ belt, skill }) => {
          const { label, color } = beltOf(belt);
          const level = beltMastery(progress, belt);
          const stats = statsOf(progress, belt);
          const day = progress.passed[belt];
          const facts = [
            day && `obtenue en classe le ${formatDay(day)}`,
            !day && progress.passedTest?.[belt] && `réussie en conditions réelles le ${formatDay(progress.passedTest[belt]!)}`,
            stats.practices > 0 &&
              `${stats.practices} entraînement${stats.practices > 1 ? 's' : ''}` +
                (stats.bestPractice ? ` (au mieux ${scoreText(stats.bestPractice)})` : ''),
            stats.bestTest && `en conditions réelles, au mieux ${scoreText(stats.bestTest)}`,
          ].filter(Boolean);
          return h(
            'li',
            { class: `belt-item belt-progress-row m-${level}`, style: `--belt: ${color}; --belt-text: ${beltTextColor(color)}` },
            h(
              'div',
              { class: 'belt-row' },
              h('span', { class: 'belt-chip' }, label),
              h(
                'span',
                { class: 'belt-text' },
                h('span', { class: 'belt-skill' }, skill),
                facts.length > 0 && h('span', { class: 'belt-facts' }, facts.join(' · ')),
              ),
              h('span', { class: 'mastery-tag' }, MASTERY_LABELS[level]),
            ),
          );
        }),
      ),
    );
  });

  root.append(
    h(
      'section',
      { class: 'screen' },
      topbar('Ceintures', onBack, ctx.profile),
      h('h1', { class: 'title' }, 'Mes progrès'),
      h('p', { class: 'subtitle' }, 'Plus c’est vert, plus tu as avancé.'),
      legend,
      ...subjects,
    ),
  );
}
