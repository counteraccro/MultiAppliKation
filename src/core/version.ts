export const APP_VERSION = __APP_VERSION__;
export const APP_BUILD = __APP_BUILD__;

const CHECK_EVERY_MS = 30 * 60 * 1000;

export interface RemoteVersion {
  version: string;
  build: string;
}

/** Version en ligne si elle diffère de celle qui tourne, sinon null (ou hors ligne). */
export async function fetchNewerVersion(): Promise<RemoteVersion | null> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) return null;
    const remote = (await response.json()) as RemoteVersion;
    return remote.build && remote.build !== APP_BUILD ? remote : null;
  } catch {
    return null;
  }
}

/**
 * Cherche une nouvelle version au démarrage, quand l'app revient au premier plan
 * (rouverte depuis l'écran d'accueil) et toutes les 30 minutes.
 */
export function watchForUpdates(onUpdate: (remote: RemoteVersion) => void): void {
  // En développement, Vite recharge déjà la page tout seul.
  if (!import.meta.env.PROD) return;

  let notified = false;
  const check = async () => {
    if (notified) return;
    const remote = await fetchNewerVersion();
    if (remote && !notified) {
      notified = true;
      onUpdate(remote);
    }
  };

  void check();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void check();
  });
  window.setInterval(check, CHECK_EVERY_MS);
}

/** Recharge la nouvelle version, en contournant le cache de la page (GitHub Pages garde 10 min). */
export function reloadToVersion(remote: RemoteVersion): void {
  window.location.replace(`${import.meta.env.BASE_URL}?v=${encodeURIComponent(remote.build)}`);
}
