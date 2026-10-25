import { h } from '../core/dom';

function randomInt(min: number, max: number, random: () => number): number {
  return min + Math.floor(random() * (max - min + 1));
}

/**
 * Une question « d'adulte » : un pourcentage simple (« 25 % de 160 »). Un adulte le fait de tête
 * en quelques secondes ; un enfant de primaire ne l'a pas encore appris (les pourcentages arrivent
 * en CM2 et en 6ᵉ), alors qu'il connaît vite ses tables. Le résultat est toujours un nombre entier.
 */
export function adultQuestion(random: () => number = Math.random): { text: string; answer: number } {
  const [percent, step, min, max] = ([
    [10, 10, 30, 190],
    [20, 5, 40, 200],
    [25, 4, 40, 200],
    [50, 2, 30, 198],
  ] as const)[randomInt(0, 3, random)]!;
  const of = step * randomInt(Math.ceil(min / step), Math.floor(max / step), random);
  return { text: `${percent}\u00a0% de ${of}`, answer: (of * percent) / 100 };
}

export interface AdultCheckOptions {
  title: string;
  /** Ce qui va se passer ; « un adulte répond : » est ajouté à la suite. */
  message: string;
  confirmLabel: string;
  /** Bouton rouge (suppression). */
  danger?: boolean;
}

/**
 * Fenêtre protégée par une question d'adulte : pour qu'un enfant n'efface pas
 * une progression ni ne descende de classe pour avoir plus facile.
 */
export function openAdultCheck(root: HTMLElement, options: AdultCheckOptions, onConfirm: () => void): void {
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
    { class: 'dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'adult-check-title' },
    h('h2', { id: 'adult-check-title' }, options.title),
    h('p', {}, `${options.message} Pour confirmer, un adulte répond :`),
    h('label', { class: 'adult-row' }, questionEl, input),
    error,
    h(
      'div',
      { class: 'dialog-actions' },
      h('button', { class: 'button secondary', type: 'button', onclick: close }, 'Annuler'),
      h('button', { class: `button ${options.danger ? 'danger' : 'primary'}`, type: 'submit' }, options.confirmLabel),
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
