import { h } from '../core/dom';
import type { Profile } from '../core/storage';

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Une multiplication « d'adulte », hors de portée d'un enfant de 9 ans. */
function adultQuestion(): { text: string; answer: number } {
  const a = randomInt(13, 19);
  const b = randomInt(6, 9);
  return { text: `${a} × ${b}`, answer: a * b };
}

/**
 * Suppression protégée : pour qu'un enfant n'efface pas la progression d'un autre,
 * il faut résoudre une multiplication d'adulte.
 */
export function openDeleteProfile(root: HTMLElement, profile: Profile, onConfirm: () => void): void {
  let question = adultQuestion();

  const questionEl = h('span', { class: 'adult-question' }, `${question.text} =`);
  const input = h('input', {
    class: 'adult-input',
    type: 'text',
    inputmode: 'numeric',
    pattern: '[0-9]*',
    autocomplete: 'off',
    'aria-label': 'Résultat',
  });
  const error = h('p', { class: 'form-error', role: 'alert' });

  const close = () => overlay.remove();

  const form = h(
    'form',
    { class: 'dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'delete-title' },
    h('h2', { id: 'delete-title' }, `Supprimer le profil de ${profile.name} ?`),
    h('p', {}, 'Toute sa progression sera effacée. Pour confirmer, un adulte répond :'),
    h('label', { class: 'adult-row' }, questionEl, input),
    error,
    h(
      'div',
      { class: 'dialog-actions' },
      h('button', { class: 'button secondary', type: 'button', onclick: close }, 'Annuler'),
      h('button', { class: 'button danger', type: 'submit' }, 'Supprimer'),
    ),
  );

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (Number(input.value.trim()) === question.answer && input.value.trim() !== '') {
      close();
      onConfirm();
      return;
    }
    question = adultQuestion();
    questionEl.textContent = `${question.text} =`;
    input.value = '';
    error.textContent = 'Ce n’est pas ça. Nouvelle question.';
    input.focus();
  });

  const overlay = h('div', { class: 'overlay' }, form);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });
  overlay.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });

  root.append(overlay);
  input.focus();
}
