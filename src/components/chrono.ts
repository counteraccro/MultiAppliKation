import { h } from '../core/dom';
import { formatDuration } from '../core/time';

export interface Chrono {
  el: HTMLElement;
  /** Repart (ne compte que le temps de réflexion). */
  start(): void;
  pause(): void;
  /** Ajoute une pénalité, affichée « +5 s » un instant. */
  addPenalty(ms: number): void;
  elapsed(): number;
  destroy(): void;
}

/** Chrono visible, au dixième de seconde. */
export function createChrono(): Chrono {
  const time = h('span', { class: 'chrono-time' });
  const penalty = h('span', { class: 'chrono-penalty', 'aria-hidden': 'true' });
  const el = h('div', { class: 'chrono', role: 'timer' }, time, penalty);

  let accumulated = 0;
  let startedAt: number | undefined;
  let frame: number | undefined;

  const elapsed = () => accumulated + (startedAt === undefined ? 0 : performance.now() - startedAt);

  const draw = () => {
    time.textContent = formatDuration(elapsed());
    frame = startedAt === undefined ? undefined : requestAnimationFrame(draw);
  };

  const stopDrawing = () => {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
  };

  draw();

  return {
    el,
    start() {
      if (startedAt !== undefined) return;
      startedAt = performance.now();
      draw();
    },
    pause() {
      if (startedAt === undefined) return;
      accumulated += performance.now() - startedAt;
      startedAt = undefined;
      stopDrawing();
      draw();
    },
    addPenalty(ms) {
      accumulated += ms;
      penalty.textContent = `+${Math.round(ms / 1000)} s`;
      // Relance l'animation même si deux pénalités se suivent.
      penalty.classList.remove('show');
      void penalty.offsetWidth;
      penalty.classList.add('show');
      draw();
    },
    elapsed,
    destroy: stopDrawing,
  };
}
