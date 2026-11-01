import { h } from '../core/dom';

export interface KeypadHandlers {
  onDigit(digit: number): void;
  onBackspace(): void;
  onSubmit(): void;
  /** Nombres décimaux : une touche virgule, et OK passe sur sa propre ligne. */
  onComma?(): void;
}

export interface Keypad {
  el: HTMLElement;
  setSubmitLabel(label: string): void;
  destroy(): void;
}

/**
 * Pavé numérique dessiné dans l'app (le clavier iOS cacherait la moitié de l'écran).
 * Au clavier d'ordinateur : chiffres, Retour arrière, Entrée (et la virgule avec « , » ou « . »).
 */
export function createKeypad(handlers: KeypadHandlers): Keypad {
  const key = (label: string, action: () => void, extra = '') =>
    h('button', { class: `key ${extra}`, type: 'button', onclick: action }, label);

  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => key(String(d), () => handlers.onDigit(d)));
  const { onComma } = handlers;
  const submit = key('OK', handlers.onSubmit, onComma ? 'key-submit key-wide' : 'key-submit');
  const back = key('⌫', handlers.onBackspace, 'key-back');
  const zero = key('0', () => handlers.onDigit(0));

  const el = h(
    'div',
    { class: 'keypad' },
    ...digits,
    ...(onComma ? [key(',', onComma), zero, back, submit] : [back, zero, submit]),
  );
  el.querySelector('.key-back')?.setAttribute('aria-label', 'Effacer');

  const onKeydown = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    // Une fenêtre est ouverte par-dessus (mise à jour…) : le clavier est pour elle.
    if (document.querySelector('.overlay')) return;
    if (/^[0-9]$/.test(event.key)) handlers.onDigit(Number(event.key));
    else if ((event.key === ',' || event.key === '.') && onComma) onComma();
    else if (event.key === 'Backspace') handlers.onBackspace();
    else if (event.key === 'Enter') handlers.onSubmit();
    else return;
    // Empêche aussi Entrée d'activer le bouton du pavé qui a le focus (double réponse).
    event.preventDefault();
  };
  document.addEventListener('keydown', onKeydown);

  return {
    el,
    setSubmitLabel: (label) => {
      submit.textContent = label;
    },
    destroy: () => document.removeEventListener('keydown', onKeydown),
  };
}
