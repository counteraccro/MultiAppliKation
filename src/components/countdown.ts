import { h } from '../core/dom';

/** Les dernières secondes s'affichent en couleur. */
const LOW_MS = 10_000;

export interface Countdown {
  el: HTMLElement;
  /** Repart (ne compte que le temps où une question est posée). */
  start(): void;
  pause(): void;
  destroy(): void;
}

/** Compte à rebours visible, à la seconde ; `onEnd` est appelé une fois, à zéro. */
export function createCountdown(totalMs: number, onEnd: () => void): Countdown {
  const time = h('span', { class: 'chrono-time' });
  const el = h('div', { class: 'chrono countdown', role: 'timer' }, time);

  let accumulated = 0;
  let startedAt: number | undefined;
  let frame: number | undefined;
  let ended = false;

  const remaining = () => Math.max(0, totalMs - accumulated - (startedAt === undefined ? 0 : performance.now() - startedAt));

  const draw = () => {
    const left = remaining();
    time.textContent = `${Math.ceil(left / 1000)} s`;
    el.classList.toggle('low', left <= LOW_MS);
    if (left === 0 && !ended) {
      ended = true;
      startedAt = undefined;
      frame = undefined;
      onEnd();
      return;
    }
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
      if (startedAt !== undefined || ended) return;
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
    destroy: stopDrawing,
  };
}
