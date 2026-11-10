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

type UpdateHandler = (apply: () => void, remote: RemoteVersion | null) => void;

let registration: ServiceWorkerRegistration | undefined;
let showUpdate: UpdateHandler | undefined;
/** Le service worker a trouvé une nouvelle version (la fenêtre s'affiche). */
let updateFound = false;

/**
 * Le service worker garde l'app pour le hors ligne ; c'est donc lui qui détecte
 * une nouvelle publication. Il vérifie au démarrage, quand l'app revient au premier
 * plan (rouverte depuis l'écran d'accueil) et toutes les 30 minutes.
 * `onUpdate` reçoit de quoi passer à la nouvelle version (active puis recharge la page).
 */
export function watchForUpdates(onUpdate: UpdateHandler): void {
  // En développement, Vite recharge déjà la page tout seul.
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  showUpdate = onUpdate;
  registerSW({
    async onNeedRefresh() {
      updateFound = true;
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

export type UpdateCheck = 'latest' | 'offline' | 'update' | 'reset';

/** Temps laissé au service worker pour trouver la nouvelle version, avant de forcer. */
const UPDATE_WAIT_MS = 10000;

/**
 * Bouton « Chercher une mise à jour » : sur iPhone, l'app installée peut rester
 * en veille sans jamais voir la nouvelle version (un enfant n'a pas eu la Grammaire).
 * Si la recherche normale n'aboutit pas, on efface la copie hors ligne et on recharge :
 * la progression est dans le localStorage, elle ne bouge pas.
 */
export async function checkForUpdateNow(): Promise<UpdateCheck> {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return 'latest';
  if (!navigator.onLine) return 'offline';

  const remote = await fetchRemoteVersion();
  if (!remote) return 'offline';
  if (remote.build === APP_BUILD) return 'latest';

  if (await findUpdate()) {
    showUpdate?.(() => activateAndReload(registration), remote);
    return 'update';
  }
  await resetAndReload();
  return 'reset';
}

/**
 * La nouvelle version attend (`waiting`), sauf si la page n'était pas contrôlée
 * par le service worker (juste après l'installation) : elle s'active alors tout de
 * suite, et seul `onNeedRefresh` le signale.
 */
async function findUpdate(): Promise<boolean> {
  if (!registration) return false;
  const reg = registration;
  const found = () => updateFound || reg.waiting !== null;
  await reg.update().catch(() => {});
  const deadline = Date.now() + UPDATE_WAIT_MS;
  while (!found() && Date.now() < deadline) {
    await new Promise((resolve) => window.setTimeout(resolve, 250));
  }
  return found();
}

/** Repart de zéro : plus de service worker ni de cache, la page revient du réseau. */
async function resetAndReload(): Promise<void> {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((reg) => reg.unregister()));
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
  // Le paramètre évite que le navigateur resserve l'ancienne page depuis son cache.
  window.location.replace(`${import.meta.env.BASE_URL}?t=${Date.now()}`);
}
