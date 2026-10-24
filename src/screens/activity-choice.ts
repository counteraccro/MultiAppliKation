import { activities } from '../activities';
import type { App } from '../app';
import { h } from '../core/dom';
import type { Profile } from '../core/storage';
import { topbar } from '../components/topbar';

export function renderActivityChoice(root: HTMLElement, app: App, profile: Profile): void {
  const tiles = activities.map((activity) => {
    const tile = h(
      'button',
      {
        class: 'tile activity-tile',
        type: 'button',
        onclick: () => app.go({ name: 'activity', profileId: profile.id, activityId: activity.id }),
      },
      h('span', { class: 'activity-emoji', 'aria-hidden': 'true' }, activity.emoji),
      h('span', { class: 'tile-label' }, activity.title),
    );
    tile.style.setProperty('--profile-color', activity.color);
    return tile;
  });

  root.append(
    h(
      'section',
      { class: 'screen' },
      topbar(
        'Changer de joueur',
        () => app.go({ name: 'who-plays' }),
        profile,
        () => app.go({ name: 'edit-profile', profileId: profile.id }),
      ),
      h('h1', { class: 'title' }, `Bonjour ${profile.name} !`),
      h('p', { class: 'subtitle' }, 'À quoi on joue ?'),
      h('div', { class: 'tile-grid' }, ...tiles),
    ),
  );
}
