import { h } from '../core/dom';
import type { Grade } from '../core/grades';
import { NAME_MAX_LENGTH, PROFILE_COLORS } from '../core/profiles';
import { avatar } from './avatar';
import { createGradePicker } from './grade-picker';

export interface ProfileValues {
  name: string;
  color: string;
  grade: Grade;
}

export interface ProfileFormOptions {
  initial: { name: string; color: string; grade?: Grade };
  submitLabel: string;
  /** Message d'erreur sur le prénom, ou null s'il convient. */
  validateName(name: string): string | null;
  onSubmit(values: ProfileValues): void;
}

/** Formulaire commun à la création et à la modification : prénom, couleur, classe. */
export function createProfileForm(options: ProfileFormOptions): { el: HTMLFormElement; focusName(): void } {
  let color = options.initial.color;

  const input = h('input', {
    class: 'name-input',
    type: 'text',
    value: options.initial.name,
    maxlength: NAME_MAX_LENGTH,
    autocomplete: 'off',
    autocapitalize: 'words',
    spellcheck: 'false',
    placeholder: 'Ton prénom',
    'aria-label': 'Ton prénom',
  });
  const nameError = h('p', { class: 'form-error', role: 'alert' });
  const gradeError = h('p', { class: 'form-error', role: 'alert' });
  const preview = h('div', { class: 'preview' });
  const grades = createGradePicker(options.initial.grade);

  const updatePreview = () => preview.replaceChildren(avatar(input.value || '?', color));
  input.addEventListener('input', () => {
    nameError.textContent = '';
    updatePreview();
  });
  grades.el.addEventListener('change', () => {
    gradeError.textContent = '';
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
    nameError,
    h('fieldset', { class: 'swatches' }, h('legend', {}, 'Ta couleur'), ...swatches),
    grades.el,
    gradeError,
    h('button', { class: 'button primary', type: 'submit' }, options.submitLabel),
  );

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = options.validateName(input.value);
    if (message) {
      nameError.textContent = message;
      input.focus();
      return;
    }
    const grade = grades.value();
    if (!grade) {
      gradeError.textContent = 'Choisis ta classe.';
      return;
    }
    options.onSubmit({ name: input.value.trim(), color, grade });
  });

  updatePreview();
  return { el: form, focusName: () => input.focus() };
}
