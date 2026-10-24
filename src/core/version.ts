import { registerSW } from 'virtual:pwa-register';

export const APP_VERSION = __APP_VERSION__;
export const APP_BUILD = __APP_BUILD__;

const CHECK_EVERY_MS = 30 * 60 * 1000;

export interface RemoteVersion {
  version: string;
  build: string;
}

/** Version publiée en ligne (null hors ligne). */
export async function fetchRemoteVersion(): Promise<RemoteVersion | null> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: 'no-store' });
    return response.ok ? ((await response.json()) as RemoteVersion) : null;
  } catch {
    return null;
  }
}

/**
 * Le service worker garde l'app pour le hors ligne ; c'est donc lui qui détecte
 * une nouvelle publication. Il vérifie au démarrage, quand l'app revient au premier
 * plan (rouverte depuis l'écran d'accueil) et toutes les 30 minutes.
 * `onUpdate` reçoit de quoi passer à la nouvelle version (active puis recharge la page).
 */
export function watchForUpdates(onUpdate: (apply: () => void, remote: RemoteVersion | null) => void): void {
  // En développement, Vite recharge déjà la page tout seul.
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  let registration: ServiceWorkerRegistration | undefined;

  registerSW({
    async onNeedRefresh() {
      onUpdate(() => activateAndReload(registration), await fetchRemoteVersion());
    },
    onRegisteredSW(_url, reg) {
      if (!reg) return;
      registration = reg;
      const check = () => {
        if (navigator.onLine) reg.update().catch(() => {});
      };
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
      window.setInterval(check, CHECK_EVERY_MS);
    },
  });
}

/** Au-delà, on recharge quand même : la fenêtre ne doit jamais rester bloquée. */
const RELOAD_TIMEOUT_MS = 3000;

/**
 * Active la nouvelle version puis recharge la page.
 * Le rechargement de vite-plugin-pwa n'a lieu que si la page était déjà contrôlée
 * par un service worker à son ouverture : ce n'est pas le cas juste après la
 * première installation (ex. passage de 0.4.0 à 0.5.0), et l'app restait bloquée.
 */
function activateAndReload(registration: ServiceWorkerRegistration | undefined): void {
  let done = false;
  const reload = () => {
    if (done) return;
    done = true;
    window.location.reload();
  };

  navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true });
  window.setTimeout(reload, RELOAD_TIMEOUT_MS);

  const waiting = registration?.waiting;
  if (!waiting) return reload();
  waiting.addEventListener('statechange', () => {
    if (waiting.state === 'activated') reload();
  });
  waiting.postMessage({ type: 'SKIP_WAITING' });
}
