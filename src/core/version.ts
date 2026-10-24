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
 * `onUpdate` reçoit de quoi passer à la nouvelle version (recharge la page).
 */
export function watchForUpdates(onUpdate: (apply: () => void, remote: RemoteVersion | null) => void): void {
  // En développement, Vite recharge déjà la page tout seul.
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  const updateSW = registerSW({
    async onNeedRefresh() {
      onUpdate(() => void updateSW(true), await fetchRemoteVersion());
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => {
        if (navigator.onLine) registration.update().catch(() => {});
      };
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
      window.setInterval(check, CHECK_EVERY_MS);
    },
  });
}
