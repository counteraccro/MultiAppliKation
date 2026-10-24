import type { App } from '../app';
import { createGradePicker } from '../components/grade-picker';
import { topbar } from '../components/topbar';
import { h } from '../core/dom';
import type { Profile } from '../core/storage';

/** Profil d'avant la classe : on la demande une fois, sans adulte (c'est un premier choix, pas un changement). */
export function renderChooseGrade(root: HTMLElement, app: App, profile: Profile): void {
  const grades = createGradePicker(undefined);
  const error = h('p', { class: 'form-error', role: 'alert' });
  grades.el.addEventListener('change', () => {
    error.textContent = '';
  });

  const form = h(
    'form',
    { class: 'profile-form' },
    grades.el,
    error,
    h('button', { class: 'button primary', type: 'submit' }, 'C’est parti !'),
  );
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const grade = grades.value();
    if (!grade) {
      error.textContent = 'Choisis ta classe.';
      return;
    }
    app.store.update(profile.id, { grade });
    app.go({ name: 'activity-choice', profileId: profile.id });
  });

  root.append(
    h(
      'section',
      { class: 'screen' },
      topbar('Changer de joueur', () => app.go({ name: 'who-plays' }), profile),
      h('h1', { class: 'title' }, `En quelle classe es-tu, ${profile.name} ?`),
      h('p', { class: 'subtitle' }, 'Les questions s’adapteront à ta classe.'),
      form,
    ),
  );
}
