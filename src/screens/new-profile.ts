import type { App } from '../app';
import { h } from '../core/dom';
import { PROFILE_COLORS } from '../core/profiles';
import { createProfileForm } from '../components/profile-form';

export function renderNewProfile(root: HTMLElement, app: App): void {
  const form = createProfileForm({
    initial: { name: '', color: PROFILE_COLORS[app.store.list().length % PROFILE_COLORS.length]! },
    submitLabel: 'C’est parti !',
    validateName: (name) => app.store.validateName(name),
    onSubmit({ name, color, grade }) {
      const profile = app.store.create(name, color, grade);
      app.go({ name: 'activity-choice', profileId: profile.id });
    },
  });

  root.append(
    h(
      'section',
      { class: 'screen' },
      app.store.list().length > 0 &&
        h(
          'header',
          { class: 'topbar' },
          h('button', { class: 'back', type: 'button', onclick: () => app.go({ name: 'who-plays' }) }, '← Retour'),
        ),
      h('h1', { class: 'title' }, 'Nouveau profil'),
      form.el,
    ),
  );
  // Pas de focus automatique sur iPhone : le clavier cacherait l'écran dès l'arrivée.
  if (window.matchMedia('(hover: hover)').matches) form.focusName();
}
