import { h } from '../core/dom';
import { APP_VERSION, reloadToVersion, type RemoteVersion } from '../core/version';

/**
 * Nouvelle version en ligne : fenêtre sans bouton « fermer », pour que tout le monde
 * passe à la nouvelle version. La progression est enregistrée à chaque réponse :
 * recharger ne fait perdre que la série en cours.
 */
export function showUpdateDialog(remote: RemoteVersion): void {
  const button = h('button', { class: 'button primary', type: 'button' }, 'Mettre à jour');
  button.addEventListener('click', () => {
    button.setAttribute('disabled', '');
    reloadToVersion(remote);
  });

  const versions =
    remote.version !== APP_VERSION ? `Version ${APP_VERSION} → ${remote.version}` : `Version ${APP_VERSION}, nouvelle édition`;

  document.body.append(
    h(
      'div',
      { class: 'overlay update-overlay' },
      h(
        'div',
        { class: 'dialog', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'update-title' },
        h('h2', { id: 'update-title' }, 'Une nouvelle version est arrivée !'),
        h('p', {}, 'Touche le bouton pour la découvrir. Ta progression est gardée.'),
        h('p', { class: 'version-note' }, versions),
        button,
      ),
    ),
  );
  button.focus();
}
