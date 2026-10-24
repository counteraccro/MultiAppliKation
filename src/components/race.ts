import { h } from '../core/dom';

export interface Race {
  el: HTMLElement;
  destroy(): void;
}

/**
 * Course contre son record (défi) : le fantôme avance au rythme du record,
 * l'enfant avance d'une case à chaque question tentée.
 */
export function createRace(options: {
  recordMs: number;
  total: number;
  /** Temps du chrono, pénalités comprises. */
  elapsed(): number;
  attempted(): number;
}): Race {
  const ghost = h('span', { class: 'runner ghost', 'aria-hidden': 'true' }, '👻');
  const player = h('span', { class: 'runner player', 'aria-hidden': 'true' }, '🏃');
  const status = h('span', { class: 'race-status' });
  const el = h(
    'div',
    { class: 'race' },
    h('div', { class: 'race-track' }, ghost, player, h('span', { class: 'race-finish', 'aria-hidden': 'true' }, '🏁')),
    status,
  );

  // Les coureurs vont de 7 % (départ) à 85 % (juste avant le drapeau).
  const at = (progress: number) => `${7 + progress * 78}%`;
  let frame: number | undefined;
  let ahead: boolean | undefined;

  const draw = () => {
    const ghostAt = Math.min(1, options.elapsed() / options.recordMs);
    const playerAt = options.attempted() / options.total;
    ghost.style.left = at(ghostAt);
    player.style.left = at(playerAt);
    const isAhead = playerAt >= ghostAt;
    if (isAhead !== ahead) {
      ahead = isAhead;
      status.textContent = isAhead ? 'Devant ton record !' : 'Ton record est devant…';
      el.classList.toggle('behind', !isAhead);
    }
    frame = requestAnimationFrame(draw);
  };
  draw();

  return {
    el,
    destroy() {
      if (frame !== undefined) cancelAnimationFrame(frame);
    },
  };
}
