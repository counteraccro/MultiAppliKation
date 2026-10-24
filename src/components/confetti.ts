const COLORS = ['#ff6b6b', '#ff9f43', '#f7c948', '#2ecc71', '#4d96ff', '#9b5de5', '#f15bb5'];
const COUNT = 90;
const DURATION_MS = 3000;

/** Pluie de confettis par-dessus l'écran ; rien si l'appareil demande moins d'animations. */
export function launchConfetti(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const layer = document.createElement('div');
  layer.className = 'confetti';
  layer.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < COUNT; i++) {
    const piece = document.createElement('span');
    const size = 6 + Math.random() * 8;
    piece.style.cssText = [
      `left: ${Math.random() * 100}%`,
      `width: ${size}px`,
      `height: ${size * (0.4 + Math.random() * 0.6)}px`,
      `background: ${COLORS[i % COLORS.length]}`,
      `animation-delay: ${Math.random() * 0.6}s`,
      `animation-duration: ${1.8 + Math.random() * 1.2}s`,
      `--drift: ${(Math.random() - 0.5) * 160}px`,
      `--spin: ${(Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 720)}deg`,
    ].join(';');
    layer.append(piece);
  }
  document.body.append(layer);
  window.setTimeout(() => layer.remove(), DURATION_MS + 600);
}
