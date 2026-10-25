import { h } from '../core/dom';
import { isMuted, setMuted } from '../core/sound';

/** Bouton 🔊 / 🔇 de la barre de jeu. */
export function soundToggle(): HTMLButtonElement {
  const button = h('button', { class: 'sound-toggle', type: 'button' });
  const render = () => {
    button.textContent = isMuted() ? '🔇' : '🔊';
    button.setAttribute('aria-label', isMuted() ? 'Remettre le son' : 'Couper le son');
  };
  button.addEventListener('click', () => {
    setMuted(!isMuted());
    render();
  });
  render();
  return button;
}
