// Mesure d'audience anonyme avec GoatCounter (voir .ai/analyse/17-mesure-audience.md).
// Ni cookie, ni prénom, ni résultat : seulement l'écran ouvert et, pour une activité, la classe.

/** Compte GoatCounter : https://couteraccro.goatcounter.com */
const GOATCOUNTER_URL = 'https://couteraccro.goatcounter.com/count';

/** Même clé que le script officiel de GoatCounter : un appareil marqué n'est plus compté. */
const SKIP_KEY = 'skipgc';
/** Ouvrir l'app avec ce lien (#ne-pas-compter) marque l'appareil, #compter le démarque. */
const SKIP_HASH = '#ne-pas-compter';
const COUNT_HASH = '#compter';

let firstHit = true;

/** Lit et retire le marqueur du lien, puis dit si cet appareil doit être compté. */
function enabled(): boolean {
  // En développement et pendant les tests, rien ne part.
  if (!import.meta.env.PROD) return false;
  try {
    if (location.hash === SKIP_HASH) localStorage.setItem(SKIP_KEY, 't');
    if (location.hash === COUNT_HASH) localStorage.removeItem(SKIP_KEY);
    if (location.hash === SKIP_HASH || location.hash === COUNT_HASH) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    return localStorage.getItem(SKIP_KEY) !== 't';
  } catch {
    return true;
  }
}

function send(params: Record<string, string>): void {
  if (!enabled() || !navigator.onLine) return;
  const query = new URLSearchParams({
    ...params,
    s: `${screen.width},${screen.height},${devicePixelRatio}`,
    rnd: Math.random().toString(36).slice(2),
  });
  // Le lien d'où l'on vient, seulement à l'ouverture de l'app.
  if (firstHit && document.referrer) query.set('r', document.referrer);
  firstHit = false;
  // Une image suffit : GoatCounter compte la requête, hors ligne elle échoue sans bruit.
  new Image().src = `${GOATCOUNTER_URL}?${query}`;
}

/** Un écran ouvert, par exemple `/activites` ou `/tables`. */
export function trackScreen(path: string, title: string): void {
  send({ p: path, t: title });
}

/** Un évènement, par exemple `tables/CM1` : quelle activité, pour quelle classe. */
export function trackEvent(name: string, title: string): void {
  send({ p: name, t: title, e: 'true' });
}
