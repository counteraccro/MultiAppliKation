import type { App } from '../app';
import { h } from '../core/dom';
import { onLongPress } from '../core/long-press';
import { APP_VERSION, checkForUpdateNow, type UpdateCheck } from '../core/version';
import { avatar } from '../components/avatar';
import { openDeleteProfile } from './delete-profile';

export function renderWhoPlays(root: HTMLElement, app: App): void {
  const profiles = app.store.list();

  const tiles = profiles.map((profile) => {
    const tile = h(
      'button',
      {
        class: 'tile profile-tile',
        type: 'button',
        onclick: () => app.go({ name: 'activity-choice', profileId: profile.id }),
      },
      avatar(profile.name, profile.color),
      h('span', { class: 'tile-label' }, profile.name),
    );
    tile.style.setProperty('--profile-color', profile.color);
    onLongPress(tile, () =>
      openDeleteProfile(root, profile, () => {
        app.store.remove(profile.id);
        app.go({ name: 'who-plays' });
      }),
    );
    return tile;
  });

  const addTile = h(
    'button',
    { class: 'tile add-tile', type: 'button', onclick: () => app.go({ name: 'new-profile' }) },
    h('span', { class: 'avatar avatar-large add-avatar', 'aria-hidden': 'true' }, '+'),
    h('span', { class: 'tile-label' }, profiles.length === 0 ? 'Crée ton profil' : 'Nouveau'),
  );

  root.append(
    h(
      'section',
      { class: 'screen' },
      h('h1', { class: 'title brand' }, 'Multi', h('span', { class: 'brand-accent' }, 'Appli'), 'Kation'),
      h('p', { class: 'subtitle' }, 'Qui joue ?'),
      h('div', { class: 'tile-grid' }, ...tiles, addTile),
      profiles.length > 0 &&
        h('p', { class: 'hint' }, 'Pour supprimer un profil : appui long sur son prénom (adulte).'),
      h('p', { class: 'app-version' }, `Version ${APP_VERSION}`),
      updateButton(),
    ),
  );
}

const UPDATE_MESSAGES: Record<UpdateCheck, string> = {
  latest: 'Tu as la dernière version.',
  offline: 'Pas de connexion : réessaie plus tard.',
  update: '',
  reset: 'Mise à jour…',
};

/** Pour l'app restée bloquée sur une ancienne version (voir checkForUpdateNow). */
function updateButton(): HTMLElement {
  const status = h('p', { class: 'update-status', 'aria-live': 'polite' });
  const button = h('button', { class: 'link-update', type: 'button' }, 'Chercher une mise à jour');
  button.addEventListener('click', async () => {
    button.setAttribute('disabled', '');
    status.textContent = 'Je cherche…';
    const result = await checkForUpdateNow();
    status.textContent = UPDATE_MESSAGES[result];
    if (result !== 'reset') button.removeAttribute('disabled');
  });
  return h('div', { class: 'update-check' }, button, status);
}
