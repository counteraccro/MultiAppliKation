import { h } from '../core/dom';
import type { Keypad } from './keypad';

export interface KeyboardHandlers {
  onChar(char: string): void;
  onBackspace(): void;
  onSubmit(): void;
}

const ROWS = ['azertyuiop', 'qsdfghjklm', 'wxcvbn'];
/** Toujours visibles : le clavier de l'iPhone les cache derrière un appui long. */
const ACCENTS = 'éèêàçùâîôû';
/** Ce que la frappe d'un clavier d'ordinateur peut écrire (accents compris). */
const TYPABLE = /^[a-zàâäçéèêëîïôöùûüœæ ]$/;

/**
 * Clavier de lettres dessiné dans l'app (AZERTY, minuscules), pour répondre en mots.
 * Le clavier iOS cacherait la moitié de l'écran et corrigerait tout seul.
 * Au clavier d'ordinateur : lettres, accents, espace, Retour arrière, Entrée.
 */
export function createKeyboard(handlers: KeyboardHandlers): Keypad {
  const key = (label: string, action: () => void, extra = '') =>
    h('button', { class: `kb-key ${extra}`, type: 'button', onclick: action }, label);
  const letter = (char: string, extra = '') => key(char, () => handlers.onChar(char), extra);

  const back = key('⌫', handlers.onBackspace, 'kb-back');
  back.setAttribute('aria-label', 'Effacer');
  const space = key('espace', () => handlers.onChar(' '), 'kb-space');
  const submit = key('OK', handlers.onSubmit, 'kb-submit');

  const el = h(
    'div',
    { class: 'keyboard' },
    h('div', { class: 'kb-row kb-accents' }, ...[...ACCENTS].map((c) => letter(c, 'kb-accent'))),
    h('div', { class: 'kb-row' }, ...[...ROWS[0]!].map((c) => letter(c))),
    h('div', { class: 'kb-row' }, ...[...ROWS[1]!].map((c) => letter(c))),
    h('div', { class: 'kb-row' }, ...[...ROWS[2]!].map((c) => letter(c)), back),
    h('div', { class: 'kb-row' }, space, submit),
  );

  const onKeydown = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    // Une fenêtre est ouverte par-dessus (mise à jour…) : le clavier est pour elle.
    if (document.querySelector('.overlay')) return;
    const char = event.key.toLocaleLowerCase('fr');
    if (TYPABLE.test(char)) handlers.onChar(char);
    else if (event.key === 'Backspace') handlers.onBackspace();
    else if (event.key === 'Enter') handlers.onSubmit();
    else return;
    // Empêche aussi Entrée ou Espace d'activer le bouton qui a le focus (double frappe).
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
