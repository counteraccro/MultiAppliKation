import type { App } from '../app';
import { h } from '../core/dom';
import { NAME_MAX_LENGTH, PROFILE_COLORS } from '../core/profiles';
import { avatar } from '../components/avatar';

export function renderNewProfile(root: HTMLElement, app: App): void {
  let color: string = PROFILE_COLORS[app.store.list().length % PROFILE_COLORS.length]!;

  const input = h('input', {
    class: 'name-input',
    type: 'text',
    maxlength: NAME_MAX_LENGTH,
    autocomplete: 'off',
    autocapitalize: 'words',
    spellcheck: 'false',
    placeholder: 'Ton prénom',
    'aria-label': 'Ton prénom',
  });
  const error = h('p', { class: 'form-error', role: 'alert' });
  const preview = h('div', { class: 'preview' });

  const updatePreview = () => preview.replaceChildren(avatar(input.value || '?', color));
  input.addEventListener('input', () => {
    error.textContent = '';
    updatePreview();
  });

  const swatches = PROFILE_COLORS.map((c, i) => {
    const swatch = h('input', {
      class: 'swatch',
      type: 'radio',
      name: 'color',
      value: c,
      checked: c === color,
      'aria-label': `Couleur ${i + 1}`,
    });
    swatch.style.setProperty('--swatch-color', c);
    swatch.addEventListener('change', () => {
      color = c;
      updatePreview();
    });
    return swatch;
  });

  const form = h(
    'form',
    { class: 'profile-form' },
    preview,
    input,
    error,
    h('fieldset', { class: 'swatches' }, h('legend', {}, 'Ta couleur'), ...swatches),
    h('button', { class: 'button primary', type: 'submit' }, 'C’est parti !'),
  );

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = app.store.validateName(input.value);
    if (message) {
      error.textContent = message;
      input.focus();
      return;
    }
    const profile = app.store.create(input.value, color);
    app.go({ name: 'activity-choice', profileId: profile.id });
  });

  updatePreview();
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
      form,
    ),
  );
  // Pas de focus automatique sur iPhone : le clavier cacherait l'écran dès l'arrivée.
  if (window.matchMedia('(hover: hover)').matches) input.focus();
}
