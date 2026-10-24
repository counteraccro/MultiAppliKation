export const LONG_PRESS_MS = 900;

/**
 * Appui long (doigt ou souris) sur un élément. Le clic qui suit un appui long
 * est annulé, pour ne pas ouvrir le profil en plus.
 * Pendant l'appui, l'élément porte la classe `pressing` (animation CSS).
 */
export function onLongPress(el: HTMLElement, action: () => void): void {
  let timer: number | undefined;
  let fired = false;

  const cancel = () => {
    window.clearTimeout(timer);
    timer = undefined;
    el.classList.remove('pressing');
  };

  el.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    fired = false;
    el.classList.add('pressing');
    timer = window.setTimeout(() => {
      fired = true;
      cancel();
      action();
    }, LONG_PRESS_MS);
  });
  el.addEventListener('pointerup', cancel);
  el.addEventListener('pointerleave', cancel);
  el.addEventListener('pointercancel', cancel);
  // Pas de menu contextuel (clic droit, appui long Android).
  el.addEventListener('contextmenu', (event) => event.preventDefault());
  el.addEventListener(
    'click',
    (event) => {
      if (fired) {
        event.stopImmediatePropagation();
        event.preventDefault();
        fired = false;
      }
    },
    { capture: true },
  );
}
